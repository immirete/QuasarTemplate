// backend/profile-service/src/controllers/profileController.ts
import { Elysia, t, type Context } from 'elysia';
import { profiles, type Profile, type NewProfile } from '../schema'; // 👈 Import NewProfile type
import { eq } from 'drizzle-orm';
import minioClient from '../minioClient';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { drizzle } from 'drizzle-orm/node-postgres';

interface ProfileContext extends Context {
    db: ReturnType<typeof drizzle>;
}

export const profileController = (app: Elysia) => app
   // --- NEW POST /profile route for profile creation ---
// backend/profile-service/src/controllers/profileController.ts
.post('/profile', async ({ body, set, db }: ProfileContext & { body: NewProfile }) => {
    console.log('Profile Service - POST /profile endpoint hit!'); // 👈 ADD LOGGING: Route hit
    console.log('Request body:', body); // 👈 ADD LOGGING: Request body

    try {
        const newProfileData: NewProfile = body;
        const createdProfile = await db.insert(profiles)
            .values(newProfileData)
            .returning();

        set.status = 201;
        console.log('Profile created successfully:', createdProfile[0]); // 👈 ADD LOGGING: Success
        return { message: 'Profile created successfully', data: createdProfile[0] };
    } catch (error: any) {
        console.error('Error creating profile:', error); // Existing error logging
        set.status = 500;
        return { message: 'Failed to create profile', error: error.message };
    }
}, {
    body: t.Object({
        userId: t.String(),
        email: t.Optional(t.String()),
    }),
})
    .get('/profile/:userId', async ({ params: { userId }, set, db }: ProfileContext) => {
        try {
            const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
            if (!profile) {
                set.status = 404;
                return { message: 'Profile not found' };
            }
            return { message: 'Profile retrieved successfully', data: profile };
        } catch (error: any) {
            console.error('Error getting profile:', error);
            set.status = 500;
            return { message: 'Failed to get profile', error: error.message };
        }
    })
    .put('/profile/:userId', async ({ params: { userId }, body, set, db }: ProfileContext & { body: any }) => {
        try {
            const updatedProfile = await db.update(profiles)
                .set(body)
                .where(eq(profiles.userId, userId))
                .returning();

            if (updatedProfile.length === 0) {
                set.status = 404;
                return { message: 'Profile not found or not updated' };
            }

            set.status = 200;
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
            email: t.Optional(t.String()), // Permitir editar email (opcional)
            bio: t.Optional(t.String()),   // Permitir editar bio
            // No permitimos editar avatarUrl directamente desde este endpoint (se edita en /image)
        }),
    })
    
    .put('/profile/:userId/avatar', async ({ params: { userId }, body, set, db, request }: ProfileContext & { body: any }) => {
        try {
            const contentType = request.headers.get('content-type') || 'image/jpeg';
            const imageName = `profile-images/${userId}-${Date.now()}.${contentType.split('/')[1]}`;
            const bucketName = process.env.MINIO_BUCKET_NAME || 'profile-images';

            const uploadCommand = new PutObjectCommand({
                Bucket: bucketName,
                Key: imageName,
                Body: request.body as ReadableStream<any>,
                ContentType: contentType,
            });
            await minioClient.send(uploadCommand);

            const getObjectCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: imageName,
            });
            const avatarUrl = await getSignedUrl(minioClient, getObjectCommand, { expiresIn: 3600 });

            const updatedProfile = await db.update(profiles)
                .set({ avatarUrl: avatarUrl }) // Guardar 'avatarUrl' en lugar de 'profileImageUrl'
                .where(eq(profiles.userId, userId))
                .returning();

            if (updatedProfile.length === 0) {
                set.status = 404;
                return { message: 'Profile not found or not updated' };
            }

            set.status = 200;
            return { message: 'Profile image updated successfully', data: updatedProfile[0] };
        } catch (error: any) {
            console.error('Error updating profile image:', error);
            set.status = 500;
            return { message: 'Failed to update profile image', error: error.message };
        }
    });
    