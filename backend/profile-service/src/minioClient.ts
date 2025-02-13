// backend/profile-service/src/minioClient.ts
import { S3Client } from "@aws-sdk/client-s3";
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../../.env' });

const minioClient = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT || 'http://minio:9000',
    region: process.env.MINIO_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER || 'tu_usuario_minio',
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'tu_contraseña_minio',
    },
    forcePathStyle: true,
});

export default minioClient;