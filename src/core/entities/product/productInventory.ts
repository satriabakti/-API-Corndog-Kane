import { TMaterialGetResponse } from "../material/material";

export type TProductInventory = {
  id: number;
  productId: number;
  quantity: number;
  materialId: number;
  material: TMaterialGetResponse;
  createdAt: Date;
  updatedAt: Date;
};

export type TProductInventoryCreateRequest = {
  product_id: number;
  quantity: number;
  material_id: number;
};

export type TProductInventoryUpdateRequest = {
  quantity?: number;
  material_id?: number;
};

export type TProductInventoryGetResponse = {
  id: number;
  product_id: number;
  quantity: number;
  material_id: number;
  material: TMaterialGetResponse;
  created_at: string;
  updated_at: string;
};