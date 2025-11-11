# Late Approval Status API

## 📋 Overview

Endpoint untuk mengubah status approval keterlambatan (late_approval_status) pada record attendance.

## 🔗 Endpoint

```
PATCH /api/v1/employees/:id/:status
```

## 🔐 Authentication

✅ **Required** - Endpoint ini memerlukan authentication token

```
Authorization: Bearer <your_token>
```

## 📝 Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | ✅ Yes | Attendance record ID |
| `status` | string | ✅ Yes | New approval status |

### Valid Status Values

- `PENDING` - Menunggu approval
- `APPROVED` - Disetujui
- `REJECTED` - Ditolak

## 📤 Request Example

### 1. Approve Late Attendance

```bash
PATCH /api/v1/employees/123/APPROVED
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Reject Late Attendance

```bash
PATCH /api/v1/employees/123/REJECTED
```

### 3. Reset to Pending

```bash
PATCH /api/v1/employees/123/PENDING
```

## 📥 Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Late approval status updated to APPROVED",
  "data": {
    "id": 123,
    "employee_id": 25,
    "outlet_id": 8,
    "checkin_image_proof": "/uploads/absent/checkin-123.jpg",
    "checkout_image_proof": "/uploads/absent/checkout-123.jpg",
    "checkin_time": "2025-11-10T08:45:00.000Z",
    "checkout_time": "2025-11-10T17:30:00.000Z",
    "late_minutes": 45,
    "late_notes": "Terjebak macet di jalan tol",
    "late_present_proof": "/uploads/absent/late-proof-123.jpg",
    "late_approval_status": "APPROVED",
    "attendance_status": "PRESENT",
    "is_active": true,
    "created_at": "2025-11-10T08:45:00.000Z",
    "updated_at": "2025-11-10T10:15:00.000Z"
  },
  "metadata": {},
  "errors": []
}
```

### Error Response (400 Bad Request)

#### Invalid Attendance ID

```json
{
  "success": false,
  "message": "Invalid attendance ID",
  "data": null,
  "metadata": {},
  "errors": [
    {
      "field": "id",
      "message": "Invalid attendance ID",
      "type": "invalid"
    }
  ]
}
```

#### Invalid Status Value

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "metadata": {},
  "errors": [
    {
      "field": "status",
      "message": "Status must be PENDING, APPROVED, or REJECTED",
      "type": "validation"
    }
  ]
}
```

### Error Response (404 Not Found)

```json
{
  "success": false,
  "message": "Failed to update late approval status",
  "data": null,
  "metadata": {},
  "errors": [
    {
      "message": "Attendance record not found"
    }
  ]
}
```

### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "message": "Unauthorized",
  "data": null,
  "metadata": {},
  "errors": [
    {
      "message": "Invalid or missing authentication token"
    }
  ]
}
```

## 🎯 Use Cases

### Use Case 1: Approve Late Attendance
Admin menyetujui keterlambatan karyawan yang memiliki alasan valid.

```bash
curl -X PATCH "http://localhost:3000/api/v1/employees/123/APPROVED" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Use Case 2: Reject Late Attendance
Admin menolak keterlambatan karyawan yang tidak memiliki alasan valid.

```bash
curl -X PATCH "http://localhost:3000/api/v1/employees/123/REJECTED" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Use Case 3: Reset to Pending for Re-review
Admin ingin me-review kembali approval yang sudah diberikan.

```bash
curl -X PATCH "http://localhost:3000/api/v1/employees/456/PENDING" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Workflow

```
1. Employee check-in terlambat
   ↓
2. System auto-set late_approval_status = PENDING
   ↓
3. Employee submit late_notes dan late_present_proof
   ↓
4. Admin review di table view
   ↓
5. Admin call PATCH /employees/:id/APPROVED atau REJECTED
   ↓
6. Status updated di database
   ↓
7. Frontend refresh table untuk show updated status
```

## 📊 Status Flow Diagram

```
┌─────────┐
│ PENDING │ ──────┐
└─────────┘       │
     ▲            │
     │            ▼
     │      ┌──────────┐
     └──────│ APPROVED │
     │      └──────────┘
     │            
     │      ┌──────────┐
     └──────│ REJECTED │
            └──────────┘
```

## 🔒 Business Rules

1. **Only Authenticated Users** dapat mengubah late approval status
2. **Attendance Record Must Exist** - ID harus valid
3. **Status Must Be Valid** - Hanya `PENDING`, `APPROVED`, atau `REJECTED`
4. **No Validation on Late Minutes** - Bisa approve/reject berapapun late_minutes
5. **Audit Trail** - `updatedAt` otomatis ter-update

## 📝 Database Impact

### Table: `attendances`

| Field | Before | After |
|-------|--------|-------|
| `late_approval_status` | `PENDING` | `APPROVED` / `REJECTED` |
| `updatedAt` | Old timestamp | New timestamp |

## 🧪 Testing Examples

### Test 1: Approve with cURL

```bash
curl -X PATCH \
  http://localhost:3000/api/v1/employees/123/APPROVED \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

### Test 2: Reject with cURL

```bash
curl -X PATCH \
  http://localhost:3000/api/v1/employees/123/REJECTED \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Test 3: Invalid Status (Should Fail)

```bash
curl -X PATCH \
  http://localhost:3000/api/v1/employees/123/INVALID \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "status",
      "message": "Status must be PENDING, APPROVED, or REJECTED"
    }
  ]
}
```

### Test 4: Invalid Attendance ID (Should Fail)

```bash
curl -X PATCH \
  http://localhost:3000/api/v1/employees/99999/APPROVED \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Failed to update late approval status",
  "errors": [
    {
      "message": "Attendance record not found"
    }
  ]
}
```

## 🔗 Related Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/employees/schedule?view=table` | GET | Get attendance list with late_approval_status |
| `/employees/checkin` | POST | Check-in (creates attendance with PENDING status if late) |
| `/employees/checkout` | POST | Check-out |
| `/employees/schedule/:outletId` | GET | Get attendances by outlet |

## 📱 Frontend Integration

### React Example

```typescript
const approveLateAttendance = async (attendanceId: number) => {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/employees/${attendanceId}/APPROVED`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log('Late attendance approved!');
      // Refresh table
      fetchAttendanceTable();
    } else {
      console.error('Failed to approve:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const rejectLateAttendance = async (attendanceId: number) => {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/employees/${attendanceId}/REJECTED`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log('Late attendance rejected!');
      // Refresh table
      fetchAttendanceTable();
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Vue Example

```javascript
const updateLateApprovalStatus = async (attendanceId, status) => {
  try {
    const response = await axios.patch(
      `/api/v1/employees/${attendanceId}/${status}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      this.$message.success(`Status updated to ${status}`);
      this.fetchAttendances();
    }
  } catch (error) {
    this.$message.error('Failed to update status');
  }
};
```

## 📊 Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Attendance record ID |
| `employee_id` | number | Employee ID |
| `outlet_id` | number | Outlet ID |
| `checkin_image_proof` | string | Path to check-in image |
| `checkout_image_proof` | string\|null | Path to check-out image |
| `checkin_time` | DateTime | Check-in timestamp |
| `checkout_time` | DateTime\|null | Check-out timestamp |
| `late_minutes` | number | Minutes late (0 if on time) |
| `late_notes` | string\|null | Employee's reason for being late |
| `late_present_proof` | string\|null | Image proof for being late |
| `late_approval_status` | string | **Updated field**: PENDING, APPROVED, REJECTED |
| `attendance_status` | string | PRESENT, SICK, NOT_PRESENT, EXCUSED, CUTI |
| `is_active` | boolean | Whether record is active |
| `created_at` | DateTime | Record creation time |
| `updated_at` | DateTime | Last update time |

## ⚠️ Important Notes

1. **Route Order**: Endpoint ini harus didefinisikan **SEBELUM** `GET /employees/:id` untuk menghindari route conflict
2. **Authentication Required**: Semua request harus include valid JWT token
3. **Idempotent**: Calling dengan status yang sama multiple times tidak akan error
4. **Atomic**: Update status adalah single database transaction
5. **No Cascade**: Mengubah status tidak mempengaruhi field lain

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-11 | Initial release - PATCH /employees/:id/:status |

## 📞 Support

For questions or issues, please contact the development team.
