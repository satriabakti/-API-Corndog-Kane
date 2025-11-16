/* eslint-disable @typescript-eslint/no-explicit-any */
import { TMasterProduct, TMasterProductWithID } from "../entities/product/masterProduct";
import { MasterProductRepository } from "../../adapters/postgres/repositories/MasterProductRepository";
import { Service } from "./Service";
import { TProductInventory, TProductInventoryCreateRequest, TProductInventoryUpdateRequest } from "../entities/product/productInventory";
import { ProductRepository } from "../../adapters/postgres/repositories/ProductRepository";
import MaterialRepository from "../../adapters/postgres/repositories/MaterialRepository";

export default class MasterProductService extends Service<TMasterProduct | TMasterProductWithID> {
  declare repository: MasterProductRepository;
  private productRepository: ProductRepository;
  private materialRepository: MaterialRepository;

  constructor(repository: MasterProductRepository) {
    super(repository);
    this.materialRepository = new MaterialRepository();
    this.productRepository = new ProductRepository();
    
  }

  async getAll({category_id}: {category_id?: number}): Promise<TMasterProductWithID[]> {
    const result = await this.repository.getAll(
		undefined,
		undefined,
      undefined,
    category_id ? { category_id } : undefined,
		{ id: "asc" }
    );
    return result.data as TMasterProductWithID[];
  }

  async getProductInventory(masterProductId: number): Promise<any[]> {
    return await this.repository.getProductInventory(masterProductId);
  }

  async createProductInventory(data: TProductInventoryCreateRequest): Promise<TProductInventory> {
    let productId=data.product_id;
    if (data.product_id === undefined) {
      const pyaload: TMasterProduct = {
        name: data.product_name || "Unnamed Product",
        categoryId: data.category_id, // Default category, adjust as needed
        isActive: true,
      };
      const createdMasterProduct = await this.repository.create(pyaload);
      productId = createdMasterProduct.id;

    }
    data.product_id = productId!;
    const materials = data.materials;
    // Here you might want to create entries in a product inventory table for each material
    // associated with the master product. This depends on your database schema.
    const materialsCreaated = materials.map(async (material) => new Promise( (resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inventoryData: any = {
        product_id: productId!,
        material_id: material.material_id,
        quantity: material.quantity,
        unit_quantity: material.unit,
      };
      resolve(this.repository.createProductInventory(inventoryData));
    }));
    this.productRepository.createStockInProduction(
      productId!,
      data.quantity,
      data.unit,
    )
    await Promise.all(materials.map(async (material) => new Promise( (resolve) => {
      resolve(this.materialRepository.createStockOut({
        materialId: material.material_id,
        quantityUnit: material.unit,
        quantity: material.quantity * data.quantity,
      }));
    })));
   
    // eslint-disable-entiere-file @typescript-eslint/no-explicit-any
    return {
      id: productId!,
      quantity: data.quantity,
      unit_quantity: data.unit,
      material: (await Promise.all(materialsCreaated)).map((m:any) => (m.materials))as any[],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // return await this.repository.createProductInventory(data);
  }

  async updateProductInventory(
    masterProductId: number, 
    data: TProductInventoryUpdateRequest
  ): Promise<any> {

    const masterProduct = await this.repository.getById(masterProductId); 
    if (!masterProduct) {
      throw new Error(`Master product with ID ${masterProductId} not found`);
    }

    let materialsUpdated: any[] = (await this.repository
      .getProductInventory(masterProductId))
      .map(item =>
      ({ material_id: item.materialId, quantity: item.quantity, unit: item.unit_quantity })
    );
    
    const materials: any[]= data.materials;
    if (materials && materials.length > 0) {
       materialsUpdated = materials.map(async (material:any) => new Promise((resolve) => {
         const inventoryData: any = {
          material_id: material.material_id,
          quantity: material.quantity,
          unit_quantity: material.unit,
        };
        resolve(this.repository.updateProductInventory(masterProductId,material.material_id, inventoryData));
      }
      ));
    }
    await this.productRepository.createStockInProduction(masterProductId, data.quantity, data.unit);

    await Promise.all(
		materialsUpdated.map(
			async (material) =>
				new Promise((resolve) => {
					resolve(
						this.materialRepository.createStockOut({
							materialId: material.material_id,
							quantityUnit: material.unit,
							quantity: material.quantity * data.quantity,
						})
					);
				})
		)
    );
    return await Promise.all([...materialsUpdated]);

    // return await this.repository.updateProductInventory(masterProductId, materialId, data);
  }
}