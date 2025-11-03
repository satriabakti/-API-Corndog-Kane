import {
  TOutletProductRequest,
  TOutletMaterialRequest,
} from "../entities/outlet/request";
import Repository from "./Repository";

/**
 * OutletProductRequest Repository Interface
 */
export interface OutletProductRequestRepository extends Repository<TOutletProductRequest> {
  /**
   * Find all product requests by outlet ID
   */
  findByOutletId(outletId: number): Promise<TOutletProductRequest[]>;

  /**
   * Find product request by ID with relations
   */
  findByIdWithRelations(id: number): Promise<TOutletProductRequest | null>;

  /**
   * Find all product requests with pagination
   */
  findAllPaginated(skip: number, take: number): Promise<{ data: TOutletProductRequest[]; total: number }>;

  /**
   * Approve product request with approval quantity
   */
  approve(id: number, approvalQuantity: number): Promise<TOutletProductRequest>;

  /**
   * Reject product request
   */
  reject(id: number): Promise<TOutletProductRequest>;

  /**
   * Batch create product requests
   */
  batchCreate(requests: Array<{ outletId: number; productId: number; quantity: number }>): Promise<TOutletProductRequest[]>;
}

/**
 * OutletMaterialRequest Repository Interface
 */
export interface OutletMaterialRequestRepository extends Repository<TOutletMaterialRequest> {
  /**
   * Find all material requests by outlet ID
   */
  findByOutletId(outletId: number): Promise<TOutletMaterialRequest[]>;

  /**
   * Find material request by ID with relations
   */
  findByIdWithRelations(id: number): Promise<TOutletMaterialRequest | null>;

  /**
   * Find all material requests with pagination
   */
  findAllPaginated(skip: number, take: number): Promise<{ data: TOutletMaterialRequest[]; total: number }>;

  /**
   * Approve material request with approval quantity
   */
  approve(id: number, approvalQuantity: number): Promise<TOutletMaterialRequest>;

  /**
   * Reject material request
   */
  reject(id: number): Promise<TOutletMaterialRequest>;

  /**
   * Batch create material requests
   */
  batchCreate(requests: Array<{ outletId: number; materialId: number; quantity: number }>): Promise<TOutletMaterialRequest[]>;
}

