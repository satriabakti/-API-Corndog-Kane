import { TOutletMaterialRequest } from "../../../core/entities/outlet/request";
import { OutletMaterialRequestRepository as IOutletMaterialRequestRepository } from "../../../core/repositories/outletRequest";
import Repository from "./Repository";
import { OUTLETREQUESTSTATUS } from "../../../core/entities/outlet/request";

export class OutletMaterialRequestRepository
  extends Repository<TOutletMaterialRequest>
  implements IOutletMaterialRequestRepository
{
  constructor() {
    super("outletMaterialRequest");
  }

  /**
   * Find all material requests by outlet ID
   */
  async findByOutletId(outletId: number): Promise<TOutletMaterialRequest[]> {
    const dbRecords = await this.prisma.outletMaterialRequest.findMany({
      where: {
        outlet_id: outletId,
        is_active: true,
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map to entity using EntityMapper
    const { EntityMapper } = await import("../../../mappers/EntityMapper");
    const { getEntityMapper } = await import("../../../mappers/EntityMappers");

    const mapper = new EntityMapper<TOutletMaterialRequest>(getEntityMapper("outletMaterialRequest"));
    return mapper.mapToEntities(dbRecords);
  }

  /**
   * Find material request by ID with relations
   */
  async findByIdWithRelations(id: number): Promise<TOutletMaterialRequest | null> {
    const dbRecord = await this.prisma.outletMaterialRequest.findUnique({
      where: { id },
      include: {
        material: {
          select: {
            id: true,
            name: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!dbRecord) return null;

    // Map to entity using EntityMapper
    const { EntityMapper } = await import("../../../mappers/EntityMapper");
    const { getEntityMapper } = await import("../../../mappers/EntityMappers");

    const mapper = new EntityMapper<TOutletMaterialRequest>(getEntityMapper("outletMaterialRequest"));
    return mapper.mapToEntity(dbRecord);
  }

  /**
   * Approve material request with approval quantity
   */
  async approve(id: number, approvalQuantity: number): Promise<TOutletMaterialRequest> {
    const updated = await this.prisma.outletMaterialRequest.update({
      where: { id },
      data: {
        approval_quantity: approvalQuantity,
        status: OUTLETREQUESTSTATUS.APPROVED,
        updatedAt: new Date(),
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Map to entity using EntityMapper
    const { EntityMapper } = await import("../../../mappers/EntityMapper");
    const { getEntityMapper } = await import("../../../mappers/EntityMappers");

    const mapper = new EntityMapper<TOutletMaterialRequest>(getEntityMapper("outletMaterialRequest"));
    return mapper.mapToEntity(updated);
  }

  /**
   * Reject material request
   */
  async reject(id: number): Promise<TOutletMaterialRequest> {
    const updated = await this.prisma.outletMaterialRequest.update({
      where: { id },
      data: {
        status: OUTLETREQUESTSTATUS.REJECTED,
        updatedAt: new Date(),
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Map to entity using EntityMapper
    const { EntityMapper } = await import("../../../mappers/EntityMapper");
    const { getEntityMapper } = await import("../../../mappers/EntityMappers");

    const mapper = new EntityMapper<TOutletMaterialRequest>(getEntityMapper("outletMaterialRequest"));
    return mapper.mapToEntity(updated);
  }

  /**
   * Batch create material requests
   */
  async batchCreate(
    requests: Array<{ outletId: number; materialId: number; quantity: number }>
  ): Promise<TOutletMaterialRequest[]> {
    // Create all requests
    await this.prisma.outletMaterialRequest.createMany({
      data: requests.map((req) => ({
        outlet_id: req.outletId,
        material_id: req.materialId,
        quantity: req.quantity,
        status: OUTLETREQUESTSTATUS.PENDING,
        is_active: true,
      })),
    });

    // Fetch the created records (createMany doesn't return data in Prisma)
    // Get the latest records for this outlet
    const createdRecords = await this.prisma.outletMaterialRequest.findMany({
      where: {
        outlet_id: requests[0].outletId,
        is_active: true,
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: requests.length,
    });

    // Map to entities using EntityMapper
    const { EntityMapper } = await import("../../../mappers/EntityMapper");
    const { getEntityMapper } = await import("../../../mappers/EntityMappers");

    const mapper = new EntityMapper<TOutletMaterialRequest>(getEntityMapper("outletMaterialRequest"));
    return mapper.mapToEntities(createdRecords);
  }

  /**
   * Find all material requests with pagination
   */
  async findAllPaginated(skip: number, take: number): Promise<{ data: TOutletMaterialRequest[]; total: number }> {
    const [dbRecords, total] = await Promise.all([
      this.prisma.outletMaterialRequest.findMany({
        where: { is_active: true },
        skip,
        take,
        include: {
          material: {
            select: {
              id: true,
              name: true,
            },
          },
          outlet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.outletMaterialRequest.count({
        where: { is_active: true },
      }),
    ]);

    // Map to entity using EntityMapper
    const { EntityMapper } = await import("../../../mappers/EntityMapper");
    const { getEntityMapper } = await import("../../../mappers/EntityMappers");

    const mapper = new EntityMapper<TOutletMaterialRequest>(getEntityMapper("outletMaterialRequest"));
    const data = mapper.mapToEntities(dbRecords);

    return { data, total };
  }

  /**
   * Get aggregated material requests grouped by outlet and date
   */
  async getAggregatedByOutlet(): Promise<
    Array<{
      outlet_id: number;
      request_date: string;
      total_request_material: number;
      total_request_material_accepted: number;
    }>
  > {
    // Get all material requests
    const allRequests = await this.prisma.outletMaterialRequest.findMany({
      where: { is_active: true },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by outlet_id and date
    const groupedByOutletAndDate = new Map<string, {
      outlet_id: number;
      request_date: string;
      requests: typeof allRequests;
    }>();

    allRequests.forEach((request) => {
      const dateKey = request.createdAt.toISOString().split('T')[0]; // Get YYYY-MM-DD
      const groupKey = `${request.outlet_id}_${dateKey}`;

      if (!groupedByOutletAndDate.has(groupKey)) {
        groupedByOutletAndDate.set(groupKey, {
          outlet_id: request.outlet_id,
          request_date: dateKey,
          requests: [],
        });
      }

      groupedByOutletAndDate.get(groupKey)!.requests.push(request);
    });

    // Convert map to array and calculate totals
    const data = Array.from(groupedByOutletAndDate.values()).map((group) => {
      // Group by material_id to count unique materials
      const uniqueMaterials = new Set<number>();
      const approvedMaterials = new Set<number>();
      
      group.requests.forEach((request) => {
        uniqueMaterials.add(request.material_id);
        
        if (request.status === OUTLETREQUESTSTATUS.APPROVED) {
          approvedMaterials.add(request.material_id);
        }
      });

      return {
        outlet_id: group.outlet_id,
        request_date: group.request_date,
        total_request_material: uniqueMaterials.size,
        total_request_material_accepted: approvedMaterials.size,
      };
    });

    return data;
  }

  /**
   * Get detailed material requests by date and outlet
   */
  async getDetailedByDateAndOutlet(date: string, outletId: number): Promise<TOutletMaterialRequest[]> {
    // Parse date to get start and end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dbRecords = await this.prisma.outletMaterialRequest.findMany({
      where: {
        outlet_id: outletId,
        is_active: true,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map to entity using EntityMapper
    const { EntityMapper } = await import("../../../mappers/EntityMapper");
    const { getEntityMapper } = await import("../../../mappers/EntityMappers");

    const mapper = new EntityMapper<TOutletMaterialRequest>(getEntityMapper("outletMaterialRequest"));
    return mapper.mapToEntities(dbRecords);
  }

  /**
   * Delete (soft delete) all material requests by date and outlet
   */
  async deleteByDateAndOutlet(date: string, outletId: number): Promise<number> {
    // Parse date to get start and end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.prisma.outletMaterialRequest.updateMany({
      where: {
        outlet_id: outletId,
        is_active: true,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      data: {
        is_active: false,
        updatedAt: new Date(),
      },
    });

    return result.count;
  }
}
