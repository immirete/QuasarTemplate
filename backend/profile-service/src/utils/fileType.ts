// Basado en las firmas de archivo comunes (magic numbers)
export function detectMimeType(buffer: Buffer): string {
    // JPEG: Comienza con FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'image/jpeg';
    }
    // PNG: Comienza con 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'image/png';
    }
    // GIF: Comienza con 47 49 46 38
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
        return 'image/gif';
    }
    // WEBP: Comprueba la firma RIFF y WEBP
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
        if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
            return 'image/webp';
        }
    }

    // Por defecto, asumimos JPEG
    return 'image/jpeg';
}

export function getFileExtension(mimeType: string): string {
    const extensions: { [key: string]: string } = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp'
    };

    return extensions[mimeType] || 'jpg';
}

export function isImageMimeType(mimeType: string): boolean {
    return [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ].includes(mimeType);
}