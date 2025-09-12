import { Controller, Get } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from 'src/database/entity/tenant-entity';
import { Repository } from 'typeorm';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
  ) {}

  @Get()
  async getTenant() {
    return await this.tenantRepo.find();
  }
}
