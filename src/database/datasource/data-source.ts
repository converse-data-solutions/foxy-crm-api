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
  entities: [__dirname + '/../entity/*.entity{.js, .ts}'],
  synchronize: true,
});
console.log(dataSource.options.entities);
