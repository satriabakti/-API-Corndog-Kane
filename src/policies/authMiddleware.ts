import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TErrorResponse, TResponse } from '../core/entities/base/response';
import env from '../configs/env';
import PostgresAdapter from '../adapters/postgres/instance';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    outlet_id?: number;
  };
}

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

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return sendFailureResponse(
        res,
        [{ field: 'authorization', message: 'No authorization header provided', type: 'required' }],
        'No authorization header provided',
        401
      );
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return sendFailureResponse(
        res,
        [{ field: 'token', message: 'No token provided', type: 'required' }],
        'No token provided',
        401
      );
    }

    const jwtSecret = env.app.key || 'your-secret-key';
    
    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      username: string;
      role: string;
    };

    // Fetch user's outlet_id from database
    const prisma = PostgresAdapter.client;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.id) },
      include: {
        outlets: {
          select: {
            id: true,
          },
        },
      },
    });

    req.user = {
      ...decoded,
      outlet_id: user?.outlets?.id,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return sendFailureResponse(
        res,
        [{ field: 'token', message: 'Invalid token', type: 'invalid' }],
        'Invalid token',
        401
      );
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return sendFailureResponse(
        res,
        [{ field: 'token', message: 'Token expired', type: 'invalid' }],
        'Token expired',
        401
      );
    }

    return sendFailureResponse(
      res,
      [{ field: 'authentication', message: 'Authentication error', type: 'internal_error' }],
      'Authentication error',
      500
    );
  }
};
