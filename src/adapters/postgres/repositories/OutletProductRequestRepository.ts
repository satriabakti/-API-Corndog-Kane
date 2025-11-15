import { TOutletProductRequest } from "../../../core/entities/outlet/request";
import { OutletProductRequestRepository as IOutletProductRequestRepository } from "../../../core/repositories/outletRequest";
import Repository from "./Repository";
import { OUTLETREQUESTSTATUS } from "../../../core/entities/outlet/request";

export class OutletProductRequestRepository
  extends Repository<TOutletProductRequest>
  implements IOutletProductRequestRepository
{
  constructor() {
    super("outletProductRequest");
  }

  /**
   * Find all product requests by outlet ID
   */
  async findByOutletId(outletId: number): Promise<TOutletProductRequest[]> {
    const dbRecords = await this.prisma.outletProductRequest.findMany({
      where: {
      outlet_id: outletId,
      is_active: true,
    },
    include: {
      product: {
        include: {
          product_master: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });    // Map to entity using EntityMapper
    const { EntityMapper } = await import("../../../mappers/EntityMapper");
    const { getEntityMapper } = await import("../../../mappers/EntityMappers");

    const mapper = new EntityMapper<TOutletProductRequest>(getEntityMapper("outletProductRequest"));
    return mapper.mapToEntities(dbRecords);
  }

  /**
   * Find product request by ID with relations
   */
  async findByIdWithRelations(id: number): Promise<TOutletProductRequest | null> {
    const dbRecord = await this.prisma.outletProductRequest.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            product_master: {
              select: {
                name: true,
              },
            },
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

    const mapper = new EntityMapper<TOutletProductRequest>(getEntityMapper("outletProductRequest"));
    return mapper.mapToEntity(dbRecord);
  }

  /**
   * Approve product request with approval quantity
   */
  async approve(id: number, approvalQuantity: number): Promise<TOutletProductRequest> {
    const updated = await this.prisma.outletProductRequest.update({
      where: { id },
      data: {
        approval_quantity: approvalQuantity,
        status: OUTLETREQUESTSTATUS.APPROVED,
        updatedAt: new Date(),
      },
      include: {
        product: {
          include: {
            product_master: {
              select: {
                name: true,
              },
            },
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

    const mapper = new EntityMapper<TOutletProductRequest>(getEntityMapper("outletProductRequest"));
    return mapper.mapToEntity(updated);
  }

  /**
   * Reject product request
   */
  async reject(id: number): Promise<TOutletProductRequest> {
    const updated = await this.prisma.outletProductRequest.update({
      where: { id },
      data: {
        status: OUTLETREQUESTSTATUS.REJECTED,
        updatedAt: new Date(),
      },
      include: {
        product: {
          include: {
            product_master: {
              select: {
                name: true,
              },
            },
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

    const mapper = new EntityMapper<TOutletProductRequest>(getEntityMapper("outletProductRequest"));
    return mapper.mapToEntity(updated);
  }

  /**
   * Batch create product requests
   */
  async batchCreate(
    requests: Array<{ outletId: number; productId: number; quantity: number }>
  ): Promise<TOutletProductRequest[]> {
    // Create all requests
    await this.prisma.outletProductRequest.createMany({
      data: requests.map((req) => ({
        outlet_id: req.outletId,
        product_id: req.productId,
        quantity: req.quantity,
        status: OUTLETREQUESTSTATUS.PENDING,
        is_active: true,
      })),
    });

    // Fetch the created records (createMany doesn't return data in Prisma)
    // Get the latest records for this outlet
    const createdRecords = await this.prisma.outletProductRequest.findMany({
      where: {
        outlet_id: requests[0].outletId,
        is_active: true,
      },
      include: {
        product: {
          include: {
            product_master: {
              select: {
                name: true,
              },
            },
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

    const mapper = new EntityMapper<TOutletProductRequest>(getEntityMapper("outletProductRequest"));
    return mapper.mapToEntities(createdRecords);
  }

  /**
   * Find all product requests with pagination
   */
  async findAllPaginated(skip: number, take: number): Promise<{ data: TOutletProductRequest[]; total: number }> {
    const [dbRecords, total] = await Promise.all([
      this.prisma.outletProductRequest.findMany({
        where: { is_active: true },
        skip,
        take,
        include: {
          product: {
          include: {
            product_master: {
              select: {
                name: true,
              },
            },
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
      this.prisma.outletProductRequest.count({
        where: { is_active: true },
      }),
    ]);

    // Map to entity using EntityMapper
    const { EntityMapper } = await import("../../../mappers/EntityMapper");
    const { getEntityMapper } = await import("../../../mappers/EntityMappers");

    const mapper = new EntityMapper<TOutletProductRequest>(getEntityMapper("outletProductRequest"));
    const data = mapper.mapToEntities(dbRecords);

    return { data, total };
  }

  /**
   * Get aggregated requests grouped by outlet and date
   */
  async getAggregatedByOutlet(skip: number, take: number): Promise<{
    data: Array<{
      outlet_id: number;
      outlet_name: string;
      employee_id: number | null;
      employee_name: string | null;
      request_date: string;
      total_request_product: number;
      total_request_product_accepted: number;
    }>;
    total: number;
  }> {
    // Get all requests grouped by outlet_id and date
    const allRequests = await this.prisma.outletProductRequest.findMany({
      where: { is_active: true },
      include: {
        outlet: {
          include: {
            outlet_employee: {
              where: { is_active: true },
              include: {
                employee: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by outlet_id and date
    const groupedByOutletAndDate = new Map<string, {
      outlet_id: number;
      outlet_name: string;
      employee_id: number | null;
      employee_name: string | null;
      request_date: string;
      requests: typeof allRequests;
    }>();

    allRequests.forEach((request) => {
      const dateKey = request.createdAt.toISOString().split('T')[0]; // Get YYYY-MM-DD
      const groupKey = `${request.outlet_id}_${dateKey}`;

      if (!groupedByOutletAndDate.has(groupKey)) {
        const employee = request.outlet.outlet_employee[0]?.employee;
        groupedByOutletAndDate.set(groupKey, {
          outlet_id: request.outlet_id,
          outlet_name: request.outlet.name,
          employee_id: employee?.id || null,
          employee_name: employee?.name || null,
          request_date: dateKey,
          requests: [],
        });
      }

      groupedByOutletAndDate.get(groupKey)!.requests.push(request);
    });

    // Convert map to array and calculate totals
    const allGroupedData = Array.from(groupedByOutletAndDate.values()).map((group) => {
      // Group by product_id to count unique products
      const uniqueProducts = new Set<number>();
      const approvedProducts = new Set<number>();
      
      group.requests.forEach((request) => {
        uniqueProducts.add(request.product_id);
        
        if (request.status === OUTLETREQUESTSTATUS.APPROVED) {
          approvedProducts.add(request.product_id);
        }
      });

      return {
        outlet_id: group.outlet_id,
        outlet_name: group.outlet_name,
        employee_id: group.employee_id,
        employee_name: group.employee_name,
        request_date: group.request_date,
        total_request_product: uniqueProducts.size,
        total_request_product_accepted: approvedProducts.size,
      };
    });

    const total = allGroupedData.length;

    // Apply pagination
    const data = allGroupedData.slice(skip, skip + take);

    return { data, total };
  }

  /**
   * Get detailed product requests by date and outlet
   */
  async getDetailedByDateAndOutlet(date: string, outletId: number): Promise<TOutletProductRequest[]> {
    // Parse date to get start and end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dbRecords = await this.prisma.outletProductRequest.findMany({
		where: {
			outlet_id: outletId,
			is_active: true,
			createdAt: {
				gte: startOfDay,
				lte: endOfDay,
			},
		},
		include: {
      product: {
      
				include: {
					product_master: {
						select: {
							name: true,
							category: {
								select: {name: true},
              },
              
						},
					},
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
			createdAt: "desc",
		},
    });

    // Map to entity using EntityMapper
    const { EntityMapper } = await import("../../../mappers/EntityMapper");
    const { getEntityMapper } = await import("../../../mappers/EntityMappers");

    const mapper = new EntityMapper<TOutletProductRequest>(getEntityMapper("outletProductRequest"));
    return mapper.mapToEntities(dbRecords);
  }

  /**
   * Delete (soft delete) all product requests by date and outlet
   */
  async deleteByDateAndOutlet(date: string, outletId: number): Promise<number> {
    // Parse date to get start and end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.prisma.outletProductRequest.updateMany({
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
