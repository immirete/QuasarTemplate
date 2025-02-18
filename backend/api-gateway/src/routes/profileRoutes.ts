import { Elysia } from "elysia";

const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';
const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://localhost:3003';

export const profileRoutes = (app: Elysia) => app
    // Ruta para servir imágenes (redirección al image-service)
    .get('/api/v1/profile/images/:bucket/:imageId', async ({ params: { bucket, imageId }, set }) => {
        try {
            const imageUrl = `${IMAGE_SERVICE_URL}/${bucket}/${imageId}`;
            console.log('🔄 Redirigiendo a image-service:', imageUrl);

            const response = await fetch(imageUrl);
            
            if (!response.ok) {
                console.error('❌ Image service error:', response.status);
                set.status = response.status;
                return { message: 'Error accessing image' };
            }

            // Copiar todos los headers relevantes
            for (const [key, value] of response.headers) {
                set.headers[key] = value;
            }

            // Devolver la imagen
            const buffer = await response.arrayBuffer();
            return new Uint8Array(buffer);
        } catch (error) {
            console.error('❌ Error accessing image service:', error);
            set.status = 500;
            return { message: 'Error serving image' };
        }
    })

    .group('/profile', (app) => app
        // Subir avatar (redirección al image-service)
        .put('/:userId/avatar', async ({ params: { userId }, request, set }) => {
            try {
                console.log('📤 Recibiendo petición de subida de avatar');
                
                const targetUrl = `${IMAGE_SERVICE_URL}/upload/profile-images/${userId}`;
                console.log('🔄 Redirigiendo a:', targetUrl);

                // Reenviar el FormData manteniendo su estructura
                const formData = await request.formData();
                
                const response = await fetch(targetUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': request.headers.get('authorization') || '',
                    },
                    body: formData,
                });

                console.log('📥 Respuesta del image-service:', response.status);
                const responseText = await response.text();

                if (!response.ok) {
                    set.status = response.status;
                    return { message: 'Error uploading avatar', error: responseText };
                }

                set.status = 201;
                return JSON.parse(responseText);
            } catch (error: any) {
                console.error('❌ Error uploading avatar:', error);
                set.status = 500;
                return { message: 'Failed to upload avatar', error: error.message };
            }
        })

        // Obtener perfil de usuario
        .get('/:userId', async ({ params: { userId }, set, request }) => {
            try {
                // Agrega logging para debug
                console.log('🔍 Intentando obtener perfil para userId:', userId);
                
                // Asegúrate de que la URL se construye correctamente
                const profileUrl = `${PROFILE_SERVICE_URL}/profile/${userId}`;
                console.log('🌐 URL del servicio:', profileUrl);

                const response = await fetch(profileUrl, {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        // Agrega el token de autorización si es necesario
                        'Authorization': request.headers.get('authorization') || ''
                    }
                });

                // Agrega más logging
                console.log('📥 Status code:', response.status);
                
                if (!response.ok) {
                    console.error('❌ Error response:', await response.text());
                    set.status = response.status;
                    return { message: 'Profile not found', status: response.status };
                }

                const data = await response.json();
                console.log('✅ Datos recibidos:', data);
                return data;
            } catch (error: any) {
                console.error('❌ Error fetching profile:', error);
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
