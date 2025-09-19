import { dataSource } from './base-app-data-source';
import { DataSource } from 'typeorm';
export const coreDataSource = new DataSource({
  ...dataSource.options,
  entities: [
    __dirname + '/../entity/core-app/*.entity.js',
    __dirname + '/../entity/common-entity/*.entity.js',
  ],
  migrations: ['dist/migration/core-app/*.js'],
});
