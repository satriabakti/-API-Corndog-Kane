import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

export const ProductCategoryMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: "id", entityField: "id" },
    { dbField: "name", entityField: "name" },
    { dbField: "is_active", entityField: "isActive" },
    { dbField: "createdAt", entityField: "createdAt" },
    { dbField: "updatedAt", entityField: "updatedAt" },
  ],
  relations: [
    {
      dbField: "products",
      entityField: "products",
      mapper: (rel) => {
        const products = rel as Array<{
          id: number;
          name: string;
          image_path?: string | null;
          description?: string | null;
          price: number;
          is_active: boolean;
          createdAt: Date;
          updatedAt: Date;
        }>;
        return products.map((product) => ({
          id: product.id,
          name: product.name,
          imagePath: product.image_path ?? null,
          description: product.description ?? null,
          price: product.price,
          isActive: product.is_active,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        }));
      } ,
      isArray: true,

    }
  ],
};

