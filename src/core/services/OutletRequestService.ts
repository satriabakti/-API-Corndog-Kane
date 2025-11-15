import { OutletProductRequestRepository } from "../../adapters/postgres/repositories/OutletProductRequestRepository";
import { OutletMaterialRequestRepository } from "../../adapters/postgres/repositories/OutletMaterialRequestRepository";
import {
  TOutletProductRequest,
  TOutletMaterialRequest,
  TOutletRequestBatchCreate,
  TOutletRequestApproval,
  OUTLETREQUESTSTATUS,
} from "../entities/outlet/request";

export class OutletRequestService {
  private productRequestRepo: OutletProductRequestRepository;
  private materialRequestRepo: OutletMaterialRequestRepository;

  constructor(
    productRequestRepo: OutletProductRequestRepository,
    materialRequestRepo: OutletMaterialRequestRepository
  ) {
    this.productRequestRepo = productRequestRepo;
    this.materialRequestRepo = materialRequestRepo;
  }

  /**
   * Create batch outlet requests (products and/or materials)
   */
  async createBatchRequest(data: TOutletRequestBatchCreate): Promise<{
    productRequests: TOutletProductRequest[];
    materialRequests: TOutletMaterialRequest[];
  }> {
    // Validate: at least one product or material must be provided
    if ((!data.products || data.products.length === 0) && (!data.materials || data.materials.length === 0)) {
      throw new Error("At least one product or material request is required");
    }

    let productRequests: TOutletProductRequest[] = [];
    let materialRequests: TOutletMaterialRequest[] = [];

    // Create product requests if provided
    if (data.products && data.products.length > 0) {
      productRequests = await this.productRequestRepo.batchCreate(
        data.products.map((p) => ({
          outletId: data.outletId,
          productId: p.productId,
          quantity: p.quantity,
        }))
      );
    }

    // Create material requests if provided
    if (data.materials && data.materials.length > 0) {
      materialRequests = await this.materialRequestRepo.batchCreate(
        data.materials.map((m) => ({
          outletId: data.outletId,
          materialId: m.materialId,
          quantity: m.quantity,
        }))
      );
    }

    return { productRequests, materialRequests };
  }

  /**
   * Get all requests by outlet ID
   */
  async getRequestsByOutletId(
    outletId: number
  ): Promise<{
    products: TOutletProductRequest[];
    materials: TOutletMaterialRequest[];
  }> {
    const [products, materials] = await Promise.all([
      this.productRequestRepo.findByOutletId(outletId),
      this.materialRequestRepo.findByOutletId(outletId),
    ]);

    return { products, materials };
  }

  /**
   * Get all requests (admin only)
   */
  async getAllRequests(
    skip: number,
    take: number
  ): Promise<{
    products: { data: TOutletProductRequest[]; total: number };
    materials: { data: TOutletMaterialRequest[]; total: number };
  }> {
    const [productsResult, materialsResult] = await Promise.all([
      this.productRequestRepo.findAllPaginated(skip, take),
      this.materialRequestRepo.findAllPaginated(skip, take),
    ]);

    return {
      products: productsResult,
      materials: materialsResult,
    };
  }

  /**
   * Get aggregated requests grouped by outlet and date with employee info
   */
  async getAggregatedRequests(
    page: number,
    limit: number
  ): Promise<{
    data: Array<{
      outlet_id: number;
      outlet_name: string;
      employee_id: number | null;
      employee_name: string | null;
      request_date: string;
      total_request_product: number;
      total_request_product_accepted: number;
      total_request_material: number;
      total_request_material_accepted: number;
      status: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    // Get product aggregated data (this includes pagination)
    const productData = await this.productRequestRepo.getAggregatedByOutlet(skip, limit);

    // Get material aggregated data (all outlets and dates)
    const materialData = await this.materialRequestRepo.getAggregatedByOutlet();

    // Combine the data
    const combinedData = productData.data.map((productItem) => {
      // Find matching material data for this outlet AND date
      const materialItem = materialData.find(
        (m) => m.outlet_id === productItem.outlet_id && m.request_date === productItem.request_date
      );

      const totalRequestProduct = productItem.total_request_product;
      const totalRequestProductAccepted = productItem.total_request_product_accepted;
      const totalRequestMaterial = materialItem?.total_request_material || 0;
      const totalRequestMaterialAccepted = materialItem?.total_request_material_accepted || 0;

      // Determine status: if all requests are accepted, status is "processed", otherwise "pending"
      const totalRequests = totalRequestProduct + totalRequestMaterial;
      const totalAccepted = totalRequestProductAccepted + totalRequestMaterialAccepted;
      const status = totalRequests > 0 && totalRequests === totalAccepted ? 'processed' : 'pending';

      return {
        outlet_id: productItem.outlet_id,
        outlet_name: productItem.outlet_name,
        employee_id: productItem.employee_id,
        employee_name: productItem.employee_name,
        request_date: productItem.request_date,
        total_request_product: totalRequestProduct,
        total_request_product_accepted: totalRequestProductAccepted,
        total_request_material: totalRequestMaterial,
        total_request_material_accepted: totalRequestMaterialAccepted,
        status,
      };
    });

    const totalPages = Math.ceil(productData.total / limit);

    return {
      data: combinedData,
      pagination: {
        page,
        limit,
        total: productData.total,
        totalPages,
      },
    };
  }

  /**
   * Update product request (product_id and/or quantity only)
   */
  async updateProductRequest(
    id: string,
    data: { productId?: number; quantity?: number }
  ): Promise<TOutletProductRequest> {
    // Validate: cannot update if not PENDING
    const existing = await this.productRequestRepo.getById(id);
    if (!existing) {
      throw new Error("Product request not found");
    }

    const currentRequest = existing as TOutletProductRequest;
    if (currentRequest.status !== OUTLETREQUESTSTATUS.PENDING) {
      throw new Error("Can only update requests with PENDING status");
    }

    // Prepare update data (camelCase for entity)
    const updateData: Partial<TOutletProductRequest> = {};
    if (data.productId !== undefined) {
      updateData.productId = data.productId;
    }
    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity;
    }

    return await this.productRequestRepo.update(id, updateData);
  }

  /**
   * Update material request (material_id and/or quantity only)
   */
  async updateMaterialRequest(
    id: string,
    data: { materialId?: number; quantity?: number }
  ): Promise<TOutletMaterialRequest> {
    // Validate: cannot update if not PENDING
    const existing = await this.materialRequestRepo.getById(id);
    if (!existing) {
      throw new Error("Material request not found");
    }

    const currentRequest = existing as TOutletMaterialRequest;
    if (currentRequest.status !== OUTLETREQUESTSTATUS.PENDING) {
      throw new Error("Can only update requests with PENDING status");
    }

    // Prepare update data (camelCase for entity)
    const updateData: Partial<TOutletMaterialRequest> = {};
    if (data.materialId !== undefined) {
      updateData.materialId = data.materialId;
    }
    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity;
    }

    return await this.materialRequestRepo.update(id, updateData);
  }

  /**
   * Delete product request
   */
  async deleteProductRequest(id: string): Promise<void> {
    const existing = await this.productRequestRepo.getById(id);
    if (!existing) {
      throw new Error("Product request not found");
    }

    await this.productRequestRepo.delete(id);
  }

  /**
   * Delete material request
   */
  async deleteMaterialRequest(id: string): Promise<void> {
    const existing = await this.materialRequestRepo.getById(id);
    if (!existing) {
      throw new Error("Material request not found");
    }

    await this.materialRequestRepo.delete(id);
  }

  /**
   * Approve requests with approval quantities
   * Must include approval_quantity for ALL items in the request
   */
  async approveRequests(approval: TOutletRequestApproval): Promise<{
    productRequests: TOutletProductRequest[];
    materialRequests: TOutletMaterialRequest[];
  }> {
    // Validate: at least one approval must be provided
    if ((!approval.products || approval.products.length === 0) && (!approval.materials || approval.materials.length === 0)) {
      throw new Error("At least one product or material approval is required");
    }

    const productRequests: TOutletProductRequest[] = [];
    const materialRequests: TOutletMaterialRequest[] = [];

    // Approve product requests
    if (approval.products && approval.products.length > 0) {
      for (const item of approval.products) {
        const existing = await this.productRequestRepo.getById(item.id.toString());
        if (!existing) {
          throw new Error(`Product request with id ${item.id} not found`);
        }

        const currentRequest = existing as TOutletProductRequest;
        if (currentRequest.status !== OUTLETREQUESTSTATUS.PENDING) {
          throw new Error(`Product request with id ${item.id} is not PENDING`);
        }

        const approved = await this.productRequestRepo.approve(item.id, item.approvalQuantity);
        productRequests.push(approved);
      }
    }

    // Approve material requests
    if (approval.materials && approval.materials.length > 0) {
      for (const item of approval.materials) {
        const existing = await this.materialRequestRepo.getById(item.id.toString());
        if (!existing) {
          throw new Error(`Material request with id ${item.id} not found`);
        }

        const currentRequest = existing as TOutletMaterialRequest;
        if (currentRequest.status !== OUTLETREQUESTSTATUS.PENDING) {
          throw new Error(`Material request with id ${item.id} is not PENDING`);
        }

        const approved = await this.materialRequestRepo.approve(item.id, item.approvalQuantity);
        materialRequests.push(approved);
      }
    }

    return { productRequests, materialRequests };
  }

  /**
   * Reject product request
   */
  async rejectProductRequest(id: string): Promise<TOutletProductRequest> {
    const existing = await this.productRequestRepo.getById(id);
    if (!existing) {
      throw new Error("Product request not found");
    }

    const currentRequest = existing as TOutletProductRequest;
    if (currentRequest.status !== OUTLETREQUESTSTATUS.PENDING) {
      throw new Error("Can only reject requests with PENDING status");
    }

    return await this.productRequestRepo.reject(parseInt(id));
  }

  /**
   * Reject material request
   */
  async rejectMaterialRequest(id: string): Promise<TOutletMaterialRequest> {
    const existing = await this.materialRequestRepo.getById(id);
    if (!existing) {
      throw new Error("Material request not found");
    }

    const currentRequest = existing as TOutletMaterialRequest;
    if (currentRequest.status !== OUTLETREQUESTSTATUS.PENDING) {
      throw new Error("Can only reject requests with PENDING status");
    }

    return await this.materialRequestRepo.reject(parseInt(id));
  }

  /**
   * Get detailed requests by date and outlet
   */
  async getDetailedByDateAndOutlet(date: string, outletId: number): Promise<{
    outlet_id: number;
    outlet_name: string;
    outlet_location: string;
    request_date: string;
    employee_name: string;
    product_requests: TOutletProductRequest[];
    material_requests: TOutletMaterialRequest[];
  }> {
    // Fetch both product and material requests (these come with outlet/product/material included from repository)
    const [productRequests, materialRequests] = await Promise.all([
      this.productRequestRepo.getDetailedByDateAndOutlet(date, outletId),
      this.materialRequestRepo.getDetailedByDateAndOutlet(date, outletId),
    ]);

    // The repository returns data with relations included, but EntityMapper strips them
    // So we need to get the raw data. For now, let's just return empty strings if no data
    let outletName = "Unknown Outlet";
    let outletLocation = "";
    let employee_name = "";

    // If we have requests, we can fetch outlet separately
    if (productRequests.length > 0 || materialRequests.length > 0) {
      // Fetch outlet info from database directly
      const { default: PostgresAdapter } = await import("../../adapters/postgres/instance");
      const outlet = await PostgresAdapter.client.outlet.findUnique({
        where: { id: outletId },
        select: {
          id: true,
          name: true,
          location: true,
          outlet_employee: { select: { employee: { select: { name: true } } } },
        },
      });

      if (outlet) {
        outletName = outlet.name;
        outletLocation = outlet.location;
        employee_name = outlet.outlet_employee[0]?.employee?.name || "";
      }
    }
    return {
      outlet_id: outletId,
      outlet_name: outletName,
      outlet_location: outletLocation,
      request_date: date,
      employee_name: employee_name,
      product_requests: productRequests,
      material_requests: materialRequests,
    };
  }

  /**
   * Delete all requests by date and outlet (soft delete)
   * Returns count of deleted product and material requests
   */
  async deleteByDateAndOutlet(date: string, outletId: number): Promise<{
    deletedProductRequests: number;
    deletedMaterialRequests: number;
  }> {
    const [deletedProductRequests, deletedMaterialRequests] = await Promise.all([
      this.productRequestRepo.deleteByDateAndOutlet(date, outletId),
      this.materialRequestRepo.deleteByDateAndOutlet(date, outletId),
    ]);

    return {
      deletedProductRequests,
      deletedMaterialRequests,
    };
  }
}
