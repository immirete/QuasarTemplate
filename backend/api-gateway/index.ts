import { Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';
import bearer from '@elysiajs/bearer';
import { authRoutes } from './src/routes/authRoutes';
import { profileRoutes } from "./src/routes/profileRoutes";  
import * as dotenv from 'dotenv';
import { cors } from '@elysiajs/cors';
// import { createProxyMiddleware } from '@elysiajs/http-proxy';

dotenv.config();

const app = new Elysia()

    .use(cors({
        origin: '*',
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }))
    .use(jwt({
        secret: process.env.JWT_SECRET || 'your-secret-key'
    }))
    .use(bearer())
    .use(authRoutes)
    .use(profileRoutes)  // Mover profileRoutes antes del catch-all
    .all('/*', async ({ request, set }) => {
        // El catch-all route solo para otras rutas no manejadas específicamente
        const url = new URL(request.url);
        if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/profile')) {
            set.status = 404;
            return { message: 'Route not found' };
        }

        const target = `http://localhost:9000${url.pathname}${url.search}`;
        console.log('Forwarding request to:', target);

        try {
            const response = await fetch(target, {
                method: request.method,
                headers: request.headers,
                body: request.body,
            });

            set.status = response.status;
            response.headers.forEach((value, key) => {
                set.headers[key] = value;
            });

            return await response.arrayBuffer();
        } catch (error: any) {
            console.error('Proxy error:', error);
            set.status = 500;
            return { message: 'Proxy failed', error: error.message };
        }
    })
    .listen(Number(process.env.PORT) || 3000);

console.log(`🦊 API Gateway running at http://${app.server?.hostname}:${app.server?.port}`);

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});