// backend/profile-service/src/schema.ts
import { pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const profiles = pgTable(
    'profiles',
    {
        id: serial('id').primaryKey(),
        userId: text('user_id').notNull().unique(),
        firstName: text('first_name'),
        lastName: text('last_name'),
        email: text('email'), // Añadimos el email al perfil (opcional, si quieres editar el email desde el perfil)
        bio: text('bio'),      // Añadimos la bio
        avatarUrl: text('avatar_url'), // Para la URL de la imagen de perfil en MinIO (renombrado desde profileImage a avatarUrl para consistencia con el frontend)
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (profiles) => {
        return {
            userIdIndex: uniqueIndex('profiles_user_id_unique_idx').on(profiles.userId),
        };
    }
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;