import { Elysia, t, type Context } from 'elysia';
import { profiles, type Profile, type NewProfile } from '../schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import imageService from '../services/imageService';
import { detectMimeType } from '../utils/fileType';

interface ProfileContext extends Context {
    db: ReturnType<typeof drizzle>;
}

async function extractFileFromRequest(request: Request): Promise<Buffer> {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const file = formData.get('avatar');
        if (!file || !(file instanceof Blob)) {
            throw new Error('No file uploaded');
        }
        return Buffer.from(await file.arrayBuffer());
    } else {
        // Fallback para otros tipos de contenido
        const arrayBuffer = await request.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
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
        } catch (error: any) {
            console.error('Error creating profile:', error);
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
            email: t.Optional(t.String()),
            bio: t.Optional(t.String()),
        }),
    })
    
    .put('/profile/:userId/avatar', async ({ params: { userId }, set, db, request }: ProfileContext) => {
        console.log('Avatar upload request received for user:', userId);
        try {
            const bucketName = process.env.MINIO_BUCKET_NAME || 'profile-images';
            
            // Extraer el archivo
            const buffer = await extractFileFromRequest(request);
            console.log('File received, size:', buffer.length, 'bytes');

            // Detectar el tipo real del archivo
            const detectedType = detectMimeType(buffer);
            console.log('Detected file type:', detectedType);

            // Generar nombre único para la imagen y subirla
            const fileName = imageService.generateImageName(userId, detectedType, 'avatar-');
            console.log('Generated file name:', fileName);

            // Subir la imagen
            try {
                const imageUrl = await imageService.uploadImage(
                    {
                        buffer,
                        fileName,
                        contentType: detectedType
                    },
                    bucketName
                );
                console.log('Image uploaded successfully:', imageUrl);

                // Actualizar perfil con la nueva URL
                const updatedProfile = await db.update(profiles)
                    .set({ avatarUrl: imageUrl })
                    .where(eq(profiles.userId, userId))
                    .returning();

                if (updatedProfile.length === 0) {
                    throw new Error('Profile not found or not updated');
                }

                set.status = 200;
                return { message: 'Avatar updated successfully', data: updatedProfile[0] };
            } catch (uploadError) {
                console.error('Error uploading to MinIO:', uploadError);
                throw new Error('Failed to upload image to storage');
            }
        } catch (error: any) {
            console.error('Error in avatar upload:', error);
            set.status = 500;
            return { message: 'Failed to upload avatar', error: error.message };
        }
    });
