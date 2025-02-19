import { Elysia } from 'elysia';
import imageService from '../services/imageService';
import { detectMimeType } from '../utils/fileType';
import { StorageError } from '../storage/StorageProvider';

async function extractFileFromRequest(request: Request): Promise<Buffer> {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const file = formData.get('avatar') || formData.get('file');
        if (!file || !(file instanceof Blob)) {
            throw new Error('No file uploaded');
        }
        return Buffer.from(await file.arrayBuffer());
    } else {
        const arrayBuffer = await request.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}

export const imageController = (app: Elysia) => app
    .put('/upload/:bucket/:userId', async ({ params: { bucket, userId }, request, set }) => {
        try {
            console.log('📤 Iniciando subida de imagen:', {
                bucket,
                userId,
                headers: Object.fromEntries(request.headers)
            });
            
            const buffer = await extractFileFromRequest(request);
            const detectedType = detectMimeType(buffer);

            if (!detectedType.startsWith('image/')) {
                console.error('❌ Tipo de archivo inválido:', detectedType);
                set.status = 400;
                return { message: 'Invalid file type. Only images are allowed.' };
            }

            console.log('📦 Archivo recibido:', {
                tipo: detectedType,
                tamaño: buffer.length
            });

            const fileName = imageService.generateImageName(userId, detectedType);
            console.log('📝 Nombre generado:', fileName);

            const imageUrl = await imageService.uploadImage(
                {
                    buffer,
                    fileName,
                    contentType: detectedType
                },
                bucket
            );

            console.log('✅ Imagen subida exitosamente:', imageUrl);
            set.status = 201;
            return { message: 'Image uploaded successfully', url: imageUrl };
        } catch (error: any) {
            console.error('❌ Error subiendo imagen:', error);
            set.status = error instanceof StorageError ? 400 : 500;
            return { message: 'Failed to upload image', error: error.message };
        }
    })

    .get('/:bucket/:imageId', async ({ params: { bucket, imageId }, set }) => {
        try {
            console.log('🔍 Solicitando imagen:', { bucket, imageId });

            const imageData = await imageService.getImage(bucket, imageId);
            if (!imageData || imageData.length === 0) {
                console.error('❌ Imagen no encontrada');
                set.status = 404;
                return { message: 'Image not found' };
            }

            // Detectar el tipo MIME de la imagen
            const detectedType = detectMimeType(imageData);
            console.log('🎨 Tipo MIME detectado:', detectedType);

            // Configurar headers para la respuesta
            const headers = new Headers({
                'Content-Type': detectedType,
                'Content-Length': imageData.length.toString(),
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*',
                'Accept-Ranges': 'bytes'
            });

            console.log('📤 Enviando imagen:', {
                tipo: detectedType,
                tamaño: imageData.length,
                headers: Object.fromEntries(headers.entries())
            });

            // Devolver la imagen como Response con los headers correctos
            return new Response(imageData, { headers });
        } catch (error) {
            console.error('❌ Error sirviendo imagen:', error);
            set.status = error instanceof StorageError ? 404 : 500;
            return { message: 'Error serving image', error: error instanceof Error ? error.message : 'Unknown error' };
        }
    })

    .delete('/delete/:bucket/:filename', async ({ params: { bucket, filename }, set }) => {
        try {
            console.log('🗑 Eliminando imagen:', { bucket, filename });
            
            await imageService.deleteImage(bucket, filename);
            
            set.status = 200;
            return { message: 'Image deleted successfully' };
        } catch (error) {
            console.error('❌ Error eliminando imagen:', error);
            set.status = error instanceof StorageError ? 404 : 500;
            return { message: 'Failed to delete image', error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
