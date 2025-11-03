/**
 * Utility class for common database-to-domain mapping operations
 */
export class MapperUtil {
  /**
   * Convert numeric ID to string
   */
  static mapId(id: number | string): string {
    return typeof id === 'number' ? id.toString() : id;
  }

  /**
   * Convert snake_case to camelCase field mapping
   */
  static snakeToCamel(snakeCase: string): string {
    return snakeCase.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert camelCase to snake_case field mapping
   */
  static camelToSnake(camelCase: string): string {
    return camelCase.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Map common database fields to domain entity fields
   */
  static mapCommonFields(dbRecord: {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    is_active?: boolean;
  }): {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    isActive?: boolean;
  } {
    return {
      id: this.mapId(dbRecord.id),
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
      ...(dbRecord.is_active !== undefined && { isActive: dbRecord.is_active }),
    };
  }

  /**
   * Handle nullable string fields with default empty string
   */
  static mapNullableString(value: string | null, defaultValue: string = ''): string {
    return value ?? defaultValue;
  }

  /**
   * Handle nullable number fields
   */
  static mapNullableNumber(value: number | null, defaultValue: number = 0): number {
    return value ?? defaultValue;
  }

  /**
   * Map boolean fields from database to domain
   */
  static mapBoolean(value: boolean | null, defaultValue: boolean = false): boolean {
    return value ?? defaultValue;
  }

  /**
   * Map date fields, handling null values
   */
  static mapDate(value: Date | null): Date | null {
    return value;
  }

  /**
   * Generic mapper for relations with common fields
   */
  static mapRelation<TInput, TOutput>(
    relation: TInput | null | undefined,
    mapper: (rel: TInput) => TOutput
  ): TOutput | null {
    return relation ? mapper(relation) : null;
  }

  /**
   * Map array of relations
   */
  static mapRelationArray<TInput, TOutput>(
    relations: TInput[] | null | undefined,
    mapper: (rel: TInput) => TOutput
  ): TOutput[] {
    return relations ? relations.map(mapper) : [];
  }

  /**
   * Convert domain entity fields to database fields for create/update
   */
  static toDatabaseFields<T extends Record<string, unknown>>(domainData: T): Record<string, unknown> {
    const dbData: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(domainData)) {
      if (value === undefined) continue;
      
      // Convert camelCase to snake_case
      const snakeKey = this.camelToSnake(key);
      
      // Convert string IDs to numbers if the key ends with _id
      if (snakeKey.endsWith('_id') && typeof value === 'string') {
        dbData[snakeKey] = parseInt(value);
      } else {
        dbData[snakeKey] = value;
      }
    }
    
    return dbData;
  }

  /**
   * Extract ID from relation object or return as is
   */
  static extractRelationId(relation: { id: string | number } | string | number): number {
    if (typeof relation === 'object' && 'id' in relation) {
      return typeof relation.id === 'string' ? parseInt(relation.id) : relation.id;
    }
    return typeof relation === 'string' ? parseInt(relation) : relation;
  }
}
