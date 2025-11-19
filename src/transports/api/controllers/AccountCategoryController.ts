import { Request, Response } from 'express';
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TAccountCategoryGetResponse } from "../../../core/entities/finance/account";
import AccountCategoryService from '../../../core/services/AccountCategoryService';
import { AccountCategoryRepository } from "../../../adapters/postgres/repositories/AccountCategoryRepository";
import Controller from "./Controller";
import { AccountCategoryResponseMapper } from "../../../mappers/response-mappers/AccountCategoryResponseMapper";

export class AccountCategoryController extends Controller<TAccountCategoryGetResponse, TMetadataResponse> {
  private accountCategoryService: AccountCategoryService;

  constructor() {
    super();
    this.accountCategoryService = new AccountCategoryService(new AccountCategoryRepository());
  }

  getAll = () => {
    return async (req: Request, res: Response) => {
      try {
        const categories = await this.accountCategoryService.getAll();
        const mappedResults = AccountCategoryResponseMapper.toListResponse(categories);
        
        return this.getSuccessResponse(
          res,
          {
            data: mappedResults,
            metadata: {} as TMetadataResponse,
          },
          "Account categories retrieved successfully"
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to retrieve account categories",
          500,
          [] as TAccountCategoryGetResponse[],
          {} as TMetadataResponse
        );
      }
    };
  }
}
