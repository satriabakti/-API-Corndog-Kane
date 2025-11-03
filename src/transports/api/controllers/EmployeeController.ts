import { Request, Response } from "express";
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TEmployeeGetResponse } from "../../../core/entities/employee/employee";
import { TOutletAssignmentGetResponse } from "../../../core/entities/outlet/assignment";
import Controller from "./Controller";
import EmployeeService from "../../../core/services/EmployeeService";
import { EmployeeResponseMapper } from "../../../mappers/response-mappers/EmployeeResponseMapper";
import { OutletAssignmentResponseMapper } from "../../../mappers/response-mappers/OutletAssignmentResponseMapper";

// Union type for all possible employee response types
type TEmployeeResponseTypes = TEmployeeGetResponse | TOutletAssignmentGetResponse | null;

export class EmployeeController extends Controller<TEmployeeResponseTypes, TMetadataResponse> {
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

      const responseData: TEmployeeGetResponse = EmployeeResponseMapper.toListResponse(employee);

      return this.getSuccessResponse(
        res,
        { 
          data: responseData, 
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
        [],
        {} as TMetadataResponse
      );
    }
  };

  getSchedules = async (req: Request, res: Response, employeeService: EmployeeService) => {
    try {
      // This endpoint returns all employee-outlet assignments (schedules)
      const schedules = await employeeService.getSchedules();
      
      // Map to proper response type
      const schedulesResponse: TOutletAssignmentGetResponse[] = schedules.map(schedule =>
        OutletAssignmentResponseMapper.toListResponse(schedule)
      );
      
      return this.getSuccessResponse(
        res,
        {
          data: schedulesResponse,
          metadata: {} as TMetadataResponse,
        },
        'Employee schedules retrieved successfully'
      );
    } catch (error) {
      return this.handleError(
        res,
        error,
        'Failed to retrieve employee schedules',
        500,
        [],
        {} as TMetadataResponse
      );
    }
  };
}
