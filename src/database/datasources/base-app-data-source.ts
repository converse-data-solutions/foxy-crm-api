import { DataSource } from 'typeorm';
import { DB_CONSTANTS } from 'src/common/constant/config.constants';

export const dataSource = new DataSource({
  type: 'postgres',
  username: DB_CONSTANTS.USER,
  host: DB_CONSTANTS.HOST,
  password: DB_CONSTANTS.PASSWORD,
  port: DB_CONSTANTS.PORT,
  database: DB_CONSTANTS.NAME,
  entities: [__dirname + '/../entities/base-app-entities/*.entity.js'],
  synchronize: false,
  logging: ['error'],
  migrations: ['dist/migrations/base-app/*.js'],
  extra: {
    idleTimeoutMillis: 10000,
    max: 5,
  },
});
