import { Elysia, t } from 'elysia';
import type { Context } from 'elysia';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { profiles } from '../schema';

const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://localhost:3003';

interface ProfileContext extends Context {
    db: ReturnType<typeof drizzle>;
}

interface NewProfile {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
}

export const profileController = (app: Elysia) => app
    .post('/profile', async ({ body, set, db }: ProfileContext & { body: NewProfile }) => {
        try {
            const newProfileData: NewProfile = body;
            const createdProfile = await db.insert(profiles)
                .values(newProfileData)
                .returning();

            set.status = 201;
            return { message: 'Profile created successfully', data: createdProfile[0] };
        } catch (error) {
            console.error('Error creating profile:', error);
            set.status = 500;
            return { message: 'Failed to create profile' };
        }
    })

    // Subir avatar
    .put('/profile/:userId/avatar', async ({ params: { userId }, request, set, db }: ProfileContext & { params: { userId: string } }) => {
        try {
            // Enviar la imagen al image-service
            const formData = await request.formData();
            const file = formData.get('avatar');
            if (!file || !(file instanceof Blob)) {
                set.status = 400;
                return { message: 'No avatar file provided' };
            }

            // Construir la URL del image-service
            const imageServiceUrl = `${IMAGE_SERVICE_URL}/upload/profile-images/${userId}`;

            // Enviar el archivo al image-service
            const imageResponse = await fetch(imageServiceUrl, {
                method: 'PUT',
                body: formData
            });

            if (!imageResponse.ok) {
                throw new Error('Failed to upload image to image service');
            }

            const imageResult = await imageResponse.json();

            // Actualizar el perfil con la nueva URL del avatar
            await db.update(profiles)
                .set({ avatarUrl: imageResult.url })
                .where(eq(profiles.userId, userId));

            set.status = 200;
            return { message: 'Avatar updated successfully', avatarUrl: imageResult.url };
        } catch (error: any) {
            console.error('Error updating avatar:', error);
            set.status = 500;
            return { message: 'Failed to update avatar', error: error.message };
        }
    })

    .get('/profile/:userId', async ({ params: { userId }, set, db }: ProfileContext & { params: { userId: string } }) => {
        try {
            const profile = await db.select()
                .from(profiles)
                .where(eq(profiles.userId, userId))
                .limit(1);

            if (profile.length === 0) {
                set.status = 404;
                return { message: 'Profile not found' };
            }

            return { message: 'Profile retrieved successfully', data: profile[0] };
        } catch (error) {
            console.error('Error fetching profile:', error);
            set.status = 500;
            return { message: 'Failed to fetch profile' };
        }
    })

    .put('/profile/:userId', async ({ params: { userId }, body, set, db }: ProfileContext & { params: { userId: string }, body: Partial<NewProfile> }) => {
        try {
            const updatedProfile = await db.update(profiles)
                .set(body)
                .where(eq(profiles.userId, userId))
                .returning();

            if (updatedProfile.length === 0) {
                set.status = 404;
                return { message: 'Profile not found' };
            }

            return { message: 'Profile updated successfully', data: updatedProfile[0] };
        } catch (error: any) {
            console.error('Error updating profile:', error);
            set.status = 500;
            return { message: 'Failed to update profile', error: error.message };
        }
    }, {
        body: t.Object({
            firstName: t.Optional(t.String()),
            lastName: t.Optional(t.String()),
            email: t.Optional(t.String()),
            bio: t.Optional(t.String()),
        }),
    })
    
   
    ;
