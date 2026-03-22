import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  entities: ['src/**/*.entity.ts', 'dist/**/*.entity.js'],
  migrations: ['migrations/*.ts', 'migrations/*.js'],
});
