import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
});

const db = drizzle(pool);

async function main() {
  console.log('Iniciando migración...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migración completada exitosamente');
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  }
  await pool.end();
  process.exit(0);
}

main();