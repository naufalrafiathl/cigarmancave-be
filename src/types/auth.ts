import { Request } from 'express';

export interface AuthUser {
  id: number;
  email: string;
  auth0Id?: string;
  fullName?: string;
  picture?: string;
  isPremium?: boolean;
}

export interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user: AuthUser;
}

export interface FileUploadRequest extends AuthenticatedRequest {
  file: Express.Multer.File;
}

export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return req.user !== undefined;
}

export function hasFile(req: Request): req is FileUploadRequest {
  return 'file' in req && req.file !== undefined;
}