import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/database/entity/base-app/subscription.entity';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { SeedService } from 'src/service/seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Country, Subscription])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
