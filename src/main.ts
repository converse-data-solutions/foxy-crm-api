import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { CustomValidationPipe } from './common/pipes/custom-validation.pipe';
import { SeedService } from './services/seed.service';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.use('/api/v1/stripe-payment/webhook', express.raw({ type: 'application/json' }));

  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
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

  await app.listen(8000);
}
bootstrap();
