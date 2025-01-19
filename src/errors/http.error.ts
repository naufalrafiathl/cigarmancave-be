import { AppError } from './base.error';

interface ErrorDetails {
  message: string;
  details?: Record<string, any>;
}

export class BadRequestError extends Error {
  constructor(errorInfo: string | ErrorDetails) {
    const message = typeof errorInfo === 'string' ? errorInfo : errorInfo.message;
    super(message);
    
    if (typeof errorInfo !== 'string') {
      (this as any).details = errorInfo.details;
    }

    this.name = 'BadRequestError';
  }
}
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation Error') {
    super(message, 422);
  }
}