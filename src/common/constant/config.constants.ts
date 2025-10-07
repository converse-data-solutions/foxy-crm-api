import { config } from 'dotenv';
config();
export const DB_CONSTANTS = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: Number(process.env.DB_PORT) || 5432,
  USER: process.env.DB_USER || 'postgres',
  PASSWORD: process.env.DB_PASS,
  NAME: process.env.DB_NAME || 'base-app',
};

export const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER || 'loggerkey314@gmail.com',
  pass: process.env.SMTP_PASS || 'wgawvdgvxxscxwjw',
};

export const SALT_ROUNDS = Number(process.env.SALT) || 12;

export const JWT_CONFIG = {
  SECRET_KEY: process.env.SECRET_KEY,
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
};
export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const Environment = {
  NODE_ENV: process.env.NODE_ENV || 'dev',
};

export const PAYMENT_URL = {
  success_url: process.env.PAYMENT_SUCCESS_URL,
  failure_url: process.env.PAYUMENT_FAILURE_URL,
};
