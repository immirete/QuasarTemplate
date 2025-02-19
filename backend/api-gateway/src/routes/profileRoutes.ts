import { Elysia } from "elysia";
import { Readable } from 'stream';

const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';
const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://localhost:3003';
const API_PUBLIC_URL = process.env.API_PUBLIC_URL || 'https://api-calistenics.duckdns.org';

// Función para construir URLs internas
const buildImageServiceUrl = (bucket: string, imageId: string) => {
    return `${IMAGE_SERVICE_URL}/${bucket}/${imageId}`;
};

// Función para construir URLs públicas
const buildPublicUrl = (bucket: string, imageId: string) => {
    return `${API_PUBLIC_URL}/api/v1/profile/images/${bucket}/${imageId}`;
};

export const profileRoutes = (app: Elysia) => app
    // Proxy para servir imágenes
    .get('/api/v1/profile/images/:bucket/:imageId', async ({ params: { bucket, imageId }, set }) => {
        const imageServiceUrl = buildImageServiceUrl(bucket, imageId);
        
        try {
            console.log('🔄 Obteniendo imagen desde:', imageServiceUrl);
            
            const response = await fetch(imageServiceUrl);
            
            if (!response.ok) {
                console.error('❌ Error del image-service:', response.status);
                set.status = response.status;
                return { message: 'Error accessing image' };
            }

            // Obtener y verificar el tipo de contenido
            const contentType = response.headers.get('Content-Type');
            if (!contentType || !contentType.startsWith('image/')) {
                console.error('❌ Tipo de contenido inválido:', contentType);
                set.status = 400;
                return { message: 'Invalid content type' };
            }

            // Configurar headers correctamente
            set.headers['Content-Type'] = contentType;
            const contentLength = response.headers.get('Content-Length');
            if (contentLength) {
                set.headers['Content-Length'] = contentLength;
            }
            set.headers['Cache-Control'] = 'public, max-age=31536000';
            set.headers['Access-Control-Allow-Origin'] = '*';

            // Obtener la imagen como ArrayBuffer
            const imageBuffer = await response.arrayBuffer();
            
            console.log('✅ Imagen obtenida:', {
                tipo: contentType,
                tamaño: imageBuffer.byteLength,
                headers: Object.fromEntries(Object.entries(set.headers))
            });

            // Devolver como Response con los headers correctos
            return new Response(imageBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Length': imageBuffer.byteLength.toString(),
                    'Cache-Control': 'public, max-age=31536000',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } catch (error) {
            console.error('❌ Error procesando imagen:', error);
            set.status = 500;
            return { message: 'Error processing image' };
        }
    })

    .group('/profile', (app) => app
        // Subir avatar
        .put('/:userId/avatar', async ({ params: { userId }, request, set }) => {
            try {
                const targetUrl = `${IMAGE_SERVICE_URL}/upload/profile-images/${userId}`;
                const formData = await request.formData();
                
                const response = await fetch(targetUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': request.headers.get('authorization') || '',
                    },
                    body: formData,
                });

                const responseText = await response.text();
                if (!response.ok) {
                    set.status = response.status;
                    return { message: 'Error uploading avatar', error: responseText };
                }

                const responseData = JSON.parse(responseText);
                if (!responseData.url) {
                    console.error('❌ No URL in response');
                    set.status = 500;
                    return { message: 'Image service did not return URL' };
                }

                const filename = responseData.url.split('/').pop();
                console.log('📄 Nombre del archivo:', filename);

                const profileServiceUrl = `${PROFILE_SERVICE_URL}/profile/${userId}/avatar-url`;
                const updatedProfileResponse = await fetch(profileServiceUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': request.headers.get('authorization') || '',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ filename }),
                });

                if (!updatedProfileResponse.ok) {
                    const errorText = await updatedProfileResponse.text();
                    set.status = updatedProfileResponse.status;
                    return { message: 'Error updating profile', error: errorText };
                }

                const publicUrl = buildPublicUrl('profile-images', filename);
                console.log('✅ URL pública generada:', publicUrl);
                
                set.status = 200;
                return { message: 'Avatar updated successfully', avatarUrl: publicUrl };
            } catch (error: any) {
                console.error('❌ Error:', error);
                set.status = 500;
                return { message: 'Failed to update avatar', error: error.message };
            }
        })

        // Obtener perfil
        .get('/:userId', async ({ params: { userId }, set, request }) => {
            try {
                const profileUrl = `${PROFILE_SERVICE_URL}/profile/${userId}`;
                const response = await fetch(profileUrl, {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': request.headers.get('authorization') || ''
                    }
                });

                if (!response.ok) {
                    set.status = response.status;
                    return { message: 'Profile not found' };
                }

                const profile = await response.json();
                
                // Convertir avatarUrl a URL pública
                if (profile.data?.avatarUrl) {
                    profile.data.avatarUrl = buildPublicUrl('profile-images', profile.data.avatarUrl);
                }

                return profile;
            } catch (error: any) {
                console.error('❌ Error:', error);
                set.status = 500;
                return { message: 'Failed to fetch profile', error: error.message };
            }
        })

        // Actualizar perfil
        .put('/:userId', async ({ params: { userId }, body, set, request }) => {
            try {
                const targetUrl = `${PROFILE_SERVICE_URL}/profile/${userId}`;
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
                    return { message: 'Error updating profile' };
                }

                const updatedProfile = await response.json();
                
                // Convertir avatarUrl a URL pública
                if (updatedProfile.data?.avatarUrl) {
                    updatedProfile.data.avatarUrl = buildPublicUrl('profile-images', updatedProfile.data.avatarUrl);
                }

                return updatedProfile;
            } catch (error: any) {
                console.error('❌ Error:', error);
                set.status = 500;
                return { message: 'Error updating profile', error: error.message };
            }
        })
    );
