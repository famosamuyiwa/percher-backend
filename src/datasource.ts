import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { entities, migrations } from './config/database.config';
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mydatabase',
  entities,
  migrations,
  synchronize: false,
  logging: ['error', 'warn', 'migration'], // Helps with debugging migrations
});
