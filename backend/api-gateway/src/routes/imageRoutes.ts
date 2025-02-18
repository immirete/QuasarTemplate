import { Elysia, t } from 'elysia';

const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://localhost:3003';

// images.gateway.ts
export const imagesGateway = (app: Elysia) => app
    // Proxy para operaciones de imágenes
    .group('/images', (app) => app
        .put('/upload/:bucket/:userId', ({ params, request }) => 
            fetch(`${IMAGE_SERVICE_URL}/upload/${params.bucket}/${params.userId}`, {
                method: 'PUT',
                body: request.body
            })
        )
        .get('/:bucket/:imageId', ({ params }) => 
            fetch(`${IMAGE_SERVICE_URL}/${params.bucket}/${params.imageId}`)
        )
    );