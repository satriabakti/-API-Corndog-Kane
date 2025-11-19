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

  // Custom getAll to handle AccountResponseMapper's array-based toListResponse
  getAll = () => {
    return async (req: Request, res: Response) => {
      try {
        const { page, limit, search_key, search_value, category_id, ...filters } = req.query;
        // Use validated defaults from pagination schema (page=1, limit=10)
        const pageNum = page ? parseInt(page as string, 10) : 1;
        const limitNum = limit ? parseInt(limit as string, 10) : 10;
        const categoryId = category_id ? parseInt(category_id as string, 10) : undefined;
        
        // Build search config
        const search =
          search_key && 
          search_value && 
          search_key !== 'undefined' && 
          search_value !== 'undefined'
            ? [{ field: search_key as string, value: search_value as string }]
            : undefined;
        
        // Add category filter if provided
        const combinedFilters = categoryId 
          ? { ...filters, account_category_id: categoryId }
          : Object.keys(filters).length > 0 ? filters : undefined;
        
        const result = await this.accountService.findAll(
          pageNum,
          limitNum,
          search,
          combinedFilters as any
        );
        
        // AccountResponseMapper expects an array
        const mappedResults = AccountResponseMapper.toListResponse(result.data as any);
        
        const metadata: TMetadataResponse = {
          page: result.page,
          limit: result.limit,
          total_records: result.total,
          total_pages: result.totalPages,
        };
        
        return this.getSuccessResponse(
          res,
          { data: mappedResults, metadata },
          "Accounts retrieved successfully"
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to retrieve accounts",
          500,
          [] as TAccountGetResponse[],
          {
            page: 1,
            limit: 10,
            total_records: 0,
            total_pages: 0,
          } as TMetadataResponse
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
