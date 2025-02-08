import { Elysia } from 'elysia';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './src/schema';
import { authController } from './src/controllers/authController';
import jwt from '@elysiajs/jwt';
import bearer from '@elysiajs/bearer';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 
        `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
});

const db = drizzle(pool);

const app = new Elysia()
    .decorate('db', db)
    .use(jwt({
        secret: process.env.JWT_SECRET || 'your-secret-key'
    }))
    .use(bearer())
    .use(authController)
    .get('/', () => 'Auth Service Running')
    .listen(3001);

console.log(`🦊 Auth Service running at http://${app.server?.hostname}:${app.server?.port}`);

// Manejo de errores de conexión a la base de datos
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});