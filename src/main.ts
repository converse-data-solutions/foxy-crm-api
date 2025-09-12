import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { CustomValidationPipe } from './common/pipes/custom-validation.pipe';
import { SeedService } from './services/seed.service';
import * as express from 'express';
import helmet from 'helmet';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(8000);
}
bootstrap();
