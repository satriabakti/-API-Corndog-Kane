/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { TErrorResponse, TMetadataResponse, TResponse } from "../../../core/entities/base/response";
import { PrismaErrorHandler } from "../../../adapters/postgres/repositories/PrismaErrorHandler";
import { Service } from "../../../core/services/Service";
import { TUser } from "../../../core/entities/user/user";
import { TRole } from "../../../core/entities/user/role";
import { TOutlet } from "../../../core/entities/outlet/outlet";

type TDataMetadataResponse<T, M> = {
  data: T |T[];
  metadata: M;
};

// Generic mapper interface for response mapping
interface ResponseMapper<TEntity, TResponse> {
  toListResponse(entity: TEntity): TResponse;
}

// Entity constraint type matching Service class
type TEntity = TUser | TOutlet | TRole;
export default class Controller<T, M> {
	protected getSuccessResponse(
		res: Response,
		{ data, metadata }: TDataMetadataResponse<T, M>,
		message?: string
	): Response<TResponse<T, M>> {
		return res.status(200).json({
			status: "success",
			message: message || "Request was successful",
			data,
			metadata,
		} as TResponse<T | T[], M>);
	}
	
	protected getFailureResponse(
		res: Response,
    { data, metadata }: TDataMetadataResponse<T, M>,
    errors: TErrorResponse[] | null,
    message?: string,
    code?: number
  ): Response<TResponse<T, M>> {
    return res.status(code || 400).json({
      status: "failed",
      message: message || "Request failed",
      data,
      errors: errors || undefined,
      metadata,
    } as TResponse<T, M>);
  }

	/**
	 * Handle service errors with consistent response format
	 * Automatically handles Prisma errors with proper status codes and error types
	 * @param res - Express Response object
	 * @param error - The error object thrown
	 * @param message - User-friendly error message
	 * @param statusCode - HTTP status code (default: 500, overridden by Prisma errors)
	 * @param emptyData - Empty data object matching the expected type
	 * @param emptyMetadata - Empty metadata object matching the expected type
	 */
	protected handleError(
		res: Response,
		error: unknown,
		message: string,
		statusCode: number = 500,
		emptyData: T | T[],
		emptyMetadata: M
	) {
		console.error(`${message}:`, error);
		
		// Check if it's a Prisma error and handle it specifically
		const prismaError = PrismaErrorHandler.handlePrismaError(error);
		if (prismaError) {
			return this.getFailureResponse(
				res,
				{ data: emptyData, metadata: emptyMetadata },
				prismaError.errors,
				message,
				prismaError.statusCode
			);
		}
		
		// Default error handling for non-Prisma errors
		return this.getFailureResponse(
			res,
			{ data: emptyData, metadata: emptyMetadata },
			[{ field: 'server', message, type: 'internal_error' }],
			message,
			statusCode
		);
	}

	/**
	 * Generic findAll method for listing entities with pagination
	 * Can be used by any controller to retrieve paginated lists
	 * @param serviceClass - Service instance for the entity
	 * @param mapperClass - Response mapper with toListResponse method
	 * @returns Express middleware function
	 */
	protected createFindAllHandler<E extends TEntity, TResponseItem>(
		serviceClass: Service<E>,
		mapperClass: ResponseMapper<E, TResponseItem>
	) {
		return async (req: Request, res: Response) => {
			try {
				const { page, limit, search_key, search_value, ...filters } = req.query;
				const pageNum = page ? parseInt(page as string) : 1;
				const limitNum = limit ? parseInt(limit as string) : 10;
				const search =
					search_key && search_value
						? [
								{
									field: search_key as string,
									value: search_value as string,
								},
						  ]
						: undefined;
				const filterObj = Object.keys(filters).length > 0 ? filters : undefined;

				const result = await serviceClass.findAll(
					pageNum,
					limitNum,
					search,
					filterObj as Record<string, unknown>
				);

				const dataMapped = result.data.map((d: E) =>
					mapperClass.toListResponse(d)
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
						data: dataMapped as any,
						metadata: metadata as any,
					},
					"Data retrieved successfully"
				);
			} catch (error) {
				return this.handleError(
					res,
					error,
					"Failed to retrieve data",
					500,
					[] as any,
					{
						page: 1,
						limit: 10,
						total_records: 0,
						total_pages: 0,
					} as any
				);
			}
		};
	}

	/**
	 * Public findAll method that can be called directly from routes
	 * Usage: router.get("/", roleController.findAll(roleService, RoleResponseMapper))
	 * @param serviceClass - Service instance for the entity
	 * @param mapperClass - Response mapper with toListResponse method
	 * @returns Express middleware function
	 */
	findAll<E extends TEntity, TResponseItem>(
		serviceClass: Service<E>,
		mapperClass: ResponseMapper<E, TResponseItem>
	) {
		return this.createFindAllHandler<E, TResponseItem>(serviceClass, mapperClass);
	}

	/**
	 * Protected createHandler - Creates middleware for entity creation
	 * @param serviceClass - Service instance for the entity
	 * @param mapperClass - Response mapper with toListResponse method
	 * @param successMessage - Custom success message
	 * @returns Express middleware function
	 */
	protected createCreateHandler<E extends TEntity, TResponseItem>(
		serviceClass: Service<E>,
		mapperClass: ResponseMapper<E, TResponseItem>,
		successMessage: string = "Data created successfully"
	) {
		return async (req: Request, res: Response) => {
			try {
				const newEntity = await serviceClass.create(req.body as E);
				
				return this.getSuccessResponse(
					res,
					{
						data: mapperClass.toListResponse(newEntity) as any,
						metadata: {} as any,
					},
					successMessage
				);
			} catch (error) {
				return this.handleError(
					res,
					error,
					"Failed to create data",
					500,
					{} as any,
					{} as any
				);
			}
		};
	}

	/**
	 * Public create method that can be called directly from routes
	 * Usage: router.post("/", roleController.create(roleService, RoleResponseMapper))
	 * @param serviceClass - Service instance for the entity
	 * @param mapperClass - Response mapper with toListResponse method
	 * @param successMessage - Custom success message (optional)
	 * @returns Express middleware function
	 */
	create<E extends TEntity, TResponseItem>(
		serviceClass: Service<E>,
		mapperClass: ResponseMapper<E, TResponseItem>,
		successMessage: string = "Data created successfully"
	) {
		return this.createCreateHandler<E, TResponseItem>(serviceClass, mapperClass, successMessage);
	}

	/**
	 * Protected updateHandler - Creates middleware for entity update
	 * @param serviceClass - Service instance for the entity
	 * @param mapperClass - Response mapper with toListResponse method
	 * @param successMessage - Custom success message
	 * @returns Express middleware function
	 */
	protected createUpdateHandler<E extends TEntity, TResponseItem>(
		serviceClass: Service<E>,
		mapperClass: ResponseMapper<E, TResponseItem>,
		successMessage: string = "Data updated successfully"
	) {
		return async (req: Request, res: Response) => {
			try {
				const { id } = req.params;
				const updatedEntity = await serviceClass.update(id, req.body);

				if (!updatedEntity) {
					return this.getFailureResponse(
						res,
						{ data: {} as any, metadata: {} as any },
						[{ field: 'id', message: 'Data not found', type: 'not_found' }],
						'Data not found',
						404
					);
				}

				return this.getSuccessResponse(
					res,
					{
						data: mapperClass.toListResponse(updatedEntity) as any,
						metadata: {} as any,
					},
					successMessage
				);
			} catch (error) {
				return this.handleError(
					res,
					error,
					"Failed to update data",
					500,
					{} as any,
					{} as any
				);
			}
		};
	}

	/**
	 * Public update method that can be called directly from routes
	 * Usage: router.put("/:id", roleController.update(roleService, RoleResponseMapper))
	 * @param serviceClass - Service instance for the entity
	 * @param mapperClass - Response mapper with toListResponse method
	 * @param successMessage - Custom success message (optional)
	 * @returns Express middleware function
	 */
	update<E extends TEntity, TResponseItem>(
		serviceClass: Service<E>,
		mapperClass: ResponseMapper<E, TResponseItem>,
		successMessage: string = "Data updated successfully"
	) {
		return this.createUpdateHandler<E, TResponseItem>(serviceClass, mapperClass, successMessage);
	}

	/**
	 * Protected deleteHandler - Creates middleware for entity deletion
	 * @param serviceClass - Service instance for the entity
	 * @param successMessage - Custom success message
	 * @returns Express middleware function
	 */
	protected createDeleteHandler<E extends TEntity>(
		serviceClass: Service<E>,
		successMessage: string = "Data deleted successfully"
	) {
		return async (req: Request, res: Response) => {
			try {
				const { id } = req.params;
				await serviceClass.delete(id);

				return this.getSuccessResponse(
					res,
					{
						data: {} as any,
						metadata: {} as any,
					},
					successMessage
				);
			} catch (error) {
				return this.handleError(
					res,
					error,
					"Failed to delete data",
					500,
					{} as any,
					{} as any
				);
			}
		};
	}

	/**
	 * Public delete method that can be called directly from routes
	 * Usage: router.delete("/:id", roleController.delete(roleService))
	 * @param serviceClass - Service instance for the entity
	 * @param successMessage - Custom success message (optional)
	 * @returns Express middleware function
	 */
	delete<E extends TEntity>(
		serviceClass: Service<E>,
		successMessage: string = "Data deleted successfully"
	) {
		return this.createDeleteHandler<E>(serviceClass, successMessage);
	}
}