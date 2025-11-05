import { TRole, TRoleGetResponse } from "./role";

export type TUser = {
  id: string;
  name: string;
  username: string;
  role_id?: number;
  password: string;
  role:TRole;
  outlets?: { id: number } | null;
  lastestLogin?: Date | null;
  logins: {
    ipAddress: string,
    userAgent: string,
    loginAt: Date,
  }[]
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type TUserCreate = {
  name: string;
  username: string;
  password: string;
  role_id?: number;
  isActive: boolean;
}
export type TUserCreateRequest = {
  name: string;
  username: string;
  password: string;
  role_id: number;
  is_active: boolean;
}

export type TUserUpdateRequest = {
  name?: string;
  username?: string;
  password?: string;
  role_id?: number;
  is_active?: boolean;
}
export type TUserGetResponse = Omit<TUser, 'isActive' | 'createdAt' | 'updatedAt' |'password'| 'role'|"logins"| 'lastestLogin'> & {
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  role?: string;
  lastest_login?: Date | null;
}

export type TuserDetailGetResponse = Omit<TUser, 'password' | 'role' | 'isActive' | 'createdAt' | 'updatedAt' | 'lastestLogin'> & {
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  role: TRoleGetResponse;
  lastest_login?: Date | null;
}
