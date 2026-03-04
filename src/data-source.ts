import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Auth } from './auth/auth.entity';
console.log('process.env.SUPABASE_DIRECT_URL', process.env.SUPABASE_DIRECT_URL);
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.SUPABASE_DIRECT_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: [Auth],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

export default AppDataSource;
