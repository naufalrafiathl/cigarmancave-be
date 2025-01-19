import express, { Request, Response, NextFunction } from 'express';
import { ImportController } from '../controllers/import.controller';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types/auth';

const router = express.Router();
const importController = new ImportController();

const asyncHandler = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
};

router.use(authenticate);

router.get('/quota', asyncHandler(importController.getQuota));

router.post(
  '/process',
  importController.uploadMiddleware,
  asyncHandler(importController.processImport)
);

router.post(
  '/confirm',
  asyncHandler(importController.confirmImport)
);

export default router;