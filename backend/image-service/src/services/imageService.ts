import { detectMimeType, getFileExtension } from '../utils/fileType';
import { StorageProvider, StorageFactory, StorageConfig } from '../storage/StorageProvider';

interface UploadOptions {
    buffer: Buffer;
    fileName: string;
    contentType: string;
}

class ImageService {
    private storageProvider?: StorageProvider;
    private config: StorageConfig;

    constructor() {
        this.config = {
            endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9002',
            region: 'us-east-1',
            credentials: {
                accessKey: process.env.MINIO_ROOT_USER || 'Usuario1',
                secretKey: process.env.MINIO_ROOT_PASSWORD || 'Usuario1',
            },
            publicUrlBase: process.env.IMAGE_SERVICE_URL || 'http://localhost:3003'
        };
    }

    private async ensureProvider(): Promise<StorageProvider> {
        if (!this.storageProvider) {
            this.storageProvider = await StorageFactory.createProvider('minio', this.config);
        }
        return this.storageProvider;
    }

    public async initialize(): Promise<void> {
        try {
            await this.ensureProvider();
            console.log('✅ Proveedor de almacenamiento inicializado');
        } catch (error) {
            console.error('❌ Error inicializando el proveedor de almacenamiento:', error);
            throw error;
        }
    }

    public generateImageName(userId: string, mimeType: string): string {
        const timestamp = Date.now();
        const extension = getFileExtension(mimeType);
        return `${userId}-${timestamp}.${extension}`;
    }

    public async uploadImage(options: UploadOptions, bucketName: string): Promise<string> {
        try {
            console.log('📥 Iniciando subida de imagen:', {
                fileName: options.fileName,
                bucketName,
                contentType: options.contentType,
                size: options.buffer.length
            });

            // Verificar que el tipo MIME es de imagen
            const detectedType = detectMimeType(options.buffer);
            console.log('🔍 Tipo MIME detectado:', detectedType);

            if (!detectedType.startsWith('image/')) {
                throw new Error('Invalid file type. Only images are allowed.');
            }

            // Obtener el proveedor y subir el archivo
            const provider = await this.ensureProvider();
            const imageUrl = await provider.uploadFile(
                bucketName,
                options.fileName,
                options.buffer,
                detectedType
            );

            console.log('✅ Imagen subida exitosamente:', imageUrl);
            return imageUrl;

        } catch (error) {
            console.error('❌ Error en ImageService.uploadImage:', error);
            throw error;
        }
    }

    public async deleteImage(bucketName: string, fileName: string): Promise<void> {
        try {
            console.log('🗑️ Eliminando imagen:', { bucket: bucketName, file: fileName });
            const provider = await this.ensureProvider();
            await provider.deleteFile(bucketName, fileName);
            console.log('✅ Imagen eliminada exitosamente');
        } catch (error) {
            console.error('❌ Error eliminando archivo:', error);
            throw error;
        }
    }

    public async getImage(bucketName: string, fileName: string): Promise<Buffer> {
        try {
            console.log('🔍 Obteniendo imagen:', { bucket: bucketName, file: fileName });
            const provider = await this.ensureProvider();
            return await provider.getFile(bucketName, fileName);
        } catch (error) {
            console.error('❌ Error obteniendo imagen:', error);
            throw error;
        }
    }

    public async getPublicUrl(bucketName: string, fileName: string): Promise<string> {
        const provider = await this.ensureProvider();
        return provider.getPublicUrl(bucketName, fileName);
    }
}

// Crear e inicializar el servicio
const imageService = new ImageService();

// Inicializar el servicio
(async () => {
    try {
        await imageService.initialize();
    } catch (error) {
        console.error('❌ Error inicializando ImageService:', error);
        process.exit(1); // Salir si no podemos inicializar el servicio
    }
})();

export default imageService;