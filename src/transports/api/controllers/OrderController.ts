import { Response } from 'express';
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TOrderGetResponse, TOrderCreateRequest, TOrderListResponse, TOrderDetailResponse } from "../../../core/entities/order/order";
import OrderService from '../../../core/services/OrderService';
import OrderRepository from "../../../adapters/postgres/repositories/OrderRepository";
import { OrderResponseMapper } from "../../../mappers/response-mappers/OrderResponseMapper";
import Controller from "./Controller";
import { AuthRequest } from '../../../policies/authMiddleware';
import { Request } from 'express';
import { getWebSocketInstance } from '../../websocket';

// Union type for all possible order response types (including null for error cases)
type TOrderResponseTypes = TOrderGetResponse | TOrderListResponse | TOrderDetailResponse | null;

// Extended metadata type for orders
type TOrderMetadata = TMetadataResponse | { page: number; limit: number; total: number; totalPages: number };

export class OrderController extends Controller<TOrderResponseTypes, TOrderMetadata> {
  private orderService: OrderService;

  constructor() {
    super();
    this.orderService = new OrderService(new OrderRepository());
  }

  /**
   * Get all orders with pagination
   */
  async getAllOrders(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.orderService.getAllOrders(page, limit);

      // Map each order to list response format
      const data: TOrderListResponse[] = result.orders.map(order => 
        OrderResponseMapper.toOrderListResponse(order)
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
          data,
          metadata,
        },
        'Orders retrieved successfully'
      );
    } catch (error) {
      return this.handleError(
        res,
        error,
        'Failed to fetch orders',
        500,
        [] as TOrderListResponse[],
        {
          page: 1,
          limit: 10,
          total_records: 0,
          total_pages: 0,
        } as TMetadataResponse
      );
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(req: Request, res: Response) {
    try {
      const orderId = parseInt(req.params.id);

      if (isNaN(orderId)) {
        return this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ type: 'invalid', field: 'order_id', message: 'Invalid order ID' }],
          'Invalid order ID'
        );
      }

      const order = await this.orderService.getOrderById(orderId);
      const data: TOrderDetailResponse = OrderResponseMapper.toOrderDetailResponse(order);

      return this.getSuccessResponse(
        res,
        {
          data,
          metadata: {} as TMetadataResponse,
        },
        'Order retrieved successfully'
      );
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Order not found' ? 404 : 500;
      
      return this.handleError(
        res,
        error,
        'Failed to fetch order',
        statusCode,
        null,
        {} as TMetadataResponse
      );
    }
  }

  /**
   * Create new order
   */
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const { payment_method, items } = req.body as TOrderCreateRequest;
      const outletId = req.user?.outlet_id;

      if (!outletId) {
        return this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ type: 'required', field: 'outlet_id', message: 'Outlet ID not found in authentication token' }],
          'Outlet ID not found in authentication token'
        );
      }

      // Validate required fields
      if (!payment_method) {
        return this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ type: 'required', field: 'payment_method', message: 'payment_method is required' }],
          'payment_method is required'
        );
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return this.getFailureResponse(
          res,
          { data: null, metadata: {} as TMetadataResponse },
          [{ type: 'required', field: 'items', message: 'items array is required and must not be empty' }],
          'items array is required and must not be empty'
        );
      }

      // Convert items format
      const orderItems = items.map(item => ({
        productId: item.product_id,
        qty: item.qty,
      }));

      // Create order
      const order = await this.orderService.createOrder(
        outletId,
        payment_method,
        orderItems
      );

      // Map response
      console.log(order)
      const response: TOrderGetResponse = OrderResponseMapper.toCreateResponse(order);
      // Fetch full order detail for WebSocket broadcast
      const fullOrder = await this.orderService.getOrderById(parseInt(order.id));
      const orderDetailForBroadcast: TOrderListResponse = OrderResponseMapper.toOrderListResponse(fullOrder);

      // Emit new-order event to all connected clients
      try {
        const io = getWebSocketInstance();
        io.emit('new-order', orderDetailForBroadcast);
        console.log(`📡 WebSocket: Broadcasted new order ${fullOrder.invoice_number}`);
      } catch (wsError) {
        console.error('⚠️  WebSocket emit failed:', wsError);
        // Don't fail the request if WebSocket fails
      }

      return this.getSuccessResponse(
        res,
        {
          data: response,
          metadata: {} as TMetadataResponse,
        },
        'Order created successfully'
      );
    } catch (error) {
      console.error('Error creating order:', error);
      const errMessage =
        error instanceof Error ? error.message : typeof error === 'string' ? error : 'Failed to create order';
      return this.handleError(
        res,
        error,
        errMessage,
        400,
        null,
        {} as TMetadataResponse
      );
    }
  }
}
