import { TProduct, TProductWithID } from "../../../core/entities/product/product";
import { ProductRepository as IProductRepository } from "../../../core/repositories/product";
import Repository from "./Repository";
import { ProductStockInEntity, ProductWithStocks } from "../../../core/entities/inventory/inventory";
import { ProductMapper } from "../../../mappers/mappers/ProductMapper";

export class ProductRepository
	extends Repository<TProduct | TProductWithID>
	implements IProductRepository
{
	constructor() {
		super("product");
		// Override with custom mapper
		this.mapper = new ProductMapper();
	}

	/**
	 * Override create to handle ProductMaster creation
	 */
	async create(item: TProduct | TProductWithID): Promise<TProduct | TProductWithID> {
		// Extract the fields that should be in ProductMaster
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const productCreate = item as any; // Type assertion for legacy interface compatibility

		let masterProduct;
		
		// Check if product_master_id is provided to link to existing master product
		if (productCreate.product_master_id) {
			// Use existing master product
			masterProduct = await this.prisma.productMaster.findUnique({
				where: { id: productCreate.product_master_id }
			});
			
			if (!masterProduct) {
				throw new Error(`Master product with ID ${productCreate.product_master_id} not found`);
			}
		} else {
			// Create new ProductMaster
			masterProduct = await this.prisma.productMaster.create({
				data: {
					name: productCreate.name,
					category_id: productCreate.categoryId,
					is_active: true,
				},
			});
		}

		// Then create Product linking to ProductMaster
		const created = await this.prisma.product.create({
			data: {
				product_master_id: masterProduct.id,
				description: productCreate.description,
				image_path: productCreate.imagePath,
				price: productCreate.price,
				hpp: productCreate.hpp, // Add HPP field
				is_active: item.isActive ?? true,
			},
			include: {
				product_master: {
					include: {
						category: true,
					},
				},
			},
		});

		return this.mapper.mapToEntity(created);
	}

	/**
	 * Override update to handle ProductMaster updates
	 */
	async update(id: string, item: Partial<TProduct | TProductWithID>): Promise<TProduct | TProductWithID> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const productUpdate = item as any; // Type assertion for legacy interface compatibility
		const numericId = parseInt(id, 10);

		// Get existing product to find product_master_id
		const existing = await this.prisma.product.findUnique({
			where: { id: numericId },
			select: { product_master_id: true },
		});

		if (!existing) {
			throw new Error(`Product with ID ${id} not found`);
		}

		// Update ProductMaster if name or categoryId is provided
		if (productUpdate.name !== undefined || productUpdate.categoryId !== undefined) {
			await this.prisma.productMaster.update({
				where: { id: existing.product_master_id },
				data: {
					...(productUpdate.name !== undefined && { name: productUpdate.name }),
					...(productUpdate.categoryId !== undefined && { category_id: productUpdate.categoryId }),
				},
			});
		}

		// Update Product
		const updated = await this.prisma.product.update({
			where: { id: numericId },
			data: {
				...(productUpdate.description !== undefined && { description: productUpdate.description }),
				...(productUpdate.imagePath !== undefined && { image_path: productUpdate.imagePath }),
				...(productUpdate.price !== undefined && { price: productUpdate.price }),
				...(productUpdate.hpp !== undefined && { hpp: productUpdate.hpp }), // Add HPP field
				...(productUpdate.isActive !== undefined && { is_active: productUpdate.isActive }),
			},
			include: {
				product_master: {
					include: {
						category: true,
					},
				},
			},
		});

		return this.mapper.mapToEntity(updated);
	}

	/**
	 * Create product stock in record (PURCHASE only)
	 */
	async createStockIn(data: ProductStockInEntity): Promise<{ id: number; date: Date }> {
		const now = new Date();
		
		// Create stock record
		const stock = await this.prisma.productStock.create({
			data: {
				product_id: data.productId,
				quantity: data.quantity,
				date: now,
				source_from: data.sourceFrom,
				detail: {
					create: {
						price: data.price,
						supplier_id: data.supplierId,
					}
				}
			},
		});

		return {
			id: stock.id,
			date: stock.date,
		};
	}

	/**
	 * Create product stock in record (PRODUCTION - no detail)
	 */
	async createStockInProduction(productId: number, quantity: number): Promise<{ id: number; date: Date }> {
		const now = new Date();
		
		// Create stock record without detail (PRODUCTION source)
		const stock = await this.prisma.productStock.create({
			data: {
				product_id: productId,
				quantity: quantity,
				date: now,
				source_from: "PRODUCTION",
			},
		});

		return {
			id: stock.id,
			date: stock.date,
		};
	}

	/**
	 * Update product stock in record
	 */
	async updateStockIn(id: number, data: Omit<ProductStockInEntity, 'sourceFrom'>): Promise<void> {
		await this.prisma.productStock.update({
			where: { id },
			data: {
				product_id: data.productId,
				quantity: data.quantity,
				detail: {
					update: {
						price: data.price,
						supplier_id: data.supplierId,
					}
				}
			},
		});
	}

	/**
	 * Delete product stock in record
	 */
	async deleteStockIn(id: number): Promise<void> {
		// Delete detail first (foreign key constraint)
		await this.prisma.productStockDetail.deleteMany({
			where: { stock_id: id },
		});
		
		// Then delete stock
		await this.prisma.productStock.delete({
			where: { id },
		});
	}

	/**
	 * Get product with all stock records
	 */
	async getProductWithStocks(productId: number): Promise<ProductWithStocks | null> {
		const product = await this.prisma.product.findUnique({
			where: { id: productId },
			include: {
				product_master: true,
				stocks: {
					include: {
						detail: true,
					},
				},
			},
		});

		if (!product) return null;

		// Map to entity - use mapper to get name and categoryId from product_master
		const mappedProduct = this.mapper.mapToEntity(product);

		return {
			id: product.id,
			name: mappedProduct.name,
			price: product.price,
			categoryId: mappedProduct.categoryId || 0,
			isActive: product.is_active,
			stocks: product.stocks.map(stock => ({
				id: stock.id,
				quantity: stock.quantity,
				date: stock.date,
				sourceFrom: stock.source_from as "PURCHASE" | "PRODUCTION",
				detail: stock.detail ? {
					price: stock.detail.price,
					supplierId: stock.detail.supplier_id,
				} : null,
			})),
		};
	}

	/**
	 * Get product purchase list (PURCHASE source only)
	 * Returns paginated list of product stocks with PURCHASE source
	 */
	async getProductPurchaseList(skip: number, take: number) {
		const [dbRecords, total] = await Promise.all([
			this.prisma.productStock.findMany({
				where: {
					source_from: "PURCHASE", // Only PURCHASE, exclude PRODUCTION
				},
				skip,
				take,
				include: {
					products: true,
					detail: {
						include: {
							supplier: true,
						},
					},
				},
				orderBy: {
					date: 'desc', // Newest first
				},
			}),
			this.prisma.productStock.count({
				where: {
					source_from: "PURCHASE",
				},
			}),
		]);

		return {
			data: dbRecords,
			total,
		};
	}

	/**
	 * Get all product stock records (for inventory calculation)
	 */
	async getAllProductStockRecords() {
		const dbRecords = await this.prisma.productStock.findMany({
			include: {
				products: {
					include: {
						product_master: {
							include: {
								category: true,
							},
						},
					},
				},
			},
			orderBy: {
				date: 'asc',
			},
		});

		// Map products to have name field from product_master
		return dbRecords.map(record => ({
			...record,
			products: {
				...record.products,
				name: record.products.product_master.name,
				categoryId: record.products.product_master.category_id,
				category: record.products.product_master.category,
			},
		}));
	}/**
 * Get product remaining stock from outlet for specific date
 * Optimized: Single aggregate query instead of recursive approach
 */
async getProductStockByOutlet(productId: number, outletId: number, date: Date): Promise<number> {
	// End of day for the given date
	const endOfDay = new Date(date);
	endOfDay.setHours(23, 59, 59, 999);

	// Single query: Get ALL stock_in up to and including this date
	const totalStockInData = await this.prisma.outletProductRequest.aggregate({
		where: {
			outlet_id: outletId,
			product_id: +productId,
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

	// Single query: Get ALL sold_stock up to and including this date
	const totalSoldData = await this.prisma.orderItem.aggregate({
		where: {
			product_id: +productId,
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

	// Calculate remaining_stock: total received - total sold
	const remainingStock = totalStockIn - totalSold;

	return remainingStock;
}

/**
 * Get detailed product with materials relation
 */
async getDetailedProduct(productId: number) {
	const product = await this.prisma.product.findUnique({
		where: { id: productId },
		include: {
			product_master: {
				include: {
					category: true,
					inventories: {
						include: {
							material: true,
						},
					},
				},
			},
		},
	});

	if (!product) return null;

	// Map to entity format
	return {
		id: product.id,
		name: product.product_master.name,
		image_path: product.image_path,
		description: product.description,
		price: product.price,
		hpp: product.hpp, // Include HPP field
		category_id: product.product_master.category_id,
		category: product.product_master.category ? {
			id: product.product_master.category.id,
			name: product.product_master.category.name,
			is_active: product.product_master.category.is_active,
			created_at: product.product_master.category.createdAt,
			updated_at: product.product_master.category.updatedAt,
		} : null,
		is_active: product.is_active,
		created_at: product.createdAt,
		updated_at: product.updatedAt,
		materials: product.product_master.inventories.map(inventory => ({
			id: inventory.material.id,
			name: inventory.material.name,
			suplier_id: inventory.material.suplier_id,
			is_active: inventory.material.is_active,
			created_at: inventory.material.createdAt.toISOString(),
			updated_at: inventory.material.updatedAt.toISOString(),
			quantity: inventory.quantity
		}))
	};
}
}
