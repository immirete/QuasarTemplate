// backend/api-gateway/routes/profile.ts
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from '@elysiajs/bearer';

const validateAuth = async ({ jwt, request, set }: { jwt: any, request: Request, set: any }) => {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token || !await jwt.verify(token)) {
        set.status = 401;
        return false;
    }
    return true;
};

export const profileRoutes = (app: Elysia) => app
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET || 'your-secret-key'
    }))
    .use(bearer())
    .decorate('fetch', fetch)
    .group('/profile', (app) => app
        .get('/:userId', async ({ params: { userId }, set, fetch, request, jwt }) => {
            try {
                if (!await validateAuth({ jwt, request, set })) {
                    return { message: 'Unauthorized: Invalid token' };
                }

                const response = await fetch(`http://localhost:3002/profile/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': request.headers.get('authorization') || '', // Forward Authorization header
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    set.status = response.status;
                    return data;
                }

                set.status = 200;
                return data;
            } catch (error: any) {
                console.error('Error proxying request to profile service:', error);
                set.status = 500;
                return { message: 'Failed to proxy request to profile service', error: error.message };
            }
        })
        .put('/:userId', async ({ params: { userId }, body, set, fetch, jwt, request }) => {
            try {
                if (!await validateAuth({ jwt, request, set })) {
                    return { message: 'Unauthorized: Invalid token' };
                }

                const response = await fetch(`http://localhost:3002/profile/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': request.headers.get('authorization') || '', // Forward Authorization header
                    },
                    body: JSON.stringify(body),
                });

                const data = await response.json();

                if (!response.ok) {
                    set.status = response.status;
                    return data;
                }

                set.status = 200;
                return data;
            } catch (error: any) {
                console.error('Error proxying request to profile service:', error);
                set.status = 500;
                return { message: 'Failed to proxy request to profile service', error: error.message };
            }
        })
        .put('/:userId/avatar', async ({ params: { userId }, body, set, fetch, jwt, request }) => {
            try {
                if (!await validateAuth({ jwt, request, set })) {
                    return { message: 'Unauthorized: Invalid token' };
                }

                const response = await fetch(`http://localhost:3002/profile/${userId}/avatar`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': request.headers.get('content-type') || 'image/jpeg', // Forward Content-Type
                        'Authorization': request.headers.get('authorization') || '', // Forward Authorization header
                    },
                    body: request.body as ReadableStream<any>, // Forward request body as stream
                });

                const data = await response.json(); // Note: This might not be JSON for image upload success
                if (!response.ok) {
                    set.status = response.status;
                    return data; // Return error from profile-service
                }

                set.status = 200;
                return data; // Return success from profile-service
            } catch (error: any) {
                console.error('Error proxying profile image update to profile service:', error);
                set.status = 500;
                return { message: 'Failed to proxy profile image update', error: error.message };
            }
        })
        .get('/:userId/image', async ({ params: { userId }, set, fetch, jwt, request }) => {
            try {
                if (!await validateAuth({ jwt, request, set })) {
                    return { message: 'Unauthorized: Invalid token' };
                }
                
                const response = await fetch(`http://localhost:3002/profile/${userId}/image`, {
                    headers: {
                        'Authorization': request.headers.get('authorization') || '', // Forward Authorization header
                    },
                });

                if (!response.ok) {
                    set.status = response.status;
                    return { message: 'Error fetching profile image', error: await response.text() }; // Return error from profile-service
                }

                set.status = 200;
                set.headers['Content-Type'] = response.headers.get('content-type') || 'image/jpeg'; // Set Content-Type from profile-service response
                return response.body; // Stream image body to client
            } catch (error: any) {
                console.error('Error proxying profile image:', error);
                set.status = 500;
                return { message: 'Failed to proxy profile image', error: error.message };
            }
        })
    )