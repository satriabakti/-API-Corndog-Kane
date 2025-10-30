import { TInventoryStockInBatchEntity, TInventoryStockInResponse } from "../../core/entities/inventory/inventory";
import { InventoryStockInResponseMapper } from "./InventoryStockInResponseMapper";

/**
 * Maps TInventoryStockInBatchEntity (camelCase) to TInventoryStockInResponse (snake_case)
 */
export class InventoryStockInBatchResponseMapper {
	static toResponse(entity: TInventoryStockInBatchEntity): TInventoryStockInResponse {
		return {
			success_count: entity.successCount,
			failed_count: entity.failedCount,
			total_count: entity.totalCount,
			items: InventoryStockInResponseMapper.toResponseArray(entity.items),
			errors: entity.errors,
		};
	}
}
