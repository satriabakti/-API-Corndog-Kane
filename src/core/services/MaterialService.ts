import MaterialRepository from "../../adapters/postgres/repositories/MaterialRepository";
import { 
	TMaterial, 
	TMaterialWithID, 
	TMaterialStockInCreateRequest,
	TMaterialStockOutCreateRequest,
	TMaterialStockInventory,
	PaginatedMaterialStockIn
} from "../entities/material/material";
import { Service } from "./Service";

export default class MaterialService extends Service<TMaterial | TMaterialWithID> {
	declare repository: MaterialRepository;

	constructor(repository: MaterialRepository) {
		super(repository);
	}

	/**
	 * Stock in material
	 * @returns TMaterialStockInventory entity
	 */
	async stockIn(data: TMaterialStockInCreateRequest): Promise<TMaterialStockInventory> {
		// Ensure material_id is provided
		if (!data.material_id) {
			throw new Error("Material ID is required");
		}

		// Create stock in record through repository
		const stockInRecord = await this.repository.createStockIn({
			materialId: data.material_id,
			quantity: data.quantity,
			price: data.price || 0,
			quantityUnit: data.unit_quantity,
		});

		// Get material with stocks through repository (already mapped by EntityMapper)
		const material = await this.repository.getMaterialWithStocks(data.material_id);

		if (!material) {
			throw new Error("Material not found");
		}

		// Data dari repository sudah dalam format camelCase (mapped by EntityMapper)
		const totalStockIn = material.materialIn.reduce((sum: number, item) => sum + item.quantity, 0);
		const totalStockOut = material.materialOut.reduce((sum: number, item) => sum + item.quantity, 0);
		const currentStock = totalStockIn - totalStockOut;

		// Get latest stock in and out times
		const latestStockIn = material.materialIn.length > 0 
			? material.materialIn[material.materialIn.length - 1].createdAt 
			: null;
		const latestStockOut = material.materialOut.length > 0 
			? material.materialOut[material.materialOut.length - 1].createdAt 
			: null;

		// Format time as HH:MM:SS
		const formatTime = (date: Date | null): string => {
			if (!date) return "00:00:00";
			return new Date(date).toTimeString().split(' ')[0];
		};

		// Format date as YYYY-MM-DD
		const formatDate = (date: Date): string => {
			return new Date(date).toISOString().split('T')[0];
		};

		return {
			id: material.id,
			date: formatDate(new Date()), // Today's date
			name: material.name,
			firstStockCount: material.materialIn[0]?.quantity || 0,
			stockInCount: totalStockIn,
			stockOutCount: totalStockOut,
			currentStock: currentStock,
			unitQuantity: stockInRecord.quantityUnit,
			updatedAt: material.updatedAt,
			outTimes: formatTime(latestStockOut),
			inTimes: formatTime(latestStockIn),
		};
	}

	/**
	 * Stock out material
	 * @returns TMaterialStockInventory entity
	 */
	async stockOut(data: TMaterialStockOutCreateRequest): Promise<TMaterialStockInventory> {
		// Create stock out record through repository
		await this.repository.createStockOut({
			materialId: data.material_id,
			quantity: data.quantity,
			quantityUnit: "pcs",
		});

		// Get material with stocks through repository (already mapped by EntityMapper)
		const material = await this.repository.getMaterialWithStocks(data.material_id);

		if (!material) {
			throw new Error("Material not found");
		}

		// Data dari repository sudah dalam format camelCase (mapped by EntityMapper)
		const totalStockIn = material.materialIn.reduce((sum: number, item) => sum + item.quantity, 0);
		const totalStockOut = material.materialOut.reduce((sum: number, item) => sum + item.quantity, 0);
		const currentStock = totalStockIn - totalStockOut;

		// Get latest stock in and out times
		const latestStockIn = material.materialIn.length > 0 
			? material.materialIn[material.materialIn.length - 1].createdAt 
			: null;
		const latestStockOut = material.materialOut.length > 0 
			? material.materialOut[material.materialOut.length - 1].createdAt 
			: null;

		// Format time as HH:MM:SS
		const formatTime = (date: Date | null): string => {
			if (!date) return "00:00:00";
			return new Date(date).toTimeString().split(' ')[0];
		};

		// Format date as YYYY-MM-DD
		const formatDate = (date: Date): string => {
			return new Date(date).toISOString().split('T')[0];
		};

		return {
			id: material.id,
			date: formatDate(new Date()), // Today's date
			name: material.name,
			firstStockCount: material.materialIn[0]?.quantity || 0,
			stockInCount: totalStockIn,
			stockOutCount: totalStockOut,
			currentStock: currentStock,
			unitQuantity: material.materialIn[0]?.quantityUnit || "pcs",
			updatedAt: material.updatedAt,
			outTimes: formatTime(latestStockOut),
			inTimes: formatTime(latestStockIn),
		};
	}

	async getBuyList(page = 1, limit = 10): Promise<PaginatedMaterialStockIn> {
		const skip = (page - 1) * limit;
		return await this.repository.getMaterialInList(skip, limit);
	}

	/**
	 * Get stocks inventory list
	 * @returns Array of TMaterialStockInventory entities
	 */
	async getStocksList(page: number = 1, limit: number = 10): Promise<{ data: TMaterialStockInventory[], total: number }> {
		// Format time as HH:MM:SS
		const formatTime = (date: Date | null): string => {
			if (!date) return "00:00:00";
			return new Date(date).toTimeString().split(' ')[0];
		};

		// Format date as YYYY-MM-DD
		const formatDate = (date: Date): string => {
			return new Date(date).toISOString().split('T')[0];
		};

		// Get all material in and out records through repository
		// Data sudah ter-mapped dalam format camelCase oleh EntityMapper
		const [materialIns, materialOuts] = await Promise.all([
			this.repository.getAllMaterialInRecords(),
			this.repository.getAllMaterialOutRecords(),
		]);

		// Group by material_id and date
		interface DailyStock {
			materialId: number;
			materialName: string;
			date: string;
			stockIn: number;
			stockOut: number;
			unitQuantity: string;
			latestInTime: Date | null;
			latestOutTime: Date | null;
			updatedAt: Date;
		}

		const dailyStocksMap = new Map<string, DailyStock>();

		// Process material in records (data sudah dalam camelCase dari mapper)
		materialIns.forEach(record => {
			const date = formatDate(record.createdAt);
			const key = `${record.materialId}_${date}`;
			
			if (!dailyStocksMap.has(key)) {
				dailyStocksMap.set(key, {
					materialId: record.materialId,
					materialName: record.material.name,
					date,
					stockIn: 0,
					stockOut: 0,
					unitQuantity: record.quantityUnit,
					latestInTime: null,
					latestOutTime: null,
					updatedAt: record.createdAt,
				});
			}
			
			const dailyStock = dailyStocksMap.get(key)!;
			dailyStock.stockIn += record.quantity;
			dailyStock.latestInTime = record.createdAt;
			dailyStock.updatedAt = record.createdAt;
		});

		// Process material out records (data sudah dalam camelCase dari mapper)
		materialOuts.forEach(record => {
			const date = formatDate(record.createdAt);
			const key = `${record.materialId}_${date}`;
			
			if (!dailyStocksMap.has(key)) {
				// If no stock in on this date, we still need to create entry
				dailyStocksMap.set(key, {
					materialId: record.materialId,
					materialName: '', // Will be filled later
					date,
					stockIn: 0,
					stockOut: 0,
					unitQuantity: record.quantityUnit,
					latestInTime: null,
					latestOutTime: null,
					updatedAt: record.createdAt,
				});
			}
			
			const dailyStock = dailyStocksMap.get(key)!;
			dailyStock.stockOut += record.quantity;
			dailyStock.latestOutTime = record.createdAt;
			if (record.createdAt > dailyStock.updatedAt) {
				dailyStock.updatedAt = record.createdAt;
			}
		});

		// Convert to array and sort by material_id and date
		const dailyStocks = Array.from(dailyStocksMap.values()).sort((a, b) => {
			if (a.materialId !== b.materialId) {
				return a.materialId - b.materialId;
			}
			return a.date.localeCompare(b.date);
		});

		// Calculate running stock for each material
		const materialStocksMap = new Map<number, number>(); // materialId -> running stock
		const data: TMaterialStockInventory[] = [];

		dailyStocks.forEach(daily => {
			const previousStock = materialStocksMap.get(daily.materialId) || 0;
			const currentStock = previousStock + daily.stockIn - daily.stockOut;
			
			data.push({
				id: daily.materialId,
				date: daily.date,
				name: daily.materialName,
				firstStockCount: previousStock, // Stock awal = stock akhir hari sebelumnya
				stockInCount: daily.stockIn,
				stockOutCount: daily.stockOut,
				currentStock: currentStock, // Stock akhir hari ini
				unitQuantity: daily.unitQuantity,
				updatedAt: daily.updatedAt,
				inTimes: formatTime(daily.latestInTime),
				outTimes: formatTime(daily.latestOutTime),
			});

			// Update running stock for this material
			materialStocksMap.set(daily.materialId, currentStock);
		});

		// Apply pagination
		const skip = (page - 1) * limit;
		const paginatedData = data.slice(skip, skip + limit);
		const total = data.length;

		return { data: paginatedData, total };
	}
}
