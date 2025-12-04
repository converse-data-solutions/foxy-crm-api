import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { CountryService } from './country.service';
import { TenantService } from './tenant.service';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { PlanPricing } from 'src/database/entities/base-app-entities/plan-pricing.entity';
import { Role } from 'src/enums/core-app.enum';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { UpdateUserDto } from 'src/dtos/user-dto/update-user.dto';
import { UserSignupDto } from 'src/dtos/user-dto/user-signup.dto';
import { applyFilters } from 'src/shared/utils/query-filter.util';
import { paginationParams } from 'src/shared/utils/pagination-params.util';
import { getRepositoryToken } from '@nestjs/typeorm';

jest.mock('bcrypt');
jest.mock('src/shared/utils/query-filter.util');
jest.mock('src/shared/utils/pagination-params.util');
jest.mock('src/shared/database-connection/get-connection', () => ({
  getRepo: jest.fn().mockResolvedValue({
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  }),
}));
jest.mock('src/shared/utils/config.util', () => ({
  Environment: { NODE_ENV: 'production' },
  SALT_ROUNDS: 10,
}));

describe('UserService', () => {
  let service: UserService;
  let mockCountryService: Partial<CountryService>;
  let mockTenantService: Partial<TenantService>;
  let mockSubscriptionRepo: Partial<Repository<Subscription>>;
  let mockPlanRepo: Partial<Repository<PlanPricing>>;
  let mockQueryBuilder: any;
  let mockUserRepo: any;

  const tenantId = 'tenant01';
  const user = { id: 'user01', name: 'user', role: Role.Admin, email: 'user@mail.com' } as User;

  const createMockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  beforeEach(async () => {
    mockQueryBuilder = {
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    mockUserRepo = createMockRepo();
    mockUserRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockCountryService = { getCountry: jest.fn().mockReturnValue('India') };
    mockTenantService = { getTenant: jest.fn() };
    mockSubscriptionRepo = { findOne: jest.fn() };
    mockPlanRepo = { findOne: jest.fn() };

    (getRepo as jest.Mock).mockResolvedValue(mockUserRepo);
    (paginationParams as jest.Mock).mockReturnValue({ limit: 10, page: 1, skip: 0 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: CountryService, useValue: mockCountryService },
        { provide: TenantService, useValue: mockTenantService },
        { provide: getRepositoryToken(Subscription), useValue: mockSubscriptionRepo },
        { provide: 'PlanPricingRepository', useValue: mockPlanRepo },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('updateUser', () => {
    const updateUserDto = { name: 'newUser', email: 'newuser@mail.com' } as UpdateUserDto;

    it('should throw UnauthorizationException if non-admin try to edit other user data', async () => {
      await expect(
        service.updateUser(tenantId, { ...user, role: Role.Manager }, 'user1', updateUserDto),
      ).rejects.toThrow('You are not authorized to modify other users.');
    });

    it('should throw UnauthorizedException if non-admin user try to update role', async () => {
      await expect(
        service.updateUser(tenantId, { ...user, role: Role.Manager }, user.id, {
          ...updateUserDto,
          role: Role.Manager,
        }),
      ).rejects.toThrow('Only administrators can update user roles.');
    });

    it('should throw BadRequestException if user id is invalid', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateUser(tenantId, user, user.id, { ...updateUserDto, role: Role.Admin }),
      ).rejects.toThrow('User not found');
    });

    it('should throw error when try to update admin mail', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...user, role: Role.Admin });
      await expect(service.updateUser(tenantId, user, user.id, updateUserDto)).rejects.toThrow(
        'Administrator email cannot be changed.',
      );
    });

    it('should call tenantService.getTenant when updating mail', async () => {
      const existUser = { id: 'user1', email: 'old@mail.com', role: Role.Manager };
      mockUserRepo.findOne.mockResolvedValue(existUser);
      mockUserRepo.find.mockResolvedValue([]);
      await service.updateUser(tenantId, user, 'user1', updateUserDto);
      expect(mockTenantService.getTenant).toHaveBeenCalledWith(updateUserDto.email);
    });

    it('should throw ConflictException if email already in use', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'user1', email: 'old@mail.com' });
      mockUserRepo.find.mockResolvedValue([{ id: 'user2', email: updateUserDto.email }]);
      await expect(service.updateUser(tenantId, user, 'user1', updateUserDto)).rejects.toThrow(
        'Email is already registered with another account.',
      );
    });

    it('should throw ConflictException if phone already in use', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'user1', phone: '12345' });
      mockUserRepo.find.mockResolvedValue([{ id: 'user2', phone: '12345' }]);
      await expect(
        service.updateUser(tenantId, user, 'user1', { phone: '12345' } as UpdateUserDto),
      ).rejects.toThrow('Phone number is already registered with another account.');
    });

    it('should call countryService.getCountry and save user when country is provided', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'user1', email: 'old@mail.com' });
      mockUserRepo.find.mockResolvedValue([]);
      await service.updateUser(tenantId, user, 'user1', {
        name: 'test',
        country: 'India',
      } as UpdateUserDto);
      expect(mockCountryService.getCountry).toHaveBeenCalledWith('India');
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should update successfully and return success response', async () => {
      const existUser = { id: 'user1', email: 'old@mail.com', name: 'old' };
      mockUserRepo.findOne.mockResolvedValue(existUser);
      mockUserRepo.find.mockResolvedValue([]);
      const result = await service.updateUser(tenantId, user, 'user1', {
        name: 'new',
      } as UpdateUserDto);
      expect(mockUserRepo.save).toHaveBeenCalledWith({ ...existUser, name: 'new' });
      expect(result).toMatchObject({ success: true, statusCode: 200 });
    });
  });

  describe('getAllUser', () => {
    it('should call getRepo and createQueryBuilder', async () => {
      await service.getAllUsers(tenantId, {} as any);
      expect(getRepo).toHaveBeenCalledWith(User, tenantId);
      expect(mockUserRepo.createQueryBuilder).toHaveBeenCalledWith('user');
    });

    it('should call applyFilters with correct arguments', async () => {
      const query = { name: 'john', email: 'test@mail.com' };
      await service.getAllUsers(tenantId, query as any);
      expect(applyFilters).toHaveBeenCalledWith(mockQueryBuilder, expect.any(Object), query);
    });

    it('should return user data and pagination info', async () => {
      const users = [{ id: 'user005', name: 'john' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([users, 1]);
      const result = await service.getAllUsers(tenantId, {} as any);
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        message: 'User details fetched based on filter',
        data: users,
        pageInfo: { total: 1, limit: 10, page: 1, totalPages: 1 },
      });
    });

    it('should handle empty data correctly', async () => {
      const result = await service.getAllUsers(tenantId, {} as any);
      expect(result.data).toEqual([]);
    });
  });

  describe('userSignup', () => {
    const signupDto: UserSignupDto = {
      name: 'newUser',
      email: 'newuser@mail.com',
      password: 'Password@123',
      phone: '1234567890',
      country: 'India',
    } as UserSignupDto;

    const setupMocks = (
      activeSubscription: boolean,
      userCount: number,
      currentUsers: number,
      existingUser = false,
    ) => {
      (mockTenantService.getTenant as jest.Mock).mockResolvedValue({
        schemaName: 'tenant_schema',
        subscription: { id: 'sub01' },
      });
      (mockPlanRepo.findOne as jest.Mock).mockResolvedValue({
        tenantsSubscription: [{ status: activeSubscription }],
        plan: { userCount },
      });
      mockUserRepo.count.mockResolvedValue(currentUsers);
      mockUserRepo.findOne.mockResolvedValue(existingUser ? { email: signupDto.email } : null);
    };

    it('should throw BadRequestException if no subscription found', async () => {
      (mockTenantService.getTenant as jest.Mock).mockResolvedValue({
        schemaName: 'tenant_schema',
        subscription: { id: 'sub01' },
      });
      (mockPlanRepo.findOne as jest.Mock).mockResolvedValue({
        tenantsSubscription: [{}],
        plan: {},
      });
      await expect(service.userSignup(signupDto)).rejects.toThrow(
        'No active subscription found. Please renew your plan.',
      );
    });

    it('should throw BadRequestException if user limit exceeded', async () => {
      setupMocks(true, 5, 5);
      await expect(service.userSignup(signupDto)).rejects.toThrow(
        'User limit reached for your subscription plan.',
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      setupMocks(true, 10, 1, true);
      await expect(service.userSignup(signupDto)).rejects.toThrow(
        'An account with this email or phone number already exists.',
      );
    });

    it('should call countryService.getCountry when country is provided', async () => {
      setupMocks(true, 10, 1);
      mockUserRepo.create.mockReturnValue({});
      mockUserRepo.save.mockResolvedValue({});
      await service.userSignup(signupDto);
      expect(mockCountryService.getCountry).toHaveBeenCalledWith('India');
    });

    it('should create user, hash password, and return success', async () => {
      setupMocks(true, 10, 1);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUserRepo.create.mockReturnValue({});
      mockUserRepo.save.mockResolvedValue({});
      const result = await service.userSignup(signupDto);
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: signupDto.email, password: 'hashed_password' }),
      );
      expect(result).toMatchObject({ success: true, statusCode: 201 });
    });
  });

  describe('validateUser', () => {
    const schema = 'tenant_schema';
    const payload = { email: 'test@example.com' } as any;

    it('should throw BadRequestException if subscription not found', async () => {
      (mockSubscriptionRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.validateUser(payload, schema)).rejects.toThrow(
        'Invalid organization or tenant.',
      );
    });

    it('should throw HttpException if subscription expired in production', async () => {
      (mockSubscriptionRepo.findOne as jest.Mock).mockResolvedValue({
        tenant: { schemaName: schema },
        status: false,
      });
      await expect(service.validateUser(payload, schema)).rejects.toThrow(
        'Subscription expired. Please renew your plan.',
      );
    });

    it('should return user when found', async () => {
      (mockSubscriptionRepo.findOne as jest.Mock).mockResolvedValue({
        tenant: { schemaName: schema },
        status: true,
      });
      const mockUser = { id: 1, email: payload.email, status: true, emailVerified: true };
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.validateUser(payload, schema);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (mockSubscriptionRepo.findOne as jest.Mock).mockResolvedValue({
        tenant: { schemaName: schema },
        status: true,
      });
      mockUserRepo.findOne.mockResolvedValue(null);
      const result = await service.validateUser(payload, schema);
      expect(result).toBeNull();
    });
  });
});
