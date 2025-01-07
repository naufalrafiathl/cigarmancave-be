// src/routes/achievement.routes.ts
import express from 'express';
import { AchievementController } from '../controllers/achievement.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const achievementController = new AchievementController();

router.use(authenticate);

router.get('/', achievementController.getUserAchievements);

export default router;