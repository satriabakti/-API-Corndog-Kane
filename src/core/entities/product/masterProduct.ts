import { TCategoryGetResponse } from "./category";

export type TMasterProduct = {
  name: string;
  categoryId: number;
  isActive?: boolean;
  category?: TCategoryGetResponse | null;
};

export type TMasterProductWithID = TMasterProduct & {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TMasterProductCreateRequest = {
  name: string;
  category_id: number;
  is_active?: boolean;
};

export type TMasterProductUpdateRequest = {
  name?: string;
  category_id?: number;
  is_active?: boolean;
};

export type TMasterProductGetResponse = {
  id: number;
  name: string;
  category_id: number;
  category: Omit<TCategoryGetResponse, 'created_at' | 'updated_at'> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};