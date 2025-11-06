export type TOrderItem = {
  id: string;
  orderId: string;
  productId: number;
  quantity: number;
  price: number;
  orderItemRootId?: number | null;
  subItems?: TOrderItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TOrder = {
  id: string;
  outletId: number;
  outletLocation: string;
  invoiceNumber: string;
  employeeId: number;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TOrderWithItems = TOrder & {
  items: TOrderItem[];
};

export type TOrderCreate = {
  outletId: number;
  outletLocation: string;
  invoiceNumber: string;
  employeeId: number;
  paymentMethod: string;
  totalAmount: number;
  status: string;
};

export type TOrderItemCreate = {
  productId: number;
  quantity: number;
  price: number;
  orderItemRootId?: number;
  subItems?: TOrderItemCreate[];
};

export type TOrderCreateRequest = {
  payment_method: string;
  items: {
    product_id: number;
    qty: number;
    product_items_ids?: {
      product_id: number;
      qty: number;
    }[];
  }[];
};

export type TOrderGetResponse = {
  id: number;
  outlet_id: number;
  outlet_location: string;
  invoice_number: string;
  employee_id: number;
  payment_method: string;
  total_amount: number;
  status: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  items: {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    sub_total_price: number;
    total_price: number;
    product_items?: {
      id: number;
      product_id: number;
      quantity: number;
      price: number;
      total_price: number;
    }[];
  }[];
};

// Response types for GET endpoints
export type TOrderListResponse = {
  invoice_number: string;
  date: string;
  total_amount: number;
  [categoryName: string]: string | number | {
    quantity: number;
    total_amount: number;
    items: string[];
  };
};

export type TOrderDetailResponse = {
  id: number;
  invoice_number: string;
  date: string;
  total_amount: number;
  status: string;
  payment_method: string;
  outlet: {
    id: number;
    name: string;
    location: string;
    code: string;
  };
  employee: {
    id: number;
    name: string;
    phone: string;
  };
  created_at: Date;
  updated_at: Date;
  [categoryName: string]: unknown;
};

export type TMyOrderResponse = {
  id: number;
  invoice_number: string;
  date: string;
  payment_method: string;
  total_price: number;
  employee: {
    id: number;
    name: string;
  };
  outlet: {
    id: number;
    name: string;
  };
  items: {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    sub_total_price: number;
    total_price: number;
    product_name?: string;
    sub_items?: {
      id: number;
      product_id: number;
      quantity: number;
      price: number;
      total_price: number;
      product_name?: string;
    }[];
  }[];
};