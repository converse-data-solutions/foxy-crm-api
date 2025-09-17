import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { TenantSubscription } from 'src/database/entity/base-app/tenant-subscription.entity';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { TenantSignupDto } from 'src/dto/tenant-signup.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Signin, UserSignupDto } from 'src/dto/user-signup.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { User } from 'src/database/entity/core-app/user.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/dto/jwt-payload.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantSubscription)
    private readonly tenantSubcriptionRepo: Repository<TenantSubscription>,
    @InjectQueue('tenant-setup') private readonly tenantQueue: Queue,
    private readonly jwtService: JwtService,
  ) {}

  async tenantSignup(tenant: TenantSignupDto) {
    const domain = tenant.email.split('@')[1].split('.')[0];

    const isTenant = await this.tenantRepo.findOne({
      where: [
        { organizationName: tenant.organizationName },
        { email: tenant.email },
        { domain },
      ],
    });
    if (isTenant != null) {
      throw new ConflictException({
        message: 'The Organization or email is already registered',
      });
    } else {
      const hashPassword = await bcrypt.hash(
        tenant.password,
        Number(process.env.SALT)!,
      );
      const newTenant: Tenant = await this.tenantRepo.save({
        ...tenant,
        domain,
        password: hashPassword,
      });

      const tenantSubscription = this.tenantSubcriptionRepo.create({
        tenant: newTenant,
      });
      await this.tenantSubcriptionRepo.save(tenantSubscription);

      await this.tenantQueue.add('tenant-setup', newTenant);

      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message:
          'Account created and once basic setup is completed you get a mail',
      };
    }
  }

  async userSignup(user: UserSignupDto, tenantId: string) {
    const userRepo = await getRepo<User>(User, tenantId);
    const isUser = await userRepo.findOne({ where: { email: user.email } });
    if (isUser) {
      throw new ConflictException({
        message: 'User with this email is already registered',
      });
    } else {
      const hashPassword = await bcrypt.hash(
        user.password,
        Number(process.env.SALT || 5),
      );
      const newUser = userRepo.create({
        name: user.name,
        password: hashPassword,
        email: user.email,
      });
      await userRepo.save(newUser);
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'User account created successfully',
      };
    }
  }

  async userSignin(user: Signin, tenantId: string) {
    const userRepo = await getRepo(User, tenantId);
    const userExist = await userRepo.findOne({ where: { email: user.email } });
    if (!userExist) {
      throw new NotFoundException({
        message: 'User email not found please signup',
      });
    } else {
      const validPassword = await bcrypt.compare(
        user.password,
        userExist.password,
      );
      if (!validPassword) {
        throw new BadRequestException({
          message: 'Invalid password please enter correct password',
        });
      } else {
        const payload = plainToInstance(JwtPayload, userExist, {
          excludeExtraneousValues: true,
        });
        console.log('payload----------', payload);

        return this.jwtService.sign(
          {
            id: userExist.id,
            role: userExist.role,
            email: userExist.email,
          },
          { secret: process.env.SECRET_KEY },
        );
      }
    }
  }

  async validateUser(payload: JwtPayload, schema: string) {
    const userRepo = await getRepo(User, schema);
    const user = await userRepo.findOne({ where: { id: payload.id } });
    return user ? payload : null;
  }
}
