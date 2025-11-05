import UserRepository from "../../../adapters/postgres/repositories/UserRepository";
import { AuthService } from "../../../core/services/AuthService";
import { Request,Response } from "express";
import Controller from "./Controller";
import { TLoginMetadataResponse, TLoginResponse } from "../../../core/entities/user/auth";
import { sign } from "jsonwebtoken";
import env from "../../../configs/env";
export class AuthController extends Controller<TLoginResponse,TLoginMetadataResponse> {
  private authService: AuthService;
  
  constructor() {
    super();
    this.authService = new AuthService(new UserRepository());
  }
  
  login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      const loginResponse = await this.authService.login(
        { username, password },
        { ipAddress:ipAddress ||'', userAgent }
      ) as TLoginResponse ;

      if (!loginResponse) {
        return this.getFailureResponse(res,
          {
            data: {} as TLoginResponse, metadata: {} as TLoginMetadataResponse
          },
          [
            { field: 'username/password', message: 'Invalid credentials', type:'not_found'}
          ],
          'Invalid credentials',
          401
        );
      }
      return this.getSuccessResponse(res, {
        data: {
          id: loginResponse.id,
          name: loginResponse.name,
          username: loginResponse.username,
          role: loginResponse.role,
          outlet_id: loginResponse.outlet_id,
        },
        metadata: {
          token: this.createToken(loginResponse),
        }
      }, 'Login successful');

    } catch (error) {
      console.error('Login error:', error);
      return this.handleError(
        res,
        error,
        'Internal server error',
        500,
        {} as TLoginResponse,
        {} as TLoginMetadataResponse
      );
    }
  }

  createToken(data: TLoginResponse): string{
    
    return sign(data, env.app.key, {
      expiresIn: "24h",
      issuer: data.username,
    })
  }
}