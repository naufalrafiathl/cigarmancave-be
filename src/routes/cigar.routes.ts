import { Router } from 'express';
import { CigarController } from '../controllers/cigar.controller';

const router = Router();
const cigarController = new CigarController();

router.get('/search', cigarController.search.bind(cigarController));
router.get('/:id', cigarController.getCigar.bind(cigarController));

export default router;