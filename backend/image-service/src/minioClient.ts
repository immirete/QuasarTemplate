import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Obtener configuración del .env
const MINIO_CONFIG = {
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9002',
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER || 'Usuario1',
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'Usuario1',
    },
    forcePathStyle: true
};

// Log de configuración (sin secretos)
console.log('📦 MinIO Configuration:', {
    endpoint: MINIO_CONFIG.endpoint,
    region: MINIO_CONFIG.region,
    credentials: {
        accessKeyId: MINIO_CONFIG.credentials.accessKeyId,
        secretKeyIsSet: !!MINIO_CONFIG.credentials.secretAccessKey
    }
});

// Crear cliente S3 con configuración mejorada
const minioClient = new S3Client({
    ...MINIO_CONFIG,
    forcePathStyle: true,
    requestHandler: {
        abortSignal: undefined,
        connectionTimeout: 30000,
        socketTimeout: 30000,
        keepAlive: true,
        maxSockets: 50,
    }
});

// Log de inicialización exitosa
console.log('✅ MinIO client initialized');

// Función para verificar la conectividad
const testMinioConnection = async () => {
    try {
        // Intentar listar buckets como prueba de conexión
        const command = new ListBucketsCommand({});
        const response = await minioClient.send(command);
        
        console.log('🔗 MinIO connection test successful:', {
            buckets: response.Buckets?.length || 0,
            owner: response.Owner?.DisplayName
        });
        return true;
    } catch (error) {
        console.error('❌ MinIO connection test failed:', {
            error: error instanceof Error ? error.message : String(error),
            config: {
                endpoint: MINIO_CONFIG.endpoint,
                region: MINIO_CONFIG.region
            }
        });
        return false;
    }
};

// Ejecutar prueba de conexión al iniciar
testMinioConnection().catch(console.error);

// Exportar cliente y función de prueba
export { minioClient as default, testMinioConnection };