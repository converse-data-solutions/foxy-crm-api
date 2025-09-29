import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from 'src/database/entity/base-app/plan.entity';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { SeedService } from 'src/services/seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Country, Plan])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
