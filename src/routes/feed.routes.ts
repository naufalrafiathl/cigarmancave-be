import express from 'express';
import { FeedController } from '../controllers/feed.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { GetFeedSchema } from '../schemas/feed.schema';

const router = express.Router();
const feedController = new FeedController();

router.use(authenticate);

// Get feed with filters
router.get(
  '/',
  validateRequest(GetFeedSchema),
  feedController.getFeed.bind(feedController)
);

export default router;