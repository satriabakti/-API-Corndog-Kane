import { Response } from 'express';
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TOrderGetResponse, TOrderCreateRequest } from "../../../core/entities/order/order";
import OrderService from '../../../core/services/OrderService';
import OrderRepository from "../../../adapters/postgres/repositories/OrderRepository";
import { OrderResponseMapper } from "../../../mappers/response-mappers/OrderResponseMapper";
import Controller from "./Controller";
import { AuthRequest } from '../../../policies/authMiddleware';
import { Request } from 'express';
import { getWebSocketInstance } from '../../websocket';

export class OrderController extends Controller<TOrderGetResponse, TMetadataResponse> {
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
      const data = result.orders.map(order => 
        OrderResponseMapper.toOrderListResponse(order)
      );

      return res.status(200).json({
        data,
        metadata: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
      return res.status(500).json({
        metadata: {
          message: errorMessage,
        },
      });
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(req: Request, res: Response) {
    try {
      const orderId = parseInt(req.params.id);

      if (isNaN(orderId)) {
        return res.status(400).json({
          metadata: {
            message: 'Invalid order ID',
          },
        });
      }

      const order = await this.orderService.getOrderById(orderId);
      const data = OrderResponseMapper.toOrderDetailResponse(order);

      return res.status(200).json({
        data,
        metadata: {
          message: 'Order retrieved successfully',
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch order';
      const statusCode = error instanceof Error && error.message === 'Order not found' ? 404 : 500;
      
      return res.status(statusCode).json({
        metadata: {
          message: errorMessage,
        },
      });
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
        return res.status(400).json({
          metadata: {
            message: 'Outlet ID not found in authentication token',
          },
        });
      }

      // Validate required fields
      if (!payment_method) {
        return res.status(400).json({
          metadata: {
            message: 'payment_method is required',
          },
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          metadata: {
            message: 'items array is required and must not be empty',
          },
        });
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
      const response = OrderResponseMapper.toCreateResponse(order);
      // Fetch full order detail for WebSocket broadcast
      const fullOrder = await this.orderService.getOrderById(parseInt(order.id));
      const orderDetailForBroadcast = OrderResponseMapper.toOrderListResponse(fullOrder);

      // Emit new-order event to all connected clients
      try {
        const io = getWebSocketInstance();
        io.emit('new-order', orderDetailForBroadcast);
        console.log(`📡 WebSocket: Broadcasted new order ${fullOrder.invoice_number}`);
      } catch (wsError) {
        console.error('⚠️  WebSocket emit failed:', wsError);
        // Don't fail the request if WebSocket fails
      }

      return res.status(201).json({
        data: response,
        metadata: {
          message: 'Order created successfully',
        },
      });
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      return res.status(400).json({
        metadata: {
          message: errorMessage,
        },
      });
    }
  }
}
