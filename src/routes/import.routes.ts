// src/routes/import.routes.ts
import express, { Request, Response, NextFunction } from 'express';
import { ImportController } from '../controllers/import.controller';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types/auth';

const router = express.Router();
const importController = new ImportController();

// Helper to wrap async route handlers
const asyncHandler = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
};

// Apply authentication middleware to all routes
router.use(authenticate);

// Get quota information
router.get('/quota', asyncHandler(importController.getQuota));

// Process import file
router.post(
  '/process',
  importController.uploadMiddleware,
  asyncHandler(importController.processImport)
);

// Confirm import selections
router.post(
  '/confirm',
  asyncHandler(importController.confirmImport)
);

export default router;