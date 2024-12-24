import express from 'express';
import { ReviewController } from '../controllers/review.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { CreateReviewSchema, GetReviewsQuerySchema } from '../schemas/review.schema';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const reviewController = new ReviewController();

router.use(authenticate);

router.post(
  '/',
  validateRequest(CreateReviewSchema),
  reviewController.createReview
);

router.get(
  '/',
  validateRequest(GetReviewsQuerySchema),
  reviewController.getReviews
);

router.get(
  '/:id',
  reviewController.getReviewById
);

export default router;