// src/controllers/cigar-insights.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CigarInsightsService } from '../services/cigar-insights.service';
import { BadRequestError } from '../errors';

export class CigarInsightsController {
  private cigarInsightsService: CigarInsightsService;

  constructor() {
    this.cigarInsightsService = new CigarInsightsService();
  }

  getInsights = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cigarId = parseInt(req.params.cigarId);
      if (isNaN(cigarId)) {
        throw new BadRequestError('Invalid cigar ID');
      }

      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User ID is required');
      }

      const insights = await this.cigarInsightsService.getOrCreateInsights(cigarId, userId);

      res.json({
        status: 'success',
        data: insights
      });
    } catch (error) {
      next(error);
    }
  };
}