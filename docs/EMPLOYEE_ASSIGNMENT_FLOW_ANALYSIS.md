# Employee Assignment Flow Analysis
**Endpoint**: `POST /outlets/:id/employee/:employeeid`

## Current Implementation Flow

### 1. **Request Parameters**
- `id` (path): Outlet ID
- `employeeid` (path): Employee ID
- `date` (body): Assignment date
- `is_for_one_week` (body): Boolean flag for 7-day assignment

### 2. **Current Logic** (`assignEmployeeToOutlet`)
```
1. Validate outlet exists
2. Validate employee exists
3. Generate assignment dates (1 day or 7 days)
4. For each date:
   - Deactivate existing assignments for SAME outlet + SAME employee + SAME date
   - Create new assignment
5. Return assignments
```

### 3. **Current Issues**
❌ **No conflict detection** for different employees on same outlet + date
❌ **No previous status handling** (SICK, PRESENT, etc.)
❌ **No attendance record creation** when replacing employees
❌ **No employee swap logic** between outlets
❌ **No protection** against updating if attendance already exists with PRESENT status

---

## Required Scenarios

### **Scenario 1: Replace with SICK status**
**Given:**
- Employee A assigned to Outlet A on 10-12-2025
- Employee B assigned to Outlet B on 10-12-2025

**Request:**
```json
POST /outlets/A/employee/B
{
  "date": "2025-12-10",
  "previous_status": "SICK"
}
```

**Expected Behavior:**
1. ✅ Move Employee B from Outlet B to Outlet A
2. ✅ Create attendance record for Employee A with `attendance_status: SICK`
3. ✅ Deactivate Employee A's oldest schedule on Outlet A

---

### **Scenario 2: Swap employees (PRESENT status)**
**Given:**
- Employee A assigned to Outlet A on 10-12-2025
- Employee B assigned to Outlet B on 10-12-2025

**Request:**
```json
POST /outlets/A/employee/B
{
  "date": "2025-12-10",
  "previous_status": "PRESENT"
}
```

**Expected Behavior:**
1. ✅ Move Employee A from Outlet A to Outlet B
2. ✅ Move Employee B from Outlet B to Outlet A
3. ✅ Swap their assignments (mutual exchange)

---

### **Scenario 3: Different date assignment**
**Given:**
- Employee A assigned to Outlet A on 10-12-2025
- Employee B assigned to Outlet B on 12-12-2025 (different date)

**Request:**
```json
POST /outlets/A/employee/B
{
  "date": "2025-12-10",
  "previous_status": "SICK"
}
```

**Expected Behavior:**
1. ✅ Move Employee B to Outlet A on 10-12-2025
2. ✅ Deactivate Employee A's assignment on Outlet A for 10-12-2025
3. ✅ Keep Employee B's assignment on Outlet B for 12-12-2025 (don't remove)

---

## Business Rules

### **Conflict Detection**
When assigning Employee X to Outlet Y on Date Z:

1. **Check existing assignment:**
   ```sql
   SELECT * FROM outlet_employees 
   WHERE outlet_id = Y 
     AND DATE(assigned_at) = DATE(Z)
     AND is_active = true
   ```

2. **If conflict exists (Employee A already assigned):**
   - Apply scenario logic based on `previous_status`

### **Attendance Protection**
**Reject update if:**
```sql
SELECT * FROM attendances
WHERE employee_id = [current_assigned_employee]
  AND outlet_id = Y
  AND DATE(checkin_time) = DATE(Z)
  AND attendance_status = 'PRESENT'
  AND is_active = true
```

If found → Return error:
```json
{
  "success": false,
  "message": "Cannot reassign employee with PRESENT attendance",
  "errors": [{
    "field": "employee_id",
    "message": "Employee has already checked in as PRESENT",
    "type": "attendance_exists"
  }]
}
```

---

## Proposed New Flow

### **Step 1: Validation**
```typescript
1. Validate outlet exists
2. Validate employee (new employee) exists
3. Validate previous_status (SICK, PRESENT, EXCUSED, CUTI, NOT_PRESENT)
4. Normalize date to start of day
```

### **Step 2: Conflict Detection**
```typescript
const existingAssignment = await findAssignment({
  outletId,
  date: targetDate,
  isActive: true
});

if (!existingAssignment) {
  // No conflict - simple assignment
  return createSimpleAssignment();
}
```

### **Step 3: Attendance Protection Check**
```typescript
const existingAttendance = await findAttendance({
  employeeId: existingAssignment.employee_id,
  outletId,
  date: targetDate,
  status: 'PRESENT'
});

if (existingAttendance) {
  throw new Error('Cannot reassign: Employee has PRESENT attendance');
}
```

### **Step 4: Apply Scenario Logic**
```typescript
if (previous_status === 'PRESENT') {
  // Scenario 2: SWAP
  await swapEmployees(
    existingAssignment.employee_id,
    newEmployeeId,
    outletId,
    existingAssignment.outlet_id,
    targetDate
  );
}

if (previous_status === 'SICK' || other_statuses) {
  // Scenario 1 & 3: REPLACE + CREATE ATTENDANCE
  await replaceEmployee(
    existingAssignment.employee_id,
    newEmployeeId,
    outletId,
    targetDate,
    previous_status
  );
}
```

### **Step 5: Return Response**
```typescript
return {
  success: true,
  message: 'Employee assignment updated successfully',
  data: {
    assignment: newAssignment,
    action: 'swap' | 'replace',
    attendance_created: attendanceRecord || null
  }
}
```

---

## Database Transaction Structure

### **For Scenario 1 (Replace with SICK):**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Deactivate old employee's assignment
  await tx.outletEmployee.updateMany({
    where: { outlet_id, employee_id: oldEmployeeId, date: targetDate },
    data: { is_active: false }
  });

  // 2. Create attendance for old employee with SICK status
  await tx.attendance.create({
    data: {
      employee_id: oldEmployeeId,
      outlet_id,
      attendance_status: 'SICK',
      checkin_time: targetDate,
      // ... other required fields
    }
  });

  // 3. Create new assignment for new employee
  await tx.outletEmployee.create({
    data: {
      outlet_id,
      employee_id: newEmployeeId,
      assigned_at: targetDate,
      is_active: true
    }
  });
});
```

### **For Scenario 2 (Swap with PRESENT):**
```typescript
await prisma.$transaction(async (tx) => {
  // Get both employees' current outlets
  const employeeAOutlet = outletA;
  const employeeBOutlet = outletB;

  // 1. Deactivate both current assignments
  await tx.outletEmployee.updateMany({
    where: {
      OR: [
        { outlet_id: employeeAOutlet, employee_id: employeeA, date: targetDate },
        { outlet_id: employeeBOutlet, employee_id: employeeB, date: targetDate }
      ]
    },
    data: { is_active: false }
  });

  // 2. Create swapped assignments
  await tx.outletEmployee.createMany({
    data: [
      { outlet_id: employeeBOutlet, employee_id: employeeA, assigned_at: targetDate },
      { outlet_id: employeeAOutlet, employee_id: employeeB, assigned_at: targetDate }
    ]
  });
});
```

---

## API Changes Required

### **1. Update Validation Schema**
Add `previous_status` field:
```typescript
export const assignEmployeeToOutletSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Outlet ID is required"),
    employeeid: z.string().min(1, "Employee ID is required"),
  }),
  body: z.object({
    date: z.string().transform((val) => new Date(val)),
    is_for_one_week: z.boolean(),
    previous_status: z.enum(['SICK', 'PRESENT', 'NOT_PRESENT', 'EXCUSED', 'CUTI']).optional(),
  }),
});
```

### **2. Update Repository Methods**
Add new methods:
- `findAssignmentByOutletAndDate(outletId, date)`
- `findAttendanceByEmployeeOutletDate(employeeId, outletId, date, status)`
- `swapEmployeeAssignments(employee1, employee2, outlet1, outlet2, date)`
- `replaceEmployeeWithAttendance(oldEmployee, newEmployee, outlet, date, status)`

### **3. Update Service Layer**
Refactor `assignEmployeeToOutletForDates` to handle scenarios

### **4. Update Controller**
Extract and pass `previous_status` from request body

---

## Questions for Confirmation

1. ✅ **Scenario 1**: When creating attendance for Employee A with SICK status, what values should be used for:
   - `checkin_image_proof` (required field) → Use placeholder or null?
   - `checkin_time` → Use the assignment date at 00:00?

2. ✅ **Scenario 2**: When swapping, should we:
   - Only swap for the requested date?
   - Or swap for all future dates as well?

3. ✅ **Scenario 3**: "Remove oldest schedule" - does this mean:
   - Find Employee A's oldest assignment across ALL outlets and deactivate it?
   - Or just remove the conflicting assignment on the target date?

4. ✅ **is_for_one_week**: Should the scenario logic apply to:
   - Only the first day of the week?
   - Each day independently (check conflicts for each of 7 days)?

5. ✅ **Attendance creation**: Should we also check if attendance already exists before creating a new one?

---

## Implementation Priority

### **Phase 1: Validation & Protection** ⚡ HIGH
- Add `previous_status` field validation
- Add attendance PRESENT protection check
- Add conflict detection

### **Phase 2: Core Scenarios** ⚡ HIGH
- Implement Scenario 1 (Replace with SICK)
- Implement Scenario 2 (Swap with PRESENT)
- Implement Scenario 3 (Different date)

### **Phase 3: Edge Cases** 🔸 MEDIUM
- Handle is_for_one_week with scenarios
- Handle missing attendance proof fields
- Add proper error messages

### **Phase 4: Testing** 🔸 MEDIUM
- Unit tests for each scenario
- Integration tests for transactions
- Edge case tests

---

## Recommendation

**Before implementing**, please confirm:

1. The expected behavior for attendance proof fields when creating SICK attendance
2. Whether swap applies to single date or multiple dates
3. The exact meaning of "remove oldest schedule"
4. How to handle is_for_one_week flag with the new logic

Once confirmed, I will implement the complete solution with proper transaction handling and all scenarios.
