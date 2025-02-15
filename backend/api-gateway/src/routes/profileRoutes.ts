import { Elysia } from "elysia";

const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';
const MINIO_SERVICE_URL = process.env.MINIO_SERVICE_URL || 'http://localhost:9002';

export const profileRoutes = (app: Elysia) => app
    // Ruta para servir imágenes de MinIO
    .get('/api/v1/profile/images/:imageId', async ({ params: { imageId }, set }) => {
        try {
            const minioUrl = `${MINIO_SERVICE_URL}/profile-images/${imageId}`;
            console.log('Accessing MinIO URL:', minioUrl);

            const response = await fetch(minioUrl);
            
            if (!response.ok) {
                console.error('MinIO error:', response.status);
                const errorText = await response.text();
                console.error('MinIO error details:', errorText);
                set.status = response.status;
                return { message: 'Error accessing image' };
            }

            // Configurar los headers exactamente como los envía MinIO
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

            // Servir la imagen directamente como buffer
            const buffer = await response.arrayBuffer();
            return new Uint8Array(buffer);
        } catch (error) {
            console.error('Error serving image:', error);
            set.status = 500;
            return { message: 'Error serving image' };
        }
    })

    .group('/profile', (app) => app
        // Subir avatar
        .put('/:userId/avatar', async ({ params: { userId }, request, set }) => {
            try {
                console.log('Recibiendo petición de subida de avatar');
                const contentType = request.headers.get('content-type');
                console.log('Content-Type:', contentType);
                
                const targetUrl = `${PROFILE_SERVICE_URL}/profile/${userId}/avatar`;
                console.log('Enviando a:', targetUrl);

                // Reenviar el FormData manteniendo su estructura
                const formData = await request.formData();
                
                // Debug: verificar el contenido del FormData
                console.log('FormData entries:');
                for (const [key, value] of formData.entries()) {
                    console.log(`Key: ${key}, Value type: ${value instanceof Blob ? 'Blob' : typeof value}`);
                    if (value instanceof Blob) {
                        console.log(`Blob size: ${value.size} bytes`);
                    }
                }

                const response = await fetch(targetUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': request.headers.get('authorization') || '',
                    },
                    body: formData,
                });

                console.log('Respuesta del profile-service:', response.status);
                const responseText = await response.text();
                console.log('Respuesta completa:', responseText);

                if (!response.ok) {
                    set.status = response.status;
                    return { message: 'Error uploading avatar', error: responseText };
                }

                set.status = 200;
                return JSON.parse(responseText);
            } catch (error: any) {
                console.error('Error uploading avatar:', error);
                set.status = 500;
                return { message: 'Failed to upload avatar', error: error.message };
            }
        })
        // Obtener perfil de usuario
        .get('/:userId', async ({ params: { userId }, set }) => {
            try {
                const response = await fetch(`${PROFILE_SERVICE_URL}/profile/${userId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                const textResponse = await response.text();
                console.log('📩 Respuesta de profile-service:', textResponse);

                const data = JSON.parse(textResponse);
                set.status = response.ok ? 200 : response.status;
                return data;
            } catch (error: any) {
                console.error('Error fetching profile:', error);
                set.status = 500;
                return { message: 'Failed to fetch profile', error: error.message };
            }
        })

        // Actualizar perfil de usuario
        .put('/:userId', async ({ params: { userId }, body, set, request }) => {
            try {
                console.log('📥 Datos recibidos en API Gateway:', body);

                const targetUrl = `${PROFILE_SERVICE_URL}/profile/${userId}`;
                console.log('🚀 Redirigiendo a:', targetUrl);

                const response = await fetch(targetUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': request.headers.get('authorization') || '',
                    },
                    body: JSON.stringify(body),
                });

                if (!response.ok) {
                    set.status = response.status;
                    return { message: 'Error en profile-service' };
                }

                set.status = 200;
                return { message: 'Perfil actualizado con éxito' };
            } catch (error: any) {
                console.error('❌ Error en API Gateway:', error);
                set.status = 500;
                return { message: 'Error al conectar con profile service', error: error.message };
            }
        })
    );
