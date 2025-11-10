

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
      description: outlet.description,
      is_active: outlet.isActive,
      incomeTarget: outlet.incomeTarget,
      created_at: outlet.createdAt,
      updated_at: outlet.updatedAt,
    };
  }

  /**
   * Map User entity to detailed response format
   * Used in findById endpoints
   */
  static toDetailResponse(outlet: TOutletWithSettings, picName: string | null = null): TOutletGetResponseWithSettings {
    // Find the setting with the latest checkin_time
    let latestSetting = outlet.settings && outlet.settings.length > 0 ? outlet.settings[0] : null;
    if (latestSetting) {
      for (const setting of outlet.settings) {
        if (setting.checkinTime > latestSetting.checkinTime) {
          latestSetting = setting;
        }
      }
    }
    
    return {
      id: outlet.id,
      setting: {
        checkin_time: latestSetting?.checkinTime || "00:00:00",
        checkout_time: latestSetting?.checkoutTime || "00:00:00",
        income_target: outlet.incomeTarget,
        details: outlet.settings?.map(s => ({
          id: s.id,
          checkin_time: s.checkinTime,
          checkout_time: s.checkoutTime,
          salary: s.salary,
          days: s.days,
        })) || [],
      },
      name: outlet.name,
      location: outlet.location,
      code: outlet.code,
      pic_name: picName,
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
