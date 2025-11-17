import { Request, Response, NextFunction } from 'express';
import { PrismaErrorHandler } from '../../../adapters/postgres/repositories/PrismaErrorHandler';
import { TErrorResponse } from '../../../core/entities/base/response';

/**
 * Global error handler middleware
 * Ensures all errors are returned in consistent JSON format
 */
export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error for debugging
  console.error('[Error Handler]:', error);

  // Check if response has already been sent
  if (res.headersSent) {
    return next(error);
  }

  // Handle Prisma errors
  const prismaError = PrismaErrorHandler.handlePrismaError(error);
  if (prismaError) {
    res.status(prismaError.statusCode).json({
      status: 'failed',
      message: prismaError.errors[0]?.message || 'Database operation failed',
      data: null,
      errors: prismaError.errors,
      metadata: {},
    });
    return;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for validation errors (from our service layer)
    const statusCode = error.message.includes('not found') ? 404 : 400;
    
    const errors: TErrorResponse[] = [{
      field: 'validation',
      message: error.message,
      type: error.message.includes('not found') ? 'not_found' : 'invalid',
    }];

    res.status(statusCode).json({
      status: 'failed',
      message: error.message,
      data: null,
      errors,
      metadata: {},
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    status: 'failed',
    message: 'Internal server error',
    data: null,
    errors: [{
      field: 'server',
      message: 'An unexpected error occurred',
      type: 'internal_error',
    }],
    metadata: {},
  });
};
