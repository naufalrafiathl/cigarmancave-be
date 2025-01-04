import express from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const uploadController = new UploadController();

router.use(authenticate);

// Direct upload endpoint
router.post(
  '/image',
  uploadController.uploadMiddleware,
  uploadController.uploadImage
);

// Get signed URL for client-side upload
router.post('/signed-url', uploadController.getSignedUrl);

export default router;