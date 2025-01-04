import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import crypto from 'crypto';
import { BadRequestError } from '../errors';

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  generateVariants?: boolean;
}

interface ImageUrls {
  original: string;
  thumbnail?: string;
  medium?: string;
}

interface FileWithBuffer {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export class ImageService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;
  private allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  constructor() {
    const requiredEnvVars = ['AWS_REGION', 'AWS_S3_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    this.region = process.env.AWS_REGION!;
    this.bucket = process.env.AWS_S3_BUCKET!;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `${timestamp}-${hash}.${extension}`;
  }

  private async optimizeImage(buffer: Buffer, options: ImageOptions = {}): Promise<Buffer> {
    const { width, height, quality = 80 } = options;
    let sharpInstance = sharp(buffer);

    const metadata = await sharpInstance.metadata();
    if (!metadata.width || !metadata.height) {
      throw new BadRequestError('Invalid image file');
    }

    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    return sharpInstance
      .jpeg({ quality })
      .toBuffer();
  }

  async uploadImage(
    file: FileWithBuffer,
    folder: string = 'uploads',
    options: ImageOptions = {}
  ): Promise<ImageUrls> {
    try {
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      }

      const optimizedBuffer = await this.optimizeImage(file.buffer, options);
      const fileName = this.generateFileName(file.originalname);
      const key = `${folder}/${fileName}`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: optimizedBuffer,
          ContentType: 'image/jpeg',
          CacheControl: 'max-age=31536000',
        })
      );

      const urls: ImageUrls = {
        original: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
      };

      if (options.generateVariants) {
        const thumbnailBuffer = await this.optimizeImage(file.buffer, {
          width: 200,
          height: 200,
          quality: 70,
        });
        const thumbnailKey = `${folder}/thumbnails/${fileName}`;
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: thumbnailKey,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg',
            CacheControl: 'max-age=31536000',
          })
        );
        urls.thumbnail = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${thumbnailKey}`;

        const mediumBuffer = await this.optimizeImage(file.buffer, {
          width: 600,
          height: 600,
          quality: 75,
        });
        const mediumKey = `${folder}/medium/${fileName}`;
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: mediumKey,
            Body: mediumBuffer,
            ContentType: 'image/jpeg',
            CacheControl: 'max-age=31536000',
          })
        );
        urls.medium = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${mediumKey}`;
      }

      return urls;
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new Error('Failed to upload image');
    }
  }

  async deleteImage(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      const folder = key.split('/')[0];
      const fileName = key.split('/').pop();
      if (fileName) {
        await Promise.all([
          this.s3Client.send(
            new DeleteObjectCommand({
              Bucket: this.bucket,
              Key: `${folder}/thumbnails/${fileName}`,
            })
          ),
          this.s3Client.send(
            new DeleteObjectCommand({
              Bucket: this.bucket,
              Key: `${folder}/medium/${fileName}`,
            })
          ),
        ]);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  async getSignedUploadUrl(
    fileName: string,
    folder: string = 'uploads',
    contentType: string
  ): Promise<string> {
    if (!this.allowedMimeTypes.includes(contentType)) {
      throw new BadRequestError('Invalid content type');
    }

    const key = `${folder}/${this.generateFileName(fileName)}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: 'max-age=31536000',
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }
}