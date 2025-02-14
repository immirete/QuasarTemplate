import { Elysia } from "elysia";

const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';

export const profileRoutes = (app: Elysia) => app
    .group('/profile', (app) => app
        // Obtener perfil de usuario
        .get('/:userId', async ({ params: { userId }, set }) => {
            try {
                const response = await fetch(`${PROFILE_SERVICE_URL}/profile/${userId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                const textResponse = await response.text(); // 📌 Leer la respuesta como texto primero
                console.log('📩 Respuesta de profile-service:', textResponse); // Ver qué está recibiendo

                const data = JSON.parse(textResponse); // Convertir manualmente a JSON
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
                        'Authorization': request.headers.get('authorization') || '', // 🔹 Pasamos el token
                    },
                    body: JSON.stringify(body),
                });

                console.log('📩 Respuesta del profile-service:', response.status, await response.text());

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

        // Obtener imagen de perfil
        .get('/:userId/image', async ({ params: { userId }, set }) => {
            try {
                const response = await fetch(`${PROFILE_SERVICE_URL}/profile/${userId}/image`);

                if (!response.ok) {
                    set.status = response.status;
                    return { message: 'Error fetching profile image' };
                }

                set.status = 200;
                set.headers['Content-Type'] = response.headers.get('content-type') || 'image/jpeg';
                return response.body;
            } catch (error: any) {
                console.error('Error fetching profile image:', error);
                set.status = 500;
                return { message: 'Failed to fetch profile image', error: error.message };
            }
        })
    );
