import { PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import minioClient from '../minioClient';
import { resetAndSetupBucket } from '../utils/setupBucket';
import { detectMimeType, getFileExtension, isImageMimeType } from '../utils/fileType';

interface UploadImageOptions {
    buffer: Buffer;
    fileName: string;
    contentType?: string;
}

export class ImageService {
    private static instance: ImageService;
    private readonly endpoint: string;
    private initialized: boolean = false;

    private constructor() {
        this.endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9002';
    }

    public static getInstance(): ImageService {
        if (!ImageService.instance) {
            ImageService.instance = new ImageService();
        }
        return ImageService.instance;
    }

    private async initialize(bucketName: string) {
        if (!this.initialized) {
            try {
                console.log('Initializing image service and setting up bucket...');
                await resetAndSetupBucket(bucketName);
                this.initialized = true;
                console.log('Image service initialized successfully');
            } catch (error) {
                console.error('Failed to initialize image service:', error);
                throw error;
            }
        }
    }

    public async uploadImage(options: UploadImageOptions, bucketName: string): Promise<string> {
        // Asegurar que el bucket está configurado correctamente
        await this.initialize(bucketName);

        // Validar y detectar el tipo de imagen
        const detectedType = detectMimeType(options.buffer);
        if (!isImageMimeType(detectedType)) {
            throw new Error(`Invalid image format: ${detectedType}. Only JPEG, PNG, GIF and WEBP are supported.`);
        }

        console.log('Uploading image:', {
            fileName: options.fileName,
            contentType: detectedType,
            size: options.buffer.length
        });

        // Subir a MinIO
        try {
            const uploadCommand = new PutObjectCommand({
                Bucket: bucketName,
                Key: options.fileName,
                Body: options.buffer,
                ContentType: detectedType,
            });

            await minioClient.send(uploadCommand);
            console.log('File uploaded successfully');

            // Devolver la URL pública
            const imageUrl = `${this.endpoint}/${bucketName}/${options.fileName}`;
            console.log('Generated public URL:', imageUrl);
            return imageUrl;
        } catch (error) {
            console.error('Error uploading file to MinIO:', error);
            throw new Error('Failed to upload file to storage');
        }
    }

    public generateImageName(userId: string, contentType: string, prefix: string = ''): string {
        // Usar el tipo MIME para determinar la extensión
        const extension = getFileExtension(contentType);
        const timestamp = Date.now();
        return `${prefix}${userId}-${timestamp}.${extension}`;
    }
}

export default ImageService.getInstance();