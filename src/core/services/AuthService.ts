import { TLoginRequest, TLoginResponse } from "../entities/user/auth";
import { TUser } from "../entities/user/user";
import { UserRepository } from "../repositories";
import { Service } from "./Service";
import bcrypt from "bcrypt";

export class AuthService extends Service<TUser> {
  declare repository: UserRepository;

  constructor(repository: UserRepository) {
    super(repository);
  }

  async login(credentials: TLoginRequest,metadata:{ipAddress:string,userAgent:string}): Promise<TLoginResponse | null> {
    const user = await this.repository.findByUsername(credentials.username);
    
    if (!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

    if (!isPasswordValid) return null;

    await this.repository.createLoginHistory(
      +user.id, metadata.ipAddress, metadata.userAgent
    );
    return {
      id: user.id ,
      name: user.name,
      username: user.username,
      role: user.role.name, // TODO: Replace with actual role from database
      outlet_id: user.outlets?.id ?? null,
    };
  }

  async findByUsername(username: string): Promise<TUser | null> {
    return this.repository.findByUsername(username);
  }
}