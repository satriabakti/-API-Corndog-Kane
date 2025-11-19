import { Request, Response, NextFunction } from "express";
import { AccountTypeRepository } from "../../../adapters/postgres/repositories/AccountTypeRepository";
import { AccountTypeService } from "../../../core/services/AccountTypeService";
import { AccountTypeResponseMapper } from "../../../mappers/response-mappers/AccountTypeResponseMapper";
import Controller from "./Controller";
import { TMetadataResponse } from "../../../core/entities/base/response";

// Response type for AccountType
type TAccountTypeResponse = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
};

export class AccountTypeController extends Controller<TAccountTypeResponse, TMetadataResponse> {
  private accountTypeService: AccountTypeService;

  constructor() {
    super();
    const accountTypeRepository = new AccountTypeRepository();
    this.accountTypeService = new AccountTypeService(accountTypeRepository);
  }

  getAll() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Use validated pagination params from middleware with defaults
        const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
        
        const accountTypes = await this.accountTypeService.getAllAccountTypes();
        const mappedResults = AccountTypeResponseMapper.toListResponse(accountTypes);
        
        // Apply pagination to results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = mappedResults.slice(startIndex, endIndex);
        
        const metadata: TMetadataResponse = {
          page,
          limit,
          total_records: mappedResults.length,
          total_pages: Math.ceil(mappedResults.length / limit),
        };
        
        return this.getSuccessResponse(
          res,
          {
            data: paginatedData,
            metadata,
          },
          "Account types retrieved successfully"
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to retrieve account types",
          500,
          [] as TAccountTypeResponse[],
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

  getById() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = parseInt(req.params.id);
        const accountType = await this.accountTypeService.getAccountTypeById(id);
        
        if (!accountType) {
          return res.status(404).json({
            success: false,
            message: "Account type not found",
          });
        }

        res.status(200).json({
          success: true,
          data: AccountTypeResponseMapper.toResponse(accountType),
          message: "Account type retrieved successfully",
        });
      } catch (error) {
        next(error);
      }
    };
  }
}
