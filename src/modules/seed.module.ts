import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { SeedService } from 'src/services/seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Plan])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
