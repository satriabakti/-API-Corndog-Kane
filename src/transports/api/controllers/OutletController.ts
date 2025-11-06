import { Request, Response } from "express";
import OutletRepository from "../../../adapters/postgres/repositories/OutletRepository";
import EmployeeRepository from "../../../adapters/postgres/repositories/EmployeeRepository";
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TOutletAssignmentGetResponse } from "../../../core/entities/outlet/assignment";
import { 
	TOutletCreateRequest, 
	TOutletGetResponse, 
	TOutletGetResponseWithSettings, 
	TOutletUpdateRequest, 
	TOutletWithSettings,
	TOutletStockItem,
	TMaterialStockItem
} from "../../../core/entities/outlet/outlet";
import OutletService from "../../../core/services/OutletService";
import EmployeeService from "../../../core/services/EmployeeService";
import Controller from "./Controller";
import { OutletResponseMapper } from "../../../mappers/response-mappers/OutletResponseMapper";
import { OutletAssignmentResponseMapper } from "../../../mappers/response-mappers/OutletAssignmentResponseMapper";
import { OutletProductStockResponseMapper } from "../../../mappers/response-mappers/OutletProductStockResponseMapper";
import { OutletMaterialStockResponseMapper } from "../../../mappers/response-mappers/OutletMaterialStockResponseMapper";

export class OutletController extends Controller<
	| TOutletGetResponse
	| TOutletGetResponseWithSettings
	| TOutletAssignmentGetResponse
	| TOutletStockItem
	| TMaterialStockItem,
	TMetadataResponse
> {
	private outletService: OutletService;
	private employeeService: EmployeeService;
	private outletRepository: OutletRepository;

	constructor() {
		super();
		this.outletRepository = new OutletRepository();
		this.outletService = new OutletService(this.outletRepository);
		this.employeeService = new EmployeeService(new EmployeeRepository());
	}

	/**
	 * Get all outlets with pic_name from latest active employee
	 */
	getAllOutlets = async (req: Request, res: Response): Promise<Response> => {
		try {
			const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
			const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
			const {search_key,search_value}	= req.query;
			const result = await this.outletService.findAll(page, limit,[
				{
					field: search_key as string,
					value: search_value as string,
				},
			]);

			// Fetch pic_name for each outlet
			const dataWithPicName = await Promise.all(
				result.data.map(async (outlet) => {
					const picName = await this.outletRepository.getLatestEmployeeName(parseInt(outlet.id));
					return OutletResponseMapper.toListResponse(outlet, picName);
				})
			);

			const metadata: TMetadataResponse = {
				page: result.page,
				limit: result.limit,
				total_records: result.total,
				total_pages: result.totalPages,
			};

			return this.getSuccessResponse(
				res,
				{
					data: dataWithPicName,
					metadata: metadata,
				},
				"Outlets retrieved successfully"
			);
		} catch (error) {
			return this.handleError(
				res,
				error,
				"Failed to retrieve outlets",
				500,
				[],
				{} as TMetadataResponse
			);
		}
	};

	findById = async (req: Request, res: Response): Promise<Response> => {
		const { id } = req.params;
		const outlet = (await this.outletService.findById(
			id
		)) as TOutletWithSettings | null;

		if (!outlet) {
			return this.getFailureResponse(
				res,
				{ data: {} as TOutletGetResponseWithSettings, metadata: {} as TMetadataResponse },
				[{ field: 'id', message: 'Outlet not found', type: 'not_found' }],
				'Outlet not found',
				404
			);
		}

		// Fetch pic_name from latest active employee
		const picName = await this.outletRepository.getLatestEmployeeName(parseInt(id));

		return this.getSuccessResponse(
			res,
			{
				data: OutletResponseMapper.toDetailResponse(outlet, picName),
				metadata: {} as TMetadataResponse,
			},
			"Outlet retrieved successfully"
		);
	};
	// overide create method

	createOutlet = async (req: Request, res: Response): Promise<Response> => {
		try {
			const outletData = req.body as TOutletCreateRequest;
			const newOutlet = (await this.outletService.createOutlet({
				checkinTime: outletData.setting.checkin_time,
				checkoutTime: outletData.setting.checkout_time,
				description: outletData.description,
				isActive: outletData.is_active,
				location: outletData.location,
				name: outletData.name,
				code: outletData.code,
				picPhone: outletData.pic_phone,
				salary: +outletData.setting.salary,
				incomeTarget: +outletData.setting.income_target,
				user: outletData.user,
				userId: outletData.user_id || 0,
			})) as TOutletWithSettings;
			return this.getSuccessResponse(
				res,
				{
					data: OutletResponseMapper.toDetailResponse(newOutlet),
					metadata: {} as TMetadataResponse,
				},
				"Outlet created successfully"
			);
		} catch (error) {
			return this.handleError(
				res,
				error,
				"Failed to create outlet",
				500,
				{} as TOutletGetResponse,
				{} as TMetadataResponse
			);
		}
	};
  updateOutlet = async (req: Request, res: Response): Promise<Response> => {
    try {
      
      const { id } = req.params;
      const outletData = req.body as TOutletUpdateRequest;
	  let setting = outletData.setting || {};
	  if (Object.keys(setting).length > 0) {
		setting = {
		  checkInTime: setting.checkin_time,
		  checkOutTime: setting.checkout_time,
		  salary: setting.salary == null ? null : +setting.salary,
		} as { checkInTime?: string | null; checkOutTime?: string | null; salary?: number | null };
		
	  }
      const updatedOutlet = (await this.outletService.updateOutlet(+id, {
        ...setting,
        description: outletData.description,
        isActive: outletData.is_active,
        location: outletData.location,
        name: outletData.name,
        code: outletData.code,
        picPhone: outletData.pic_phone,
        userId: outletData.user_id,
      })) as TOutletWithSettings;
      
      if (!updatedOutlet) {
        return this.getFailureResponse(
          res,
          { data: {} as TOutletGetResponse, metadata: {} as TMetadataResponse },
          [{ field: 'id', message: 'Outlet not found', type: 'not_found' }],
          'Outlet not found',
          404
        );
      }
      
      return this.getSuccessResponse(
        res,
        {
          data: OutletResponseMapper.toListResponse(updatedOutlet as TOutletWithSettings),
          metadata: {} as TMetadataResponse,
        },
        'Outlet updated successfully'
      );
    } catch (error){
      return this.handleError(
        res,
        error,
        "Failed to update outlet",
        500,
        {} as TOutletGetResponse,
        {} as TMetadataResponse
      );
    }
	}

	assignEmployeeToOutlet = async (req: Request, res: Response): Promise<Response> => {
		try {
			const outletId = parseInt(req.params.id);
			const employeeId = parseInt(req.params.employeeid);
			const { date, is_for_one_week } = req.body;

			// Validate outlet exists
			const outlet = await this.outletService.findById(outletId.toString());
			if (!outlet) {
				return this.getFailureResponse(
					res,
					{ data: {} as TOutletGetResponse, metadata: {} as TMetadataResponse },
					[{ field: 'id', message: 'Outlet not found', type: 'not_found' }],
					'Outlet not found',
					404
				);
			}

			// Validate employee exists
			const employee = await this.employeeService.findById(employeeId.toString());
			if (!employee) {
				return this.getFailureResponse(
					res,
					{ data: {} as TOutletGetResponse, metadata: {} as TMetadataResponse },
					[{ field: 'employeeid', message: 'Employee not found', type: 'not_found' }],
					'Employee not found',
					404
				);
			}

			const assignments = await this.outletService.assignEmployeeToOutletForDates(
				outletId,
				employeeId,
				new Date(date),
				is_for_one_week
			);

			const responseData: TOutletAssignmentGetResponse[] = assignments.map((assignment) =>
				OutletAssignmentResponseMapper.toListResponse(assignment)
			);

			return this.getSuccessResponse(
				res,
				{
					data: responseData,
					metadata: {} as TMetadataResponse,
				},
				"Employee assigned to outlet successfully"
			);
		} catch (error) {
			return this.handleError(
				res,
				error,
				"Failed to assign employee to outlet",
				500,
				{} as TOutletGetResponse,
				{} as TMetadataResponse
			);
		}
	};

	/**
	 * Get outlet product stock movements with pagination
	 */
	getOutletProductStocks = async (req: Request, res: Response): Promise<Response> => {
		try {
			const { id } = req.params;
			const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
			const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
			
			// Optional date filters
			let startDate: Date | undefined;
			let endDate: Date | undefined;

			if (req.query.start_date) {
				startDate = new Date(req.query.start_date as string);
			}
			if (req.query.end_date) {
				endDate = new Date(req.query.end_date as string);
			}

			// Verify outlet exists
			const outlet = await this.outletService.findById(id);
			if (!outlet) {
				return this.getFailureResponse(
					res,
					{ data: [], metadata: {} as TMetadataResponse },
					[{ field: 'id', message: 'Outlet not found', type: 'not_found' }],
					'Outlet not found',
					404
				);
			}

			const result = await this.outletService.getOutletProductStocks(
				parseInt(id),
				page,
				limit,
				startDate,
				endDate
			);

			return this.getSuccessResponse(
				res,
				{
					data: result.data.map(item => OutletProductStockResponseMapper.toListResponse(item)),
					metadata: result.metadata,
				},
				"Outlet product stocks retrieved successfully"
			);
		} catch (error) {
			return this.handleError(
				res,
				error,
				"Failed to retrieve outlet product stocks",
				500,
				[],
				{} as TMetadataResponse
			);
		}
	};

	/**
	 * Get outlet material stock movements with pagination
	 */
	getOutletMaterialStocks = async (req: Request, res: Response): Promise<Response> => {
		try {
			const { id } = req.params;
			const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
			const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
			
			// Optional date filters
			let startDate: Date | undefined;
			let endDate: Date | undefined;

			if (req.query.start_date) {
				startDate = new Date(req.query.start_date as string);
			}
			if (req.query.end_date) {
				endDate = new Date(req.query.end_date as string);
			}

			// Verify outlet exists
			const outlet = await this.outletService.findById(id);
			if (!outlet) {
				return this.getFailureResponse(
					res,
					{ data: [], metadata: {} as TMetadataResponse },
					[{ field: 'id', message: 'Outlet not found', type: 'not_found' }],
					'Outlet not found',
					404
				);
			}

			const result = await this.outletService.getOutletMaterialStocks(
				parseInt(id),
				page,
				limit,
				startDate,
				endDate
			);

			return this.getSuccessResponse(
				res,
				{
					data: result.data.map(item => OutletMaterialStockResponseMapper.toListResponse(item)),
					metadata: result.metadata,
				},
				"Outlet material stocks retrieved successfully"
			);
		} catch (error) {
			return this.handleError(
				res,
				error,
				"Failed to retrieve outlet material stocks",
				500,
				[],
				{} as TMetadataResponse
			);
		}
	};

}
