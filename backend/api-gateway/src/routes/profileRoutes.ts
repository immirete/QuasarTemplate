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
                
                // URL para subir la imagen al Image Service
                const targetUrl = `${IMAGE_SERVICE_URL}/upload/profile-images/${userId}`;
                console.log('🔄 Redirigiendo a:', targetUrl);
        
                // Obtener el FormData (la imagen) y reenviarlo al Image Service
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
        
                // Imprimir la respuesta completa para ver su estructura
                console.log('🔍 Respuesta completa del image-service:', responseText);
        
                const responseData = JSON.parse(responseText);
        
                // Verificar si "url" existe en la respuesta del image-service
                if (!responseData.url) {
                    console.error('❌ No se encontró "url" en la respuesta del image-service');
                    set.status = 500;
                    return { message: 'Image service did not return URL' };
                }
        
                // Obtener la URL del avatar desde la respuesta del Image Service
                const avatarUrl = responseData.url;  // URL de la imagen subida
                console.log('✅ Avatar subido:', avatarUrl);

                // Actualizar el perfil con la nueva URL del avatar
                const profileServiceUrl = `${PROFILE_SERVICE_URL}/profile/${userId}/avatar-url`;
                console.log('🔄 Actualizando perfil con nueva URL:', avatarUrl);

                const updatedProfileResponse = await fetch(profileServiceUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': request.headers.get('authorization') || '',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ avatarUrl }),
                });

                if (!updatedProfileResponse.ok) {
                    const errorText = await updatedProfileResponse.text();
                    console.error('❌ Error actualizando perfil:', errorText);
                    throw new Error(`Error actualizando perfil: ${errorText}`);
                }

                const profileUpdateResult = await updatedProfileResponse.json();
                console.log('✅ Perfil actualizado:', profileUpdateResult);
        
                if (!updatedProfileResponse.ok) {
                    const errorText = await updatedProfileResponse.text();
                    console.error('❌ Error updating profile:', errorText);
                    set.status = updatedProfileResponse.status;
                    return { message: 'Error updating profile', error: errorText };
                }
        
                // Si todo fue exitoso
                set.status = 200;
                return { message: 'Avatar updated successfully', avatarUrl };
        
            } catch (error: any) {
                console.error('❌ Error uploading avatar:', error);
                set.status = 500;
                return { message: 'Failed to update avatar', error: error.message };
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
