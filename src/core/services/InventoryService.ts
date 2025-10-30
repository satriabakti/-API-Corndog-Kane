import { 
	TInventoryStockInRequest,
	TInventoryStockInItem,
	TInventoryStockInBatchEntity,
	TInventoryStockInEntity,
	TInventoryStockInUpdateRequest,
	TInventoryBuyListItemEntity,
	ItemType
} from "../entities/inventory/inventory";
import MaterialRepository from "../../adapters/postgres/repositories/MaterialRepository";
import { ProductRepository } from "../../adapters/postgres/repositories/ProductRepository";
import SupplierRepository from "../../adapters/postgres/repositories/SupplierRepository";
import { Service } from "./Service";
import { TMaterial, TMaterialWithID } from "../entities/material/material";
import { TSupplierWithID } from "../entities/suplier/suplier";

/**
 * InventoryService
 * Handles unified stock in operations for both Material and Product
 * Routes requests to appropriate repository based on item_type
 */
export default class InventoryService extends Service<TMaterial | TMaterialWithID> {
	private materialRepository: MaterialRepository;
	private productRepository: ProductRepository;
	private supplierRepository: SupplierRepository;

	constructor(
		materialRepository: MaterialRepository,
		productRepository: ProductRepository,
		supplierRepository: SupplierRepository
	) {
		// Use material repository as base (not actually used)
		super(materialRepository);
		this.materialRepository = materialRepository;
		this.productRepository = productRepository;
		this.supplierRepository = supplierRepository;
	}

	/**
	 * Main stock in handler (batch processing)
	 * Processes multiple items and returns batch entity
	 * @returns TInventoryStockInBatchEntity
	 */
	async stockIn(data: TInventoryStockInRequest): Promise<TInventoryStockInBatchEntity> {
		const results: TInventoryStockInEntity[] = [];
		const errors: Array<{ index: number; item: TInventoryStockInItem; error: string }> = [];

		// Process each item
		for (let i = 0; i < data.items.length; i++) {
			const item = data.items[i];
			
			try {
				const result = await this.processStockInItem(item);
				results.push(result);
			} catch (error) {
				// Capture error but continue processing other items
				errors.push({
					index: i,
					item,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		// Return batch entity (camelCase)
		return {
			successCount: results.length,
			failedCount: errors.length,
			totalCount: data.items.length,
			items: results,
			...(errors.length > 0 && { errors }),
		};
	}

	/**
	 * Process single stock in item
	 * @returns TInventoryStockInEntity
	 */
	private async processStockInItem(data: TInventoryStockInItem): Promise<TInventoryStockInEntity> {
		// Validate supplier exists
		const supplierRecord = await this.supplierRepository.getById(data.supplier_id.toString());
		if (!supplierRecord) {
			throw new Error(`Supplier with ID ${data.supplier_id} not found`);
		}
		
		// Extract supplier info (handle both TSupplier and TSupplierWithID)
		const supplier = {
			id: (supplierRecord as TSupplierWithID).id || data.supplier_id,
			name: supplierRecord.name
		};

		// Route based on item type
		if (data.item_type === ItemType.MATERIAL) {
			return await this.handleMaterialStockIn(data as Extract<TInventoryStockInItem, { item_type: "MATERIAL" }>, supplier);
		} else if (data.item_type === ItemType.PRODUCT) {
			return await this.handleProductStockIn(data as Extract<TInventoryStockInItem, { item_type: "PRODUCT" }>, supplier);
		}
		
		// TypeScript exhaustiveness check
		const _exhaustiveCheck: never = data;
		throw new Error(`Invalid item_type: ${(_exhaustiveCheck as { item_type: string }).item_type}`);
	}

	/**
	 * Handle Material stock in
	 */
	private async handleMaterialStockIn(
		data: Extract<TInventoryStockInItem, { item_type: "MATERIAL" }>,
		supplier: { id: number; name: string }
	): Promise<TInventoryStockInEntity> {
		let materialId: number;

		// Create new material if needed
		if (data.material && !data.material_id) {
			const newMaterial = await this.materialRepository.createMaterial({
				name: data.material.name,
				suplierId: data.supplier_id,
				isActive: data.material.is_active ?? true,
			});
			materialId = newMaterial.id;
		} else if (data.material_id) {
			materialId = data.material_id;
		} else {
			throw new Error("Either material_id or material must be provided");
		}

		// Create stock in record
		const stockInRecord = await this.materialRepository.createStockIn({
			materialId,
			quantity: data.quantity,
			price: data.price,
			quantityUnit: data.unit_quantity,
		});

		// Get material with stocks to calculate current stock
		const material = await this.materialRepository.getMaterialWithStocks(materialId);
		if (!material) {
			throw new Error("Material not found after creation");
		}

		// Calculate current stock
		const totalStockIn = material.materialIn.reduce((sum, item) => sum + item.quantity, 0);
		const totalStockOut = material.materialOut.reduce((sum, item) => sum + item.quantity, 0);
		const currentStock = totalStockIn - totalStockOut;

		// Return entity with camelCase
		return {
			id: stockInRecord.id,
			itemType: ItemType.MATERIAL,
			itemName: material.name,
			quantity: data.quantity,
			unitQuantity: data.unit_quantity,
			price: data.price, // Total price (not per unit)
			supplier: {
				id: supplier.id,
				name: supplier.name,
			},
			currentStock: currentStock,
			createdAt: stockInRecord.createdAt,
		};
	}

	/**
	 * Handle Product stock in (PURCHASE only)
	 */
	private async handleProductStockIn(
		data: Extract<TInventoryStockInItem, { item_type: "PRODUCT" }>,
		supplier: { id: number; name: string }
	): Promise<TInventoryStockInEntity> {
		// Validate product exists
		const product = await this.productRepository.getById(data.product_id.toString());
		if (!product) {
			throw new Error(`Product with ID ${data.product_id} not found`);
		}

		// Create product stock in with PURCHASE source
		const stockInRecord = await this.productRepository.createStockIn({
			productId: data.product_id,
			quantity: data.quantity,
			price: data.price,
			supplierId: data.supplier_id,
			sourceFrom: "PURCHASE",
		});

		// Get product with stocks to calculate current stock
		const productWithStocks = await this.productRepository.getProductWithStocks(data.product_id);
		if (!productWithStocks) {
			throw new Error("Product not found after stock in");
		}

		// Calculate current stock (only from PURCHASE source)
		type StockItem = { sourceFrom: "PURCHASE" | "PRODUCTION"; quantity: number };
		const currentStock = productWithStocks.stocks
			.filter((stock: StockItem) => stock.sourceFrom === "PURCHASE")
			.reduce((sum: number, stock: StockItem) => sum + stock.quantity, 0);

		// Return entity with camelCase
		return {
			id: stockInRecord.id,
			itemType: ItemType.PRODUCT,
			itemName: product.name,
			quantity: data.quantity,
			unitQuantity: data.unit_quantity,
			price: data.price, // Total price (not per unit)
			supplier: {
				id: supplier.id,
				name: supplier.name,
			},
			currentStock: currentStock,
			createdAt: stockInRecord.date,
		};
	}

	/**
	 * Get unified buy list (Material purchases + Product PURCHASE)
	 * Combines data from material_in and product_stocs (PURCHASE only)
	 * 
	 * Strategy: Fetch ALL data, combine, sort, then paginate
	 * For very large datasets, consider using database-level UNION query
	 */
	async getBuyList(page = 1, limit = 10): Promise<{ data: TInventoryBuyListItemEntity[], total: number }> {
		// Calculate skip for final pagination
		const skip = (page - 1) * limit;

		// Fetch ALL data from both sources in parallel
		// We need all data to properly combine and sort before paginating
		const [materialData, productData] = await Promise.all([
			this.materialRepository.getMaterialInList(0, Number.MAX_SAFE_INTEGER),
			this.productRepository.getProductPurchaseList(0, Number.MAX_SAFE_INTEGER),
		]);

		// Combine and map to unified entity format (camelCase)
		const combinedItems: TInventoryBuyListItemEntity[] = [];

		// Map Material purchases
		for (const materialIn of materialData.data) {
			combinedItems.push({
				id: materialIn.id,
				itemType: ItemType.MATERIAL,
				itemId: materialIn.materialId,
				itemName: materialIn.material.name,
				quantity: materialIn.quantity,
				unitQuantity: materialIn.quantityUnit,
				price: materialIn.price, // Total price (not per unit)
				supplier: {
					id: materialIn.material.suplier?.id || 0,
					name: materialIn.material.suplier?.name || "Unknown",
				},
				purchasedAt: materialIn.receivedAt,
			});
		}

		// Map Product PURCHASE records
		for (const productStock of productData.data) {
			if (productStock.detail && productStock.detail.supplier) {
				combinedItems.push({
					id: productStock.id,
					itemType: ItemType.PRODUCT,
					itemId: productStock.product_id,
					itemName: productStock.products.name,
					quantity: productStock.quantity,
					unitQuantity: "pcs", // Default unit for products
					price: productStock.detail.price, // Total price (not per unit)
					supplier: {
						id: productStock.detail.supplier.id,
						name: productStock.detail.supplier.name,
					},
					purchasedAt: productStock.date,
				});
			}
		}

		// Sort combined results by purchasedAt (newest first)
		combinedItems.sort((a, b) => 
			b.purchasedAt.getTime() - a.purchasedAt.getTime()
		);

		// Get total count
		const total = combinedItems.length;

		// Apply pagination to combined and sorted results
		const paginatedItems = combinedItems.slice(skip, skip + limit);

		return {
			data: paginatedItems,
			total,
		};
	}

	/**
	 * Update stock in record
	 * If item_type changes: delete old record + create new record
	 * If item_type same: update existing record
	 */
	async updateStockIn(
		pathItemType: "MATERIAL" | "PRODUCT",
		id: number,
		data: TInventoryStockInUpdateRequest
	): Promise<TInventoryStockInEntity> {
		// Case 1: item_type berubah (MATERIAL -> PRODUCT atau sebaliknya)
		if (pathItemType !== data.item_type) {
			// Delete old record
			if (pathItemType === ItemType.MATERIAL) {
				await this.materialRepository.deleteStockIn(id);
			} else {
				await this.productRepository.deleteStockIn(id);
			}

			// Create new record with new item_type
			const newRecord = await this.processStockInItem(data);
			
			// Return the new record (same format as POST)
			return newRecord;
		}

		// Case 2: item_type sama - update existing record
		if (data.item_type === ItemType.MATERIAL) {
			return await this.updateMaterialStockIn(id, data as Extract<TInventoryStockInUpdateRequest, { item_type: "MATERIAL" }>);
		} else {
			return await this.updateProductStockIn(id, data as Extract<TInventoryStockInUpdateRequest, { item_type: "PRODUCT" }>);
		}
	}

	/**
	 * Update Material stock in record
	 */
	private async updateMaterialStockIn(
		id: number,
		data: Extract<TInventoryStockInUpdateRequest, { item_type: "MATERIAL" }>
	): Promise<TInventoryStockInEntity> {
		let materialId: number;

		// Handle material creation if needed
		if (data.material && !data.material_id) {
			const newMaterial = await this.materialRepository.createMaterial({
				name: data.material.name,
				suplierId: data.supplier_id,
				isActive: data.material.is_active ?? true,
			});
			materialId = newMaterial.id;
		} else if (data.material_id) {
			materialId = data.material_id;
		} else {
			throw new Error("Either material_id or material must be provided");
		}

		// Update stock in record
		await this.materialRepository.updateStockIn(id, {
			materialId,
			quantity: data.quantity,
			price: data.price,
			quantityUnit: data.unit_quantity,
		});

		// Get supplier info
		const supplierRecord = await this.supplierRepository.getById(data.supplier_id.toString());
		if (!supplierRecord) {
			throw new Error(`Supplier with ID ${data.supplier_id} not found`);
		}

		const supplier = {
			id: (supplierRecord as { id: number }).id || data.supplier_id,
			name: supplierRecord.name
		};

		// Get material with stocks to calculate current stock
		const material = await this.materialRepository.getMaterialWithStocks(materialId);
		if (!material) {
			throw new Error("Material not found after update");
		}

		// Get the updated record
		const updatedRecord = material.materialIn.find(item => item.id === id);
		if (!updatedRecord) {
			throw new Error("Updated record not found");
		}

		// Calculate current stock
		const totalStockIn = material.materialIn.reduce((sum, item) => sum + item.quantity, 0);
		const totalStockOut = material.materialOut.reduce((sum, item) => sum + item.quantity, 0);
		const currentStock = totalStockIn - totalStockOut;

		// Return entity (camelCase)
		return {
			id: id,
			itemType: ItemType.MATERIAL,
			itemName: material.name,
			quantity: data.quantity,
			unitQuantity: data.unit_quantity,
			price: data.price,
			supplier: {
				id: supplier.id,
				name: supplier.name,
			},
			currentStock: currentStock,
			createdAt: updatedRecord.createdAt,
		};
	}

	/**
	 * Update Product stock in record
	 */
	private async updateProductStockIn(
		id: number,
		data: Extract<TInventoryStockInUpdateRequest, { item_type: "PRODUCT" }>
	): Promise<TInventoryStockInEntity> {
		// Validate product exists
		const product = await this.productRepository.getById(data.product_id.toString());
		if (!product) {
			throw new Error(`Product with ID ${data.product_id} not found`);
		}

		// Update stock in record
		await this.productRepository.updateStockIn(id, {
			productId: data.product_id,
			quantity: data.quantity,
			price: data.price,
			supplierId: data.supplier_id,
		});

		// Get supplier info
		const supplierRecord = await this.supplierRepository.getById(data.supplier_id.toString());
		if (!supplierRecord) {
			throw new Error(`Supplier with ID ${data.supplier_id} not found`);
		}

		const supplier = {
			id: (supplierRecord as { id: number }).id || data.supplier_id,
			name: supplierRecord.name
		};

		// Get product with stocks to calculate current stock
		const productWithStocks = await this.productRepository.getProductWithStocks(data.product_id);
		if (!productWithStocks) {
			throw new Error("Product not found after update");
		}

		// Find the updated record
		const updatedRecord = productWithStocks.stocks.find(stock => stock.id === id);
		if (!updatedRecord) {
			throw new Error("Updated record not found");
		}

		// Calculate current stock (only from PURCHASE source)
		type StockItem = { sourceFrom: "PURCHASE" | "PRODUCTION"; quantity: number };
		const currentStock = productWithStocks.stocks
			.filter((stock: StockItem) => stock.sourceFrom === "PURCHASE")
			.reduce((sum: number, stock: StockItem) => sum + stock.quantity, 0);

		// Return entity (camelCase)
		return {
			id: id,
			itemType: ItemType.PRODUCT,
			itemName: product.name,
			quantity: data.quantity,
			unitQuantity: data.unit_quantity,
			price: data.price,
			supplier: {
				id: supplier.id,
				name: supplier.name,
			},
			currentStock: currentStock,
			createdAt: updatedRecord.date,
		};
	}
}
