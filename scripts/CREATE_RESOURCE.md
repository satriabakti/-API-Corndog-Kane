# Resource Management Scripts

Automatically generate and remove complete resources with all necessary files following the project's patterns.

## Generate Resource

### Usage

```bash
npm run generate:resource -- --name=<resource-name>
```

### Example

```bash
npm run generate:resource -- --name=material
```

This will create a "Material" resource with consistent naming across all files.

## Remove Resource

### Usage

```bash
npm run remove:resource -- --name=<resource-name>
```

### Example

```bash
npm run remove:resource -- --name=material
```

This will remove all files related to the "Material" resource and clean up index files.

## What Generate Creates

The script will generate:

1. **Entity Type** - `src/core/entities/{resource}/{resource}.ts`
   - Main type definitions (TMaterial, TMaterialWithID, etc.)
   - WithID, Create, Update variants
   - Request/Response types

2. **Repository Interface** - `src/core/repositories/{resource}.ts`
   - Repository interface extending base Repository (MaterialRepository)

3. **Repository Adapter** - `src/adapters/postgres/repositories/{Resource}Repository.ts`
   - Concrete implementation using Prisma (MaterialRepository class)

4. **Service** - `src/core/services/{Resource}Service.ts`
   - Business logic layer (MaterialService)

5. **Entity Mapper** - `src/mappers/mappers/{Resource}MapperEntity.ts`
   - Maps database fields to entity fields (MaterialMapperEntity)

6. **Response Mapper** - `src/mappers/response-mappers/{Resource}ResponseMapper.ts`
   - Formats entity data for API responses (MaterialResponseMapper)

7. **Validation Schema** - `src/transports/api/validations/{resource}.validation.ts`
   - Zod schemas for create, update, delete operations (material.validation.ts)

8. **Controller** - `src/transports/api/controllers/{Resource}Controller.ts`
   - HTTP request handlers (MaterialController)

9. **Router** - `src/transports/api/routers/v1/{resource}.ts`
   - API route definitions with CRUD endpoints (material.ts)

10. **Auto-updates** index files for controllers, mappers, and entity mappers

## Output Example

```
🚀 Create New Resource

📝 Creating resource: Material
Fields: name: string, description: string, isActive: boolean, createdAt: Date, updatedAt: Date

✅ Created: src/core/entities/material/material.ts
✅ Created: src/core/repositories/material.ts
✅ Created: src/adapters/postgres/repositories/MaterialRepository.ts
✅ Created: src/core/services/MaterialService.ts
✅ Created: src/mappers/mappers/MaterialMapperEntity.ts
✅ Created: src/mappers/response-mappers/MaterialResponseMapper.ts
✅ Created: src/transports/api/validations/material.validation.ts
✅ Created: src/transports/api/controllers/MaterialController.ts
✅ Created: src/transports/api/routers/v1/material.ts
✅ Updated: src/transports/api/controllers/index.ts
✅ Updated: src/mappers/response-mappers/index.ts
✅ Updated: src/mappers/EntityMappers.ts

✅ Resource created successfully!

📝 Next steps:
1. Update src/transports/api/routers/v1/index.ts to import the new router
2. Run: npm run build
3. Test your endpoints!
```

## Default Fields

By default, each resource includes:
- `name: string` - Resource name
- `description: string` - Resource description
- `isActive: boolean` - Active status
- `createdAt: Date` - Creation timestamp
- `updatedAt: Date` - Last update timestamp

## Generated API Endpoints

After creation, you'll have these endpoints:

- `GET /api/v1/{resource}` - List all (with pagination)
- `POST /api/v1/{resource}` - Create new
- `PUT /api/v1/{resource}/:id` - Update existing
- `DELETE /api/v1/{resource}/:id` - Delete

## Next Steps

After running the script:

1. **Register the router** in `src/transports/api/routers/v1/index.ts`:
   ```typescript
   import customerRouter from './customer';
   // ...
   router.use('/customers', customerRouter);
   ```

2. **Create database migration** (if using Prisma):
   ```bash
   npm run prisma:migrate
   ```

3. **Build and test**:
   ```bash
   npm run build
   npm start
   ```

## What Remove Deletes

The `remove:resource` command will:

1. Delete all 9 generated files:
   - Entity types directory
   - Repository interface
   - Repository adapter
   - Service
   - Entity mapper
   - Response mapper
   - Validation schema
   - Controller
   - Router

2. Remove exports from index files:
   - `src/transports/api/controllers/index.ts`
   - `src/mappers/response-mappers/index.ts`
   - `src/mappers/EntityMappers.ts`

3. Remove type definitions from:
   - `src/adapters/postgres/repositories/Repository.ts` (TEntity type)

**Note**: You'll need to manually remove:
- Router import from `src/transports/api/routers/v1/index.ts`
- Prisma model from schema file (if exists)

## Code Patterns

The generated code follows these patterns:

- ✅ Hexagonal Architecture (Ports & Adapters)
- ✅ Repository Pattern
- ✅ Service Layer Pattern
- ✅ DTO (Data Transfer Objects) with mappers
- ✅ Validation with Zod
- ✅ Consistent naming conventions
- ✅ TypeScript strict types

## Customization

After generation, you can customize:

- Add custom methods to Service
- Add relations to Entity Mapper
- Add custom validation rules
- Add custom controller methods
- Extend the generated code as needed

All generated code follows the same patterns as existing resources (supplier, role, user, etc.).
