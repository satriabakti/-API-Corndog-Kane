import { MapperUtil } from "../MapperUtil";
import { EntityMapConfig } from "../../adapters/postgres/repositories/Repository";

/**
 * Outlet entity mapping configuration
 */
export const OutletMapperEntity: EntityMapConfig = {
  fields: [
    { dbField: 'id', entityField: 'id', transform: (v) => MapperUtil.mapId(v as number) },
    { dbField: 'name', entityField: 'name' },
    { dbField: 'address', entityField: 'address', transform: (v) => MapperUtil.mapNullableString(v as string | null) },
    { dbField: 'phone', entityField: 'phone', transform: (v) => MapperUtil.mapNullableString(v as string | null) },
    {dbField:"code", entityField:"code", transform: (v) => MapperUtil.mapNullableString(v as string | null)},
    {dbField:"pic_phone", entityField:"picPhone", transform: (v) => MapperUtil.mapNullableString(v as string | null)},
    { dbField: 'description', entityField: 'description', transform: (v) => MapperUtil.mapNullableString(v as string | null) },
    { dbField: 'location', entityField: 'location' },
    { dbField: 'check_in_time', entityField: 'checkinTime', transform: (v) => MapperUtil.mapDate(v as Date) },
    { dbField: 'check_out_time', entityField: 'checkoutTime', transform: (v) => MapperUtil.mapDate(v as Date) },
    { dbField: 'salary', entityField: 'salary', transform: (v) => MapperUtil.mapNullableNumber(v as number) },
    { dbField: 'income_target', entityField: 'incomeTarget', transform: (v) => MapperUtil.mapNullableNumber(v as number) },
    { dbField: 'user_id', entityField: 'userId', transform: (v) => MapperUtil.mapId(v as number) },
    { dbField: 'is_active', entityField: 'isActive' },
    { dbField: 'createdAt', entityField: 'createdAt' },
    { dbField: 'updatedAt', entityField: 'updatedAt' },
  ],
  relations: [
   
    {
      dbField: 'user',
      entityField: 'user',
      mapper: (rel) => {
        const user = rel as {
          id: number;
          username: string;
          name: string | null;
          is_active: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
        return {
          id: MapperUtil.mapId(user.id),
          username: user.username,
          name: MapperUtil.mapNullableString(user.name),
          isActive: user.is_active,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      },
    },
    {
      dbField: "settings",
      entityField: "setting", 
      isArray: true,
      include:true,
      
      mapper: (rel) => {
        const settings = rel as {
          check_in_time: string,
          check_out_time: string,
          day: string[]
        }
        return {
          checkin_time: settings.check_in_time,
          checkout_time:settings.check_out_time, 
          days:settings.day
        }
      }
    }
  ],
};
