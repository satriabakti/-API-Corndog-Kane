import { Response } from "express";
import { AuthRequest } from "../../../policies";
import Controller from "./Controller";

type TAuthTestData = {
  id: string;
  username: string;
  role: string;
};

type TAuthTestMetadata = {
  timestamp: string;
};

export class TestController extends Controller<TAuthTestData, TAuthTestMetadata> {
  authTest = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return this.getFailureResponse(
          res,
          { data: {} as TAuthTestData, metadata: {} as TAuthTestMetadata },
          [{ field: 'user', message: 'User not authenticated', type: 'invalid' }],
          'User not authenticated',
          401
        );
      }

      return this.getSuccessResponse(
        res,
        {
          data: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role,
          },
          metadata: {
            timestamp: new Date().toISOString(),
          }
        },
        'Authentication successful'
      );
    } catch (error) {
      console.error('Auth test error:', error);
      return this.getFailureResponse(
        res,
        { data: {} as TAuthTestData, metadata: {} as TAuthTestMetadata },
        [{ field: 'server', message: 'Internal server error', type: 'internal_error' }],
        'Internal server error',
        500
      );
    }
  };
}
