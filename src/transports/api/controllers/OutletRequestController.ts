import { Request, Response, NextFunction } from 'express';
import { OutletRequestService } from '../../../core/services/OutletRequestService';
import {
  TCreateOutletRequestBody,
  TUpdateProductRequestBody,
  TUpdateMaterialRequestBody,
  TApproveRequestsBody,
} from '../validations/outletRequest.validation';
import {
  OutletProductRequestResponseMapper,
  OutletMaterialRequestResponseMapper,
  OutletProductRequestBatchResponseMapper,
  OutletMaterialRequestBatchResponseMapper,
} from '../../../mappers/response-mappers';
import { AuthRequest } from '../../../policies/authMiddleware';
import { TOutletProductRequest, TOutletMaterialRequest } from '../../../core/entities/outlet/request';
import Controller from './Controller';
import { TMetadataResponse } from '../../../core/entities/base/response';
import { 
  TOutletProductRequestResponse, 
  TOutletMaterialRequestResponse, 
  TOutletRequestDetailResponse,
  TOutletRequestsResponse 
} from '../../../core/entities/outlet/request';

// Union type for all possible outlet request response types
// Using Record<string, unknown> to allow complex nested response structures
type TOutletRequestResponseTypes = 
  | TOutletProductRequestResponse 
  | TOutletMaterialRequestResponse 
  | TOutletRequestDetailResponse
  | TOutletRequestsResponse
  | Record<string, unknown>
  | null;

export class OutletRequestController extends Controller<TOutletRequestResponseTypes, TMetadataResponse> {
  constructor(private outletRequestService: OutletRequestService) {
    super();
  }

  /**
   * Create a new batch request (products and/or materials)
   * Outlet ID is taken from the authenticated user
   */
  createBatchRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Request body is already validated by middleware
      const { products, materials } = req.body as TCreateOutletRequestBody;

      // Get outlet_id from authenticated user
      const outletId = req.user?.outlet_id;
      if (!outletId) {
        this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ type: 'required', field: 'outlet_id', message: 'Outlet ID not found in user session' }],
          'Outlet ID not found in user session'
        );
        return;
      }

      // Create batch request
      const result = await this.outletRequestService.createBatchRequest({
        outletId,
        products: products?.map(p => ({
          productId: p.id,
          quantity: p.quantity,
        })) || [],
        materials: materials?.map(m => ({
          materialId: m.id,
          quantity: m.quantity,
        })) || [],
      });

      // Map responses
      const response = {
        success: true,
        message: 'Batch request created successfully',
        data: {
          product_requests: OutletProductRequestBatchResponseMapper(result.productRequests),
          material_requests: OutletMaterialRequestBatchResponseMapper(result.materialRequests),
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all requests with pagination
   */
  getAllRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse pagination from query string with defaults
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      // Get aggregated requests grouped by outlet
      const result = await this.outletRequestService.getAggregatedRequests(page, limit);

      const metadata: TMetadataResponse = {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_records: result.pagination.total,
        total_pages: result.pagination.totalPages,
      };

      this.getSuccessResponse(
        res,
        {
          data: result.data,
          metadata,
        },
        'Requests retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get requests for the authenticated user's outlet
   */
  getMyRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get outlet_id from authenticated user
      const outletId = req.user?.outlet_id;
      if (!outletId) {
        this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ type: 'required', field: 'outlet_id', message: 'Outlet ID not found in user session' }],
          'Outlet ID not found in user session'
        );
        return;
      }

      // Get requests for this outlet
      const result = await this.outletRequestService.getRequestsByOutletId(outletId);

      // Map responses
      const responseData = {
        product_requests: OutletProductRequestBatchResponseMapper(result.products),
        material_requests: OutletMaterialRequestBatchResponseMapper(result.materials),
      };

      this.getSuccessResponse(
        res,
        {
          data: responseData,
          metadata: {} as TMetadataResponse,
        },
        'Your requests retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a product request
   * Only productId and quantity can be updated, and only if status is PENDING
   */
  updateProductRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Request body is already validated by middleware
      const { product_id, quantity } = req.body as TUpdateProductRequestBody;

      // Update the request
      const updatedRequest = await this.outletRequestService.updateProductRequest(id, {
        productId: product_id,
        quantity: quantity,
      });

      // Map response
      const responseData = OutletProductRequestResponseMapper(updatedRequest);

      this.getSuccessResponse(
        res,
        {
          data: responseData,
          metadata: {} as TMetadataResponse,
        },
        'Product request updated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a material request
   * Only materialId and quantity can be updated, and only if status is PENDING
   */
  updateMaterialRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Request body is already validated by middleware
      const { material_id, quantity } = req.body as TUpdateMaterialRequestBody;

      // Update the request
      const updatedRequest = await this.outletRequestService.updateMaterialRequest(id, {
        materialId: material_id,
        quantity: quantity,
      });

      // Map response
      const responseData = OutletMaterialRequestResponseMapper(updatedRequest);

      this.getSuccessResponse(
        res,
        {
          data: responseData,
          metadata: {} as TMetadataResponse,
        },
        'Material request updated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a product request (soft delete)
   */
  deleteProductRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await this.outletRequestService.deleteProductRequest(id);

      this.getSuccessResponse(
        res,
        {
          data: null,
          metadata: {} as TMetadataResponse,
        },
        'Product request deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a material request (soft delete)
   */
  deleteMaterialRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await this.outletRequestService.deleteMaterialRequest(id);

      this.getSuccessResponse(
        res,
        {
          data: null,
          metadata: {} as TMetadataResponse,
        },
        'Material request deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Approve multiple requests (products and/or materials)
   * Can also add new product/material requests during approval
   * Outlet ID is taken from the request body
   */
  approveRequests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Request body is already validated by middleware
      const { outlet_id, product_requests, material_requests, new_products, new_materials } = req.body as TApproveRequestsBody;

      // Step 1: Create new requests if provided
      let newProductRequests: TOutletProductRequest[] = [];
      let newMaterialRequests: TOutletMaterialRequest[] = [];

      if ((new_products && new_products.length > 0) || (new_materials && new_materials.length > 0)) {
        const batchResult = await this.outletRequestService.createBatchRequest({
          outletId: outlet_id,
          products: new_products?.map(item => ({
            productId: item.id,
            quantity: item.quantity,
          })) || [],
          materials: new_materials?.map(item => ({
            materialId: item.id,
            quantity: item.quantity,
          })) || [],
        });

        newProductRequests = batchResult.productRequests;
        newMaterialRequests = batchResult.materialRequests;
      }

      // Step 2: Approve existing requests
      let approvedProductRequests: TOutletProductRequest[] = [];
      let approvedMaterialRequests: TOutletMaterialRequest[] = [];

      if ((product_requests && product_requests.length > 0) || (material_requests && material_requests.length > 0)) {
        const approvalResult = await this.outletRequestService.approveRequests({
          products: product_requests?.map(item => ({
            id: item.request_id,
            approvalQuantity: item.approval_quantity,
          })) || [],
          materials: material_requests?.map(item => ({
            id: item.request_id,
            approvalQuantity: item.approval_quantity,
          })) || [],
        });

        approvedProductRequests = approvalResult.productRequests;
        approvedMaterialRequests = approvalResult.materialRequests;
      }

      // Step 3: Combine results
      const allProductRequests = [...approvedProductRequests, ...newProductRequests];
      const allMaterialRequests = [...approvedMaterialRequests, ...newMaterialRequests];

      // Map responses
      const responseData = {
        approved_product_requests: OutletProductRequestBatchResponseMapper(approvedProductRequests),
        approved_material_requests: OutletMaterialRequestBatchResponseMapper(approvedMaterialRequests),
        new_product_requests: OutletProductRequestBatchResponseMapper(newProductRequests),
        new_material_requests: OutletMaterialRequestBatchResponseMapper(newMaterialRequests),
        total_products: allProductRequests.length,
        total_materials: allMaterialRequests.length,
      };

      this.getSuccessResponse(
        res,
        {
          data: responseData,
          metadata: {} as TMetadataResponse,
        },
        'Requests processed successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reject a product request
   */
  rejectProductRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const rejectedRequest = await this.outletRequestService.rejectProductRequest(id);

      // Map response
      const responseData = OutletProductRequestResponseMapper(rejectedRequest);

      this.getSuccessResponse(
        res,
        {
          data: responseData,
          metadata: {} as TMetadataResponse,
        },
        'Product request rejected successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reject a material request
   */
  rejectMaterialRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const rejectedRequest = await this.outletRequestService.rejectMaterialRequest(id);

      // Map response
      const responseData = OutletMaterialRequestResponseMapper(rejectedRequest);

      this.getSuccessResponse(
        res,
        {
          data: responseData,
          metadata: {} as TMetadataResponse,
        },
        'Material request rejected successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get detailed outlet requests by date and outlet
   */
  getDetailedByDateAndOutlet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date, outlet_id } = req.params;
      const outletId = parseInt(outlet_id);

      if (isNaN(outletId)) {
        this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ type: 'invalid', field: 'outlet_id', message: 'Invalid outlet_id parameter' }],
          'Invalid outlet_id parameter'
        );
        return;
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ type: 'invalid', field: 'date', message: 'Invalid date format. Expected YYYY-MM-DD' }],
          'Invalid date format. Expected YYYY-MM-DD'
        );
        return;
      }

      const result = await this.outletRequestService.getDetailedByDateAndOutlet(date, outletId);
      // Map responses
      const responseData = {
        outlet_id: result.outlet_id,
        outlet_name: result.outlet_name,
        outlet_location: result.outlet_location,
        request_date: result.request_date,
        employee_name: result.employee_name,
        product_requests: OutletProductRequestBatchResponseMapper(result.product_requests),
        material_requests: OutletMaterialRequestBatchResponseMapper(result.material_requests),
      };
      // Debug logging removed for production
      this.getSuccessResponse(
        res,
        {
          data: responseData,
          metadata: {} as TMetadataResponse,
        },
        'Detailed requests retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete all requests by date for the authenticated user's outlet
   */
  deleteByDate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date } = req.params;
      
      // Get outlet_id from authenticated user
      const outletId = req.user?.outlet_id;
      
      if (!outletId) {
        this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ type: 'required', field: 'outlet_id', message: 'User is not associated with any outlet' }],
          'User is not associated with any outlet',
          403
        );
        return;
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ type: 'invalid', field: 'date', message: 'Invalid date format. Expected YYYY-MM-DD' }],
          'Invalid date format. Expected YYYY-MM-DD'
        );
        return;
      }

      const result = await this.outletRequestService.deleteByDateAndOutlet(date, outletId);

      const totalDeleted = result.deletedProductRequests + result.deletedMaterialRequests;

      const responseData = {
        date,
        outlet_id: outletId,
        deleted_product_requests: result.deletedProductRequests,
        deleted_material_requests: result.deletedMaterialRequests,
        total_deleted: totalDeleted,
      };

      this.getSuccessResponse(
        res,
        {
          data: responseData,
          metadata: {} as TMetadataResponse,
        },
        `Successfully deleted ${totalDeleted} request(s) for date ${date}`
      );
    } catch (error) {
      next(error);
    }
  };
}
