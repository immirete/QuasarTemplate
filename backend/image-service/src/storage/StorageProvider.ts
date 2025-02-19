// Interfaz abstracta para el proveedor de almacenamiento
export interface StorageProvider {
    uploadFile(bucket: string, fileKey: string, data: Buffer, contentType: string): Promise<string>;
    getFile(bucket: string, fileKey: string): Promise<Buffer>;
    deleteFile(bucket: string, fileKey: string): Promise<void>;
    getPublicUrl(bucket: string, fileKey: string): string;
}

// Configuración base para cualquier proveedor de almacenamiento
export interface StorageConfig {
    endpoint?: string;
    region?: string;
    credentials?: {
        accessKey: string;
        secretKey: string;
    };
    publicUrlBase: string;
}

// Error personalizado para operaciones de almacenamiento
export class StorageError extends Error {
    constructor(message: string, public readonly code?: string) {
        super(message);
        this.name = 'StorageError';
    }
}

// Factory para crear instancias de proveedores de almacenamiento
export class StorageFactory {
    static async createProvider(type: string, config: StorageConfig): Promise<StorageProvider> {
        switch (type.toLowerCase()) {
            case 'minio': {
                const { MinioProvider } = await import('./MinioProvider');
                return new MinioProvider(config);
            }
            case 's3':
                throw new Error('S3 provider not implemented yet');
            case 'gcs':
                throw new Error('Google Cloud Storage provider not implemented yet');
            default:
                throw new Error(`Unknown storage provider type: ${type}`);
        }
    }
}
