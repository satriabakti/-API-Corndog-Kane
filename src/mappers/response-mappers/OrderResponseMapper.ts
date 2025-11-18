import { TOrderGetResponse, TOrder, TOrderWithItems, TOrderListResponse, TOrderDetailResponse, TMyOrderResponse } from "../../core/entities/order/order";

export class OrderResponseMapper {
  /**
   * Map Order entity to list response format (simplified)
   * Used in findAll endpoints
   */
  static toListResponse(order: TOrder): TOrderGetResponse {
    return {
      id: parseInt(order.id),
      outlet_id: order.outletId,
      outlet_location: order.outletLocation,
      invoice_number: order.invoiceNumber,
      employee_id: order.employeeId,
      payment_method: order.paymentMethod,
      total_amount: order.totalAmount,
      status: order.status,
      items: [],
      is_active: order.isActive ?? true,
      created_at: order.createdAt ?? new Date(),
      updated_at: order.updatedAt ?? new Date(),
    };
  }

  /**
   * Map Order with items to creation response format
   * Used when creating new order
   */
  static toCreateResponse(orderWithItems: TOrderWithItems): TOrderGetResponse {
    return {
      id: parseInt(orderWithItems.id),
      outlet_id: orderWithItems.outletId,
      outlet_location: orderWithItems.outletLocation,
      invoice_number: orderWithItems.invoiceNumber,
      employee_id: orderWithItems.employeeId,
      payment_method: orderWithItems.paymentMethod,
      total_amount: orderWithItems.totalAmount,
      status: orderWithItems.status,
      items: orderWithItems.items.map(item => {
        // Map sub items (children) jika ada
        const productItems = item.subItems?.map(subItem => {
          const subItemPrice = subItem.price; // qty × unit_price (already calculated)
          const subItemTotalPrice = subItemPrice; // For child: total_price = price (no sub_total_price)
          
          return {
            id: parseInt(subItem.id),
            product_id: subItem.productId,
            quantity: subItem.quantity,
            price: subItemPrice,
            total_price: subItemTotalPrice,
          };
        }) || [];

        // Calculate parent item prices
        const itemPrice = item.price; // qty × unit_price (already calculated)
        const subTotalPrice = productItems.reduce((sum, subItem) => sum + subItem.total_price, 0); // Sum of children's total_price
        const totalPrice = itemPrice + subTotalPrice; // price + sub_total_price

        return {
          id: parseInt(item.id),
          product_id: item.productId,
          quantity: item.quantity,
          price: itemPrice,
          sub_total_price: subTotalPrice,
          total_price: totalPrice,
          product_items: productItems.length > 0 ? productItems : undefined,
        };
      }),
      is_active: orderWithItems.isActive ?? true,
      created_at: orderWithItems.createdAt ?? new Date(),
      updated_at: orderWithItems.updatedAt ?? new Date(),
    };
  }

  /**
   * Map Order from Prisma to list response with grouped categories
   * Format: { invoice_number, date, total_amount, [category]: { quantity, total_amount, items } }
   */
  static toOrderListResponse(order: {
    invoice_number: string;
    createdAt: Date;
    total_amount: number;
    outlet?: {
      id: number;
      name: string;
    } | null;
    items: Array<{
      quantity: number;
      price: number;
      product: {
        name: string;
        category: { name: string } | null;
      } | null;
    }>;
  }): TOrderListResponse {
    const response: TOrderListResponse = {
      invoice_number: order.invoice_number,
      date: order.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
      total_amount: order.total_amount,
      outlet_name: order.outlet?.name || null,
    };

    // Group items by category
    const categoryMap = new Map<string, { quantity: number; total_amount: number; items: string[] }>();

    order.items?.forEach((item) => {
      const categoryName = item.product?.category?.name || 'Uncategorized';
      const productName = item.product?.name || 'Unknown Product';

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          quantity: 0,
          total_amount: 0,
          items: [],
        });
      }

      const category = categoryMap.get(categoryName)!;
      category.quantity += item.quantity;
      category.total_amount += item.price * item.quantity;
      category.items.push(productName);
    });

    // Add categories to response
    categoryMap.forEach((value, key) => {
      response[key] = value;
    });

    return response;
  }

  /**
   * Map Order from Prisma to detailed response with all relations
   * Format: { id, invoice_number, date, total_amount, outlet, employee, [category]: { ... } }
   */
  static toOrderDetailResponse(order: {
    id: number;
    invoice_number: string;
    createdAt: Date;
    updatedAt: Date;
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
    items: Array<{
      quantity: number;
      price: number;
      product: {
        name: string;
        category: { name: string } | null;
      } | null;
    }>;
  }): TOrderDetailResponse {
    const response: TOrderDetailResponse = {
      id: order.id,
      invoice_number: order.invoice_number,
      date: order.createdAt.toISOString().split('T')[0],
      total_amount: order.total_amount,
      status: order.status,
      payment_method: order.payment_method,
      outlet: {
        id: order.outlet.id,
        name: order.outlet.name,
        location: order.outlet.location,
        code: order.outlet.code,
      },
      employee: {
        id: order.employee.id,
        name: order.employee.name,
        phone: order.employee.phone,
      },
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    };

    // Group items by category
    const categoryMap = new Map<string, { quantity: number; total_amount: number; items: string[] }>();

    order.items?.forEach((item) => {
      const categoryName = item.product?.category?.name || 'Uncategorized';
      const productName = item.product?.name || 'Unknown Product';

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          quantity: 0,
          total_amount: 0,
          items: [],
        });
      }

      const category = categoryMap.get(categoryName)!;
      category.quantity += item.quantity;
      category.total_amount += item.price * item.quantity;
      category.items.push(productName);
    });

    // Add categories to response
    categoryMap.forEach((value, key) => {
      response[key] = value;
    });

    return response;
  }

  /**
   * Map Order from Prisma to "My Orders" response with nested items
   * Format: { id, invoice_number, date, employee, outlet, items: [...] }
   */
  static toMyOrderResponse(order: {
    id: number;
    invoice_number: string;
    createdAt: Date;
    payment_method: string;
    employee: {
      id: number;
      name: string;
    };
    outlet: {
      id: number;
      name: string;
      location: string;
    };
    items: Array<{
      id: number;
      product_id: number;
      quantity: number;
      price: number;
      product: {
        name: string;
        image_path?: string | null;
      } | null;
      sub_items?: Array<{
        id: number;
        product_id: number;
        quantity: number;
        price: number;
        product: {
          name: string;
          image_path?: string | null;
        } | null;
      }>;
    }>;
  }): TMyOrderResponse {
    const mappedItems = order.items.map(item => {
      // Map sub items (children) jika ada
      const subItems = item.sub_items?.map(subItem => {
        const subItemPrice = subItem.price;
        const subItemTotalPrice = subItemPrice;
        
        return {
          id: subItem.id,
          product_id: subItem.product_id,
          quantity: subItem.quantity,
          price: subItemPrice,
          total_price: subItemTotalPrice,
          product_name: subItem.product?.name,
          image_path: subItem.product?.image_path || null,
        };
      }) || [];

      // Calculate parent item prices
      const itemPrice = item.price;
      const subTotalPrice = subItems.reduce((sum, subItem) => sum + subItem.total_price, 0);
      const totalPrice = itemPrice + subTotalPrice;

      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: itemPrice,
        sub_total_price: subTotalPrice,
        total_price: totalPrice,
        product_name: item.product?.name,
        image_path: item.product?.image_path || null,
        sub_items: subItems.length > 0 ? subItems : undefined,
      };
    });

    // Calculate total price (sum of all items total_price)
    const orderTotalPrice = mappedItems.reduce((sum, item) => sum + item.total_price, 0);

    return {
      id: order.id,
      invoice_number: order.invoice_number,
      date: order.createdAt.toISOString(), // Full timestamp with time
      payment_method: order.payment_method,
      total_price: orderTotalPrice,
      employee: {
        id: order.employee.id,
        name: order.employee.name,
      },
      outlet: {
        id: order.outlet.id,
        name: order.outlet.name,
        location: order.outlet.location,
      },
      items: mappedItems,
    };
  }
}


