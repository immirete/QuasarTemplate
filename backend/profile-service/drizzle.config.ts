// backend/profile-service/drizzle.config.ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

// Parse DATABASE_URL
const dbUrl = new URL(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/profiles_db');
const [username, password] = (dbUrl.username && dbUrl.password) ? [dbUrl.username, dbUrl.password] : ['postgres', 'postgres'];
const database = dbUrl.pathname.slice(1); // remove leading '/'

const config: Config = {
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: "postgresql",
  dbCredentials: {
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '5432'),
    user: username,
    password: password,
    database: database,
    ssl: false
  },
  verbose: true
}

export default config;