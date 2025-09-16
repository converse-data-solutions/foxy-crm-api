import { InjectQueue } from '@nestjs/bullmq';
import { ConflictException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { TenantSubscription } from 'src/database/entity/base-app/tenant-subscription.entity';
import { Tenant } from 'src/database/entity/base-app/tenant.entity';
import { TenantSignupDto } from 'src/dto/tenant-signup.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantSubscription)
    private readonly tenantSubcriptionRepo: Repository<TenantSubscription>,
    @InjectQueue('tenant-setup') private readonly tenantQueue: Queue,
  ) {}

  async signup(tenant: TenantSignupDto) {
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
}
