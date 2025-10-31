import { dataSource } from './base-app-data-source';
import { DataSource } from 'typeorm';
export const coreDataSource = new DataSource({
  ...dataSource.options,
  entities: [__dirname + '/../entities/core-app-entities/*.entity.js'],
  migrations: ['dist/migrations/core-app/*.js'],
});
