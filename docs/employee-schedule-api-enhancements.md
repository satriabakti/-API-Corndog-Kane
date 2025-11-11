# Employee Schedule API Enhancements

## 📋 Overview

Dokumentasi ini menjelaskan peningkatan fitur pada endpoint `/api/v1/employees/schedule` untuk view `table`.

## 🆕 New Features

### 1. Employee Image Path in Response
Response detail schedule sekarang menyertakan `employee_image_path` dari data employee.

### 2. Pagination Support
Endpoint table view sekarang mendukung pagination dengan parameter `page` dan `limit`.

### 3. Status Filter
Filter berdasarkan `AttendanceStatus` untuk memfilter data attendance.

---

## 🔗 Endpoint

```
GET /api/v1/employees/schedule
```

---

## 📝 Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `view` | string | No | `timeline` | View mode: `table` atau `timeline` |
| `start_date` | string | No | - | Filter start date (format: YYYY-MM-DD) |
| `end_date` | string | No | - | Filter end date (format: YYYY-MM-DD) |
| `status` | string | No | - | Filter by attendance status |
| `page` | number | No | `1` | Page number (only for table view) |
| `limit` | number | No | `10` | Items per page (only for table view) |

### Valid Status Values

- `PRESENT` - Employee hadir
- `SICK` - Employee sakit
- `NOT_PRESENT` - Employee tidak hadir
- `EXCUSED` - Employee izin
- `CUTI` - Employee cuti

---

## 📤 Response Format

### Table View Response

```json
{
  "success": true,
  "message": "Employee attendance table retrieved successfully",
  "data": [
    {
      "id": 1,
      "employee_name": "John Doe",
      "employee_image_path": "/uploads/employees/john-doe.jpg",
      "date": "2025-11-10T00:00:00.000Z",
      "checkin_time": "2025-11-10T08:30:00.000Z",
      "checkin_proof": "/uploads/attendance/checkin-123.jpg",
      "checkout_time": "2025-11-10T17:00:00.000Z",
      "checkout_proof": "/uploads/attendance/checkout-123.jpg",
      "attendance_status": "PRESENT",
      "late_minutes": 0,
      "late_present_proof": null,
      "late_notes": null,
      "late_approval_status": "APPROVED"
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total_records": 50,
    "total_pages": 5
  },
  "errors": []
}
```

### Timeline View Response (unchanged)

```json
{
  "success": true,
  "message": "Employee schedules retrieved successfully",
  "data": [
    {
      "id": 1,
      "outlet_id": 8,
      "employee_id": 25,
      "assigned_at": "2025-11-09T06:39:54.328Z",
      "is_active": true,
      "outlet": {
        "id": 8,
        "name": "Antapani",
        "location": "Jl Kuningan Raya no.47"
      },
      "employee": {
        "id": 25,
        "name": "John Doe",
        "phone": "08123456789"
      }
    }
  ],
  "metadata": {}
}
```

---

## 🔍 Example Requests

### 1. Get Table View with Pagination

```bash
GET /api/v1/employees/schedule?view=table&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total_records": 50,
    "total_pages": 5
  }
}
```

### 2. Filter by Date Range

```bash
GET /api/v1/employees/schedule?view=table&start_date=2025-11-01&end_date=2025-11-30
```

### 3. Filter by Status (PRESENT)

```bash
GET /api/v1/employees/schedule?view=table&status=PRESENT
```

### 4. Filter by Status (SICK) with Date Range

```bash
GET /api/v1/employees/schedule?view=table&status=SICK&start_date=2025-11-01&end_date=2025-11-30
```

### 5. Combine All Filters

```bash
GET /api/v1/employees/schedule?view=table&status=PRESENT&start_date=2025-11-10&end_date=2025-11-20&page=2&limit=20
```

**Response:**
```json
{
  "success": true,
  "message": "Employee attendance table retrieved successfully",
  "data": [
    {
      "id": 21,
      "employee_name": "Jane Smith",
      "employee_image_path": "/uploads/employees/jane-smith.jpg",
      "date": "2025-11-15T00:00:00.000Z",
      "checkin_time": "2025-11-15T08:00:00.000Z",
      "checkin_proof": "/uploads/attendance/checkin-456.jpg",
      "checkout_time": "2025-11-15T17:00:00.000Z",
      "checkout_proof": "/uploads/attendance/checkout-456.jpg",
      "attendance_status": "PRESENT",
      "late_minutes": 0,
      "late_present_proof": null,
      "late_notes": null,
      "late_approval_status": "APPROVED"
    }
  ],
  "metadata": {
    "page": 2,
    "limit": 20,
    "total_records": 45,
    "total_pages": 3
  },
  "errors": []
}
```

### 6. Get NOT_PRESENT Employees

```bash
GET /api/v1/employees/schedule?view=table&status=NOT_PRESENT&start_date=2025-11-10&end_date=2025-11-20
```

### 7. Get Employees on CUTI (Leave)

```bash
GET /api/v1/employees/schedule?view=table&status=CUTI
```

---

## 📊 Pagination Details

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `page` | number | Current page number |
| `limit` | number | Items per page |
| `total_records` | number | Total number of records |
| `total_pages` | number | Total number of pages |

### Default Values

- **page**: 1
- **limit**: 10

### Calculation

```
total_pages = Math.ceil(total_records / limit)
skip = (page - 1) * limit
```

---

## 🎯 Use Cases

### Use Case 1: Daily Attendance Report
Get today's attendance with pagination:
```bash
GET /api/v1/employees/schedule?view=table&start_date=2025-11-10&end_date=2025-11-10&page=1&limit=50
```

### Use Case 2: Weekly Sick Leave Report
Get all sick employees this week:
```bash
GET /api/v1/employees/schedule?view=table&status=SICK&start_date=2025-11-04&end_date=2025-11-10
```

### Use Case 3: Monthly Present Employees
Get all present employees in November:
```bash
GET /api/v1/employees/schedule?view=table&status=PRESENT&start_date=2025-11-01&end_date=2025-11-30&page=1&limit=100
```

### Use Case 4: Absence Report
Get all absent employees:
```bash
GET /api/v1/employees/schedule?view=table&status=NOT_PRESENT&start_date=2025-11-01&end_date=2025-11-30
```

---

## 🔒 Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Attendance record ID |
| `employee_name` | string | Name of the employee |
| `employee_image_path` | string | **NEW**: Path to employee's profile image |
| `date` | DateTime | Date of attendance (same as checkin_time) |
| `checkin_time` | DateTime | Check-in timestamp |
| `checkin_proof` | string | Path to check-in image proof |
| `checkout_time` | DateTime\|null | Check-out timestamp (null if not checked out) |
| `checkout_proof` | string\|null | Path to check-out image proof |
| `attendance_status` | string | Status: PRESENT, SICK, NOT_PRESENT, EXCUSED, CUTI |
| `late_minutes` | number | Minutes late (0 if on time) |
| `late_present_proof` | string\|null | Late proof image |
| `late_notes` | string\|null | Notes about being late |
| `late_approval_status` | string | PENDING, APPROVED, REJECTED |

---

## ⚡ Performance Notes

1. **Pagination** mengurangi payload response dan meningkatkan performa
2. **Index** pada `checkin_time` dan `attendance_status` untuk query yang lebih cepat
3. Default limit **10 items** untuk mencegah response yang terlalu besar
4. **Date filtering** menggunakan range query dengan index

---

## 🧪 Testing

### Test 1: Basic Pagination
```bash
curl -X GET "http://localhost:3000/api/v1/employees/schedule?view=table&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2: Status Filter
```bash
curl -X GET "http://localhost:3000/api/v1/employees/schedule?view=table&status=PRESENT" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Combined Filters
```bash
curl -X GET "http://localhost:3000/api/v1/employees/schedule?view=table&status=SICK&start_date=2025-11-01&end_date=2025-11-30&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Error Handling

### Invalid Date Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "start_date",
      "message": "start_date must be in format YYYY-MM-DD"
    }
  ]
}
```

### Invalid Status Value
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "status",
      "message": "Invalid enum value. Expected 'PRESENT' | 'SICK' | 'NOT_PRESENT' | 'EXCUSED' | 'CUTI'"
    }
  ]
}
```

### Invalid Pagination Parameters
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "page",
      "message": "page must be a positive number"
    }
  ]
}
```

---

## 📝 Migration Notes

### Database Changes
No schema changes required. All features use existing fields.

### API Changes
- **Backward Compatible**: Existing calls without new parameters still work
- **New Fields**: `employee_image_path` added to response
- **New Parameters**: `status`, `page`, `limit` are all optional

### Client Updates
Frontend clients should update to:
1. Display `employee_image_path` in table view
2. Implement pagination controls
3. Add status filter dropdown

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-10 | Initial release |
| 1.1.0 | 2025-11-11 | Added employee_image_path, pagination, status filter |

---

## 📞 Support

For questions or issues, please contact the development team.
