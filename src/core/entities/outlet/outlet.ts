import { TUserCreateRequest } from "../user/user";

// Type for individual outlet setting
export type TOutletSetting = {
	id?: number;
	checkin_time: string;
	checkout_time: string;
	salary: number;
	days: string[];
};

export type TOutletSettingEntity = {
	id: number;
	outletId: number;
	checkinTime: string;
	checkoutTime: string;
	salary: number;
	days: string[];
};

export type TOutlet = {
  id: string;
  name: string;
  location: string;
  code: string;
  description: string;
  isActive: boolean;
  incomeTarget: number;
  createdAt: Date;
  updatedAt: Date;
}
export type TOutletCreate = Omit<TOutlet, "id" | "createdAt" | "updatedAt"> & {
	settings: TOutletSetting[];
	userId?: number;
	user?: {
		name: string;
		username: string;
		password: string;
		role_id: number;
		is_active: boolean;
	};
};



export type TOutletWithSettings = TOutlet & {
  settings: TOutletSettingEntity[];
}

export type TOutletCreateRequest = Omit<
	TOutlet,
	"id" | "createdAt" | "updatedAt" | "isActive" | "code" | "incomeTarget"
> & {
	is_active: boolean;
	code: string;
	income_target: number;
	setting: TOutletSetting[];
	user?: TUserCreateRequest;
	user_id?: number;
};
export type TOutletCreateRequestWithUser = TOutletCreateRequest & {
  user: TUserCreateRequest;
}
export type TOutletCreateRequestWithUserId = TOutletCreateRequest & {
  user_id: string;
}


export type TOutletGetResponse = Omit<TOutlet, 'isActive' | 'createdAt' | 'updatedAt'| 'code'> & {
  is_active: boolean; 
  code: string;
  pic_name: string | null;
  created_at: Date;
  updated_at: Date;
}

export type TOutletGetResponseWithSettings = Omit<TOutlet, 'isActive' | 'createdAt' | 'updatedAt' | 'code' | 'incomeTarget'> & {
  setting: {
    checkin_time: string;
    checkout_time: string;
    income_target: number;
    details: TOutletSetting[];
  }
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  code: string;
  pic_name: string | null;
}

export type TOutletUpdateRequest = {
  name?: string;
  location?: string;
  description?: string;
  is_active?: boolean;
  code?: string;
  income_target?: number;
  setting?: TOutletSetting[];
  user_id?: number;
}

export type TOutletUpdate = Omit<TOutlet, "id" | "createdAt" | "updatedAt"> & {
  settings?: TOutletSetting[];
  userId?: number;
};
export type TOutletAssignmentResponse = {
  outlet: {
    id: string;
    name: string;
    location: string;
  }
  employee: {
    id: string;
    name: string;
    nik: string;
  }
  assigned_at: Date;
}

export type TOutletStockItem = {
  date: string;
  product_id: number;
  product_name: string;
  first_stock: number;
  stock_in: number;
  sold_stock: number;
  remaining_stock: number;
}

export type TMaterialStockItem = {
  date: string;
  material_id: number;
  material_name: string;
  first_stock: number;
  stock_in: number;
  used_stock: number;
  remaining_stock: number;
}

export type TOutletProductStockResponse = {
  data: TOutletStockItem[];
  metadata: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
}

export type TOutletMaterialStockResponse = {
  data: TMaterialStockItem[];
  metadata: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
}
