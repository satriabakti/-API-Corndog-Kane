import { TOrder, TOrderWithItems, TOrderCreate, TOrderItemCreate } from "../../../core/entities/order/order";
import { OrderRepository as IOrderRepository } from "../../../core/repositories/order";
import Repository from "./Repository";

export default class OrderRepository
	extends Repository<TOrder>
	implements IOrderRepository
{
	constructor() {
		super("order");
	}

	/**
	 * Get employee assigned to outlet today
	 */
	async getEmployeeAssignedToday(outletId: number): Promise<number | null> {
		const today = new Date();
		const startOfDay = new Date(today);
		startOfDay.setHours(0, 0, 0, 0);
		
		const endOfDay = new Date(today);
		endOfDay.setHours(23, 59, 59, 999);

		const assignment = await this.prisma.outletEmployee.findFirst({
			where: {
				outlet_id: outletId,
				is_active: true,
				assigned_at: {
					gte: startOfDay,
					lte: endOfDay,
				},
			},
			orderBy: {
				assigned_at: 'desc',
			},
		});

		return assignment?.employee_id || null;
	}

	/**
	 * Get outlet location by ID
	 */
	async getOutletLocation(outletId: number): Promise<string | null> {
		const outlet = await this.prisma.outlet.findUnique({
			where: { id: outletId },
			select: { location: true },
		});

		return outlet?.location || null;
	}

	/**
	 * Get outlet code by ID
	 */
	async getOutletCode(outletId: number): Promise<string | null> {
		const outlet = await this.prisma.outlet.findUnique({
			where: { id: outletId },
			select: { code: true },
		});

		return outlet?.code || null;
	}

	/**
	 * Get next sequential order number for outlet
	 */
	async getNextOrderSequence(outletId: number): Promise<number> {
		const count = await this.getModel().count({
			where: { outlet_id: outletId },
		});

		return count + 1;
	}

	/**
	 * Get product price by ID
	 */
	async getProductPrice(productId: number): Promise<number | null> {
		const product = await this.prisma.product.findUnique({
			where: { id: productId },
			select: { price: true },
		});

		return product?.price || null;
	}

	/**
	 * Get available stock for product at outlet (ProductStock - approved outlet requests for today)
	 */
	async getAvailableStockForOutlet(productId: number, outletId: number): Promise<number> {
		const today = new Date();
		const endOfDay = new Date(today);
		endOfDay.setHours(23, 59, 59, 999);

		// Calculate total stock IN: all approved requests up to today
		const totalStockInData = await this.prisma.outletProductRequest.aggregate({
			where: {
				outlet_id: outletId,
				product_id: productId,
				status: 'APPROVED',
				createdAt: {
					lte: endOfDay,
				},
			},
			_sum: {
				approval_quantity: true,
			},
		});
		const totalStockIn = totalStockInData._sum?.approval_quantity || 0;

		// Calculate total SOLD: all order items up to today
		const totalSoldData = await this.prisma.orderItem.aggregate({
			where: {
				product_id: productId,
				order: {
					outlet_id: outletId,
					createdAt: {
						lte: endOfDay,
					},
				},
			},
			_sum: {
				quantity: true,
			},
		});
		const totalSold = totalSoldData._sum?.quantity || 0;

		// Calculate remaining stock: total received - total sold
		const remainingStock = totalStockIn - totalSold;

		return remainingStock;
	}

	/**
	 * Create order with items in a transaction
	 */
	async createOrderWithItems(
		orderData: TOrderCreate,
		items: TOrderItemCreate[]
	): Promise<TOrderWithItems> {
		const result = await this.prisma.$transaction(async (tx) => {
			// Create the order
			const order = await tx.order.create({
				data: {
					outlet_id: orderData.outletId,
					outlet_location: orderData.outletLocation,
					invoice_number: orderData.invoiceNumber,
					employee_id: orderData.employeeId,
					payment_method: orderData.paymentMethod,
					total_amount: orderData.totalAmount,
					status: orderData.status,
					is_active: true,
				},
			});

			// Create order items
			const orderItems = await Promise.all(
				items.map((item) =>
					tx.orderItem.create({
						data: {
							order_id: order.id,
							product_id: item.productId,
							quantity: item.quantity,
							price: item.price,
							is_active: true,
						},
					})
				)
			);

			// Return mapped entity with items
			return {
				id: order.id.toString(),
				outletId: order.outlet_id,
				outletLocation: order.outlet_location,
				invoiceNumber: order.invoice_number,
				employeeId: order.employee_id,
				paymentMethod: order.payment_method,
				totalAmount: order.total_amount,
				status: order.status,
				isActive: order.is_active,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt,
				items: orderItems.map(item => ({
					id: item.id.toString(),
					orderId: item.order_id.toString(),
					productId: item.product_id,
					quantity: item.quantity,
					price: item.price,
					isActive: item.is_active,
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				})),
			};
		});

		return result;
	}

	/**
	 * Get all orders with items and product details (for list)
	 */
	async getAllOrdersWithDetails(page: number = 1, limit: number = 10) {
		const skip = (page - 1) * limit;

		const [orders, total] = await Promise.all([
			this.prisma.order.findMany({
				where: { is_active: true },
				include: {
					items: {
						include: {
							product: {
								include: {
									category: true,
								},
							},
						},
					},
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
			this.getModel().count({ where: { is_active: true } }),
		]);

		return {
			orders,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	/**
	 * Get single order with full details (outlet, employee, items with products)
	 */
	async getOrderById(orderId: number) {
		return await this.prisma.order.findUnique({
			where: { id: orderId },
			include: {
				outlet: true,
				employee: true,
				items: {
					include: {
						product: {
							include: {
								category: true,
							},
						},
					},
				},
			},
		});
	}
}
