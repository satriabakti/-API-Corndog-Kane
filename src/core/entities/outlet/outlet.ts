import { TUserCreateRequest } from "../user/user";

export type TOutlet = {
  id: string;
  name: string;
  location: string;
  code: string;
  picPhone: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type TOutletCreate = Omit<TOutlet, "id" | "createdAt" | "updatedAt"> & {
	checkinTime: string;
	checkoutTime: string;
	salary: number;
	incomeTarget: number;
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
  checkinTime: string ;
  checkoutTime: string ;
  salary: number;
  incomeTarget: number;
}

export type TOutletCreateRequest = Omit<
	TOutletWithSettings,
	"id" | "createdAt" | "updatedAt" | "isActive" | "code" | "picPhone" | "checkinTime" | "checkoutTime" 
> & {
	is_active: boolean;
	code: string;
  pic_phone: string;
  setting: {
    checkin_time: string ;
    checkout_time: string ;
    salary: number;
    income_target: number;
  };
  user?: TUserCreateRequest
  user_id?: number;
};
export type TOutletCreateRequestWithUser = TOutletCreateRequest & {
  user: TUserCreateRequest;
}
export type TOutletCreateRequestWithUserId = TOutletCreateRequest & {
  user_id: string;
}


export type TOutletGetResponse = Omit<TOutlet, 'isActive' | 'createdAt' | 'updatedAt'| 'code' | 'picPhone'> & {
  is_active: boolean; 
  code: string;
  pic_name: string | null;
  pic_phone: string;
  created_at: Date;
  updated_at: Date;
}

export type TOutletGetResponseWithSettings = Omit<TOutletWithSettings, 'incomeTarget' |'salary'|  'isActive' | 'createdAt' | 'updatedAt' | 'code' | 'picPhone' | 'checkinTime' | 'checkoutTime'> & {
  setting: {
    
    checkin_time: string | null;
    checkout_time: string | null;
    salary: number | null;
    income_target: number | null;
  }
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  code: string;
  pic_name: string | null;
  pic_phone: string;
}

export type TOutletSettingsUpdateRequest = {
  checkin_time?: string | null;
  income_target?: number | null;
  checkout_time?: string | null;
  salary?: number | null;
}

export type TOutletUpdateRequest = {
  name?: string;
  location?: string;
  description?: string;
  is_active?: boolean;
  code?: string;
  pic_phone?: string;
  setting?: TOutletSettingsUpdateRequest;
  user_id?: number;
}

export type TOutletUpdate = Omit<TOutlet, "id" | "createdAt" | "updatedAt"> & {
	checkInTime?: string | null;
	checkOutTime?: string | null;
  salary?: number | null;
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
