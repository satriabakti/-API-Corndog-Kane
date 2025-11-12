# Employee Assignment Implementation Summary

## Overview
This document summarizes the implementation of the complex employee assignment feature with conflict resolution, week/month scheduling, and automatic attendance creation.

## API Endpoint
```
POST /outlets/:id/employee/:employeeid
```

## Request Body
```json
{
  "date": "2024-01-15",
  "is_for_one_week": false,
  "is_for_one_month": false,
  "previous_status": "SICK",
  "notes": "Emergency replacement"
}
```

### Request Fields
- `date` (required): Starting date for the assignment
- `is_for_one_week` (optional, default: false): Assign for full week ending on Saturday
- `is_for_one_month` (optional, default: false): Assign for full month ending on last Saturday
- `previous_status` (optional): Status of employee being replaced (`SICK`, `PRESENT`, `NOT_PRESENT`, `EXCUSED`, `CUTI`)
- `notes` (optional): Additional notes for the assignment

## Response Format
```json
{
  "data": [
    {
      "id": 1,
      "outlet_id": 10,
      "employee_id": 25,
      "date": "2024-01-15"
    }
  ],
  "metadata": {
    "total": 7,
    "attendances_created": 1,
    "action": "replace"
  }
}
```

### Response Fields
- `data`: Array of assignment records created
- `metadata.total`: Number of assignments created
- `metadata.attendances_created`: Number of attendance records created
- `metadata.action`: Type of operation performed (`simple`, `swap`, `replace`)

## Business Logic

### Date Range Calculation
1. **Single Date Assignment**: If both `is_for_one_week` and `is_for_one_month` are false
   - Only the specified date is assigned

2. **One Week Assignment**: If `is_for_one_week` is true
   - Calculates from start_date to next Saturday
   - Example: Jan 15 (Monday) → ends Jan 20 (Saturday)

3. **One Month Assignment**: If `is_for_one_month` is true
   - Calculates from start_date to last Saturday of the month
   - Example: Jan 15 → ends Jan 27 (last Saturday of January)

### Conflict Resolution Scenarios

For each date in the range, the system checks for existing assignments:

#### Scenario 1: No Conflict
- **Condition**: No existing assignment for this outlet on this date
- **Action**: Create simple assignment
- **Result**: Single assignment record created

#### Scenario 2: Replace with Status (SICK/NOT_PRESENT/EXCUSED/CUTI)
- **Condition**: 
  - Existing assignment exists
  - `previous_status` is provided and NOT `PRESENT`
  - No PRESENT attendance exists for the old employee
- **Action**: 
  1. Delete old assignment
  2. Create new assignment for new employee
  3. Create attendance record for old employee with:
     - status = `previous_status`
     - checkin_image_proof = `"SYSTEM_GENERATED_PLACEHOLDER"`
     - checkout_image_proof = `"SYSTEM_GENERATED_PLACEHOLDER"`
     - late_notes = `notes` from request
- **Result**: New assignment + attendance record

#### Scenario 3: Swap Employees (PRESENT status)
- **Condition**:
  - Existing assignment exists
  - `previous_status` = `PRESENT`
  - No PRESENT attendance for either employee
- **Action**:
  1. Find new employee's current assignment for same date
  2. Swap outlet_id values in both assignments atomically
- **Result**: Both assignments updated (employees swapped between outlets)

### Protection Rules

1. **PRESENT Attendance Protection**
   - If old employee has PRESENT attendance on date, reassignment is blocked
   - Error: `"Cannot reassign employee X from outlet Y on date Z: employee has already marked attendance as PRESENT"`

2. **Atomic Transactions**
   - All swap and replace operations use Prisma transactions
   - Ensures data consistency if any operation fails

## Implementation Files

### 1. Validation Layer
**File**: `src/transports/api/validations/outlet-assignment.validation.ts`
- Added 4 new optional fields to schema
- Validates previous_status enum values
- Uses Zod for type-safe validation

### 2. Utility Layer
**File**: `src/core/utils/dateHelper.ts`
- `getNextSaturday(date)`: Finds next Saturday from given date
- `getLastSaturdayOfMonth(date)`: Finds last Saturday of month
- `generateDateRange(start, end)`: Creates array of dates
- `normalizeToStartOfDay(date)`: Sets time to 00:00:00.000
- `normalizeToEndOfDay(date)`: Sets time to 23:59:59.999

### 3. Repository Layer
**File**: `src/adapters/postgres/repositories/OutletRepository.ts`

New methods added:
- `findAssignmentByOutletAndDate()`: Detects existing assignments
- `findAttendanceByEmployeeOutletDate()`: Checks for PRESENT attendance
- `findEmployeeAssignmentByDate()`: Gets employee's current assignment
- `swapEmployeeAssignments()`: Atomic swap in transaction
- `replaceEmployeeWithAttendance()`: Replace + create attendance in transaction

### 4. Service Layer
**File**: `src/core/services/OutletService.ts`

Updated method:
```typescript
async assignEmployeeToOutletForDates(
  outletId: number,
  employeeId: number,
  startDate: Date,
  isForOneWeek: boolean = false,
  isForOneMonth: boolean = false,
  previousStatus?: 'SICK' | 'PRESENT' | 'NOT_PRESENT' | 'EXCUSED' | 'CUTI',
  notes?: string
): Promise<{
  assignments: OutletAssignment[];
  attendances: Attendance[];
  action: 'simple' | 'swap' | 'replace';
}>
```

Logic flow:
1. Calculate end date based on week/month flags
2. Generate array of dates
3. For each date:
   - Check for conflicts
   - Apply appropriate scenario
   - Collect results
4. Return all assignments and attendances created

### 5. Controller Layer
**File**: `src/transports/api/controllers/OutletController.ts`

Updated:
- Extracts new parameters from request body
- Passes to service layer
- Returns enhanced response with metadata
- Handles PRESENT attendance protection errors

## Testing Scenarios

### Test 1: Single Date Assignment (No Conflict)
```bash
curl -X POST http://localhost:3000/outlets/10/employee/25 \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15"
  }'
```
Expected: Simple assignment created

### Test 2: One Week Assignment
```bash
curl -X POST http://localhost:3000/outlets/10/employee/25 \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "is_for_one_week": true
  }'
```
Expected: 6 assignments created (Mon-Sat)

### Test 3: Replace with SICK Status
```bash
curl -X POST http://localhost:3000/outlets/10/employee/25 \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "previous_status": "SICK",
    "notes": "Employee called in sick"
  }'
```
Expected: Assignment created + attendance record for old employee

### Test 4: Swap Employees
```bash
curl -X POST http://localhost:3000/outlets/10/employee/25 \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "previous_status": "PRESENT"
  }'
```
Expected: Both employees swapped between outlets

### Test 5: Month Assignment
```bash
curl -X POST http://localhost:3000/outlets/10/employee/25 \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-01",
    "is_for_one_month": true
  }'
```
Expected: Assignments from Jan 1 to last Saturday of January

### Test 6: PRESENT Attendance Protection
```bash
# First create assignment and attendance
# Then try to reassign - should fail
curl -X POST http://localhost:3000/outlets/10/employee/25 \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "previous_status": "SICK"
  }'
```
Expected: 400 error "Cannot reassign employee..."

## Database Changes

### Schema Updates
No schema changes required - existing `attendances` table already supports:
- `checkin_image_proof` (nullable String)
- `checkout_image_proof` (nullable String)
- `late_notes` (nullable String)
- `status` (AttendanceStatus enum)

### Placeholder Values
System-generated attendance records use:
```typescript
checkin_image_proof: "SYSTEM_GENERATED_PLACEHOLDER"
checkout_image_proof: "SYSTEM_GENERATED_PLACEHOLDER"
late_notes: notes || null
status: previousStatus
```

## Success Criteria
✅ Week assignments end on Saturday
✅ Month assignments end on last Saturday
✅ Conflict resolution per date
✅ PRESENT attendance protection
✅ Atomic swap transactions
✅ Attendance creation with placeholders
✅ Type-safe implementation
✅ Build verification successful

## Notes
- All operations are atomic using Prisma transactions
- Saturday calculation accounts for timezone
- Date normalization ensures consistent comparisons
- Error messages are descriptive for debugging
- Response includes action type for frontend handling
