

import { TOutlet, TOutletGetResponse, TOutletGetResponseWithSettings, TOutletWithSettings } from "../../core/entities/outlet/outlet";

/**
 * User Response Mapper
 * Maps User entity from system/database format to API response format
 */
export class OutletResponseMapper {
  /**
   * Map User entity to list response format (simplified)
   * Used in findAll endpoints
   */
  static toListResponse(outlet: TOutlet, picName: string | null = null): TOutletGetResponse {
    return {
      id: outlet.id,
      name: outlet.name,
      location: outlet.location,
      code: outlet.code,
      pic_name: picName,
      pic_phone: outlet.picPhone,
      description: outlet.description,
      is_active: outlet.isActive,
      created_at: outlet.createdAt,
      updated_at: outlet.updatedAt,
    };
  }

  /**
   * Map User entity to detailed response format
   * Used in findById endpoints
   */
  static toDetailResponse(outlet:TOutletWithSettings, picName: string | null = null): TOutletGetResponseWithSettings {
    return {
      id: outlet.id,
      setting: {
        checkin_time: outlet.checkinTime,
        checkout_time: outlet.checkoutTime,
        salary: +outlet.salary,
        income_target: +outlet.incomeTarget,
        
      },
      name: outlet.name,
      location: outlet.location,
      code: outlet.code,
      pic_name: picName,
      pic_phone: outlet.picPhone,
      description: outlet.description,
      is_active: outlet.isActive,
      created_at: outlet.createdAt,
      updated_at: outlet.updatedAt,
      
    };
  }

  /**
   * Map Role entity to response format
   */
}
