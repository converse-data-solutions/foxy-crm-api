import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();
export const dataSource = new DataSource({
  type: 'postgres',
  username: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  entities: [__dirname + '/../entity/base-app/*.entity.js'],
  synchronize: false,
  logging: true,
  migrations: ['dist/migration/base-app/*.js'],
  extra: {
    idleTimeoutMillis: 10000,
    max: 50,
  },
});
