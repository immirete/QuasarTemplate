// backend/auth-service/src/schema.ts
import { pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable(
    'users',
    {
        id: serial('id').primaryKey(),
        email: text('email').notNull().unique(),
        hashedPassword: text('hashed_password').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (users) => {
        return {
            emailIndex: uniqueIndex('users_email_unique_idx').on(users.email),
        };
    }
);

export type User = typeof users.$inferSelect; // Tipo para SELECT
export type NewUser = typeof users.$inferInsert;  // Tipo para INSERT