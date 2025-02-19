import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { StorageProvider, StorageConfig, StorageError } from './StorageProvider';
import { Readable } from 'stream';
import { detectMimeType } from '../utils/fileType';

export class MinioProvider implements StorageProvider {
    private client: S3Client;
    private config: StorageConfig;

    constructor(config: StorageConfig) {
        this.config = config;
        this.client = new S3Client({
            endpoint: config.endpoint,
            region: config.region || 'us-east-1',
            credentials: {
                accessKeyId: config.credentials?.accessKey || '',
                secretAccessKey: config.credentials?.secretKey || '',
            },
            forcePathStyle: true
        });

        console.log('🔧 MinIO Provider configurado:', {
            endpoint: config.endpoint,
            region: config.region,
            publicUrlBase: config.publicUrlBase
        });
    }

    async uploadFile(bucket: string, fileKey: string, data: Buffer, contentType: string): Promise<string> {
        try {
            console.log('📤 Subiendo archivo a MinIO:', {
                bucket,
                fileKey,
                contentType,
                tamaño: data.length
            });

            // Verificar y corregir el tipo MIME si es necesario
            const detectedType = detectMimeType(data);
            if (detectedType !== contentType) {
                console.warn('⚠️ Tipo MIME detectado diferente del proporcionado:', {
                    proporcionado: contentType,
                    detectado: detectedType
                });
                contentType = detectedType;
            }

            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: fileKey,
                Body: data,
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000',
                Metadata: {
                    'original-filename': fileKey,
                    'content-type': contentType,
                    'upload-date': new Date().toISOString()
                }
            });

            await this.client.send(command);
            const url = this.getPublicUrl(bucket, fileKey);
            
            console.log('✅ Archivo subido exitosamente:', url);
            return url;
        } catch (error: any) {
            console.error('❌ Error en MinioProvider.uploadFile:', error);
            throw new StorageError(`Failed to upload file: ${error.message}`, error.code);
        }
    }

    async getFile(bucket: string, fileKey: string): Promise<Buffer> {
        try {
            console.log('🔍 Obteniendo archivo de MinIO:', {
                bucket,
                fileKey
            });

            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: fileKey,
            });

            const response = await this.client.send(command);
            
            if (!response.Body) {
                throw new Error('No data received from storage');
            }

            // Convertir el stream a Buffer
            const chunks: Buffer[] = [];
            const stream = response.Body as Readable;
            
            return new Promise((resolve, reject) => {
                stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
                stream.on('error', (err) => {
                    console.error('❌ Error leyendo stream:', err);
                    reject(new StorageError(`Failed to read file stream: ${err.message}`));
                });
                stream.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    console.log('✅ Archivo leído exitosamente:', {
                        tamaño: buffer.length,
                        tipo: response.ContentType
                    });
                    resolve(buffer);
                });
            });
        } catch (error: any) {
            console.error('❌ Error en MinioProvider.getFile:', error);
            throw new StorageError(`Failed to get file: ${error.message}`, error.code);
        }
    }

    async deleteFile(bucket: string, fileKey: string): Promise<void> {
        try {
            console.log('🗑️ Eliminando archivo de MinIO:', {
                bucket,
                fileKey
            });

            const command = new DeleteObjectCommand({
                Bucket: bucket,
                Key: fileKey,
            });

            await this.client.send(command);
            console.log('✅ Archivo eliminado exitosamente');
        } catch (error: any) {
            console.error('❌ Error en MinioProvider.deleteFile:', error);
            throw new StorageError(`Failed to delete file: ${error.message}`, error.code);
        }
    }

    getPublicUrl(bucket: string, fileKey: string): string {
        // Construir URL pública usando la base configurada
        const url = `${this.config.publicUrlBase}/${bucket}/${fileKey}`;
        return url;
    }
}