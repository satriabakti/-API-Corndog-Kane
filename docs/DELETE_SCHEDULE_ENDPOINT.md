# Delete Schedule Endpoint Implementation

## Overview
New endpoint to delete employee schedules (assignments) for a specific outlet on a specific date.

## Endpoint
```
DELETE /schedule/:date/:outlet_id
```

## URL Parameters
- `date` - The date in ISO format (e.g., "2024-01-15")
- `outlet_id` - The outlet ID (numeric)

## Request Example
```bash
curl -X DELETE http://localhost:3000/api/v1/outlets/schedule/2024-01-15/10
```

## Response Examples

### Success Response (200)
```json
{
  "success": true,
  "message": "Successfully deleted 2 schedule(s)",
  "data": {
    "deleted_count": 2
  },
  "metadata": {}
}
```

### Not Found - Outlet (404)
```json
{
  "success": false,
  "message": "Outlet not found",
  "data": {},
  "metadata": {},
  "errors": [
    {
      "field": "outlet_id",
      "message": "Outlet not found",
      "type": "not_found"
    }
  ]
}
```

### Not Found - Schedule (404)
```json
{
  "success": false,
  "message": "No schedule found for this date",
  "data": {},
  "metadata": {},
  "errors": [
    {
      "field": "date",
      "message": "No schedule found for this date",
      "type": "not_found"
    }
  ]
}
```

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "date",
      "message": "Invalid date format"
    }
  ]
}
```

## Implementation Details

### Files Modified/Created

1. **Repository Layer**
   - File: `src/adapters/postgres/repositories/OutletRepository.ts`
   - New Method: `deleteAssignmentsByOutletAndDate(outletId, date)`
   - Returns: Number of deleted records
   - Logic: Deletes all `outletEmployee` records matching outlet_id and date range (00:00:00 - 23:59:59)

2. **Service Layer**
   - File: `src/core/services/OutletService.ts`
   - New Method: `deleteScheduleByOutletAndDate(outletId, date)`
   - Delegates to repository method

3. **Validation Layer**
   - File: `src/transports/api/validations/schedule-delete.validation.ts` (NEW)
   - Schema: `deleteScheduleSchema`
   - Validates:
     - `date`: Must be valid ISO date format
     - `outlet_id`: Must be numeric string

4. **Controller Layer**
   - File: `src/transports/api/controllers/OutletController.ts`
   - New Method: `deleteSchedule(req, res)`
   - Flow:
     1. Parse outlet_id and date from params
     2. Validate outlet exists
     3. Call service to delete schedules
     4. Return appropriate response based on result

5. **Router Layer**
   - File: `src/transports/api/routers/v1/outlet.ts`
   - New Route: `DELETE /schedule/:date/:outlet_id`
   - Uses validation middleware with `deleteScheduleSchema`

## Business Logic

### Date Matching
The system deletes all assignments where:
- `outlet_id` matches exactly
- `assigned_at` is within the date range (start of day to end of day)

Example:
- Request: `DELETE /schedule/2024-01-15/10`
- Matches: All assignments where outlet_id=10 AND assigned_at between "2024-01-15 00:00:00" and "2024-01-15 23:59:59"

### Multiple Deletions
If multiple employees are assigned to the same outlet on the same date, all assignments will be deleted.

### Response Count
The `deleted_count` in the response indicates how many schedule records were removed.

## Testing Scenarios

### Test 1: Delete Single Schedule
```bash
# Setup: Create assignment for outlet 10, employee 25 on 2024-01-15
POST /outlets/10/employee/25
{
  "date": "2024-01-15"
}

# Delete the schedule
DELETE /schedule/2024-01-15/10

# Expected: deleted_count = 1
```

### Test 2: Delete Multiple Schedules (Same Date)
```bash
# Setup: Create assignments for same outlet, same date, different employees
POST /outlets/10/employee/25 { "date": "2024-01-15" }
POST /outlets/10/employee/30 { "date": "2024-01-15" }

# Delete all schedules for that date
DELETE /schedule/2024-01-15/10

# Expected: deleted_count = 2
```

### Test 3: Delete Non-Existent Schedule
```bash
DELETE /schedule/2024-01-15/10

# Expected: 404 "No schedule found for this date"
```

### Test 4: Delete with Invalid Outlet
```bash
DELETE /schedule/2024-01-15/999

# Expected: 404 "Outlet not found"
```

### Test 5: Invalid Date Format
```bash
DELETE /schedule/invalid-date/10

# Expected: 400 "Invalid date format"
```

### Test 6: Week Assignment Deletion
```bash
# Setup: Create week assignment (Jan 15-20)
POST /outlets/10/employee/25 
{
  "date": "2024-01-15",
  "is_for_one_week": true
}

# Delete only Monday's schedule
DELETE /schedule/2024-01-15/10
# Expected: deleted_count = 1 (only Monday deleted)

# To delete all week schedules, call for each date:
DELETE /schedule/2024-01-15/10
DELETE /schedule/2024-01-16/10
DELETE /schedule/2024-01-17/10
# ... etc
```

## Notes

- The endpoint deletes records permanently from the database
- There is no soft-delete or archive functionality
- Attendance records are NOT affected by this deletion
- The deletion is atomic - either all matching records are deleted or none
- Date comparison uses local time (start and end of day)
- The endpoint is idempotent - calling it multiple times with same params produces same result

## Future Enhancements

Potential improvements:
1. Soft delete with `deleted_at` timestamp
2. Bulk delete endpoint accepting date ranges
3. Cascade delete option for related attendance records
4. Audit log for deletion tracking
5. Permission-based access control
