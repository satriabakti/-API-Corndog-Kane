import { TRole, TRoleGetResponse } from "../../core/entities/user/role";

export class RoleResponseMapper {

  static toListResponse(role: TRole): TRoleGetResponse {
    return {
      id: role.id,
      description: role.description,
      is_active:role.isActive,
      name: role.name,
      created_at: role.createdAt,
      updated_at: role.updatedAt,
    };
  }

}
