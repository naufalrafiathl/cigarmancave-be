import { Request, Response, NextFunction } from 'express';
import { FeedService } from '../services/feed.service';

export class FeedController {
  private feedService: FeedService;

  constructor() {
    this.feedService = new FeedService();
  }

  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page,
        limit,
        sortBy,
        filterBy,
        startDate,
        endDate
      } = req.query;

      const feed = await this.feedService.getFeed({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as any,
        filterBy: filterBy as any,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      res.json({
        status: 'success',
        data: feed
      });
    } catch (error) {
      next(error);
    }
  }
}