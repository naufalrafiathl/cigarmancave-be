import { auth } from 'express-oauth2-jwt-bearer';
import { environment } from '../config/environment';

export const validateAuth0Token = auth({
  audience: environment.AUTH0_AUDIENCE,
  issuerBaseURL: environment.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256'
});

// Error handling middleware
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Auth Error:', err);
  
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};