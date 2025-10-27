import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { UpdateUserDto } from 'src/dtos/user-dto/update-user.dto';
import { Role } from 'src/enums/core-app.enum';
import { getRepo } from 'src/shared/database-connection/get-connection';
import * as bcrypt from 'bcrypt';
import { APIResponse } from 'src/common/dtos/response.dto';
import { GetUserDto } from 'src/dtos/user-dto/get-user.dto';
import { CountryService } from './country.service';
import { UserSignupDto } from 'src/dtos/user-dto/user-signup.dto';
import { TenantService } from './tenant.service';
import { JwtPayload } from 'src/common/dtos/jwt-payload.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Repository } from 'typeorm';
import { paginationParams } from 'src/shared/utils/pagination-params.util';
import { Environment, SALT_ROUNDS } from 'src/shared/utils/config.util';
import { PlanPricing } from 'src/database/entities/base-app-entities/plan-pricing.entity';
import { applyFilters, FiltersMap } from 'src/shared/utils/query-filter.util';

@Injectable()
export class UserService {
  constructor(
    private readonly countryService: CountryService,
    private readonly tenantService: TenantService,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(PlanPricing)
    private readonly planPriceRepo: Repository<PlanPricing>,
  ) {}
  async updateUser(
    tenantId: string,
    user: User,
    id: string,
    updateUser: UpdateUserDto,
  ): Promise<APIResponse> {
    const userRepo = await getRepo(User, tenantId);
    const existUser = await userRepo.findOne({ where: { id } });
    if (user.id !== id && user.role != Role.Admin) {
      throw new UnauthorizedException('Not have authorization to edit others data');
    }
    if (updateUser.role && user.role != Role.Admin) {
      throw new UnauthorizedException('Not have enough authorization to update role');
    }
    if (!existUser) {
      throw new BadRequestException('Invalid user id or user not found');
    }
    if (updateUser.email) {
      if (existUser.role === Role.Admin) {
        throw new UnauthorizedException('Not able to update admin mail');
      }
      await this.tenantService.getTenant(updateUser.email);
    }

    const mailOrPhoneExist = await userRepo.find({
      where: [{ email: updateUser.email }, { phone: updateUser.phone }],
    });

    if (mailOrPhoneExist.length > 0) {
      for (const user of mailOrPhoneExist) {
        if (updateUser.email && user.email === updateUser.email && user.id !== existUser.id) {
          throw new ConflictException('Email already in use');
        }
        if (updateUser.phone && user.phone === updateUser.phone && user.id !== existUser.id) {
          throw new ConflictException('Phone number already in use');
        }
      }
    }
    const { country, ...userData } = updateUser;
    if (country) {
      const countryExist = this.countryService.getCountry(country);
      existUser.country = countryExist;
    }
    await userRepo.save({ ...existUser, ...userData });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User details updated successfully',
    };
  }

  async getAllUsers(
    tenantId: string,
    userQuery: GetUserDto,
  ): Promise<APIResponse<Omit<User, 'password' | 'otp'>[]>> {
    const userRepo = await getRepo(User, tenantId);
    const qb = userRepo.createQueryBuilder('user');

    const { limit, page, skip } = paginationParams(userQuery.page, userQuery.limit);
    const FILTERS: FiltersMap = {
      name: { column: 'user.name', type: 'like' },
      email: { column: 'user.email', type: 'like' },
      phone: { column: 'user.phone', type: 'like' },
      city: { column: 'user.city', type: 'like' },
      country: { column: 'user.country', type: 'like' },
      role: { column: 'user.role', type: 'exact' },
      statusCause: { column: 'user.status_cause', type: 'exact' },
      status: { column: 'user.status', type: 'exact' },
    };
    applyFilters<User>(qb, FILTERS, userQuery);

    // for (const [key, value] of Object.entries(userQuery)) {
    //   if (value == null || key === 'page' || key === 'limit') {
    //     continue;
    //   } else if (['name', 'email', 'phone', 'city', 'country'].includes(key)) {
    //     qb.andWhere(`user.${key} LIKE :${key}`, { [key]: `%${value}%` });
    //   } else if (key === 'role') {
    //     qb.andWhere('user.role =:role', { role: userQuery.role });
    //   } else if (key === 'statusCause') {
    //     qb.andWhere('user.status_cause =:statusCause', { statusCause: userQuery.statusCause });
    //   } else if (key === 'status') {
    //     qb.andWhere('user.status =:status', { status: userQuery.status });
    //   }
    // }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    const pageInfo = { total, limit, page, totalPages: Math.ceil(total / limit) };
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User details fetched based on filter',
      data,
      pageInfo,
    };
  }

  async getUser(tenantId: string, user: User) {
    const userRepo = await getRepo(User, tenantId);
  }

  async userSignup(user: UserSignupDto): Promise<APIResponse> {
    const tenant = await this.tenantService.getTenant(user.email);
    const userRepo = await getRepo<User>(User, tenant.schemaName);
    const userCount = await userRepo.count();
    const planPricing = await this.planPriceRepo.findOne({
      where: { tenantsSubscription: { id: tenant.subscription.id } },
      relations: {
        tenantsSubscription: true,
        plan: true,
      },
    });
    const subscriptionExist = planPricing?.tenantsSubscription[0].status;
    if (planPricing?.tenantsSubscription && !subscriptionExist) {
      throw new BadRequestException('No subscription found. Please subscribe.');
    }

    if (planPricing?.plan && userCount >= planPricing.plan.userCount) {
      throw new BadRequestException('User limit exceeded for your plan');
    }
    const isUser = await userRepo.findOne({
      where: [{ email: user.email }, { phone: user.phone }],
    });
    if (isUser) {
      throw new ConflictException('User with this email or phone number is already registered');
    }
    let country: string | undefined;
    if (user.country) {
      country = this.countryService.getCountry(user.country);
    }
    const hashPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
    const newUser = userRepo.create({
      name: user.name,
      password: hashPassword,
      email: user.email,
      phone: user.phone,
      country: country,
    });
    await userRepo.save(newUser);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'User account created successfully',
    };
  }

  async validateUser(payload: JwtPayload, schema: string) {
    const subscriptionExist = await this.subscriptionRepo.findOne({
      where: { tenant: { schemaName: schema } },
      relations: { tenant: true },
    });
    if (!subscriptionExist) {
      throw new BadRequestException('Invalid schema name');
    }
    if (subscriptionExist.status === false && Environment.NODE_ENV === 'prod') {
      throw new HttpException(
        { message: 'Subscription got expired please subscribe' },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const userRepo = await getRepo(User, schema);
    const user = await userRepo.findOne({
      where: { email: payload.email, status: true, emailVerified: true },
    });
    return user ?? null;
  }
}
