import {  TSupplierGetResponse, TSupplierWithID } from "../../core/entities/suplier/suplier";

export  class SupplierResponseMapper {
  /**
   * Map User entity to list response format (simplified)
   * Used in findAll endpoints
   */
  static toListResponse(supplier: TSupplierWithID): TSupplierGetResponse {
    return {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address,
      is_active: supplier.isActive ?? true,
      created_at: supplier.createdAt ?? new Date(),
      updated_at: supplier.updatedAt ?? new Date(),
    } as TSupplierGetResponse;
  }

}