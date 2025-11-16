import { TMaterialGetResponse } from "../material/material";

export type TProductInventory = {
  id: number;
  quantity: number;
	material: TMaterialGetResponse[];
	unit_quantity: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TProductInventoryCreateRequest = {
	product_id?: number;
	product_name?: string;
  category_id: number;
  unit: string;
  quantity: number;
	materials: {
		material_id: number;
		quantity: number;
		unit: string;
	}[];
};

export type TProductInventoryUpdateRequest = {
	unit: string;
	quantity: number;
	materials: {
		material_id: number;
		quantity: number;
		unit: string;
	}[];
};

export type TProductInventoryGetResponse = {
  id: number;
	quantity: number;
	unit_quantity: string;
  material: TMaterialGetResponse[];
};