import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { TErrorResponse, TResponse } from '../core/entities/base/response';

const sendFailureResponse = (
  res: Response, 
  errors: TErrorResponse[], 
  message: string, 
  code: number
): Response => {
  return res.status(code).json({
    status: "failed",
    message,
    data: null,
    errors,
    metadata: null,
  } as TResponse<null, null>);
};

/**
 * Role checker middleware - Validates if authenticated user has required role(s)
 * Must be used after authMiddleware
 * 
 * @param allowedRoles - Array of role names that are allowed to access the route
 * 
 * @example
 * // Single role
 * router.get('/admin', authMiddleware, roleMiddleware(['admin']), controller.method);
 * 
 * @example
 * // Multiple roles
 * router.get('/users', authMiddleware, roleMiddleware(['admin', 'manager']), controller.method);
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user exists (should be set by authMiddleware)
      if (!req.user) {
        return sendFailureResponse(
          res,
          [{ field: 'user', message: 'User not authenticated', type: 'invalid' }],
          'User not authenticated',
          401
        );
      }

      // Check if user has role property
      if (!req.user.role) {
        return sendFailureResponse(
          res,
          [{ field: 'role', message: 'User role not found', type: 'not_found' }],
          'User role not found',
          403
        );
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return sendFailureResponse(
          res,
          [{ 
            field: 'role', 
            message: `Access denied. Required roles: ${allowedRoles.join(', ')}`, 
            type: 'invalid' 
          }],
          'Insufficient permissions',
          403
        );
      }

      // User has required role, proceed
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return sendFailureResponse(
        res,
        [{ field: 'authorization', message: 'Role verification error', type: 'internal_error' }],
        'Role verification error',
        500
      );
    }
  };
};

/**
 * Shorthand middleware for admin-only routes
 */
export const adminOnly = roleMiddleware(['admin']);

/**
 * Shorthand middleware for manager and admin routes
 */
export const managerOrAdmin = roleMiddleware(['manager', 'admin']);
