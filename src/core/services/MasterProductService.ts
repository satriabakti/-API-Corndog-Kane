import { TMasterProduct, TMasterProductWithID } from "../entities/product/masterProduct";
import { MasterProductRepository } from "../../adapters/postgres/repositories/MasterProductRepository";
import { Service } from "./Service";
import { TProductInventory, TProductInventoryCreateRequest, TProductInventoryUpdateRequest } from "../entities/product/productInventory";

export default class MasterProductService extends Service<TMasterProduct | TMasterProductWithID> {
  declare repository: MasterProductRepository;

  constructor(repository: MasterProductRepository) {
    super(repository);
  }

  async getAll(): Promise<TMasterProductWithID[]> {
    const result = await this.repository.getAll();
    return result.data as TMasterProductWithID[];
  }

  async getProductInventory(masterProductId: number): Promise<TProductInventory[]> {
    return await this.repository.getProductInventory(masterProductId);
  }

  async createProductInventory(data: TProductInventoryCreateRequest): Promise<TProductInventory> {
    return await this.repository.createProductInventory(data);
  }

  async updateProductInventory(
    masterProductId: number, 
    materialId: number, 
    data: TProductInventoryUpdateRequest
  ): Promise<TProductInventory> {
    return await this.repository.updateProductInventory(masterProductId, materialId, data);
  }
}