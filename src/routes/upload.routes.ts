import express from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const uploadController = new UploadController();

router.use(authenticate);

router.post(
  '/image',
  uploadController.uploadMiddleware,
  uploadController.uploadImage
);

router.post('/signed-url', uploadController.getSignedUrl);

export default router;