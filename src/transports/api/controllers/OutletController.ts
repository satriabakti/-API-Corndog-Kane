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
	TOutletUpdate,
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
			const page = req.query.page
				? parseInt(req.query.page as string, 10)
				: 1;
			const limit = req.query.limit
				? parseInt(req.query.limit as string, 10)
				: undefined;
			const { search_key, search_value } = req.query;
			const result = await this.outletService.findAll(page, limit, [
				{
					field: search_key as string,
					value: search_value as string,
				},
			]);

			// Fetch pic_name for each outlet
			const dataWithPicName = await Promise.all(
				result.data.map(async (outlet) => {
					const picName =
						await this.outletRepository.getLatestEmployeeName(
							parseInt(outlet.id)
						);
					return OutletResponseMapper.toListResponse(
						outlet,
						picName
					);
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
				{
					data: {} as TOutletGetResponseWithSettings,
					metadata: {} as TMetadataResponse,
				},
				[
					{
						field: "id",
						message: "Outlet not found",
						type: "not_found",
					},
				],
				"Outlet not found",
				404
			);
		}

		// Fetch pic_name from latest active employee
		const picName = await this.outletRepository.getLatestEmployeeName(
			parseInt(id)
		);

		return this.getSuccessResponse(
			res,
			{
				data: OutletResponseMapper.toDetailResponse(
					outlet,
					picName
				),
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
				name: outletData.name,
				location: outletData.location,
				code: outletData.code,
				description: outletData.description,
				isActive: outletData.is_active,
				incomeTarget: outletData.income_target,
				settings: outletData.setting.map((s) => ({
					checkin_time: s.checkin_time,
					checkout_time: s.checkout_time,
					salary: s.salary,
					days: s.days,
				})),
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

			const updatePayload: Partial<TOutletUpdate> = {
				name: outletData.name,
				location: outletData.location,
				code: outletData.code,
				description: outletData.description,
				isActive: outletData.is_active,
				incomeTarget: outletData.income_target,
				userId: outletData.user_id,
			};

			if (outletData.setting) {
				updatePayload.settings = outletData.setting.map((s) => ({
					id: s.id,
					checkin_time: s.checkin_time,
					checkout_time: s.checkout_time,
					salary: s.salary,
					days: s.days,
				}));
			}

			const updatedOutlet = (await this.outletService.updateOutlet(
				+id,
				updatePayload
			)) as TOutletWithSettings;

			if (!updatedOutlet) {
				return this.getFailureResponse(
					res,
					{
						data: {} as TOutletGetResponse,
						metadata: {} as TMetadataResponse,
					},
					[
						{
							field: "id",
							message: "Outlet not found",
							type: "not_found",
						},
					],
					"Outlet not found",
					404
				);
			}

			return this.getSuccessResponse(
				res,
				{
					data: OutletResponseMapper.toDetailResponse(
						updatedOutlet
					),
					metadata: {} as TMetadataResponse,
				},
				"Outlet updated successfully"
			);
		} catch (error) {
			return this.handleError(
				res,
				error,
				"Failed to update outlet",
				500,
				{} as TOutletGetResponse,
				{} as TMetadataResponse
			);
		}
	};

	assignEmployeeToOutlet = async (
		req: Request,
		res: Response
	): Promise<Response> => {
		try {
			const outletId = parseInt(req.params.id);
			const employeeId = parseInt(req.params.employeeid);
			const {
				date,
				is_for_one_week,
				is_for_one_month,
				previous_status,
				notes,
			} = req.body;

			// Validate outlet exists
			const outlet = await this.outletService.findById(
				outletId.toString()
			);
			if (!outlet) {
				return this.getFailureResponse(
					res,
					{
						data: {} as TOutletGetResponse,
						metadata: {} as TMetadataResponse,
					},
					[
						{
							field: "id",
							message: "Outlet not found",
							type: "not_found",
						},
					],
					"Outlet not found",
					404
				);
			}

			// Validate employee exists
			const employee = await this.employeeService.findById(
				employeeId.toString()
			);
			if (!employee) {
				return this.getFailureResponse(
					res,
					{
						data: {} as TOutletGetResponse,
						metadata: {} as TMetadataResponse,
					},
					[
						{
							field: "employeeid",
							message: "Employee not found",
							type: "not_found",
						},
					],
					"Employee not found",
					404
				);
			}

			const result =
				await this.outletService.assignEmployeeToOutletForDates(
					outletId,
					employeeId,
					new Date(date),
					is_for_one_week || false,
					is_for_one_month || false,
					previous_status,
					notes
				);

			const responseData: TOutletAssignmentGetResponse[] =
				result.assignments.map((assignment) =>
					OutletAssignmentResponseMapper.toListResponse(
						assignment
					)
				);

			const message =
				result.action === "swap"
					? "Employees swapped successfully"
					: result.action === "replace"
					? "Employee replaced and attendance created successfully"
					: "Employee assigned to outlet successfully";

			return this.getSuccessResponse(
				res,
				{
					data: responseData,
					metadata: {
						total: responseData.length,
						attendances_created: result.attendances.length,
						action: result.action,
					} as unknown as TMetadataResponse,
				},
				message
			);
		} catch (error) {
			// Check if error is about duplicate assignment
			if (
				error instanceof Error &&
				error.message.includes("already assigned to outlet")
			) {
				return this.getFailureResponse(
					res,
					{
						data: {} as TOutletGetResponse,
						metadata: {} as TMetadataResponse,
					},
					[
						{
							field: "employee_id",
							message: error.message,
							type: "conflict",
						},
					],
					error.message,
					400
				);
			}

			// Check if error is about PRESENT attendance
			if (
				error instanceof Error &&
				error.message.includes("Cannot reassign")
			) {
				return this.getFailureResponse(
					res,
					{
						data: {} as TOutletGetResponse,
						metadata: {} as TMetadataResponse,
					},
					[
						{
							field: "employee_id",
							message: error.message,
							type: "conflict",
						},
					],
					error.message,
					400
				);
			}

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
	getOutletProductStocks = async (
		req: Request,
		res: Response
	): Promise<Response> => {
		try {
			const { id } = req.params;
			const page = req.query.page
				? parseInt(req.query.page as string, 10)
				: 1;
			const limit = req.query.limit
				? parseInt(req.query.limit as string, 10)
				: undefined;

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
					[
						{
							field: "id",
							message: "Outlet not found",
							type: "not_found",
						},
					],
					"Outlet not found",
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
					data: result.data.map((item) =>
						OutletProductStockResponseMapper.toListResponse(
							item
						)
					),
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
	getOutletMaterialStocks = async (
		req: Request,
		res: Response
	): Promise<Response> => {
		try {
			const { id } = req.params;
			const page = req.query.page
				? parseInt(req.query.page as string, 10)
				: 1;
			const limit = req.query.limit
				? parseInt(req.query.limit as string, 10)
				: undefined;

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
					[
						{
							field: "id",
							message: "Outlet not found",
							type: "not_found",
						},
					],
					"Outlet not found",
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
					data: result.data.map((item) =>
						OutletMaterialStockResponseMapper.toListResponse(
							item
						)
					),
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

	deleteSchedule = async (
		req: Request,
		res: Response
	): Promise<Response> => {
		try {
			const outletId = parseInt(req.params.outlet_id);
			const date = new Date(req.params.date);

			// Validate outlet exists
			const outlet = await this.outletService.findById(
				outletId.toString()
			);
			if (!outlet) {
				return this.getFailureResponse(
					res,
					{
						data: {} as TOutletGetResponse,
						metadata: {} as TMetadataResponse,
					},
					[
						{
							field: "outlet_id",
							message: "Outlet not found",
							type: "not_found",
						},
					],
					"Outlet not found",
					404
				);
			}

			const deletedCount =
				await this.outletService.deleteScheduleByOutletAndDate(
					outletId,
					date
				);

			if (deletedCount === 0) {
				return this.getFailureResponse(
					res,
					{
						data: {} as TOutletGetResponse,
						metadata: {} as TMetadataResponse,
					},
					[
						{
							field: "date",
							message: "No schedule found for this date",
							type: "not_found",
						},
					],
					"No schedule found for this date",
					404
				);
			}

			return this.getSuccessResponse(
				res,
				{
					data: {
						deleted_count: deletedCount,
					} as unknown as TOutletGetResponse,
					metadata: {} as TMetadataResponse,
				},
				`Successfully deleted ${deletedCount} schedule(s)`
			);
		} catch (error) {
			return this.handleError(
				res,
				error,
				"Failed to delete schedule",
				500,
				{} as TOutletGetResponse,
				{} as TMetadataResponse
			);
		}
	};

	/**
	 * Get financial summary for an outlet
	 */
	getSummarize = async (req: Request, res: Response): Promise<Response> => {
		try {
			const outletId = parseInt(req.params.id, 10);

			if (isNaN(outletId)) {
				return this.getFailureResponse(
					res,
					{
						data: {} as TOutletGetResponse,
						metadata: {} as TMetadataResponse,
					},
					[
						{
							field: "id",
							message: "Invalid outlet ID",
							type: "invalid",
						},
					],
					"Invalid outlet ID",
					400
				);
			}

			// Optional query parameters
			const fromDate = req.query.start_date
				? new Date(req.query.start_date as string)
				: undefined;
			const toDate = req.query.end_date
				? new Date(req.query.end_date as string)
				: undefined;
			const status = req.query.status
				? (req.query.status as string)
				: undefined;

			const summarize = await this.outletService.getOutletSummarize(
				outletId,
				fromDate,
				toDate,
				status
			);

			return this.getSuccessResponse(
				res,
				{
					data: summarize as unknown as TOutletGetResponse,
					metadata: {} as TMetadataResponse,
				},
				"Successfully retrieved outlet summary"
			);
		} catch (error) {
			return this.handleError(
				res,
				error,
				"Failed to get outlet summary",
				500,
				{} as TOutletGetResponse,
				{} as TMetadataResponse
			);
		}
	};
}
