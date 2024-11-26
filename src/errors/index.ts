// src/errors/index.ts
export * from './base.error';
export * from './http.error';

// Add aliases for backwards compatibility
import { NotFoundError, UnauthorizedError } from './http.error';
export const NotFoundException = NotFoundError;
export const UnauthorizedException = UnauthorizedError;