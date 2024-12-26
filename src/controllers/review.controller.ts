import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { UnauthorizedError, BadRequestError } from '../errors';

const reviewService = new ReviewService();

export class ReviewController {
  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      console.log('Creating review with user:', userId);
      console.log('Review data:', req.body);
      if (!userId) {
        throw new UnauthorizedError();
      }

      const review = await reviewService.createReview(userId, req.body);
      
      res.status(201).json({
        status: 'success',
        data: review
      });
    } catch (error) {
      console.error('Review creation error:', error);
      next(error);
    }
  }

  async getReviewById(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        throw new BadRequestError('Invalid review ID');
      }

      const review = await reviewService.getReviewById(reviewId);
      
      res.json({
        status: 'success',
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req?.user?.id
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }
      const { cigarId, page, limit } = req.query;

      const reviews = await reviewService.getReviews({
        cigarId: cigarId ? parseInt(cigarId as string) : undefined,
        userId,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({
        status: 'success',
        data: reviews
      });
    } catch (error) {
      next(error);
    }
  }
}