import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { ImageService } from '../services/image.service';
import { BadRequestError } from '../errors';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

export class UploadController {
  private imageService: ImageService;

  constructor() {
    this.imageService = new ImageService();
  }

  uploadMiddleware = upload.single('image');

  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new BadRequestError('No image file provided');
      }

      const folder = req.body.folder || 'uploads';
      const generateVariants = req.body.generateVariants === 'true';
      const options = {
        width: req.body.width ? parseInt(req.body.width) : undefined,
        height: req.body.height ? parseInt(req.body.height) : undefined,
        quality: req.body.quality ? parseInt(req.body.quality) : undefined,
        generateVariants,
      };

      const urls = await this.imageService.uploadImage(req.file, folder, options);

      res.status(201).json({
        status: 'success',
        data: urls,
      });
    } catch (error) {
      next(error);
    }
  };

  getSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileName, contentType, folder } = req.body;

      if (!fileName || !contentType) {
        throw new BadRequestError('fileName and contentType are required');
      }

      const signedUrl = await this.imageService.getSignedUploadUrl(
        fileName,
        folder,
        contentType
      );

      res.json({
        status: 'success',
        data: { signedUrl },
      });
    } catch (error) {
      next(error);
    }
  };
}