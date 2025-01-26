"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = __importDefault(require("crypto"));
const errors_1 = require("../errors");
class ImageService {
    constructor() {
        this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const requiredEnvVars = ['AWS_REGION', 'AWS_S3_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
        this.region = process.env.AWS_REGION;
        this.bucket = process.env.AWS_S3_BUCKET;
        this.s3Client = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    generateFileName(originalName) {
        var _a;
        const timestamp = Date.now();
        const hash = crypto_1.default.randomBytes(8).toString('hex');
        const extension = ((_a = originalName.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'jpg';
        return `${timestamp}-${hash}.${extension}`;
    }
    async optimizeImage(buffer, options = {}) {
        const { width, height, quality = 80 } = options;
        let sharpInstance = (0, sharp_1.default)(buffer);
        const metadata = await sharpInstance.metadata();
        if (!metadata.width || !metadata.height) {
            throw new errors_1.BadRequestError('Invalid image file');
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
    async uploadImage(file, folder = 'uploads', options = {}) {
        try {
            if (!this.allowedMimeTypes.includes(file.mimetype)) {
                throw new errors_1.BadRequestError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
            }
            const optimizedBuffer = await this.optimizeImage(file.buffer, options);
            const fileName = this.generateFileName(file.originalname);
            const key = `${folder}/${fileName}`;
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: optimizedBuffer,
                ContentType: 'image/jpeg',
                CacheControl: 'max-age=31536000',
            }));
            const urls = {
                original: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
            };
            if (options.generateVariants) {
                const thumbnailBuffer = await this.optimizeImage(file.buffer, {
                    width: 200,
                    height: 200,
                    quality: 70,
                });
                const thumbnailKey = `${folder}/thumbnails/${fileName}`;
                await this.s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: this.bucket,
                    Key: thumbnailKey,
                    Body: thumbnailBuffer,
                    ContentType: 'image/jpeg',
                    CacheControl: 'max-age=31536000',
                }));
                urls.thumbnail = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${thumbnailKey}`;
                const mediumBuffer = await this.optimizeImage(file.buffer, {
                    width: 600,
                    height: 600,
                    quality: 75,
                });
                const mediumKey = `${folder}/medium/${fileName}`;
                await this.s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: this.bucket,
                    Key: mediumKey,
                    Body: mediumBuffer,
                    ContentType: 'image/jpeg',
                    CacheControl: 'max-age=31536000',
                }));
                urls.medium = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${mediumKey}`;
            }
            return urls;
        }
        catch (error) {
            console.error('Error uploading image:', error);
            if (error instanceof errors_1.BadRequestError) {
                throw error;
            }
            throw new Error('Failed to upload image');
        }
    }
    async deleteImage(key) {
        try {
            await this.s3Client.send(new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }));
            const folder = key.split('/')[0];
            const fileName = key.split('/').pop();
            if (fileName) {
                await Promise.all([
                    this.s3Client.send(new client_s3_1.DeleteObjectCommand({
                        Bucket: this.bucket,
                        Key: `${folder}/thumbnails/${fileName}`,
                    })),
                    this.s3Client.send(new client_s3_1.DeleteObjectCommand({
                        Bucket: this.bucket,
                        Key: `${folder}/medium/${fileName}`,
                    })),
                ]);
            }
        }
        catch (error) {
            console.error('Error deleting image:', error);
            throw new Error('Failed to delete image');
        }
    }
    async getSignedUploadUrl(fileName, folder = 'uploads', contentType) {
        if (!this.allowedMimeTypes.includes(contentType)) {
            throw new errors_1.BadRequestError('Invalid content type');
        }
        const key = `${folder}/${this.generateFileName(fileName)}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
            CacheControl: 'max-age=31536000',
        });
        try {
            return await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn: 3600 });
        }
        catch (error) {
            console.error('Error generating signed URL:', error);
            throw new Error('Failed to generate upload URL');
        }
    }
}
exports.ImageService = ImageService;
//# sourceMappingURL=image.service.js.map