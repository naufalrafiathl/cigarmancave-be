import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateAuth0Token } from '../config/auth';

const router = Router();
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

router.get('/protected', validateAuth0Token, (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'You have accessed a protected endpoint',
    user: req.auth,
    timestamp: new Date().toISOString()
  });
});

router.post('/callback', validateAuth0Token, async (req, res, next) => {
  console.log('CALLBACK REQUEST tester:', req);
  try {
    await AuthController.handleCallback(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/profile', validateAuth0Token, async (req, res, next) => {

  try {
    await AuthController.getProfile(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;