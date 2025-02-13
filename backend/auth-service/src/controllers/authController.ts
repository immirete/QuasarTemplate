import { Elysia, t  } from 'elysia';
import { hash, verify } from 'argon2';
import jwt from '@elysiajs/jwt';
import bearer from '@elysiajs/bearer';
import { users } from '../schema';
import type { NewUser } from '../schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { uuid } from 'drizzle-orm/pg-core';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
});

const db = drizzle(pool);

export const authController = (app: Elysia) => app
    .use(jwt({
        secret: process.env.JWT_SECRET || 'your-secret-key',
    }))
    .use(bearer())
    .decorate('db', db)
    .post('/register', async ({ body, db, set ,  }) => {
        try {
            const hashedPassword = await hash(body.password);
            const newUser: NewUser = { email: body.email, hashedPassword };
            // --- MINIMAL CHANGES - ADD PROFILE CREATION HERE ---
try {
    // Call profile-service to create profile (minimal fetch example)
    const [createdUser] = await db.insert(users).values(newUser).returning();

    const createProfileResponse = await fetch('http://localhost:3002/profile', { // ⚠️ Adjust URL if needed
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({   userId: createdUser.id.toString()  , email: newUser.email }), // Send userId and email
    });
    if (!createProfileResponse.ok) {
        console.error('Error creating profile:', createProfileResponse.status, await createProfileResponse.text());
        // Basic error logging, adjust error handling as needed
    }
} catch (profileError) {
    console.error('Error calling profile-service:', profileError);
    // Handle error calling profile-service (logging, etc.)
}
            set.status = 201;
            return { message: 'User registered successfully' };
        } catch (error: any) {
            console.error('Registration error:', error);
            set.status = 500;
            return { message: 'Registration failed', error: error.message };
        }
    }, {
        body: t.Object({ email: t.String(), password: t.String() })
    })
    .post('/login', async ({ body, db, jwt, set }) => {
        try {
            const [user] = await db.select().from(users).where(eq(users.email, body.email));
            
            if (!user) {
                set.status = 401;
                return { message: 'Invalid credentials' };
            }

            const passwordMatch = await verify(user.hashedPassword, body.password);
            if (!passwordMatch) {
                set.status = 401;
                return { message: 'Invalid credentials' };
            }

            const token = await jwt.sign({ userId: user.id, email: user.email });
            return {
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email
                }
            };
        } catch (error: any) {
            console.error('Login error:', error);
            set.status = 500;
            return { message: 'Login failed', error: error.message };
        }
    }, {
        body: t.Object({ email: t.String(), password: t.String() })
    });