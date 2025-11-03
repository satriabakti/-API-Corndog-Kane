import { Request, Response } from "express";
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TEmployeeGetResponse } from "../../../core/entities/employee/employee";
import Controller from "./Controller";
import EmployeeService from "../../../core/services/EmployeeService";
import { EmployeeResponseMapper } from "../../../mappers/response-mappers/EmployeeResponseMapper";

export class EmployeeController extends Controller<TEmployeeGetResponse, TMetadataResponse> {
  constructor() {
    super();
  }

  findById = async (req: Request, res: Response, employeeService: EmployeeService) => {
    const { id } = req.params;
    try {
      const employee = await employeeService.findById(id);
      
      if (!employee) {
        return this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          null,
          'Employee not found',
          404
        );
      }

      return this.getSuccessResponse(
        res,
        { 
          data: EmployeeResponseMapper.toListResponse(employee), 
          metadata: {} as TMetadataResponse 
        },
        'Employee retrieved successfully'
      );
    } catch (error) {
      return this.handleError(
        res,
        error,
        'Failed to retrieve employee',
        500,
        [] as TEmployeeGetResponse[],
        {} as TMetadataResponse
      );
    }
  };

  getSchedules = async (req: Request, res: Response, employeeService: EmployeeService) => {
    try {
      // This endpoint returns all employee-outlet assignments (schedules)
      const schedules = await employeeService.getSchedules();
      
      return res.status(200).json({
        success: true,
        message: 'Employee schedules retrieved successfully',
        data: schedules,
      });
    } catch (error) {
      return this.handleError(
        res,
        error,
        'Failed to retrieve employee schedules',
        500,
        [] as TEmployeeGetResponse[],
        {} as TMetadataResponse
      );
    }
  };
}
