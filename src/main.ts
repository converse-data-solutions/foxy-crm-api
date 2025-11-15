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
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { CORS_URL } from './shared/utils/config.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new LoggerService() });

  app.setGlobalPrefix('api/v1');
  app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }));

  app.use(cookieParser());
  app.use(helmet());
  app.use(requestIdMiddleware);

  app.enableCors({
    origin: CORS_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'x-tenant-id', 'X-Tenant-Id'],
  });

  const config = new DocumentBuilder()
    .setTitle('CRM API Documentation')
    .setDescription('API description')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();
  const seederService = app.get(SeedService);
  await seederService.subscriptionSeed();

  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableShutdownHooks();

  await app.listen(8000);
}
bootstrap();
