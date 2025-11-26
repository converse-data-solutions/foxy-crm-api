import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { TenantService } from './tenant.service';
import * as bcrypt from 'bcrypt';
import * as getConnection from 'src/shared/database-connection/get-connection';
import { csrfUtils } from 'src/shared/utils/csrf.util';
import { Request, Response } from 'express';
import { LoggerService } from 'src/common/logger/logger.service';

jest.mock('bcrypt');
jest.mock('src/shared/database-connection/get-connection');
jest.mock('src/shared/utils/csrf.util');

const mockTokenService = {
  generateAccessToken: jest.fn().mockReturnValue('mockAccess'),
  generateRefreshToken: jest.fn().mockReturnValue('mockRefresh'),
  getRefreshToken: jest.fn().mockResolvedValue('mockUpdatedToken'),
  verifyAccessToken: jest.fn().mockResolvedValue({ userId: 1 }),
};

const mockTenantService = {
  getTenant: jest.fn().mockResolvedValue({ schemaName: 'tenant1' }),
};
const mockLoggerService = {
  logError: jest.fn(),
};
describe('AuthService', () => {
  let service: AuthService;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: TokenService, useValue: mockTokenService },
        { provide: TenantService, useValue: mockTenantService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    req = { cookies: { refresh_token: 'mockRefresh', access_token: 'mockAccess' } };
    res = { json: jest.fn(), clearCookie: jest.fn() };
  });

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  (getConnection.getRepo as jest.Mock).mockResolvedValue(mockUserRepo);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockUser = {
    id: 'user01',
    email: 'user@mail.com',
    password: 'password',
    otpVerified: true,
  };
  describe('signin', () => {
    const dto = {
      email: 'user@mail.com',
      password: 'password',
    };

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.signin(dto)).rejects.toThrow('User not found. Please sign up first.');
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
    });

    it('should throw BadRequestException if password is invalid', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser, password: 'hashedPassword' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.signin(dto)).rejects.toThrow('Incorrect password. Please try again.');
      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, 'hashedPassword');
    });

    it('should throw BadRequestException if status is false', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        password: 'hashedPassword',
        status: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.signin(dto)).rejects.toThrow(
        'Your account is disabled. Please contact the admin.',
      );
    });

    it('should throw BadRequestException if email is not verified', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        password: 'hashedPassword',
        status: true,
        emailVerified: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.signin(dto)).rejects.toThrow(
        'Please verify your email before signing in.',
      );
    });

    it('should signin successfully and return tokens', async () => {
      const mockUserExist = {
        ...mockUser,
        password: 'hashedPassword',
        status: true,
        emailVerified: true,
        role: 'admin',
      };
      mockUserRepo.findOne.mockResolvedValue(mockUserExist);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');
      const result = await service.signin(dto);
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        message: 'Signin successfull',
        data: {
          accessToken: 'mockAccess',
          refreshToken: 'mockRefresh',
          role: 'admin',
          xTenantId: 'tenant1',
        },
      });
      expect(mockUserRepo.save).toHaveBeenCalledWith({
        ...mockUserExist,
        refreshToken: 'hashedRefreshToken',
      });
    });
  });

  describe('reset password', () => {
    const passwordDto = {
      email: 'user@mail.com',
      password: 'oldPassword',
      newPassword: 'newPassword',
    };

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.resetPassword(passwordDto)).rejects.toThrow(
        'User not found or invalid email',
      );
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { email: passwordDto.email } });
    });

    it('should throw BadRequestException if old password and new passwords are same', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      passwordDto.newPassword = 'oldPassword';
      await expect(service.resetPassword(passwordDto)).rejects.toThrow(
        'New password cannot be the same as the old password.',
      );
    });

    it('should throw BadRequestException if existing password is invalid', async () => {
      passwordDto.newPassword = 'newPassword';
      mockUser.password = 'hashedPassword';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.resetPassword(passwordDto)).rejects.toThrow('Invalid current password.');
      expect(bcrypt.compare).toHaveBeenCalledWith(passwordDto.password, mockUser.password);
    });

    it('should update password and return success message', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');
      mockUser.password = 'hashedNewPassword';
      expect(await service.resetPassword(passwordDto)).toEqual({
        success: true,
        statusCode: 200,
        message: 'Password updated successfully',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(passwordDto.newPassword, 10);
      expect(mockUserRepo.save).toHaveBeenCalledWith({ ...mockUser });
    });
  });

  describe('forgotPasswordReset', () => {
    const passwordDto = { email: 'user@mail.com', password: 'password' };
    it('should throw NotFoundException when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.forgotPasswordReset(passwordDto)).rejects.toThrow(
        'User not found or invalid email',
      );
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { email: passwordDto.email } });
    });

    it('should throw BadRequestException if otp is not verified', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser, otpVerified: false });
      await expect(service.forgotPasswordReset(passwordDto)).rejects.toThrow(
        'OTP not verified. Please verify OTP before resetting password.',
      );
    });

    it('should throw BadRequestException if old and current password are same', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser, otpVerified: true });
      mockUser.password = 'hashedNewPassword';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.forgotPasswordReset(passwordDto)).rejects.toThrow(
        'New password cannot be the same as the old password.',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(passwordDto.password, mockUser.password);
    });

    it('should update password and return success message', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      mockUser.password = 'newHashedPassword';
      mockUser.otpVerified = false;
      expect(await service.forgotPasswordReset(passwordDto)).toEqual({
        success: true,
        statusCode: 200,
        message: 'Password updated successfully',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(passwordDto.password, 10);
      expect(mockUserRepo.save).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('tokenRefresh', () => {
    it('should update access token when refresh token is available', async () => {
      const mockUpdatedToken = { accessToken: 'newAccess', refreshToken: 'newRefresh' };
      mockTokenService.getRefreshToken.mockResolvedValue(mockUpdatedToken);
      const result = await service.tokenRefresh(req as Request);
      expect(mockTokenService.getRefreshToken).toHaveBeenCalledWith('mockRefresh');
      expect(result).toEqual(mockUpdatedToken);
    });

    it('should throw UnauthorizedException if no refresh token', async () => {
      req.cookies = {};
      await expect(service.tokenRefresh(req as Request)).rejects.toThrow('Missing refresh token.');
      expect(mockTokenService.getRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('getCsrfToken', () => {
    it('should generate and return csrf token', async () => {
      const mockPayload = { id: 'user01', email: 'user@mail.com' };
      const mockCsrfToken = 'csrf123';
      req.cookies = { access_token: 'mockAccess' };
      mockTokenService.verifyAccessToken.mockResolvedValue(mockPayload);
      jest.spyOn(csrfUtils, 'generateCsrfToken').mockReturnValue(mockCsrfToken);
      jest.spyOn(res, 'clearCookie').mockImplementation();
      await service.getCsrfToken(req as Request, res as Response);
      expect(mockTokenService.verifyAccessToken).toHaveBeenCalledWith('mockAccess');
      expect(res.clearCookie).toHaveBeenCalledWith('x-csrf-secret', { path: '/' });
      expect(csrfUtils.generateCsrfToken).toHaveBeenCalledWith(req, res, { overwrite: true });
      expect(req.user).toEqual(mockPayload);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 200,
        message: 'Csrf token fetched successfully',
        data: { csrfToken: mockCsrfToken },
      });
    });

    it('should throw UnauthorizedException if access token missing', async () => {
      req.cookies = {};
      await expect(service.getCsrfToken(req as Request, res as Response)).rejects.toThrow(
        'Unable to generate CSRF token. Please try again later.',
      );
      expect(mockTokenService.verifyAccessToken).not.toHaveBeenCalled();
      expect(mockLoggerService.logError).toHaveBeenCalled();
      expect(csrfUtils.generateCsrfToken).not.toHaveBeenCalled();
      expect(res.clearCookie).not.toHaveBeenCalled();
    });
  });
});
