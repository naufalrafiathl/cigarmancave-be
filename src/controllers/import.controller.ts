// src/controllers/import.controller.ts
import { Response, NextFunction } from 'express';
import { ImportService } from '../services/import.service';
import multer from 'multer';
import {
  ImportFileType,
  QuotaExceededError,
  ValidationError,
  ProcessingError
} from '../types/import';
import { AuthenticatedRequest } from '../types/auth';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported formats: JPEG, PNG, WebP, Excel, CSV'));
    }
  },
});

export class ImportController {
  private importService: ImportService;

  constructor() {
    this.importService = new ImportService();
  }

  uploadMiddleware = upload.single('file');

  getQuota = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          status: 'error',
          error: 'Unauthorized'
        });
        return;
      }

      const quota = await this.importService.getUserQuota(req.user.id);
      
      res.json({
        status: 'success',
        data: quota
      });
    } catch (error) {
      next(error);
    }
  };

  processImport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          status: 'error',
          error: 'Unauthorized'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          status: 'error',
          error: 'No file provided'
        });
        return;
      }

      const fileType = this.determineFileType(req.file.mimetype);
      
      // Process the file
      const result = await this.importService.processImport(
        req.user.id,
        req.file,
        fileType
      );

      // If processing was successful and we have data, find matches
      if (result.success && result.data) {
        const matches = await this.importService.findMatches(result.data);
        
        res.json({
          status: 'success',
          data: {
            processingResult: result,
            matches,
            cost: result.cost,
            duration: `${result.duration}ms`
          }
        });
      } else {
        res.status(422).json({
          status: 'error',
          error: result.error || 'Processing failed',
          details: {
            method: result.method,
            confidence: result.confidence,
            cost: result.cost,
            duration: `${result.duration}ms`
          }
        });
      }
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        res.status(402).json({
          status: 'error',
          error: error.message,
          code: 'QUOTA_EXCEEDED'
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          status: 'error',
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      } else if (error instanceof ProcessingError) {
        res.status(422).json({
          status: 'error',
          error: error.message,
          code: 'PROCESSING_ERROR'
        });
      } else if (error instanceof multer.MulterError) {
        res.status(400).json({
          status: 'error',
          error: this.getMulterErrorMessage(error),
          code: 'FILE_UPLOAD_ERROR'
        });
      } else {
        next(error);
      }
    }
  };

  confirmImport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          status: 'error',
          error: 'Unauthorized'
        });
        return;
      }

      const { selections } = req.body;
      if (!selections || !Array.isArray(selections)) {
        res.status(400).json({
          status: 'error',
          error: 'Invalid selections data'
        });
        return;
      }

      // TODO: Implement logic to add confirmed cigars to humidor
      
      res.json({
        status: 'success',
        message: 'Import selections confirmed'
      });
    } catch (error) {
      next(error);
    }
  };

  private determineFileType(mimetype: string): ImportFileType {
    if (mimetype.startsWith('image/')) {
      return ImportFileType.IMAGE;
    }
    if (mimetype === 'application/pdf') {
      return ImportFileType.PDF;
    }
    return ImportFileType.SPREADSHEET;
  }

  private getMulterErrorMessage(error: multer.MulterError): string {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return 'File size exceeds the 10MB limit';
      case 'LIMIT_UNEXPECTED_FILE':
        return 'Unexpected field name in form data';
      case 'LIMIT_FILE_COUNT':
        return 'Too many files uploaded';
      default:
        return error.message;
    }
  }
}