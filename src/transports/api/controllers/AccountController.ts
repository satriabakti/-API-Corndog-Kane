import { Request, Response } from 'express';
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TAccountGetResponse, TAccountCreateRequest, TAccountUpdateRequest } from "../../../core/entities/finance/account";
import AccountService from '../../../core/services/AccountService';
import { AccountRepository } from "../../../adapters/postgres/repositories/AccountRepository";
import Controller from "./Controller";
import { AccountResponseMapper } from "../../../mappers/response-mappers/AccountResponseMapper";

export class AccountController extends Controller<TAccountGetResponse, TMetadataResponse> {
  private accountService: AccountService;

  constructor() {
    super();
    this.accountService = new AccountService(new AccountRepository());
  }

  getAll = () => {
    return async (req: Request, res: Response) => {
      try {
        const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
        const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : undefined;
        const { search_key, search_value } = req.query;
        
        const result = await this.accountService.findAll(
          page,
          limit,
          search_key && search_value ? [{ field: search_key as string, value: search_value as string }] : undefined,
          categoryId ? { account_category_id: categoryId } : undefined
        );
        
        const mappedResults = AccountResponseMapper.toListResponse(result.data);
        
        const metadata: TMetadataResponse = {
          page: result.page,
          limit: result.limit,
          total_records: result.total,
          total_pages: result.totalPages,
        };
        
        return this.getSuccessResponse(
          res,
          {
            data: mappedResults,
            metadata,
          },
          "Accounts retrieved successfully"
        );
      } catch (error) {
        console.error('Error retrieving accounts:', error);
        return this.handleError(
          res,
          error,
          error instanceof Error ? error.message : "Failed to retrieve accounts",
          500,
          [] as TAccountGetResponse[],
          {} as TMetadataResponse
        );
      }
    };
  }

  getById = () => {
    return async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const account = await this.accountService.findById(id);
        
        if (!account) {
          return this.handleError(
            res,
            new Error('Account not found'),
            "Account not found",
            404,
            {} as TAccountGetResponse,
            {} as TMetadataResponse
          );
        }
        
        const mappedResult = AccountResponseMapper.toResponse(account as any);
        
        return this.getSuccessResponse(
          res,
          {
            data: mappedResult,
            metadata: {} as TMetadataResponse,
          },
          "Account retrieved successfully"
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to retrieve account",
          500,
          {} as TAccountGetResponse,
          {} as TMetadataResponse
        );
      }
    };
  }

  create = () => {
    return async (req: Request, res: Response) => {
      try {
        const data: TAccountCreateRequest = req.body;
        
        const account = await this.accountService.createAccount({
          name: data.name,
          number: data.number,
          accountCategoryId: data.account_category_id,
          accountTypeId: data.account_type_id,
          description: data.description,
        });
        
        const mappedResult = AccountResponseMapper.toResponse(account);
        
        return this.getSuccessResponse(
          res,
          {
            data: mappedResult,
            metadata: {} as TMetadataResponse,
          },
          "Account created successfully"
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to create account",
          500,
          {} as TAccountGetResponse,
          {} as TMetadataResponse
        );
      }
    };
  }

  update = () => {
    return async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const data: TAccountUpdateRequest = req.body;
        
        const account = await this.accountService.updateAccount(id, {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.number !== undefined && { number: data.number }),
          ...(data.account_category_id !== undefined && { accountCategoryId: data.account_category_id }),
          ...(data.account_type_id !== undefined && { accountTypeId: data.account_type_id }),
          ...(data.description !== undefined && { description: data.description }),
        });
        
        const mappedResult = AccountResponseMapper.toResponse(account);
        
        return this.getSuccessResponse(
          res,
          {
            data: mappedResult,
            metadata: {} as TMetadataResponse,
          },
          "Account updated successfully"
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to update account",
          500,
          {} as TAccountGetResponse,
          {} as TMetadataResponse
        );
      }
    };
  }

  delete = () => {
    return async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        
        await this.accountService.deleteAccount(id);
        
        return this.getSuccessResponse(
          res,
          {
            data: {} as TAccountGetResponse,
            metadata: {} as TMetadataResponse,
          },
          "Account deleted successfully"
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to delete account",
          500,
          {} as TAccountGetResponse,
          {} as TMetadataResponse
        );
      }
    };
  }
}
