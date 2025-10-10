import * as Joi from 'joi';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('dev', 'prod').default('dev'),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_NAME: Joi.string().default('base-app'),

  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),

  SALT: Joi.number().default(12),

  ACCESS_SECRET_KEY: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().required(),
  REFRESH_SECRETE_KEY: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().required(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  PAYMENT_SUCCESS_URL: Joi.string().uri().required(),
  PAYMENT_FAILURE_URL: Joi.string().uri().required(),

  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
})
  .unknown()
  .required();

const { error, value: envVars } = envSchema.validate(process.env, { abortEarly: true });

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export const DB_CONSTANTS = {
  HOST: envVars.DB_HOST,
  PORT: Number(envVars.DB_PORT),
  USER: envVars.DB_USER,
  PASSWORD: envVars.DB_PASS,
  NAME: envVars.DB_NAME,
};

export const SMTP_CONFIG = {
  host: envVars.SMTP_HOST,
  port: Number(envVars.SMTP_PORT),
  user: envVars.SMTP_USER,
  pass: envVars.SMTP_PASS,
};

export const SALT_ROUNDS = Number(envVars.SALT);

export const JWT_CONFIG = {
  ACCESS_SECRET_KEY: envVars.ACCESS_SECRET_KEY,
  JWT_ACCESS_EXPIRES_IN: envVars.JWT_ACCESS_EXPIRES_IN,
  REFRESH_SECRETE_KEY: envVars.REFRESH_SECRETE_KEY,
  JWT_REFRESH_EXPIRES_IN: envVars.JWT_REFRESH_EXPIRES_IN,
};

export const REDIS_CONFIG = {
  host: envVars.REDIS_HOST,
  port: Number(envVars.REDIS_PORT),
};

export const Environment = {
  NODE_ENV: envVars.NODE_ENV,
};

export const PAYMENT_URL = {
  successUrl: envVars.PAYMENT_SUCCESS_URL,
  failureUrl: envVars.PAYMENT_FAILURE_URL,
};

export const STRIPE = {
  stripeSecreteKey: envVars.STRIPE_SECRET_KEY,
  stripeWebhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
};
