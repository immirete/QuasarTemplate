// backend/profile-service/index.ts
import { Elysia } from 'elysia';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { profileController } from './src/controllers/profileController';

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no está definida');
    process.exit(1);
}

console.log('🔌 Intentando conectar a la base de datos...');
console.log('URL de conexión:', process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

// Verificar la conexión y la base de datos
async function initializeDatabase() {
    try {
        const client = await pool.connect();
        console.log('✅ Conexión a la base de datos establecida');

        // Verificar si la tabla profiles existe
        const result = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'profiles'
            );
        `);

        if (!result.rows[0].exists) {
            console.error('❌ La tabla profiles no existe. Por favor, ejecuta las migraciones.');
        } else {
            console.log('✅ Tabla profiles encontrada');
        }

        client.release();
    } catch (err) {
        console.error('❌ Error inicializando la base de datos:', err);
        process.exit(1);
    }
}

await initializeDatabase();
const db = drizzle(pool);

const app = new Elysia()
    .decorate('db', db)
    .use(profileController)
    .get('/', () => 'Profile Service Running')
    .listen(3002);

console.log(`🦊 Profile Service running at http://${app.server?.hostname}:${app.server?.port}`);