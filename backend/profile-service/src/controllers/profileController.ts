import { Elysia, t, type Context } from 'elysia';
import { profiles, type Profile, type NewProfile } from '../schema';
import { eq } from 'drizzle-orm';
import minioClient from '../minioClient';
import { PutObjectCommand, GetObjectCommand, HeadBucketCommand, CreateBucketCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { drizzle } from 'drizzle-orm/node-postgres';

interface ProfileContext extends Context {
    db: ReturnType<typeof drizzle>;
}

export const profileController = (app: Elysia) => app
    .post('/profile', async ({ body, set, db }: ProfileContext & { body: NewProfile }) => {
        console.log('Profile Service - POST /profile endpoint hit!');
        console.log('Request body:', body);

        try {
            const newProfileData: NewProfile = body;
            const createdProfile = await db.insert(profiles)
                .values(newProfileData)
                .returning();

            set.status = 201;
            console.log('Profile created successfully:', createdProfile[0]);
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
            console.log('Using bucket:', bucketName);

            // Verificar/Crear bucket
            try {
                await minioClient.send(new HeadBucketCommand({ Bucket: bucketName }));
                console.log('Bucket exists:', bucketName);
            } catch (error) {
                console.log('Creating bucket:', bucketName);
                await minioClient.send(new CreateBucketCommand({ Bucket: bucketName }));
            }

            // Leer el archivo
            const arrayBuffer = await request.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            console.log('File received, size:', buffer.length, 'bytes');

            // Generar nombre único para la imagen
            const fileName = `${userId}-${Date.now()}.jpeg`;
            console.log('Image name:', fileName);
            
            // Subir a MinIO
            const uploadCommand = new PutObjectCommand({
                Bucket: bucketName,
                Key: fileName,
                Body: buffer,
                ContentType: 'image/jpeg',
            });

            console.log('Uploading to MinIO...', {
                bucket: bucketName,
                key: fileName,
                contentType: 'image/jpeg',
                size: buffer.length
            });

            await minioClient.send(uploadCommand);

            // Verificar que el archivo se subió correctamente
            try {
                const headObjectCommand = new HeadObjectCommand({
                    Bucket: bucketName,
                    Key: fileName
                });
                await minioClient.send(headObjectCommand);
                console.log('Upload verified successfully');

                // Generar URL para acceder a través del API Gateway
                const imageUrl = `http://localhost:3000/minio/profile-images/${fileName}`;
                console.log('Generated public URL:', imageUrl);

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
            } catch (error: any) {
                const errorMessage = error.message || 'Unknown error occurred';
                throw new Error('Failed to verify file upload: ' + errorMessage);
            }
        } catch (error: any) {
            console.error('Error in avatar upload:', error);
            set.status = 500;
            return { message: 'Failed to upload avatar', error: error.message };
        }
    });