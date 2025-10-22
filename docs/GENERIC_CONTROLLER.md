# Generic Controller Methods

This document explains how to use the generic controller methods for common CRUD operations.

## Overview

The base `Controller` class provides generic methods that can be reused across all entity controllers, eliminating code duplication and ensuring consistency. All CRUD operations (Create, Read, Update, Delete) are now available as generic methods.

## Architecture Pattern

Each CRUD operation follows a consistent two-layer pattern:

1. **Protected Handler Method** (`createXHandler`) - Contains the actual implementation logic
2. **Public Method** - Calls the handler and can be used directly in routes

This pattern allows:
- **Flexibility**: Child controllers can override handlers for custom logic
- **Reusability**: Public methods provide simple API for routes
- **Consistency**: All operations follow the same structure

### Pattern Example

```typescript
// Protected handler - contains implementation
protected createFindAllHandler<E, TResponseItem>(service, mapper) {
  return async (req, res) => {
    // ... implementation logic
  };
}

// Public method - simple interface for routes
findAll<E, TResponseItem>(service, mapper) {
  return this.createFindAllHandler(service, mapper);
}
```

## Available Generic Methods

### CRUD Operations

| Operation | Protected Handler | Public Method | Usage |
|-----------|------------------|---------------|-------|
| **List** | `createFindAllHandler` | `findAll` | List entities with pagination |
| **Create** | `createCreateHandler` | `create` | Create new entity |
| **Update** | `createUpdateHandler` | `update` | Update existing entity |
| **Delete** | `createDeleteHandler` | `delete` | Delete entity by ID |

---

## 1. Generic FindAll Handler

The `createFindAllHandler` method provides a reusable implementation for listing entities with pagination, search, and filtering capabilities.

### Method Signature

```typescript
protected createFindAllHandler<E extends TEntity, TResponseItem>(
  serviceClass: Service<E>,
  mapperClass: ResponseMapper<E, TResponseItem>
): (req: Request, res: Response) => Promise<Response>
```

### Parameters

- **`E extends TEntity`** - The entity type (TUser, TRole, TOutlet, etc.)
- **`TResponseItem`** - The response type for list items
- **`serviceClass`** - Service instance that handles business logic
- **`mapperClass`** - Response mapper with a `toListResponse` method

### Usage Example

#### 1. In RoleController

```typescript
import { Request, Response } from "express";
import RoleRepository from "../../../adapters/postgres/repositories/RoleRepository";
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TRole, TRoleGetResponse } from "../../../core/entities/user/role";
import RoleService from '../../../core/services/RoleService';
import { RoleResponseMapper } from "../../../mappers/response-mappers";
import Controller from "./Controller";

export class RoleController extends Controller<TRoleGetResponse, TMetadataResponse> {
  private roleService: RoleService;

  constructor() {
    super();
    this.roleService = new RoleService(new RoleRepository());
  }

  // Use the generic findAll handler
  findAll = (req: Request, res: Response) => {
    return this.createFindAllHandler<TRole, TRoleGetResponse>(
      this.roleService,
      RoleResponseMapper
    )(req, res);
  };
}
```

#### 2. In UserController

```typescript
export class UserController extends Controller<TUserGetResponse, TMetadataResponse> {
  private userService: UserService;

  constructor() {
    super();
    this.userService = new UserService(new UserRepository());
  }

  // Use the generic findAll handler
  findAll = (req: Request, res: Response) => {
    return this.createFindAllHandler<TUser, TUserGetResponse>(
      this.userService,
      UserResponseMapper
    )(req, res);
  };
}
```

### Features

The generic `findAll` handler automatically handles:

1. **Pagination**
   - `page` query parameter (default: 1)
   - `limit` query parameter (default: 10)

2. **Search**
   - `search_key` - Field name to search in
   - `search_value` - Value to search for
   - Example: `?search_key=name&search_value=John`

3. **Filtering**
   - Any additional query parameters are treated as filters
   - Example: `?is_active=true&role_id=1`

4. **Response Mapping**
   - Automatically maps entities to response format using the provided mapper

5. **Error Handling**
   - Catches all errors
   - Returns proper HTTP status codes
   - Includes Prisma error handling

### Request Example

```bash
GET /api/v1/roles?page=1&limit=10&is_active=true&search_key=name&search_value=Admin
```

### Response Format

**Success (200 OK):**
```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "data": [
    {
      "id": "uuid-here",
      "name": "Admin",
      "description": "Administrator role",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total_records": 1,
    "total_pages": 1
  }
}
```

**Error (500 Internal Server Error):**
```json
{
  "status": "failed",
  "message": "Failed to retrieve data",
  "data": [],
  "errors": [
    {
      "field": "server",
      "message": "Failed to retrieve data",
      "type": "internal_error"
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total_records": 0,
    "total_pages": 0
  }
}
```

## Response Mapper Requirements

For the generic handler to work, your response mapper must implement the `ResponseMapper` interface:

```typescript
interface ResponseMapper<TEntity, TResponse> {
  toListResponse(entity: TEntity): TResponse;
}
```

### Example: RoleResponseMapper

```typescript
import { TRole, TRoleGetResponse } from "../../core/entities/user/role";

export class RoleResponseMapper {
  static toListResponse(role: TRole): TRoleGetResponse {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      is_active: role.isActive,
      created_at: role.createdAt,
      updated_at: role.updatedAt,
    };
  }
}
```

## Benefits

1. **Code Reusability** - Write once, use everywhere
2. **Consistency** - All list endpoints follow the same pattern
3. **Type Safety** - Full TypeScript type checking
4. **Maintainability** - Changes to the pattern only need to be made in one place
5. **Error Handling** - Automatic Prisma error handling included
6. **Validation** - Can be combined with Zod validation middleware

## Integration with Validation

The generic handler works seamlessly with the validation middleware:

```typescript
import { validate } from '../../validations/validate.middleware';
import { getRolesSchema } from '../../validations/role.validation';

// In router
router.get('/', validate(getRolesSchema), roleController.findAll);
```

## Future Generic Methods

## 2. Generic Create Handler

### Method Signature

```typescript
create<E extends TEntity, TResponseItem>(
  serviceClass: Service<E>,
  mapperClass: ResponseMapper<E, TResponseItem>,
  successMessage?: string
): (req: Request, res: Response) => Promise<Response>
```

### Parameters

- **`serviceClass`** - Service instance that handles business logic
- **`mapperClass`** - Response mapper with a `toListResponse` method
- **`successMessage`** - Optional custom success message (default: "Data created successfully")

### Usage Example

```typescript
// In user.ts router
router.post('/', 
  validate(createUserSchema), 
  userController.create(userService, UserResponseMapper, 'User created successfully')
);

// In role.ts router
router.post('/', 
  validate(createRoleSchema), 
  roleController.create(roleService, RoleResponseMapper, 'Role created successfully')
);
```

### Request Example

```bash
POST /api/v1/users
Content-Type: application/json

{
  "name": "John Doe",
  "username": "johndoe",
  "password": "Test1234",
  "role_id": 1,
  "is_active": true
}
```

### Response Format

**Success (200 OK):**
```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "id": "uuid-here",
    "name": "John Doe",
    "username": "johndoe",
    "role_id": 1,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "metadata": {}
}
```

**Error (409 Conflict - Duplicate):**
```json
{
  "status": "failed",
  "message": "Failed to create data",
  "data": {},
  "errors": [
    {
      "field": "username",
      "message": "Unique constraint failed on the fields: (`username`)",
      "type": "unique_constraint"
    }
  ],
  "metadata": {}
}
```

---

## 3. Generic Update Handler

### Method Signature

```typescript
update<E extends TEntity, TResponseItem>(
  serviceClass: Service<E>,
  mapperClass: ResponseMapper<E, TResponseItem>,
  successMessage?: string
): (req: Request, res: Response) => Promise<Response>
```

### Parameters

- **`serviceClass`** - Service instance that handles business logic
- **`mapperClass`** - Response mapper with a `toListResponse` method
- **`successMessage`** - Optional custom success message (default: "Data updated successfully")

### Usage Example

```typescript
// In user.ts router
router.put('/:id', 
  validate(updateUserSchema), 
  userController.update(userService, UserResponseMapper, 'User updated successfully')
);

// In role.ts router
router.put('/:id', 
  validate(updateRoleSchema), 
  roleController.update(roleService, RoleResponseMapper, 'Role updated successfully')
);
```

### Request Example

```bash
PUT /api/v1/users/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "name": "John Smith",
  "is_active": false
}
```

### Response Format

**Success (200 OK):**
```json
{
  "status": "success",
  "message": "User updated successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Smith",
    "username": "johndoe",
    "role_id": 1,
    "is_active": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T00:00:00Z"
  },
  "metadata": {}
}
```

**Error (404 Not Found):**
```json
{
  "status": "failed",
  "message": "Data not found",
  "data": {},
  "errors": [
    {
      "field": "id",
      "message": "Data not found",
      "type": "not_found"
    }
  ],
  "metadata": {}
}
```

---

## 4. Generic Delete Handler

### Method Signature

```typescript
delete<E extends TEntity>(
  serviceClass: Service<E>,
  successMessage?: string
): (req: Request, res: Response) => Promise<Response>
```

### Parameters

- **`serviceClass`** - Service instance that handles business logic
- **`successMessage`** - Optional custom success message (default: "Data deleted successfully")

**Note:** Delete doesn't need a mapper since it returns an empty data object.

### Usage Example

```typescript
// In user.ts router
router.delete('/:id', 
  validate(deleteUserSchema), 
  userController.delete(userService, 'User deleted successfully')
);

// In role.ts router
router.delete('/:id', 
  validate(deleteRoleSchema), 
  roleController.delete(roleService, 'Role deleted successfully')
);
```

### Request Example

```bash
DELETE /api/v1/users/123e4567-e89b-12d3-a456-426614174000
```

### Response Format

**Success (200 OK):**
```json
{
  "status": "success",
  "message": "User deleted successfully",
  "data": {},
  "metadata": {}
}
```

**Error (404 Not Found):**
```json
{
  "status": "failed",
  "message": "Failed to delete data",
  "data": {},
  "errors": [
    {
      "field": "id",
      "message": "Record to delete does not exist.",
      "type": "not_found"
    }
  ],
  "metadata": {}
}
```

---

## Complete Router Example

Here's a complete example showing all generic methods in use:

```typescript
import express from 'express';
import { UserController } from '../../controllers';
import { validate } from '../../validations/validate.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserByIdSchema,
  deleteUserSchema,
  getUsersSchema
} from '../../validations/user.validation';
import UserService from '../../../../core/services/UserService';
import { UserResponseMapper } from '../../../../mappers/response-mappers';
import UserRepository from '../../../../adapters/postgres/repositories/UserRepository';

const router = express.Router();

const userController = new UserController();
const userService = new UserService(new UserRepository());

// List all users with pagination
router.get('/', 
  validate(getUsersSchema), 
  userController.findAll(userService, UserResponseMapper)
);

// Get user by ID (custom method in UserController)
router.get('/:id', 
  validate(getUserByIdSchema), 
  userController.findById
);

// Create new user
router.post('/', 
  validate(createUserSchema), 
  userController.create(userService, UserResponseMapper, 'User created successfully')
);

// Update existing user
router.put('/:id', 
  validate(updateUserSchema), 
  userController.update(userService, UserResponseMapper, 'User updated successfully')
);

// Delete user
router.delete('/:id', 
  validate(deleteUserSchema), 
  userController.delete(userService, 'User deleted successfully')
);

export default router;
```

---

## Controller Implementation

Controllers no longer need to implement CRUD methods. They inherit everything from the base Controller:

```typescript
import RoleRepository from "../../../adapters/postgres/repositories/RoleRepository";
import { TMetadataResponse } from "../../../core/entities/base/response";
import { TRoleGetResponse } from "../../../core/entities/user/role";
import RoleService from '../../../core/services/RoleService';
import Controller from "./Controller";

export class RoleController extends Controller<TRoleGetResponse, TMetadataResponse> {
  private roleService: RoleService;

  constructor() {
    super();
    this.roleService = new RoleService(new RoleRepository());
  }

  // All CRUD methods (findAll, create, update, delete) are inherited
  // They can be called from routes by passing service and mapper
  
  // Only implement custom methods here (e.g., findById with special logic)
}
```

---

## Future Generic Methods

Planned generic methods for the base Controller:

- `findById` - Get single entity by ID with detailed response
- `bulkCreate` - Create multiple entities at once
- `bulkUpdate` - Update multiple entities at once
- `bulkDelete` - Delete multiple entities at once

These will further reduce code duplication across controllers.

---

## Customizing Generic Methods

The two-layer pattern (handler + public method) allows for easy customization when needed.

### Option 1: Override Handler in Child Controller

If you need custom logic but want to keep the same API:

```typescript
export class UserController extends Controller<TUserGetResponse, TMetadataResponse> {
  private userService: UserService;

  constructor() {
    super();
    this.userService = new UserService(new UserRepository());
  }

  // Override the handler with custom logic
  protected createCreateHandler<E extends TEntity, TResponseItem>(
    serviceClass: Service<E>,
    mapperClass: ResponseMapper<E, TResponseItem>,
    successMessage: string = "User created successfully"
  ) {
    return async (req: Request, res: Response) => {
      try {
        // Custom pre-creation logic
        const userData = req.body;
        userData.created_by = req.user?.id; // Add creator info
        
        const newEntity = await serviceClass.create(userData as E);
        
        // Custom post-creation logic
        await this.sendWelcomeEmail(newEntity);
        
        return this.getSuccessResponse(
          res,
          {
            data: mapperClass.toListResponse(newEntity) as any,
            metadata: {} as any,
          },
          successMessage
        );
      } catch (error) {
        return this.handleError(
          res,
          error,
          "Failed to create user",
          500,
          {} as any,
          {} as any
        );
      }
    };
  }

  // The public create method still works the same in routes
  // router.post('/', userController.create(userService, UserResponseMapper))
}
```

### Option 2: Create Completely Custom Method

For completely different logic, create a custom method:

```typescript
export class UserController extends Controller<TUserGetResponse, TMetadataResponse> {
  // Custom method with different signature
  findById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await this.userService.findById(id);
    
    if (!user) {
      return this.getFailureResponse(/* ... */);
    }

    // Use detail response instead of list response
    return this.getSuccessResponse(
      res,
      { data: UserResponseMapper.toDetailResponse(user), metadata: {} },
      'User retrieved successfully'
    );
  };

  // Called in routes: router.get('/:id', userController.findById)
}
```

### Option 3: Use Handler Directly in Child Controller

Call handler methods directly for route-level customization:

```typescript
export class RoleController extends Controller<TRoleGetResponse, TMetadataResponse> {
  private roleService: RoleService;

  constructor() {
    super();
    this.roleService = new RoleService(new RoleRepository());
  }

  // Use handler directly with pre-initialized service
  findAll = (req: Request, res: Response) => {
    return this.createFindAllHandler<TRole, TRoleGetResponse>(
      this.roleService,
      RoleResponseMapper
    )(req, res);
  };

  // Called in routes: router.get('/', roleController.findAll)
}
```

---

## Method Signatures Reference

### Protected Handlers (Override in Child Classes)

```typescript
// List entities with pagination
protected createFindAllHandler<E extends TEntity, TResponseItem>(
  serviceClass: Service<E>,
  mapperClass: ResponseMapper<E, TResponseItem>
): (req: Request, res: Response) => Promise<Response>

// Create entity
protected createCreateHandler<E extends TEntity, TResponseItem>(
  serviceClass: Service<E>,
  mapperClass: ResponseMapper<E, TResponseItem>,
  successMessage?: string
): (req: Request, res: Response) => Promise<Response>

// Update entity
protected createUpdateHandler<E extends TEntity, TResponseItem>(
  serviceClass: Service<E>,
  mapperClass: ResponseMapper<E, TResponseItem>,
  successMessage?: string
): (req: Request, res: Response) => Promise<Response>

// Delete entity
protected createDeleteHandler<E extends TEntity>(
  serviceClass: Service<E>,
  successMessage?: string
): (req: Request, res: Response) => Promise<Response>
```

### Public Methods (Use in Routes)

```typescript
// List entities
findAll<E extends TEntity, TResponseItem>(
  serviceClass: Service<E>,
  mapperClass: ResponseMapper<E, TResponseItem>
): (req: Request, res: Response) => Promise<Response>

// Create entity
create<E extends TEntity, TResponseItem>(
  serviceClass: Service<E>,
  mapperClass: ResponseMapper<E, TResponseItem>,
  successMessage?: string
): (req: Request, res: Response) => Promise<Response>

// Update entity
update<E extends TEntity, TResponseItem>(
  serviceClass: Service<E>,
  mapperClass: ResponseMapper<E, TResponseItem>,
  successMessage?: string
): (req: Request, res: Response) => Promise<Response>

// Delete entity
delete<E extends TEntity>(
  serviceClass: Service<E>,
  successMessage?: string
): (req: Request, res: Response) => Promise<Response>
```

---

## Migration Guide

To migrate existing controllers to use the generic handler:

1. **Keep your service and mapper:**
   ```typescript
   private roleService: RoleService;
   constructor() {
     super();
     this.roleService = new RoleService(new RoleRepository());
   }
   ```

2. **Replace custom findAll with generic handler:**
   ```typescript
   // Before:
   findAll = async (req: Request, res: Response) => {
     // ... custom pagination logic
     // ... custom mapping logic
     // ... custom error handling
   };

   // After:
   findAll = (req: Request, res: Response) => {
     return this.createFindAllHandler<TRole, TRoleGetResponse>(
       this.roleService,
       RoleResponseMapper
     )(req, res);
   };
   ```

3. **Ensure your mapper has toListResponse method:**
   ```typescript
   export class YourResponseMapper {
     static toListResponse(entity: YourEntity): YourResponse {
       return {
         // ... mapping logic
       };
     }
   }
   ```

4. **Test the endpoint** to ensure it works as expected

## Notes

- The generic handler uses `any` types internally for maximum flexibility
- All query parameters are automatically parsed and passed to the service
- The method returns proper HTTP status codes based on success/failure
- Error messages can be customized by catching and re-throwing in controllers if needed
