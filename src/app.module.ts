import { Module } from '@nestjs/common';
import { AuthModule } from './module/auth.module';
import { UserModule } from './module/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from './database/datasource/data-source';

@Module({
  imports: [
    AuthModule,
    UserModule,
    TypeOrmModule.forRootAsync({ useFactory: async() => dataSource.options }),
  ],
})
export class AppModule {}
