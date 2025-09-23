import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CustomExceptionFilter } from './common/filter/custom-exception.filter';
import * as cookieParser from 'cookie-parser';
import { CustomValidationPipe } from './common/pipe/custom-validation.pipe';
import { SeedService } from './service/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');

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
  await seederService.countrySeed();
  await seederService.subscriptionSeed();

  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalFilters(new CustomExceptionFilter());

  await app.listen(8000);
}
bootstrap();
