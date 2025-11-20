import { TRole, TRoleGetResponse } from "../../core/entities/user/role";

export class RoleResponseMapper {

  static toResponse(role: TRole): TRoleGetResponse {
    return {
      id: role.id,
      description: role.description,
      is_active: role.isActive,
      name: role.name,
      created_at: role.createdAt,
      updated_at: role.updatedAt,
    };
  }

  static toListResponse(roles: TRole[]): TRoleGetResponse[] {
    return roles.map(role => this.toResponse(role));
  }

}
