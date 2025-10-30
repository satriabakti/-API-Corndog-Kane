import { TProduct, TProductWithID } from "../../../core/entities/product/product";
import { ProductRepository as IProductRepository } from "../../../core/repositories/product";
import Repository from "./Repository";
import { ProductStockInEntity, ProductWithStocks } from "../../../core/entities/inventory/inventory";

export class ProductRepository
	extends Repository<TProduct | TProductWithID>
	implements IProductRepository
{
	constructor() {
		super("product");
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
				stocks: {
					include: {
						detail: true,
					},
				},
			},
		});

		if (!product) return null;

		// Map to entity
		return {
			id: product.id,
			name: product.name,
			price: product.price,
			categoryId: product.category_id,
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
				products: true,
			},
			orderBy: {
				date: 'asc',
			},
		});

		return dbRecords;
	}
}


