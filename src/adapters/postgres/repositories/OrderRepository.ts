import { TOrder, TOrderWithItems, TOrderCreate, TOrderItemCreate } from "../../../core/entities/order/order";
import { OrderRepository as IOrderRepository } from "../../../core/repositories/order";
import Repository from "./Repository";

/**
 * Helper function to map Prisma product (with product_master) to flat product object
 * This maintains backward compatibility with response mappers
 */
function mapProductFromPrisma(prismaProduct: any) {
	if (!prismaProduct) return null;
	
	return {
		...prismaProduct,
		name: prismaProduct.product_master?.name || '',
		category: prismaProduct.product_master?.category || null,
		// Remove product_master from the result to avoid confusion
		product_master: undefined,
	};
}

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

		return product?.price || 0;
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
					is_using_bag: orderData.isUsingBag as any,
					packaging_type: orderData.packagingType as any,
					is_active: true,
				},
			});

			// Create order items with nested items
			const orderItems = await Promise.all(
				items.map(async (item) => {
					// Create parent item
					const parentItem = await tx.orderItem.create({
						data: {
							order_id: order.id,
							product_id: item.productId,
							quantity: item.quantity,
							price: item.price,
							is_active: true,
						},
					});

					// Create sub items (children) if exists
					const subItemsData = [];
					if (item.subItems && item.subItems.length > 0) {
						const createdSubItems = await Promise.all(
							item.subItems.map((subItem) =>
								tx.orderItem.create({
									data: {
										order_id: order.id,
										product_id: subItem.productId,
										quantity: subItem.quantity,
										price: subItem.price,
										order_item_root_id: parentItem.id, // Link to parent
										is_active: true,
									},
								})
							)
						);
						subItemsData.push(...createdSubItems);
					}

					return { ...parentItem, sub_items: subItemsData };
				})
			);

			// ===== RECORD MATERIAL USAGE =====
			await this.recordMaterialUsage(tx, order.id, orderItems, orderData);

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
					orderItemRootId: item.order_item_root_id,
					subItems: item.sub_items?.map(subItem => ({
						id: subItem.id.toString(),
						orderId: subItem.order_id.toString(),
						productId: subItem.product_id,
						quantity: subItem.quantity,
						price: subItem.price,
						orderItemRootId: subItem.order_item_root_id,
						isActive: subItem.is_active,
						createdAt: subItem.createdAt,
						updatedAt: subItem.updatedAt,
					})),
					isActive: item.is_active,
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				})),
			};
		});

		return result;
	}

	/**
	 * Record material usage for an order
	 * Records: 1) Product inventory materials, 2) Minyak (special case), 3) Bag, 4) Packaging
	 */
	private async recordMaterialUsage(
		tx: any,
		orderId: number,
		orderItems: any[],
		orderData: TOrderCreate
	): Promise<void> {
		const materialUsageRecords: Array<{
			order_id: number;
			material_id: number;
			quantity: number;
			quantity_unit: string;
		}> = [];

		// Get all parent items (root items only)
		const parentItems = orderItems.filter(item => !item.order_item_root_id);
		
		// Track total parent quantity for bag/packaging
		const totalParentQuantity = parentItems.reduce((sum, item) => sum + item.quantity, 0);

		// Map to track materials already processed (to aggregate quantities)
		const materialMap = new Map<number, { quantity: number; unit: string }>();

		// 1. PROCESS PRODUCT INVENTORY MATERIALS (excluding minyak - handled separately)
		for (const item of parentItems) {
			const productInventories = await tx.productInventory.findMany({
				where: { 
					product_id: item.product_id 
				},
				include: {
					material: true
				}
			});

			for (const inv of productInventories) {
				const materialName = inv.material.name.toLowerCase();
				
				// Skip minyak, bag, packaging materials (handled separately)
				if (
					materialName.includes('minyak') ||
					materialName.includes('keresek') ||
					materialName.includes('kantong') ||
					materialName.includes('box') ||
					materialName.includes('kardus') ||
					materialName.includes('cup') ||
					materialName.includes('gelas')
				) {
					continue;
				}

				const materialQuantity = inv.quantity * item.quantity;
				const existing = materialMap.get(inv.material_id);
				
				if (existing) {
					existing.quantity += materialQuantity;
				} else {
					materialMap.set(inv.material_id, {
						quantity: materialQuantity,
						unit: inv.unit_quantity
					});
				}
			}
		}

		// 2. PROCESS MINYAK (SPECIAL CASE - aggregate all minyak usage into 1 record)
		let totalMinyakQuantity = 0;
		let minyakMaterialId: number | null = null;
		let minyakUnit = 'ml';

		for (const item of parentItems) {
			const productInventories = await tx.productInventory.findMany({
				where: { product_id: item.product_id },
				include: { material: true }
			});

			for (const inv of productInventories) {
				const materialName = inv.material.name.toLowerCase();
				if (materialName.includes('minyak')) {
					totalMinyakQuantity += inv.quantity * item.quantity;
					minyakMaterialId = inv.material_id;
					minyakUnit = inv.unit_quantity;
				}
			}
		}

		// Add minyak to map if used
		if (minyakMaterialId && totalMinyakQuantity > 0) {
			materialMap.set(minyakMaterialId, {
				quantity: totalMinyakQuantity,
				unit: minyakUnit
			});
		}

		// 3. PROCESS BAG (if is_using_bag is set)
		if (orderData.isUsingBag) {
			let searchPattern = '';
			if (orderData.isUsingBag === 'SMALL') {
				searchPattern = '%keresek kecil%';
			} else if (orderData.isUsingBag === 'MEDIUM') {
				searchPattern = '%keresek sedang%';
			} else if (orderData.isUsingBag === 'LARGE') {
				searchPattern = '%keresek besar%';
			}

			if (searchPattern) {
				const bagMaterial = await tx.material.findFirst({
					where: {
						OR: [
							{ name: { contains: searchPattern.replace(/%/g, ''), mode: 'insensitive' } },
							{ name: { contains: searchPattern.replace(/%/g, '').replace('keresek', 'kantong'), mode: 'insensitive' } }
						],
						is_active: true
					},
					include: {
						material_in: {
							orderBy: { received_at: 'desc' },
							take: 1
						}
					}
				});

				if (bagMaterial) {
					const bagUnit = bagMaterial.material_in[0]?.quantity_unit || 'pcs';
					materialMap.set(bagMaterial.id, {
						quantity: totalParentQuantity,
						unit: bagUnit
					});
				}
			}
		}

		// 4. PROCESS PACKAGING (if packaging_type is set and not NONE)
		if (orderData.packagingType && orderData.packagingType !== 'NONE') {
			let searchPatterns: string[] = [];
			
			if (orderData.packagingType === 'BOX') {
				searchPatterns = ['box', 'kardus'];
			} else if (orderData.packagingType === 'CUP') {
				searchPatterns = ['cup', 'gelas plastik', 'gelas'];
			}

			if (searchPatterns.length > 0) {
				const packagingMaterial = await tx.material.findFirst({
					where: {
						OR: searchPatterns.map(pattern => ({
							name: { contains: pattern, mode: 'insensitive' }
						})),
						is_active: true
					},
					include: {
						material_in: {
							orderBy: { received_at: 'desc' },
							take: 1
						}
					}
				});

				if (packagingMaterial) {
					const packUnit = packagingMaterial.material_in[0]?.quantity_unit || 'pcs';
					materialMap.set(packagingMaterial.id, {
						quantity: totalParentQuantity,
						unit: packUnit
					});
				}
			}
		}

		// Convert map to array of records
		for (const [materialId, data] of materialMap.entries()) {
			materialUsageRecords.push({
				order_id: orderId,
				material_id: materialId,
				quantity: data.quantity,
				quantity_unit: data.unit
			});
		}

		// Bulk insert all material usage records
		if (materialUsageRecords.length > 0) {
			await tx.orderMaterialUsage.createMany({
				data: materialUsageRecords
			});
		}
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
					outlet: {
						select: {
							id: true,
							name: true,
						},
					},
					items: {
						include: {
							product: {
								include: {
									product_master: { include: { category: true } },
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

		// Map products to flat structure
		const mappedOrders = orders.map(order => ({
			...order,
			items: order.items.map(item => ({
				...item,
				product: mapProductFromPrisma(item.product),
			})),
		}));

		return {
			orders: mappedOrders,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	/**
	 * Get orders by outlet with items and product details (for list)
	 */
	async getOrdersByOutlet(outletId: number, page: number = 1, limit: number = 10) {
		const skip = (page - 1) * limit;

		const [orders, total] = await Promise.all([
			this.prisma.order.findMany({
				where: { 
					is_active: true,
					outlet_id: outletId,
				},
				include: {
					outlet: true,
					employee: true,
					items: {
						where: {
							order_item_root_id: null, // Only get parent items
						},
						include: {
							product: {
								include: {
									product_master: { include: { category: true } },
								},
							},
							sub_items: {
								include: {
									product: {
										include: {
											product_master: { include: { category: true } },
										},
									},
								},
							},
						},
					},
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
			this.getModel().count({ 
				where: { 
					is_active: true,
					outlet_id: outletId,
				},
			}),
		]);

		// Map products to flat structure
		const mappedOrders = orders.map(order => ({
			...order,
			items: order.items.map(item => ({
				...item,
				product: mapProductFromPrisma(item.product),
				sub_items: item.sub_items?.map(subItem => ({
					...subItem,
					product: mapProductFromPrisma(subItem.product),
				})),
			})),
		}));

		return {
			orders: mappedOrders,
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
		const order = await this.prisma.order.findUnique({
			where: { id: orderId },
			include: {
				outlet: true,
				employee: true,
				items: {
					where: {
						order_item_root_id: null, // Only get parent items
					},
					include: {
						product: {
							include: {
								product_master: { include: { category: true } },
							},
						},
						sub_items: {
							include: {
								product: {
									include: {
										product_master: { include: { category: true } },
									},
								},
							},
						},
					},
				},
			},
		});

		if (!order) return null;

		// Map products to flat structure
		return {
			...order,
			items: order.items.map(item => ({
				...item,
				product: mapProductFromPrisma(item.product),
				sub_items: item.sub_items?.map(subItem => ({
					...subItem,
					product: mapProductFromPrisma(subItem.product),
				})),
			})),
		};
	}

	/**
	 * Get single order for WebSocket broadcast (with category for grouping)
	 */
	async getOrderForBroadcast(orderId: number) {
		const order = await this.prisma.order.findUnique({
			where: { id: orderId },
			include: {
				outlet: true,
				employee: true,
				items: {
					include: {
						product: {
							include: {
								product_master: {
									include: {
										category: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!order) return null;

		// Map products to flat structure
		return {
			...order,
			items: order.items.map(item => ({
				...item,
				product: mapProductFromPrisma(item.product),
			})),
		};
	}
}
