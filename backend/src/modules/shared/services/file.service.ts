import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import { promisify } from 'util';
import { mkdir, unlink } from 'fs/promises';

export type FileType = 'image' | 'document' | 'veterinary';

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  fieldname?: string;
  size?: number;
}

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly uploadDir: string;
  private readonly allowedTypes: Record<FileType, string[]> = {
    image: ['image/jpeg', 'image/png', 'image/webp'],
    document: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp','application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    veterinary: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };
  private readonly maxFileSizes: Record<FileType, number> = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    veterinary: 15 * 1024 * 1024 // 15MB
  };
  private readonly imageResizeConfigs = {
    thumbnail: { width: 300, height: 300 },
    display: { width: 1200, height: 1200 },
    original: { width: null, height: null }
  };

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR') || 'uploads';
    this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories() {
    const directories = [
      this.uploadDir,
      path.join(this.uploadDir, 'images'),
      path.join(this.uploadDir, 'documents'),
      path.join(this.uploadDir, 'veterinary'),
      path.join(this.uploadDir, 'thumbnails')
    ];

    for (const dir of directories) {
      try {
        await mkdir(dir, { recursive: true });
      } catch (error) {
        this.logger.error(`Failed to create directory ${dir}`, error);
        throw new Error(`Failed to create upload directories`);
      }
    }
  }

  async getFile(url: string): Promise<Buffer> {
    try {
      const urlParts = url.split('/');
      const fileName = urlParts.pop();
      const subDir = urlParts.pop();
      
      if (!fileName || !subDir) {
        throw new Error('Invalid file URL');
      }
  
      const filePath = path.join(this.uploadDir, subDir, fileName);
      return await fs.promises.readFile(filePath);
    } catch (error) {
      this.logger.error('Failed to get file', error);
      throw new BadRequestException('Failed to get file');
    }
  }

  async uploadFile(
    file: UploadedFile,
    type: FileType,
    docId: string,
    generateThumbnail = false
  ): Promise<{
    url: string;
    thumbnailUrl?: string;
    metadata: FileMetadata;
  }> {
    try {
      // Validate file
      this.validateFile(file, type);

      // Generate unique filename with original extension
      const fileExt = path.extname(file.originalname);
      const fileName = `${docId}${fileExt}`;
      const subDir = type === 'image' ? 'images' : type === 'document' ? 'documents' : 'veterinary';
      const filePath = path.join(this.uploadDir, subDir, fileName);

      // Process image if necessary
      let dimensions;
      if (type === 'image') {
        const processedImage = await this.processImage(file.buffer);
        await this.saveFile(processedImage, filePath);
        dimensions = await this.getImageDimensions(file.buffer);
      } else {
        await this.saveFile(file.buffer, filePath);
      }

      let thumbnailUrl;
      if (generateThumbnail && type === 'image') {
        thumbnailUrl = await this.generateThumbnail(file.buffer, fileName);
      }


      const metadata: FileMetadata = {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size || file.buffer.length,
        ...(dimensions && { dimensions })
      };

      return {
        url: this.getFileUrl(subDir, fileName),
        ...(thumbnailUrl && { thumbnailUrl }),
        metadata
      };
    } catch (error) {
      this.logger.error('File upload failed', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'File upload failed'
      );
    }
  }

  private async processImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(this.imageResizeConfigs.display.width, this.imageResizeConfigs.display.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
      this.logger.error('Image processing failed', error);
      throw new BadRequestException('Image processing failed');
    }
  }

  private async generateThumbnail(buffer: Buffer, originalFileName: string): Promise<string> {
    try {
      const thumbnailBuffer = await sharp(buffer)
        .resize(this.imageResizeConfigs.thumbnail.width, this.imageResizeConfigs.thumbnail.height, {
          fit: 'cover'
        })
        .jpeg({ quality: 70 })
        .toBuffer();

      const thumbnailFileName = `thumb_${originalFileName}`;
      const thumbnailPath = path.join(this.uploadDir, 'thumbnails', thumbnailFileName);
      await this.saveFile(thumbnailBuffer, thumbnailPath);

      return this.getFileUrl('thumbnails', thumbnailFileName);
    } catch (error) {
      this.logger.error('Thumbnail generation failed', error);
      throw new BadRequestException('Thumbnail generation failed');
    }
  }

  private async getImageDimensions(buffer: Buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0
      };
    } catch (error) {
      this.logger.error('Failed to get image dimensions', error);
      return undefined;
    }
  }

  private validateFile(file: UploadedFile, type: FileType): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedTypes[type].includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types for ${type}: ${this.allowedTypes[type].join(', ')}`
      );
    }

    const fileSize = file.size || file.buffer.length;
    if (fileSize > this.maxFileSizes[type]) {
      throw new BadRequestException(
        `File too large. Maximum size for ${type}: ${this.maxFileSizes[type] / 1024 / 1024}MB`
      );
    }
  }

  private async saveFile(buffer: Buffer, filePath: string): Promise<void> {
    try {
      await fs.promises.writeFile(filePath, buffer);
    } catch (error) {
      this.logger.error(`Failed to save file to ${filePath}`, error);
      throw new BadRequestException('Failed to save file');
    }
  }

  private getFileUrl(subDir: string, fileName: string): string {
    return `/uploads/${subDir}/${fileName}`;
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const urlParts = url.split('/');
      const fileName = urlParts.pop();
      const subDir = urlParts.pop();
      
      if (!fileName || !subDir) {
        throw new Error('Invalid file URL');
      }

      const filePath = path.join(this.uploadDir, subDir, fileName);
      
      // Check if file exists before attempting deletion
      if (await this.fileExists(filePath)) {
        await unlink(filePath);

        // If it's an image, try to delete its thumbnail
        if (subDir === 'images') {
          const thumbnailPath = path.join(this.uploadDir, 'thumbnails', `thumb_${fileName}`);
          if (await this.fileExists(thumbnailPath)) {
            await unlink(thumbnailPath);
          }
        }
      }
    } catch (error) {
      this.logger.error('File deletion failed', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}