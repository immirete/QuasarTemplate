// backend/profile-service/index.ts
import { Elysia } from 'elysia';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { profileController } from './src/controllers/profileController';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL_PROFILE,
    ssl: false
});
const db = drizzle(pool);

const app = new Elysia()
    .decorate('db', db)
    .use(profileController)
    .get('/', () => 'Profile Service Running')
    .listen(3002);

console.log(`🦊 Profile Service running at http://${app.server?.hostname}:${app.server?.port}`);