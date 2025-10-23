import { Request, Response } from "express";
import {ProductRepository} from "../../../adapters/postgres/repositories/ProductRepository";
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TProductGetResponse, TProductWithID } from "../../../core/entities/product/product";
import ProductService from "../../../core/services/ProductService";
import Controller from "./Controller";
import { ProductResponseMapper } from "../../../mappers/response-mappers/ProductResponseMapper";

import fs from "fs";
import path from "path";

export class ProductController extends Controller<TProductGetResponse, TMetadataResponse> {
  private productService: ProductService;

  constructor() {
    super();
    this.productService = new ProductService(new ProductRepository());
  }
  createProduct = async (req: Request, res: Response) => {
    const { name, description, price, category_id } = req.body;
    const imagePath = req.file ? req.file.filename : null;

    try {
      const newProduct = await this.productService.create({
        name,
        description,
        price: parseFloat(price),
        categoryId: parseInt(category_id, 10),
        imagePath,
        isActive: true,
      });

      return this.getSuccessResponse(
        res,
        {
          data: ProductResponseMapper.toListResponse(newProduct as TProductWithID),
          
          metadata: {} as TMetadataResponse,
        },
        "Product created successfully"
      );
    } catch (error) {
      console.error("Error creating product:", error);
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
    const { name, description, price, category_id, is_active } = req.body;
    
    const imagePath = req.file ? req.file.filename : null;

    try {
      //remove old image if new image is uploaded
      if(imagePath){
        const existingProduct = await this.productService.findById(productId);
        if(existingProduct && existingProduct.imagePath){
          const oldImagePath = path.join(process.cwd(), 'public', 'products', existingProduct.imagePath);
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error("Error deleting old image:", err);
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
        imagePath,
        isActive: is_active !== undefined ? Boolean(is_active) : undefined,
      });

      return this.getSuccessResponse(
        res,
        {
          data: ProductResponseMapper.toListResponse(updatedProduct as TProductWithID),
          metadata: {} as TMetadataResponse,
        },
        "Product updated successfully"
      );
    } catch (error) {
      console.error("Error updating product:", error);
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
      console.error("Error deleting product:", error);
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

}