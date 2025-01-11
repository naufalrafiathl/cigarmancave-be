import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/base.error';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';
import { ModerationError } from '../services/moderation.service';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  if (err instanceof ModerationError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      details: {
        moderationId: err.moderationId,
        violations: err.violations.map(violation => ({
          type: violation.contentType,
          categories: violation.flaggedCategories.map(cat => ({
            name: cat.category,
            confidence: `${(cat.score * 100).toFixed(2)}%`,
            appliedTo: cat.appliedInputTypes
          })),
          content: violation.originalContent
        }))
      }
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
    return;
  }

  if (err instanceof PrismaClientKnownRequestError) {
    res.status(400).json({
      status: 'error',
      message: 'Database operation failed',
      code: err.code
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.errors
    });
    return;
  }

  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' 
      ? err instanceof Error ? err.message : 'Unknown error'
      : 'Internal server error'
  });
};