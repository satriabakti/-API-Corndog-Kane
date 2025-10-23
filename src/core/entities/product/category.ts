

export type TCategory = {
  name: string;
  isActive: boolean;
};

export type TCategoryWithID = TCategory & {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};
export type TCategoryCreate = Omit<TCategory, 'isActive'>& {
  isActive?: boolean;
};

export type TCategoryCreateRequest = Omit<TCategoryCreate, "isActive"> & {
	is_active?: boolean;
};
export type TCategoryUpdateRequest = Omit<TCategoryCreateRequest, "name"> & {
  name?: string;
};
export type TCategoryGetResponse = {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};