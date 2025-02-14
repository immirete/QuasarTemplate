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
    .all('/*', async ({ request, set }) => {
        const url = new URL(request.url);
        const target = `http://localhost:9000${url.pathname}${url.search}`;
    
        // Log para asegurarse de que el token está siendo pasado
        console.log('Authorization Header:', request.headers.get('Authorization'));
    
        try {
            const response = await fetch(target, {
                method: request.method,
                headers: request.headers,  // Esto debería estar pasando correctamente el Authorization header
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
    profileRoutes(app);  // 

console.log(`🦊 API Gateway running at http://${app.server?.hostname}:${app.server?.port}`);

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});