import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth';

export const requirePremium = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isPremium) {
    return res.status(403).json({
      status: 'error',
      message: 'Premium subscription required'
    });
  }
  next();
};