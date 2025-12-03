import { DataSource } from 'typeorm';
import { DB_CONSTANTS } from 'src/shared/utils/config.util';

export const dataSource = new DataSource({
  type: 'postgres',
  username: DB_CONSTANTS.USER,
  host: DB_CONSTANTS.HOST,
  password: DB_CONSTANTS.PASSWORD,
  port: DB_CONSTANTS.PORT,
  database: DB_CONSTANTS.NAME,
  entities: [__dirname + '/../entities/base-app-entities/*.entity.js'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
  migrations: ['dist/migrations/base-app/*.js'],
  maxQueryExecutionTime: 1000,
  extra: {
    idleTimeoutMillis: 10000,
    max: 5,
  },
});
