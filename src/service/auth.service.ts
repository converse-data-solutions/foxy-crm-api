import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { TenantSubscription } from 'src/database/entity/base-app/tenant-subscription.entity';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { TenantSignupDto } from 'src/dto/tenant-dto/tenant-signup.dto';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Signin, UserSignupDto } from 'src/dto/user-dto/user-signup.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { User } from 'src/database/entity/core-app/user.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/common/dto/jwt-payload.dto';
import { plainToInstance } from 'class-transformer';
import { Country } from 'src/database/entity/common-entity/country.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Country) private readonly countryRepo: Repository<Country>,
    @InjectRepository(TenantSubscription)
    private readonly tenantSubcriptionRepo: Repository<TenantSubscription>,
    @InjectQueue('tenant-setup') private readonly tenantQueue: Queue,
    private readonly jwtService: JwtService,
  ) {}

  async tenantSignup(tenant: TenantSignupDto) {
    const domain = tenant.email.split('@')[1].split('.')[0];

    const isTenant = await this.tenantRepo.findOne({
      where: [{ organizationName: tenant.organizationName }, { email: tenant.email }, { domain }],
    });
    if (isTenant != null) {
      throw new ConflictException({
        message: 'The Organization or email is already registered',
      });
    } else {
      const hashPassword = await bcrypt.hash(tenant.password, Number(process.env.SALT));
      const { country, ...tenantData } = tenant;
      let tenantCountry: Country | null = null;
      if (country) {
        tenantCountry = await this.countryRepo.findOne({
          where: { name: ILike(`%${country}%`) },
        });
        if (!tenantCountry) {
          throw new NotFoundException({ message: 'Country not found or invalid country' });
        }
      }
      const newTenant: Tenant = await this.tenantRepo.save({
        ...tenantData,
        domain,
        country: tenantCountry ? tenantCountry : undefined,
        password: hashPassword,
      });

      const tenantSubscription = this.tenantSubcriptionRepo.create({
        tenant: newTenant,
      });
      await this.tenantSubcriptionRepo.save(tenantSubscription);

      await this.tenantQueue.add('tenant-setup', {
        tenant: newTenant,
        country,
      });

      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Account created and once basic setup is completed you get a mail',
      };
    }
  }

  async userSignup(user: UserSignupDto, tenantId: string) {
    const userRepo = await getRepo<User>(User, tenantId);
    const countryRepo = await getRepo<Country>(Country, tenantId);
    const isUser = await userRepo.findOne({
      where: [{ email: user.email }, { phone: user.phone }],
    });
    if (isUser) {
      throw new ConflictException({
        message: 'User with this email or phone number is already registered',
      });
    } else {
      let country: Country | null = null;
      if (user.country) {
        country = await countryRepo.findOne({ where: { name: ILike(`%${user.country}%`) } });
      }
      const hashPassword = await bcrypt.hash(user.password, Number(process.env.SALT || 5));
      const newUser = userRepo.create({
        name: user.name,
        password: hashPassword,
        email: user.email,
        phone: user.phone,
        country: country ? country : undefined,
      });
      await userRepo.save(newUser);
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'User account created successfully',
      };
    }
  }

  async userSignin(user: Signin, tenantId?: string) {
    const repo: Repository<User | Tenant> = tenantId
      ? await getRepo(User, tenantId)
      : this.tenantRepo;
    const userExist = await repo.findOne({ where: { email: user.email } });
    if (!userExist) {
      throw new NotFoundException({
        message: 'User email not found please signup',
      });
    } else {
      const validPassword = await bcrypt.compare(user.password, userExist.password);
      if (!validPassword) {
        throw new BadRequestException({
          message: 'Invalid password please enter correct password',
        });
      } else {
        const payload = plainToInstance(JwtPayload, userExist, {
          excludeExtraneousValues: true,
        });

        return this.jwtService.sign(
          {
            ...payload,
          },
          { secret: process.env.SECRET_KEY },
        );
      }
    }
  }

  async validateUser(payload: JwtPayload, schema: string) {
    const schemaExist = await this.tenantRepo.findOne({ where: { schemaName: schema } });
    if (!schemaExist) {
      throw new BadRequestException({ message: 'Invalid schema name' });
    }
    const userRepo = await getRepo(User, schema);
    const user = await userRepo.findOne({ where: { id: payload.id } });
    return user ? user : null;
  }
}
