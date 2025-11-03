import { MapperUtil } from "./MapperUtil";
import { EntityMapConfig, FieldMapping, RelationMapping } from "../adapters/postgres/repositories/Repository";

/**
 * EntityMapper class handles all mapping logic from database records to domain entities
 * This class is responsible for transforming raw database data into typed entity objects
 */
export class EntityMapper<T, TDbRecord = Record<string, unknown>> {
  private mapConfig: EntityMapConfig;

  constructor(mapConfig: EntityMapConfig) {
    this.mapConfig = mapConfig;
  }

  /**
   * Get Prisma include configuration for relations
   * Automatically generates includes from relations configuration
   */
  public getIncludes(): Record<string, boolean | object> | undefined {
    if (!this.mapConfig.relations || this.mapConfig.relations.length === 0) {
      return undefined;
    }

    const includes: Record<string, boolean> = {};
    for (const relation of this.mapConfig.relations) {
      includes[relation.dbField] = true;
    }
    
    return includes;
  }

  /**
   * Map database record to entity
   * Main entry point for transforming database records
   */
  public mapToEntity(dbRecord: TDbRecord): T {
    const dbData = dbRecord as Record<string, unknown>;
    const entity: Partial<T> = {};

    this.mapFields(dbData, entity);
    this.mapRelations(dbData, entity);

    return entity as T;
  }

  /**
   * Map multiple database records to entities
   */
  public mapToEntities(dbRecords: TDbRecord[]): T[] {
    return dbRecords.map(record => this.mapToEntity(record));
  }

  /**
   * Map database fields to entity fields
   * Iterates through all field mappings and applies transformations
   */
  private mapFields(dbData: Record<string, unknown>, entity: Partial<T>): void {
    for (const fieldMap of this.mapConfig.fields) {
      const dbValue = dbData[fieldMap.dbField];
      entity[fieldMap.entityField as keyof T] = this.transformField(dbValue, fieldMap) as T[keyof T];
    }
  }

  /**
   * Transform a single field value
   * Applies custom transform function if provided, otherwise returns raw value
   */
  private transformField<TValue>(value: TValue, fieldMap: FieldMapping): TValue | unknown {
    return fieldMap.transform ? fieldMap.transform(value) : value;
  }

  /**
   * Map database relations to entity relations
   * Handles both single relations and relation arrays
   */
  private mapRelations(dbData: Record<string, unknown>, entity: Partial<T>): void {
    if (!this.mapConfig.relations) return;

    for (const relationMap of this.mapConfig.relations) {
      const dbRelation = dbData[relationMap.dbField];
      entity[relationMap.entityField as keyof T] = this.transformRelation(dbRelation, relationMap) as T[keyof T];
    }
  }

  /**
   * Transform a single relation value
   * Uses MapperUtil to handle array or single relation mapping
   */
  private transformRelation<TRel>(value: TRel | TRel[], relationMap: RelationMapping): unknown {
    if (relationMap.isArray) {
      return MapperUtil.mapRelationArray(value as TRel[], relationMap.mapper);
    }
    return MapperUtil.mapRelation(value as TRel, relationMap.mapper);
  }
}
