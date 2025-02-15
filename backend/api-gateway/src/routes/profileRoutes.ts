import { Elysia } from "elysia";

const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';
const MINIO_SERVICE_URL = process.env.MINIO_SERVICE_URL || 'http://localhost:9002';

export const profileRoutes = (app: Elysia) => app
    .group('/profile', (app) => app
        // Subir avatar
        .put('/:userId/avatar', async ({ params: { userId }, request, set }) => {
            try {
                console.log('Recibiendo petición de subida de avatar');
                console.log('Content-Type:', request.headers.get('content-type'));
                
                const targetUrl = `${PROFILE_SERVICE_URL}/profile/${userId}/avatar`;
                console.log('Enviando a:', targetUrl);

                // Convertir el ReadableStream a ArrayBuffer para poder enviarlo
                const arrayBuffer = await new Response(request.body).arrayBuffer();

                const response = await fetch(targetUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': request.headers.get('content-type') || 'multipart/form-data',
                        'Authorization': request.headers.get('authorization') || '',
                    },
                    body: arrayBuffer,
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
    )
    // Ruta para servir imágenes de MinIO
    .get('/minio/profile-images/:imageId', async ({ params: { imageId }, set }) => {
        try {
            const minioUrl = `${MINIO_SERVICE_URL}/profile-images/${imageId}`;
            console.log('Accessing MinIO URL:', minioUrl);

            const minioCredentials = Buffer.from('Usuario1:Usuario1').toString('base64');
            const response = await fetch(minioUrl, {
                headers: {
                    'Authorization': `Basic ${minioCredentials}`,
                    'Host': new URL(MINIO_SERVICE_URL).host
                }
            });
            
            if (!response.ok) {
                console.error('MinIO error:', response.status);
                set.status = response.status;
                return new Response(null, { status: response.status });
            }

            const buffer = await response.arrayBuffer();
            set.headers['Content-Type'] = response.headers.get('content-type') || 'image/jpeg';
            set.headers['Cache-Control'] = 'public, max-age=31536000';
            return new Uint8Array(buffer);
        } catch (error) {
            console.error('Error serving image:', error);
            set.status = 500;
            return { message: 'Error serving image' };
        }
    });
