import { Request, Response } from "express";
import {ProductRepository} from "../../../adapters/postgres/repositories/ProductRepository";
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TProductGetResponse, TProductWithID, TProductInventoryGetResponse, TProductStockInResponse, TProductDetailGetResponse } from "../../../core/entities/product/product";
import ProductService from "../../../core/services/ProductService";
import MasterProductService from "../../../core/services/MasterProductService";
import {MasterProductRepository} from "../../../adapters/postgres/repositories/MasterProductRepository";
import Controller from "./Controller";
import { ProductResponseMapper } from "../../../mappers/response-mappers/ProductResponseMapper";
import { ProductStockResponseMapper } from "../../../mappers/response-mappers/ProductStockResponseMapper";
import { ProductStockInResponseMapper } from "../../../mappers/response-mappers/ProductStockInResponseMapper";
import { ProductDetailResponseMapper } from "../../../mappers/response-mappers/ProductDetailResponseMapper";

import fs from "fs";
import path from "path";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // Add file or other transports as needed
  ],
});

// Legacy interface for product create/update to maintain API compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LegacyProductInput = any;

export class ProductController extends Controller<TProductGetResponse | TProductStockInResponse | TProductInventoryGetResponse | TProductDetailGetResponse, TMetadataResponse> {
  private productService: ProductService;

  constructor() {
    super();
    this.productService = new ProductService(new ProductRepository());
  }
  createProduct = async (req: Request, res: Response) => {
    const { description, price ,master_product_id} = req.body;
    const imagePath = req.file ? req.file.filename : null;

    try {
      const newProduct = await this.productService.create({
        master_product_id,
        description,
        price: parseFloat(price),
        imagePath,
        hpp: req.body.hpp ? parseFloat(req.body.hpp) : 0,
        isActive: true,
      } as LegacyProductInput);

      return this.getSuccessResponse(
        res,
        {
          data: ProductResponseMapper.toListResponse(newProduct as TProductWithID),
          
          metadata: {} as TMetadataResponse,
        },
        "Product created successfully"
      );
    } catch (error) {
      logger.error("Error creating product:", { error });
      return this.handleError(res,
      
        error,
        "Failed to create product",
        500,
        {} as TProductGetResponse,
        {} as TMetadataResponse

      );
    }
  }
  updateProduct = async (req: Request, res: Response) => {
    const productId = req.params.id;
    const { name, description,hpp, price, category_id, is_active } = req.body;
    
    const imagePath = req.file ? req.file.filename : null;

    try {
      //remove old image if new image is uploaded
      const existingProduct = await this.productService.findById(productId);
      if(imagePath){
        if(existingProduct && existingProduct.imagePath){
          const oldImagePath = path.join(process.cwd(), 'public', 'products', existingProduct.imagePath);
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              logger.error("Error deleting old image:", { error: err });
            } else {
              console.log("Old image deleted successfully");
            }
          });
        }
      }
      const updatedProduct = await this.productService.update(productId, {
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        categoryId: category_id !== undefined ? parseInt(category_id, 10) : undefined,
        imagePath: imagePath !== null ? imagePath : existingProduct?.imagePath,
        isActive: is_active !== undefined ? Boolean(is_active) : undefined,
        hpp: hpp !== undefined ? parseFloat(hpp) : undefined,
      } as LegacyProductInput);

      return this.getSuccessResponse(
        res,
        {
          data: ProductResponseMapper.toListResponse(updatedProduct as TProductWithID),
          metadata: {} as TMetadataResponse,
        },
        "Product updated successfully"
      );
    } catch (error) {
      logger.error("Error updating product:", { error });
      return this.handleError(
        res,
        error,
        "Failed to update product",
        500,
        {} as TProductGetResponse,
        {} as TMetadataResponse
      );
    }
  }

  deleteProduct = async (req: Request, res: Response) => {
    const productId = req.params.id ;

    try {
      const existingProduct = await this.productService.findById(productId);
      if (existingProduct && existingProduct.imagePath) {
        const oldImagePath = path.join(process.cwd(), 'public', 'products', existingProduct.imagePath);
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error("Error deleting old image:", err);
          } else {
            console.log("Old image deleted successfully");
          }
        });
      }
      await this.productService.delete(productId);

      return this.getSuccessResponse(
        res,
        {
          data: {} as TProductGetResponse,
          metadata: {} as TMetadataResponse,
        },
        "Product deleted successfully"
      );
    } catch (error) {
      logger.error("Error deleting product:", { error });
      return this.handleError(
        res,
        error,
        "Failed to delete product",
        500,
        {} as TProductGetResponse,
        {} as TMetadataResponse
      );
    }
  };

  getStocksList = () => {
    return async (req: Request, res: Response) => {
      // Use validated pagination params from middleware with defaults
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      
      const { data, total } = await this.productService.getStocksList(page, limit);
      const mappedResults: TProductInventoryGetResponse[] = data.map(item => 
        ProductStockResponseMapper.toResponse(item)
      );
      
      const metadata: TMetadataResponse = {
        page,
        limit,
        total_records: total,
        total_pages: Math.ceil(total / limit),
      };
      
      return this.getSuccessResponse(
        res,
        {
          data: mappedResults,
          metadata,
        },
        "Product stocks inventory retrieved successfully"
      );
    };
  }

  addStockIn = async (req: Request, res: Response) => {
    try {
      const { product_id, master_product_id, quantity, unit_quantity, product } = req.body;

      // If master_product_id is provided but product_id doesn't exist, we may need to create or find a product
      let finalProductId = product_id;
      
      if (!finalProductId && master_product_id) {
        // Find if a product exists with the given master_product_id
        const existingProducts = await this.productService.findAll(1, 1, [], { product_master_id: master_product_id });
        if (existingProducts.data.length > 0) {
          // Use the first product found with this master_product_id
          finalProductId = (existingProducts.data[0] as any).id;
        } else if (product) {
          // If no product exists but we have product data, create a new product with the master_product_id
          const newProductData: any = {
            name: product.name,
            categoryId: product.category_id,
            description: product.description || null,
            imagePath: product.image_path || null,
            price: product.price,
            hpp: product.hpp || 0, // Include HPP field
            isActive: true,
          };
          
          const createdProduct = await this.productService.create({
            ...newProductData,
            product_master_id: master_product_id // This ensures we link to existing master product
          });
          
          finalProductId = (createdProduct as any).id;
        }
      } else if (!finalProductId && product) {
        // If no product_id or master_product_id exists but we have product data, create new master and product
        const masterProductService = new MasterProductService(new MasterProductRepository());
        const masterProduct = await masterProductService.create({
          name: product.name,
          categoryId: product.category_id,
          isActive: true,
        });
        
        const newProductData: any = {
          name: product.name,
          categoryId: product.category_id,
          description: product.description || null,
          imagePath: product.image_path || null,
          price: product.price,
          hpp: product.hpp || 0, // Include HPP field
          isActive: true,
        };
        
        const createdProduct = await this.productService.create(newProductData);
        finalProductId = (createdProduct as any).id;
      }

      if (!finalProductId) {
        return this.getFailureResponse(
          res,
          { data: {} as TProductStockInResponse, metadata: {} as TMetadataResponse },
          [{ field: 'product_id', message: "Product ID or master product ID with product data is required", type: 'invalid' }],
          "Product ID or master product ID with product data is required",
          400
        );
      }

      // Service returns entity (TProductStockIn)
      const entity = await this.productService.addStockIn({
        product_id: finalProductId,
        quantity,
        unit_quantity,
      });

      // Map entity to response using mapper
      const responseData = ProductStockInResponseMapper.toResponse(entity);

      return this.getSuccessResponse(
        res,
        {
          data: responseData,
          metadata: {} as TMetadataResponse,
        },
        "Product stock in added successfully"
      );
    } catch (error) {
      logger.error("Error adding product stock in:", { error });
      return this.handleError(
        res,
        error,
        "Failed to add product stock in",
        500,
        {} as TProductStockInResponse,
        {} as TMetadataResponse
      );
    }
  }

  getDetailedProduct = async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id, 10);

      const product = await this.productService.getDetailedProduct(productId);

      if (!product) {
        return this.getFailureResponse(
          res,
          { data: {} as TProductDetailGetResponse, metadata: {} as TMetadataResponse },
          [{ field: 'id', message: "Product not found", type: 'not_found' }],
          "Product not found",
          404
        );
      }

      const mappedResult = ProductDetailResponseMapper.toResponse(product);
      
      return this.getSuccessResponse(
        res,
        {
          data: mappedResult,
          metadata: {} as TMetadataResponse,
        },
        "Product retrieved successfully"
      );
    } catch (error) {
      logger.error("Error getting detailed product:", { error });
      return this.handleError(
        res,
        error,
        "Failed to get detailed product",
        500,
        {} as TProductDetailGetResponse,
        {} as TMetadataResponse
      );
    }
  }
}