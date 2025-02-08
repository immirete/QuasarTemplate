import { Elysia, t } from 'elysia';

interface AuthBody {
    email: string;
    password: string;
}

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

export const authRoutes = (app: Elysia) => app
    .post('/register', async ({ body, set }: { 
        body: AuthBody, 
        set: { status: number }
    }) => {
        try {
            const response = await fetch(`${AUTH_SERVICE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                set.status = response.status;
                return await response.json();
            }
            return await response.json();
        } catch (error: any) {
            console.error('API Gateway - Register error:', error);
            set.status = 500;
            return { message: 'Failed to register user', error: error.message };
        }
    }, {
        body: t.Object({
            email: t.String(),
            password: t.String()
        })
    })
    .post('/login', async ({ body, set }: { 
        body: AuthBody, 
        set: { status: number }
    }) => {
        try {
            const response = await fetch(`${AUTH_SERVICE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                set.status = response.status;
                return await response.json();
            }
            return await response.json();
        } catch (error: any) {
            console.error('API Gateway - Login error:', error);
            set.status = 500;
            return { message: 'Login failed', error: error.message };
        }
    }, {
        body: t.Object({
            email: t.String(),
            password: t.String()
        })
    });