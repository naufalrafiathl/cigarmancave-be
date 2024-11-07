import { expressjwt, GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { environment } from './environment';
import { RequestHandler } from 'express';

// Get clean domain without protocol
const AUTH0_DOMAIN = environment.AUTH0_DOMAIN.replace('https://', '');

// Create JWKS client
const jwksClient = jwksRsa.expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
}) as GetVerificationKey;

// JWT validation middleware
export const validateAuth0Token = expressjwt({
  secret: jwksClient,
  audience: environment.AUTH0_AUDIENCE,
  issuer: `https://${AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
}) as unknown as RequestHandler;

// Type definition for decoded JWT token
export interface Auth0JwtPayload {
  iss?: string;
  sub: string;
  aud?: string[];
  iat?: number;
  exp?: number;
  azp?: string;
  scope?: string;
  permissions?: string[];
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  locale?: string;
  [key: string]: any; // For additional custom claims
}

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      auth?: Auth0JwtPayload;
    }
  }
}