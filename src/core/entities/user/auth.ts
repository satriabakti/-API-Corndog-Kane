export type TLoginRequest = {
  username: string;
  password: string;
}

export type TLoginResponse = {
  id: string;
  name: string;
  username: string;
  role: string;
  outlet_id: number | null;
}
export type TLoginMetadataResponse = {
  token: string;
}