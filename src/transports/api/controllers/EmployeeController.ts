import { Request, Response } from "express";
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TEmployeeGetResponse, TEmployee } from "../../../core/entities/employee/employee";
import { TAttendanceGetResponse, TAttendanceListResponse, TAttendanceTableResponse } from "../../../core/entities/employee/attendance";
import { TOutletAssignmentGetResponse, TOutletAssignmentWithRelations } from "../../../core/entities/outlet/assignment";
import Controller from "./Controller";
import EmployeeService from "../../../core/services/EmployeeService";
import { EmployeeResponseMapper } from "../../../mappers/response-mappers/EmployeeResponseMapper";
import { AttendanceResponseMapper } from "../../../mappers/response-mappers/AttendanceResponseMapper";
import { AttendanceListResponseMapper } from "../../../mappers/response-mappers/AttendanceListResponseMapper";
import { AttendanceTableResponseMapper } from "../../../mappers/response-mappers/AttendanceTableResponseMapper";
import { OutletAssignmentResponseMapper } from "../../../mappers/response-mappers/OutletAssignmentResponseMapper";
import { AuthRequest } from "../../../policies/authMiddleware";
import OutletRepository from "../../../adapters/postgres/repositories/OutletRepository";
import fs from "fs";
import path from "path";

// Union type for all possible employee response types
type TEmployeeResponseTypes = TEmployeeGetResponse | TOutletAssignmentGetResponse | TAttendanceGetResponse | TAttendanceListResponse[] | TAttendanceTableResponse[] | null;

export class EmployeeController extends Controller<TEmployeeResponseTypes, TMetadataResponse> {
  constructor() {
    super();
  }

  /**
   * Convert snake_case to camelCase for employee data
   */
  private snakeToCamel<TObj extends Record<string, unknown>>(obj: TObj): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[camelKey] = this.snakeToCamel(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        result[camelKey] = value.map(item =>
          item && typeof item === 'object' && !(item instanceof Date)
            ? this.snakeToCamel(item as Record<string, unknown>)
            : item
        );
      } else {
        result[camelKey] = value;
      }
    }
    
    return result;
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

  /**
   * Create employee with image upload
   * POST /employees
   */
  createEmployee = async (req: Request, res: Response, employeeService: EmployeeService) => {
    try {
      const imagePath = req.file?.filename;

      if (!imagePath) {
        return this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ field: 'image_path', message: 'Employee image is required', type: 'required' }],
          'Validation error',
          400
        );
      }

      console.log('=== DEBUG: req.body after validation ===');
      console.log('province_id type:', typeof req.body.province_id, 'value:', req.body.province_id);
      console.log('city_id type:', typeof req.body.city_id, 'value:', req.body.city_id);

      // Convert snake_case to camelCase while preserving types (integers, dates, etc.)
      const requestData = this.snakeToCamel({
        ...req.body,
        province_id: +req.body.province_id,
        city_id: +req.body.city_id,
        district_id: +req.body.district_id,
        subdistrict_id: +req.body.subdistrict_id,
        image_path: imagePath,
      });

      console.log('=== DEBUG: after snakeToCamel ===');
      console.log('provinceId type:', typeof requestData.provinceId, 'value:', requestData.provinceId);
      console.log('cityId type:', typeof requestData.cityId, 'value:', requestData.cityId);

      const newEmployee = await employeeService.create(requestData as TEmployee);
      
      return this.getSuccessResponse(
        res,
        {
          data: EmployeeResponseMapper.toListResponse(newEmployee),
          metadata: {} as TMetadataResponse,
        },
        'Employee created successfully'
      );
    } catch (error) {
      // Delete uploaded image if creation fails
      if (req.file?.filename) {
        const imagePath = path.join(process.cwd(), 'public', 'employee', req.file.filename);
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Error deleting image:", err);
        });
      }

      return this.handleError(
        res,
        error,
        'Failed to create employee',
        500,
        {} as TEmployeeGetResponse,
        {} as TMetadataResponse
      );
    }
  };

  /**
   * Update employee with optional image upload
   * PUT /employees/:id
   */
  updateEmployee = async (req: Request, res: Response, employeeService: EmployeeService) => {
    const employeeId = req.params.id;
    
    try {
      const imagePath = req.file?.filename;

      // Remove old image if new image is uploaded
      if (imagePath) {
        const existingEmployee = await employeeService.findById(employeeId);
        if (existingEmployee && existingEmployee.imagePath) {
          const oldImagePath = path.join(process.cwd(), 'public', 'employee', existingEmployee.imagePath);
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error("Error deleting old image:", err);
          });
        }
      }

      // Convert snake_case to camelCase while preserving types (integers, dates, etc.)
      const requestData = this.snakeToCamel({
        ...req.body,
        ...(imagePath && { image_path: imagePath }),
      });

      const updatedEmployee = await employeeService.update(employeeId, requestData);
      
      return this.getSuccessResponse(
        res,
        {
          data: EmployeeResponseMapper.toListResponse(updatedEmployee),
          metadata: {} as TMetadataResponse,
        },
        'Employee updated successfully'
      );
    } catch (error) {
      // Delete uploaded image if update fails
      if (req.file?.filename) {
        const imagePath = path.join(process.cwd(), 'public', 'employee', req.file.filename);
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Error deleting image:", err);
        });
      }

      return this.handleError(
        res,
        error,
        'Failed to update employee',
        500,
        {} as TEmployeeGetResponse,
        {} as TMetadataResponse
      );
    }
  };

  getSchedules = async (req: Request, res: Response, employeeService: EmployeeService) => {
    try {
      const view = req.query.view as string | undefined;
      const startDate = req.query.start_date as string | undefined;
      const endDate = req.query.end_date as string | undefined;

      // Get data based on view parameter and date filters
      const data = await employeeService.getSchedules(view, startDate, endDate);
      
      // For table view, return attendance data
      if (view === 'table') {
        const tableResponse: TAttendanceTableResponse[] = AttendanceTableResponseMapper.toListResponse(
          data as Array<{
            id: number;
            employee: { name: string };
            checkin_time: Date;
            checkin_image_proof: string;
            checkout_time: Date | null;
            checkout_image_proof: string | null;
            attendance_status: string;
            late_minutes: number;
            late_present_proof: string | null;
            late_notes: string | null;
            late_approval_status: string;
          }>
        );
        
        return this.getSuccessResponse(
          res,
          {
            data: tableResponse,
            metadata: {} as TMetadataResponse,
          },
          'Employee attendance table retrieved successfully'
        );
      }

      // For timeline view (default), return outlet assignments
      const schedulesResponse: TOutletAssignmentGetResponse[] = (data as Array<{
        id: number;
        outlet_id: number;
        employee_id: number;
        assigned_at: Date;
        is_active: boolean;
        createdAt: Date;
        updatedAt: Date;
        outlet: { id: number; name: string; location: string; check_in_time: string; check_out_time: string };
        employee: { id: number; name: string; phone: string; nik: string; address: string };
      }>).map(schedule =>
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

  /**
   * Employee check-in
   * POST /employee/checkin
   * Validation is handled by Zod schema
   */
  checkin = async (req: AuthRequest, res: Response, employeeService: EmployeeService) => {
    try {
      // Get user info from JWT token (validated by authMiddleware)
      const userId = req.user?.id;
      const outletId = req.user?.outlet_id;

      if (!userId || !outletId) {
        return this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ field: 'authentication', message: 'User or outlet information not found', type: 'invalid' }],
          'Authentication error',
          401
        );
      }

      // Extract uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const imagePath = files?.image_proof?.[0]?.filename;
      const latePresentProof = files?.late_present_proof?.[0]?.filename;
      
      // Extract late_notes from body
      const lateNotes = req.body.late_notes;

      if (!imagePath) {
        return this.getFailureResponse(res,
          { data: null, metadata: {} as TMetadataResponse } ,
          [{field:"image_proof", message: "Image proof is required", type: "required"}],
          'Image proof is required',
          400
        )
      }
      
      // Get the scheduled employee for this outlet
      const employeeId = await employeeService.findScheduledEmployeeByUserId(parseInt(userId));
      
      if (!employeeId) {
        return this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ field: 'employee', message: 'No employee scheduled for this outlet today', type: 'not_found' }],
          'No employee scheduled for this outlet',
          404
        );
      }

      const attendance = await employeeService.checkin(
        employeeId, 
        outletId, 
        imagePath, 
        lateNotes, 
        latePresentProof
      );
      const responseData: TAttendanceGetResponse = AttendanceResponseMapper.toResponse(attendance);

      return this.getSuccessResponse(
        res,
        {
          data: responseData,
          metadata: {} as TMetadataResponse,
        },
        'Check-in successful'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check in';
      
      return this.handleError(
        res,
        error,
        errorMessage,
        500,
        null,
        {} as TMetadataResponse
      );
    }
  };

  /**
   * Employee checkout
   * POST /employee/checkout
   */
  checkout = async (req: AuthRequest, res: Response, employeeService: EmployeeService) => {
    try {
      // Get user info from JWT token
      const userId = req.user?.id;
      const outletId = req.user?.outlet_id;

      if (!userId || !outletId) {
        return this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ field: 'authentication', message: 'User or outlet information not found', type: 'invalid' }],
          'Authentication error',
          401
        );
      }

      // Image path from uploaded file (validated by Zod schema)
      const imagePath = req.file?.filename ?? '';

      // Get the scheduled employee for this outlet
      const employeeId = await employeeService.findScheduledEmployeeByUserId(parseInt(userId));
      
      if (!employeeId) {
        return this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ field: 'employee', message: 'No employee scheduled for this outlet', type: 'not_found' }],
          'No employee scheduled for this outlet',
          404
        );
      }

      // Get outlet to validate checkout time
      const outletRepository = new OutletRepository();
      const outlet = await outletRepository.findById(outletId);
      
      if (!outlet) {
        return this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ field: 'outlet', message: 'Outlet not found', type: 'not_found' }],
          'Outlet not found',
          404
        );
      }

      const attendance = await employeeService.checkout(
        employeeId, 
        outletId, 
        imagePath, 
        outlet.checkoutTime
      );
      
      const responseData: TAttendanceGetResponse = AttendanceResponseMapper.toResponse(attendance);

      return this.getSuccessResponse(
        res,
        {
          data: responseData,
          metadata: {} as TMetadataResponse,
        },
        'Check-out successful'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check out';
      
      return this.handleError(
        res,
        error,
        errorMessage,
        500,
        null,
        {} as TMetadataResponse
      );
    }
  };

  /**
   * Get attendances by outlet
   * GET /employee/schedule/:outletId
   */
  getAttendancesByOutlet = async (req: Request, res: Response, employeeService: EmployeeService) => {
    try {
      const { outletId } = req.params;
      const { date, page = '1', limit = '10' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const result = await employeeService.getAttendancesByOutlet(
        parseInt(outletId),
        date as string | undefined,
        pageNum,
        limitNum
      );

      // Apply ResponseMapper in Controller layer to transform raw data to API response format
      const mappedData = result.data.map(attendance => 
        AttendanceListResponseMapper.toResponse(attendance)
      );

      const metadata: TMetadataResponse = {
        page: pageNum,
        limit: limitNum,
        total_records: result.total,
        total_pages: Math.ceil(result.total / limitNum),
      };

      return this.getSuccessResponse(
        res,
        {
          data: mappedData,
          metadata,
        },
        'Attendances retrieved successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve attendances';
      
      return this.handleError(
        res,
        error,
        errorMessage,
        500,
        null,
        {} as TMetadataResponse
      );
    }
  };
}
