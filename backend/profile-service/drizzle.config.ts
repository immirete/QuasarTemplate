// backend/profile-service/drizzle.config.ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

const config: Config = { // Define a separate 'config' object first
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST || '',
    port: parseInt(process.env.DB_PORT_PROFILE || '5432'),
    user: process.env.DB_USER_PROFILE,
    password: process.env.DB_PASSWORD_PROFILE,
    database: process.env.DB_NAME_PROFILE || 'calistenics',
    ssl: true
  },
  verbose: true
}

export default config;