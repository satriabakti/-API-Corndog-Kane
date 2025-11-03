import { TOrder } from "../entities/order/order";
import Repository from "./Repository";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface OrderRepository extends Repository<TOrder> {}
