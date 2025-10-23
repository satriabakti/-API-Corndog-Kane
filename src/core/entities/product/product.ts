
import {  TCategoryGetResponse } from "./category";

export type TProduct = {
  name: string;
  imagePath?: string | null;
  description?: string | null;
  price: number;
  categoryId?: number;
  category?: {
    id: number;
    name: string;
    isActive: boolean;
  };
  isActive: boolean;
}
export type TProductWithID = TProduct & {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};
export type TProductCreate = Omit<TProduct, 'isActive' | 'category' > & {
  isActive?: boolean;
  categoryId: number;
};

export type TProductCreateRequest = Omit<TProductCreate, "isActive" | "imagePath" | "description"> & {
  is_active?: boolean;
  image_path?: string;
  description?: string;
};
export type TProductUpdateRequest = Omit<TProductCreateRequest, "name" | "price" | "categoryId"> & {
  name?: string;
  price?: number;
  category_id?: number;
};
export type TProductGetResponse = {
  id: number;
  name: string;
  image_path?: string | null;
  description?: string | null;
  price: number;
  category: Omit<TCategoryGetResponse, 'created_at' | 'updated_at'>  | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

