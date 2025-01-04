import express from 'express';
import { CigarInsightsController } from '../controllers/cigar-insights.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const cigarInsightsController = new CigarInsightsController();

// Apply authentication middleware
router.use(authenticate);

// Get insights for a specific cigar
router.get('/:cigarId/insights', cigarInsightsController.getInsights);

export default router;