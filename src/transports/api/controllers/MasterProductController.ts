import { Request, Response } from 'express';
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TMasterProductGetResponse } from "../../../core/entities/product/masterProduct";
import { TProductInventoryGetResponse, TProductInventoryCreateRequest, TProductInventoryUpdateRequest } from "../../../core/entities/product/productInventory";
import MasterProductService from '../../../core/services/MasterProductService';
import { MasterProductRepository } from "../../../adapters/postgres/repositories/MasterProductRepository";
import Controller from "./Controller";
import { MasterProductResponseMapper } from "../../../mappers/response-mappers/MasterProductResponseMapper";
import { ProductInventoryResponseMapper } from "../../../mappers/response-mappers/ProductInventoryResponseMapper";

export class MasterProductController extends Controller<TMasterProductGetResponse | TProductInventoryGetResponse, TMetadataResponse> {
  private masterProductService: MasterProductService;

  constructor() {
    super();
    this.masterProductService = new MasterProductService(new MasterProductRepository());
  }

  getAllMasterProducts = async (req: Request, res: Response) => {
    try {
      const {category_id} = req.query;
      const masterProducts = await this.masterProductService.getAll({category_id:category_id ? parseInt(category_id as string, 10) : undefined});

      const mappedResults: TMasterProductGetResponse[] = masterProducts.map(item =>
        MasterProductResponseMapper.toResponse(item)
      );

      return this.getSuccessResponse(
        res,
        {
          data: mappedResults,
          metadata: {} as TMetadataResponse,
        },
        "Master products retrieved successfully"
      );
    } catch (error) {
      return this.handleError(
        res,
        error,
        "Failed to retrieve master products",
        500,
        [] as TMasterProductGetResponse[],
        {} as TMetadataResponse
      );
    }
  }

  getProductInventory = async (req: Request, res: Response) => {
    try {
      const masterProductId = parseInt(req.params.id, 10);
      const inventories = await this.masterProductService.getProductInventory(masterProductId);
      console.log('inven',inventories)
      const mappedResults: TProductInventoryGetResponse[] = inventories.map(item =>
        ProductInventoryResponseMapper.toResponse(item)
      );

      return this.getSuccessResponse(
        res,
        {
          data: mappedResults,
          metadata: {} as TMetadataResponse,
        },
        "Product inventory retrieved successfully"
      );
    } catch (error) {
      return this.handleError(
        res,
        error,
        "Failed to retrieve product inventory",
        500,
        [] as TProductInventoryGetResponse[],
        {} as TMetadataResponse
      );
    }
  }

  createProductInventory = async (req: Request, res: Response) => {
    try {

      const data: TProductInventoryCreateRequest = req.body;

      const inventory = await this.masterProductService.createProductInventory(data);
      console.log(inventory)
      const mappedResult = ProductInventoryResponseMapper.toResponse(inventory);

      return this.getSuccessResponse(
        res,
        {
          data: mappedResult,
          metadata: {} as TMetadataResponse,
        },
        "Product inventory created successfully"
      );
    } catch (error) {
      return this.handleError(
        res,
        error,
        "Failed to create product inventory",
        500,
        {} as TProductInventoryGetResponse,
        {} as TMetadataResponse
      );
    }
  }

  updateProductInventory = async (req: Request, res: Response) => {
    try {
      const data: TProductInventoryUpdateRequest = req.body;
      // console.log("Request body data:", data);
      const masterProductId = parseInt(req.params.id, 10);
      const inventory = await this.masterProductService.updateProductInventory(
        masterProductId,
        data
      );
      const mappedResult = ProductInventoryResponseMapper.toResponse(inventory);

      return this.getSuccessResponse(
        res,
        {
          data: mappedResult,
          metadata: {} as TMetadataResponse,
        },
        "Product inventory updated successfully"
      );
    } catch (error) {
      return this.handleError(
        res,
        error,
        "Failed to update product inventory",
        500,
        {} as TProductInventoryGetResponse,
        {} as TMetadataResponse
      );
    }
  }
}