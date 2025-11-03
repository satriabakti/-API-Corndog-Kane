import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

export const OrderMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'id', entityField: 'id' },
    { dbField: 'outlet_id', entityField: 'outletId' },
    { dbField: 'outlet_location', entityField: 'outletLocation' },
    { dbField: 'invoice_number', entityField: 'invoiceNumber' },
    { dbField: 'employee_id', entityField: 'employeeId' },
    { dbField: 'payment_method', entityField: 'paymentMethod' },
    { dbField: 'total_amount', entityField: 'totalAmount' },
    { dbField: 'status', entityField: 'status' },
    { dbField: 'is_active', entityField: 'isActive' },
    { dbField: 'created_at', entityField: 'createdAt' },
    { dbField: 'updated_at', entityField: 'updatedAt' },
  ],
  relations: [],
};
