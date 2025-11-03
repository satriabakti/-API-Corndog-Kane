import OrderRepository from "../../adapters/postgres/repositories/OrderRepository";
import { TOrder, TOrderWithItems, TOrderItemCreate } from "../entities/order/order";
import { Service } from "./Service";

export default class OrderService extends Service<TOrder> {
	declare repository: OrderRepository;

	constructor(repository: OrderRepository) {
		super(repository);
	}

	/**
	 * Create order with validation
	 */
	async createOrder(
		outletId: number,
		paymentMethod: string,
		items: { productId: number; qty: number }[]
	): Promise<TOrderWithItems> {
		// 1. Get employee assigned today
		const employeeId = await this.repository.getEmployeeAssignedToday(outletId);
		if (!employeeId) {
			throw new Error('No employee assigned to this outlet today');
		}

		// 2. Get outlet location
		const outletLocation = await this.repository.getOutletLocation(outletId);
		if (!outletLocation) {
			throw new Error('Outlet not found');
		}

		// 3. Get outlet code for invoice
		const outletCode = await this.repository.getOutletCode(outletId);
		if (!outletCode) {
			throw new Error('Outlet code not found');
		}

		// 4. Validate items and fetch prices
		const orderItems: TOrderItemCreate[] = [];
		let totalAmount = 0;

		for (const item of items) {
			// Check product exists and get price
			const price = await this.repository.getProductPrice(item.productId);
			if (price === null) {
				throw new Error(`Product with ID ${item.productId} not found`);
			}

			// Check available stock for this outlet
			const availableStock = await this.repository.getAvailableStockForOutlet(
				item.productId,
				outletId
			);

			if (item.qty > availableStock) {
				throw new Error(
					`Insufficient stock for product ${item.productId}. Available: ${availableStock}, Requested: ${item.qty}`
				);
			}

			// Add to order items
			orderItems.push({
				productId: item.productId,
				quantity: item.qty,
				price: price,
			});

			// Calculate total
			totalAmount += item.qty * price;
		}

		// 5. Generate invoice number
		const sequence = await this.repository.getNextOrderSequence(outletId);
		const paddedSequence = sequence.toString().padStart(5, '0');
		const invoiceNumber = `TR_${outletCode}_${paddedSequence}`;

		// 6. Create order with items
		const orderData = {
			outletId,
			outletLocation,
			invoiceNumber,
			employeeId,
			paymentMethod,
			totalAmount,
			status: 'SUCCESS',
		};

		return await this.repository.createOrderWithItems(orderData, orderItems);
	}

	/**
	 * Get all orders with pagination
	 */
	async getAllOrders(page: number = 1, limit: number = 10) {
		return await this.repository.getAllOrdersWithDetails(page, limit);
	}

	/**
	 * Get order by ID
	 */
	async getOrderById(orderId: number) {
		const order = await this.repository.getOrderById(orderId);
		if (!order) {
			throw new Error('Order not found');
		}
		return order;
	}
}
