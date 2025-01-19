import { expressjwt, GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { environment } from './environment';
import { RequestHandler } from 'express';

const AUTH0_DOMAIN = environment.AUTH0_DOMAIN.replace('https://', '');

const jwksClient = jwksRsa.expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
}) as GetVerificationKey;

export const validateAuth0Token = expressjwt({
  secret: jwksClient,
  audience: environment.AUTH0_AUDIENCE,
  issuer: `https://${AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
}) as unknown as RequestHandler;

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
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      auth?: Auth0JwtPayload;
    }
  }
}