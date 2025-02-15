// backend/profile-service/src/minioClient.ts
import { S3Client } from "@aws-sdk/client-s3";
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde el directorio actual
dotenv.config();

// Configuración de MinIO
const MINIO_CONFIG = {
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9002',
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER || 'Usuario1',
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'Usuario1',
    }
};

// Log de configuración (sin mostrar secretos)
console.log('MinIO Configuration:', {
    endpoint: MINIO_CONFIG.endpoint,
    region: MINIO_CONFIG.region,
    credentials: {
        accessKeyId: MINIO_CONFIG.credentials.accessKeyId,
        secretKeyIsSet: !!MINIO_CONFIG.credentials.secretAccessKey
    }
});

// Crear cliente S3
const minioClient = new S3Client({
    ...MINIO_CONFIG,
    forcePathStyle: true,
    // Configuración adicional para manejo de errores y timeouts
    maxAttempts: 3,
    requestHandler: {
        abortSignal: undefined,
        connectionTimeout: 5000, // 5 segundos
        socketTimeout: 5000      // 5 segundos
    }
});

// Log de inicialización exitosa
console.log('MinIO client initialized successfully');

export default minioClient;