import { Elysia, t } from 'elysia';
import imageService from '../services/imageService';
import { detectMimeType } from '../utils/fileType';

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
    // Subir imagen
    .put('/upload/:bucket/:userId', async ({ params: { bucket, userId }, request, set }) => {
        try {
            console.log('🚀 Iniciando proceso de subida de imagen');
            console.log(`📁 Bucket: ${bucket}, UserId: ${userId}`);
            console.log('📨 Headers:', Object.fromEntries(request.headers));
            
            // Extraer el archivo
            const buffer = await extractFileFromRequest(request);
            console.log('📦 Archivo recibido:', {
                tamaño: buffer.length,
                tipoContenido: request.headers.get('content-type')
            });

            // Detectar el tipo real del archivo
            const detectedType = detectMimeType(buffer);
            console.log('Tipo de archivo detectado:', detectedType);

            // Generar nombre único para la imagen
            const fileName = imageService.generateImageName(userId, detectedType);
            console.log('Nombre de archivo generado:', fileName);

            // Subir la imagen
            const imageUrl = await imageService.uploadImage(
                {
                    buffer,
                    fileName,
                    contentType: detectedType
                },
                bucket
            );

            set.status = 201;
            return { message: 'Image uploaded successfully', url: imageUrl };
        } catch (error: any) {
            console.error('Error uploading image:', error);
            set.status = 500;
            return { message: 'Failed to upload image', error: error.message };
        }
    })

    // Servir imagen
    .get('/:bucket/:imageId', async ({ params: { bucket, imageId }, set }) => {
        try {
            const minioUrl = `${process.env.MINIO_ENDPOINT || 'http://localhost:9002'}/${bucket}/${imageId}`;
            console.log('Accediendo a MinIO URL:', minioUrl);

            const response = await fetch(minioUrl);
            
            if (!response.ok) {
                set.status = response.status;
                return { message: 'Error accessing image' };
            }

            // Configurar los headers para la respuesta
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');
            const etag = response.headers.get('etag');
            const lastModified = response.headers.get('last-modified');

            if (contentType) set.headers['Content-Type'] = contentType;
            if (contentLength) set.headers['Content-Length'] = contentLength;
            if (etag) set.headers['ETag'] = etag;
            if (lastModified) set.headers['Last-Modified'] = lastModified;

            set.headers['Cache-Control'] = 'public, max-age=31536000';
            set.headers['Access-Control-Allow-Origin'] = '*';

            // Devolver la imagen como buffer
            const buffer = await response.arrayBuffer();
            return new Uint8Array(buffer);
        } catch (error) {
            console.error('Error serving image:', error);
            set.status = 500;
            return { message: 'Error serving image' };
        }
    })

    // Eliminar imagen
    .delete('/:bucket/:imageId', async ({ params: { bucket, imageId }, set }) => {
        try {
            await imageService.deleteImage(bucket, imageId);
            set.status = 200;
            return { message: 'Image deleted successfully' };
        } catch (error: any) {
            console.error('Error deleting image:', error);
            set.status = 500;
            return { message: 'Failed to delete image', error: error.message };
        }
    });