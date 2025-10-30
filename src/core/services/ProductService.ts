import { TProduct, TProductWithID, TProductStockInventory, TProductStockInRequest, TProductStockIn } from "../entities/product/product";
import { ProductRepository } from "../../adapters/postgres/repositories/ProductRepository";
import { Service } from "./Service";

export default class ProductService extends Service<TProduct | TProductWithID> {
  declare repository: ProductRepository;

  constructor(repository: ProductRepository) {
    super(repository);
  }

  /**
   * Add product stock with PRODUCTION source
   * @returns TProductStockIn entity
   */
  async addStockIn(data: TProductStockInRequest): Promise<TProductStockIn> {
    // Validate product exists
    const product = await this.repository.getById(data.product_id.toString());
    if (!product) {
      throw new Error(`Product with ID ${data.product_id} not found`);
    }

    // Create stock in record with PRODUCTION source
    const stockInRecord = await this.repository.createStockInProduction(
      data.product_id,
      data.quantity
    );

    // Get product with stocks to calculate current stock
    const productWithStocks = await this.repository.getProductWithStocks(data.product_id);
    if (!productWithStocks) {
      throw new Error("Product not found after stock in");
    }

    // Calculate current stock (all sources)
    const currentStock = productWithStocks.stocks
      .reduce((sum, stock) => sum + stock.quantity, 0);

    // Return entity (camelCase)
    return {
      id: stockInRecord.id,
      productId: data.product_id,
      productName: product.name,
      quantity: data.quantity,
      unitQuantity: data.unit_quantity,
      currentStock: currentStock,
      date: stockInRecord.date,
    };
  }

  /**
   * Get stocks inventory list
   * @returns Array of TProductStockInventory entities
   */
  async getStocksList(page: number = 1, limit: number = 10): Promise<{ data: TProductStockInventory[], total: number }> {
    // Format time as HH:MM:SS
    const formatTime = (date: Date | null): string => {
      if (!date) return "00:00:00";
      return new Date(date).toTimeString().split(' ')[0];
    };

    // Format date as YYYY-MM-DD
    const formatDate = (date: Date): string => {
      return new Date(date).toISOString().split('T')[0];
    };

    // Get all product stock records
    const productStocks = await this.repository.getAllProductStockRecords();

    // Group by product_id and date
    interface DailyStock {
      productId: number;
      productName: string;
      date: string;
      stockIn: number;
      stockOut: number;
      unitQuantity: string;
      latestInTime: Date | null;
      latestOutTime: Date | null;
      updatedAt: Date;
    }

    const dailyStocksMap = new Map<string, DailyStock>();

    // Process product stock records
    productStocks.forEach(record => {
      const date = formatDate(record.date);
      const key = `${record.product_id}_${date}`;
      
      if (!dailyStocksMap.has(key)) {
        dailyStocksMap.set(key, {
          productId: record.product_id,
          productName: record.products.name,
          date,
          stockIn: 0,
          stockOut: 0,
          unitQuantity: 'pcs', // Default unit for products
          latestInTime: null,
          latestOutTime: null,
          updatedAt: record.date,
        });
      }
      
      const dailyStock = dailyStocksMap.get(key)!;
      
      // Determine if it's stock in or out based on source
      // For now, we'll treat all as stock in since products don't have explicit stock out
      // In future, you can add logic to differentiate
      dailyStock.stockIn += record.quantity;
      dailyStock.latestInTime = record.date;
      dailyStock.updatedAt = record.date;
    });

    // Convert to array and sort by product_id and date
    const dailyStocks = Array.from(dailyStocksMap.values()).sort((a, b) => {
      if (a.productId !== b.productId) {
        return a.productId - b.productId;
      }
      return a.date.localeCompare(b.date);
    });

    // Calculate running stock for each product
    const productStocksMap = new Map<number, number>(); // productId -> running stock
    const data: TProductStockInventory[] = [];

    dailyStocks.forEach(daily => {
      const previousStock = productStocksMap.get(daily.productId) || 0;
      const currentStock = previousStock + daily.stockIn - daily.stockOut;
      
      data.push({
        id: daily.productId,
        date: daily.date,
        name: daily.productName,
        firstStockCount: previousStock, // Stock awal = stock akhir hari sebelumnya
        stockInCount: daily.stockIn,
        stockOutCount: daily.stockOut,
        currentStock: currentStock, // Stock akhir hari ini
        unitQuantity: daily.unitQuantity,
        updatedAt: daily.updatedAt,
        inTimes: formatTime(daily.latestInTime),
        outTimes: formatTime(daily.latestOutTime),
      });

      // Update running stock for this product
      productStocksMap.set(daily.productId, currentStock);
    });

    // Apply pagination
    const skip = (page - 1) * limit;
    const paginatedData = data.slice(skip, skip + limit);
    const total = data.length;

    return { data: paginatedData, total };
  }
}

