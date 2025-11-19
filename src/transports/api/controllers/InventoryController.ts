import { Request, Response } from "express";
import InventoryService from "../../../core/services/InventoryService";
import { TInventoryStockInRequest, TInventoryStockInUpdateRequest, TInventoryStockInResponse, TInventoryBuyListResponse, TInventoryStockInItemResponse } from "../../../core/entities/inventory/inventory";
import { TMetadataResponse } from "../../../core/entities/base/response";
import Controller from "./Controller";
import { InventoryStockInBatchResponseMapper, InventoryBuyListResponseMapper, InventoryStockInResponseMapper } from "../../../mappers/response-mappers";

/**
 * InventoryController
 * Handles HTTP requests for unified inventory management (Material & Product)
 */
export class InventoryController extends Controller<TInventoryStockInResponse | TInventoryBuyListResponse | TInventoryStockInItemResponse, TMetadataResponse> {
	/**
	 * POST /inventory/in
	 * Handle stock in for both Material and Product
	 */
	stockIn(inventoryService: InventoryService) {
		return async (req: Request, res: Response) => {
			try {
				const requestData: TInventoryStockInRequest = req.body;

				// Call service - returns entity
				const result = await inventoryService.stockIn(requestData);

				// Map entity to response
				const responseData = InventoryStockInBatchResponseMapper.toResponse(result);

				// Determine status code and message based on results
				const statusCode = result.failedCount === 0 ? 201 : 207; // 207 Multi-Status if partial success
				const message = result.failedCount === 0
					? `All ${result.successCount} items recorded successfully`
					: `${result.successCount} items recorded, ${result.failedCount} failed`;

				// Send success response
				return res.status(statusCode).json({
					status: "success",
					message,
					data: responseData,
					metadata: {} as TMetadataResponse,
				});
			} catch (error) {
				return this.handleError(
					res,
					error,
					"Failed to process inventory stock in",
					500,
					{} as TInventoryStockInResponse,
					{} as TMetadataResponse
				);
			}
		};
	}

	/**
	 * GET /inventory/buy
	 * Get unified buy list (Material purchases + Product PURCHASE)
	 */
	getBuyList(inventoryService: InventoryService) {
		return async (req: Request, res: Response) => {
			try {
				// Use validated pagination params from middleware with defaults
				const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
				const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

				// Call service - returns entity
				const { data, total } = await inventoryService.getBuyList(page, limit);

				// Map entities to response
				const responseData: TInventoryBuyListResponse = {
					data: InventoryBuyListResponseMapper.toResponseArray(data),
					total
				};

				// Build metadata for pagination
				const metadata: TMetadataResponse = {
					page,
					limit,
					total_records: total,
					total_pages: Math.ceil(total / limit),
				};

				// Send success response
				return this.getSuccessResponse(
					res,
					{ data: responseData, metadata },
					"Buy list retrieved successfully"
				);
			} catch (error) {
				return this.handleError(
					res,
					error,
					"Failed to retrieve buy list",
					500,
					{ data: [], total: 0 } as TInventoryBuyListResponse,
					{} as TMetadataResponse
				);
			}
		};
	}

	/**
	 * PUT /inventory/in/:id
	 * Update material stock in record
	 */
	updateStockIn(inventoryService: InventoryService) {
		return async (req: Request, res: Response) => {
			try {
				const { id } = req.params;
				const requestData: TInventoryStockInUpdateRequest = req.body;

				// Validate id
				const recordId = parseInt(id);
				if (isNaN(recordId)) {
					return this.getFailureResponse(
						res,
						{ data: null, metadata: {} as TMetadataResponse },
						[{ field: 'id', message: "Invalid ID. Must be a number", type: 'invalid' }],
						"Validation failed",
						400
					);
				}

				// Call service - returns entity
				const result = await inventoryService.updateStockIn(
					recordId,
					requestData
				);

				// Map entity to response
				const responseData = InventoryStockInResponseMapper.toResponse(result);

				// Send success response
				return this.getSuccessResponse(
					res,
					{ data: responseData, metadata: {} as TMetadataResponse },
					"Stock in record updated successfully"
				);
			} catch (error) {
				return this.handleError(
					res,
					error,
					"Failed to update stock in record",
					500,
					{} as TInventoryStockInItemResponse,
					{} as TMetadataResponse
				);
			}
		};
	}
}
