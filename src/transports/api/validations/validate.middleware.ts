import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError, ZodRawShape } from 'zod';
import { TErrorResponse } from '../../../core/entities/base/response';

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Zod schema
 */
export const validate = (schema: ZodObject<ZodRawShape>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request data (body, params, query)
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query
      });
      
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert Zod errors to our error response format
        const errors: TErrorResponse[] = error.issues.map((err) => {
          const field = err.path.slice(1).join('.'); // Remove 'body', 'params', or 'query' prefix
          
          return {
            field: field || String(err.path[0]),
            message: err.message,
            type: getErrorType(err.code)
          };
        });

        return res.status(400).json({
          status: 'failed',
          message: 'Validation failed',
          errors,
          data: null,
          metadata: {}
        });
      }

      // Handle unexpected errors
      return res.status(500).json({
        status: 'failed',
        message: 'Internal server error during validation',
        errors: [{
          field: 'server',
          message: 'An unexpected error occurred',
          type: 'internal_error'
        }],
        data: null,
        metadata: {}
      });
    }
  };
};

/**
 * Map Zod error codes to our error types
 */
function getErrorType(zodCode: string): TErrorResponse['type'] {
  switch (zodCode) {
    case 'invalid_type':
      return 'invalid';
    case 'invalid_string':
      return 'invalid';
    case 'too_small':
      return 'invalid';
    case 'too_big':
      return 'invalid';
    case 'invalid_enum_value':
      return 'invalid';
    case 'unrecognized_keys':
      return 'invalid';
    case 'invalid_arguments':
      return 'invalid';
    case 'invalid_return_type':
      return 'invalid';
    case 'invalid_date':
      return 'invalid';
    case 'invalid_literal':
      return 'invalid';
    case 'custom':
      return 'invalid';
    case 'invalid_union':
      return 'invalid';
    case 'invalid_union_discriminator':
      return 'invalid';
    case 'invalid_intersection_types':
      return 'invalid';
    default:
      return 'required';
  }
}
