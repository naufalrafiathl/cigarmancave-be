export * from './base.error';
export * from './http.error';

import { NotFoundError, UnauthorizedError } from './http.error';
export const NotFoundException = NotFoundError;
export const UnauthorizedException = UnauthorizedError;