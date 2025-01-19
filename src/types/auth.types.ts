import { Auth0JwtPayload } from '../config/auth';
import 'express-oauth2-jwt-bearer';

export interface Auth0User {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  locale?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  auth0Id: string;
  fullName?: string | null;
  picture?: string | null;
  isPremium: boolean;
  locale?: string | null;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      auth?: Auth0JwtPayload;
    }
  }
}

declare module 'express-oauth2-jwt-bearer' {
  interface Auth0JwtPayload {
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    locale?: string;
  }
}