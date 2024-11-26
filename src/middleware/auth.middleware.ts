import { Request, Response, NextFunction } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import { environment } from '../config/environment';
import { UnauthorizedError } from '../errors';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
      };
    }
  }
}

export const validateAuth0Token = auth({
  audience: environment.AUTH0_AUDIENCE,
  issuerBaseURL: environment.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256'
});

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await validateAuth0Token(req, res, (err) => {
      if (err) {
        throw new UnauthorizedError('Invalid token');
      }
    });

    // At this point, token is valid
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      throw new UnauthorizedError('User ID not found in token');
    }

    req.user = {
      id: 1, 
    };

    next();
  } catch (error) {
    next(error);
  }
};