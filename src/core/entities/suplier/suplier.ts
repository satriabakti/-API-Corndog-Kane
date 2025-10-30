

import { TMaterialWithID } from "./material";

  
export type TSupplier= {
  name: string;
  phone: string;
  address?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
export type TSupplierWithID = TSupplier & { id: number };
export type TSupplierCreate = Omit<TSupplier, 'createdAt' | 'updatedAt'>;
export type TSupplierUpdate = Partial<TSupplierCreate>; 

export type TSupplierWithMaterials = TSupplierWithID & {
  materials: TMaterialWithID[]; // Replace 'any' with the actual material type when available
};


export type TSupplierGetResponse = Omit<TSupplierWithID, 'isActive' | 'createdAt' | 'updatedAt'> & {
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};
export type TSupplierCreateRequest = Omit<TSupplierCreate, 'isActive'> & {
  is_active?: boolean;
};
export type TSupplierUpdateRequest = Partial<Omit<TSupplierUpdate, 'isActive'>> & {
  is_active?: boolean;
};