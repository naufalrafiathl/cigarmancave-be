import { Request, Response, NextFunction } from 'express';
import { AchievementService } from '../services/achievement.service';

export class AchievementController {
  private achievementService: AchievementService;

  constructor() {
    this.achievementService = new AchievementService();
  }

  getUserAchievements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const achievements = await this.achievementService.getUserAchievements(userId);
      
      res.json({
        status: 'success',
        data: achievements
      });
    } catch (error) {
      next(error);
    }
  };
}