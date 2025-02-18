import { CreateBucketCommand, PutBucketPolicyCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import minioClient from '../minioClient';

export async function setupBucket(bucketName: string) {
    try {
        // 1. Verificar si el bucket existe
        try {
            await minioClient.send(new HeadBucketCommand({ Bucket: bucketName }));
            console.log('Bucket already exists');
        } catch (error) {
            // Si el bucket no existe, lo creamos
            await minioClient.send(new CreateBucketCommand({ Bucket: bucketName }));
            console.log('Created new bucket');
        }

        // 2. Configurar política pública
        const publicPolicy = {
            Version: '2012-10-17',
            Statement: [{
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucketName}/*`]
            }]
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