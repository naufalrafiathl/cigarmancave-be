import { Router } from 'express';
import { CigarController } from '../controllers/cigar.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const cigarController = new CigarController();

// Public routes
router.get('/search', authenticate, cigarController.search.bind(cigarController));
router.get('/:id', cigarController.getCigar.bind(cigarController));
router.post('/', authenticate, cigarController.createCigar.bind(cigarController));

export default router;