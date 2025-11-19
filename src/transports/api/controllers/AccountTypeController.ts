import { Request, Response, NextFunction } from "express";
import { AccountTypeRepository } from "../../../adapters/postgres/repositories/AccountTypeRepository";
import { AccountTypeService } from "../../../core/services/AccountTypeService";
import { AccountTypeResponseMapper } from "../../../mappers/response-mappers/AccountTypeResponseMapper";

export class AccountTypeController {
  private accountTypeService: AccountTypeService;

  constructor() {
    const accountTypeRepository = new AccountTypeRepository();
    this.accountTypeService = new AccountTypeService(accountTypeRepository);
  }

  getAll() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const accountTypes = await this.accountTypeService.getAllAccountTypes();
        
        res.status(200).json({
          success: true,
          data: AccountTypeResponseMapper.toListResponse(accountTypes),
          message: "Account types retrieved successfully",
        });
      } catch (error) {
        next(error);
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
