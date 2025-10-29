

// model material {
//   id           Int           @id @default(autoincrement())
//   suplier_id   Int
//   suplier      suplier       @relation(fields: [suplier_id], references: [id])
//   name         String
//   is_active    Boolean       @default(true)
//   createdAt    DateTime      @default(now())
//   updatedAt    DateTime      @updatedAt
//   material_in  MaterialIn[]
//   material_out MaterialOut[]

import { TSupplier } from "./suplier";

//   @@map("materials")
// }

// model MaterialIn {
//   id            Int      @id @default(autoincrement())
//   material_id   Int
//   price         Int
//   quantity_unit String
//   quantity      Int
//   material      material @relation(fields: [material_id], references: [id])
//   received_at   DateTime @default(now())
//   createdAt     DateTime @default(now())
//   updatedAt     DateTime @updatedAt

//   @@map("material_ins")
// }

// model MaterialOut {
//   id            Int      @id @default(autoincrement())
//   material_id   Int
//   quantity_unit String
//   quantity      Int
//   material      material @relation(fields: [material_id], references: [id])
//   used_at       DateTime @default(now())
//   createdAt     DateTime @default(now())
//   updatedAt     DateTime @updatedAt

//   @@map("material_outs")
// }
export type TMaterial = {
  suplier_id: number;
  name: string;
  is_active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
export type TMaterialWithID = TMaterial & { id: number };
export type TMaterialCreate = Omit<TMaterial, 'createdAt' | 'updatedAt'>;
export type TMaterialUpdate = Partial<TMaterialCreate>; 

export type TMaterialWithSuplier = TMaterialWithID & {
  suplier: TSupplier; // Replace 'any' with the actual suplier type when available
};
export type TMaterialIn = {
  material_id: number;
  price: number;
  quantity_unit: string;
  quantity: number;
  received_at?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
export type TMaterialInWithID = TMaterialIn & { id: number };
export type TMaterialInCreate = Omit<TMaterialIn, 'createdAt' | 'updatedAt'>;
export type TMaterialInUpdate = Partial<TMaterialInCreate>; 

export type TMaterialOut = {
  material_id: number;
  quantity_unit: string;
  quantity: number;
  used_at?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
export type TMaterialOutWithID = TMaterialOut & { id: number };
export type TMaterialOutCreate = Omit<TMaterialOut, 'createdAt' | 'updatedAt'>;
export type TMaterialOutUpdate = Partial<TMaterialOutCreate>;
