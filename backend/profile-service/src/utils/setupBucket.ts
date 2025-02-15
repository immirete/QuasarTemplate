import { DeleteBucketCommand, CreateBucketCommand, PutBucketPolicyCommand, DeleteObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3';
import minioClient from '../minioClient';

async function deleteAllObjects(bucketName: string) {
    try {
        const listCommand = new ListObjectsCommand({ Bucket: bucketName });
        const objects = await minioClient.send(listCommand);
        
        if (objects.Contents && objects.Contents.length > 0) {
            for (const object of objects.Contents) {
                if (object.Key) {
                    await minioClient.send(new DeleteObjectCommand({
                        Bucket: bucketName,
                        Key: object.Key
                    }));
                    console.log(`Deleted object: ${object.Key}`);
                }
            }
        }
    } catch (error) {
        console.error('Error deleting objects:', error);
    }
}

export async function resetAndSetupBucket(bucketName: string) {
    try {
        // 1. Intentar eliminar todos los objetos primero
        await deleteAllObjects(bucketName);

        // 2. Intentar eliminar el bucket existente
        try {
            await minioClient.send(new DeleteBucketCommand({ Bucket: bucketName }));
            console.log('Deleted existing bucket');
        } catch (error) {
            console.log('Bucket did not exist or could not be deleted');
        }

        // 3. Crear nuevo bucket
        await minioClient.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log('Created new bucket');

        // 4. Configurar política pública
        const publicPolicy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'PublicReadGetObject',
                    Effect: 'Allow',
                    Principal: {
                        AWS: ['*']
                    },
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${bucketName}/*`]
                }
            ]
        };

        await minioClient.send(new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(publicPolicy)
        }));
        console.log('Applied public read policy to bucket');

        return true;
    } catch (error) {
        console.error('Error setting up bucket:', error);
        throw error;
    }
}