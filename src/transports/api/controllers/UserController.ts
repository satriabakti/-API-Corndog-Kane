import { Request, Response } from "express";
import UserRepository from "../../../adapters/postgres/repositories/UserRepository";
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TuserDetailGetResponse, TUserGetResponse } from "../../../core/entities/user/user";
import UserService from '../../../core/services/UserService';
import { UserResponseMapper } from "../../../mappers/response-mappers";
import Controller from "./Controller";

export class UserController extends Controller<TUserGetResponse | TuserDetailGetResponse, TMetadataResponse> {
	private userService: UserService;

	constructor() {
		super();
		this.userService = new UserService(new UserRepository());
	}

  findById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await this.userService.findById(id);
      
      if (!user) {
        return this.getFailureResponse(
          res,
          { data: {} as TuserDetailGetResponse, metadata: {} as TMetadataResponse },
          [{ field: 'id', message: 'User not found', type: 'not_found' }],
          'User not found',
          404
        );
      }

      return this.getSuccessResponse(
        res,
        { data: UserResponseMapper.toDetailResponse(user), metadata: {} as TMetadataResponse },
        'User retrieved successfully'
      );
    } catch (error) {
      return this.handleError(
				res,
				error,
				"Failed to retrieve user",
				500,
				{} as TuserDetailGetResponse,
				{} as TMetadataResponse
			);
    }
  }

  // The create, update, and delete methods are inherited from the parent Controller class
  // They can be called from routes as:
  // - userController.create(userService, UserResponseMapper)
  // - userController.update(userService, UserResponseMapper)
  // - userController.delete(userService)
}