# Recent Attendance API Documentation

## Enhanced Recent Attendance Endpoint

### Endpoint

`GET /api/attendance/recent`

### Features

✅ **Employee-wise check-in/check-out tracking**  
✅ **Automatic working hours calculation**  
✅ **Daily attendance status**  
✅ **Smart grouping by employee and date**

### Query Parameters

- `limit` (optional): Number of recent records to fetch (default: 10)

### Response Format

```json
{
  "message": "Recent attendance fetched successfully",
  "records": [
    {
      "employee": {
        "id": "64f5a8b2c9d4e1f2a3b4c5d6",
        "name": "Kshitij Meshram",
        "email": "kshitij@example.com",
        "department": "Engineering",
        "role": "Developer"
      },
      "date": "2025-08-02",
      "checkIn": {
        "_id": "...",
        "timestamp": "2025-08-02T09:15:00.000Z",
        "attendance_type": "check_in",
        "method": "face_recognition",
        "confidence": "95%"
      },
      "checkOut": {
        "_id": "...",
        "timestamp": "2025-08-02T18:30:00.000Z",
        "attendance_type": "check_out",
        "method": "face_recognition",
        "confidence": "92%"
      },
      "workingHours": {
        "hours": 9,
        "minutes": 15,
        "totalHours": "9.25",
        "checkInTime": "9:15:00 AM",
        "checkOutTime": "6:30:00 PM"
      },
      "status": "Full Day"
    },
    {
      "employee": {
        "id": "64f5a8b2c9d4e1f2a3b4c5d7",
        "name": "Aditya Dakhane",
        "email": "aditya@example.com",
        "department": "Engineering",
        "role": "Senior Developer"
      },
      "date": "2025-08-02",
      "checkIn": {
        "_id": "...",
        "timestamp": "2025-08-02T09:00:00.000Z",
        "attendance_type": "check_in",
        "method": "manual"
      },
      "checkOut": null,
      "workingHours": null,
      "status": "Checked In (No Check-out)"
    }
  ],
  "summary": {
    "totalRecords": 2,
    "dateRange": {
      "from": "2025-07-26",
      "to": "2025-08-02"
    },
    "statistics": {
      "fullDays": 1,
      "partialDays": 0,
      "incompleteAttendance": 1
    }
  },
  "metadata": {
    "requestedLimit": 5,
    "actualRecords": 2,
    "timestamp": "2025-08-02T12:00:00.000Z"
  }
}
```

### Status Types

- **"Full Day"**: Working hours ≥ 8 hours
- **"Partial Day"**: Working hours < 8 hours
- **"Checked In (No Check-out)"**: Only check-in recorded
- **"Invalid (Check-out without Check-in)"**: Data inconsistency
- **"Incomplete"**: No attendance data

### Key Benefits

1. **Complete Daily View**: Shows both check-in and check-out for each employee
2. **Working Hours Calculation**: Automatic calculation between check-in and check-out
3. **Smart Grouping**: Groups records by employee and date
4. **Status Intelligence**: Provides meaningful status based on attendance completeness
5. **Rich Metadata**: Includes summary statistics and date ranges

### Usage Examples

#### Get last 10 attendance records

```bash
GET /api/attendance/recent
```

#### Get last 20 attendance records

```bash
GET /api/attendance/recent?limit=20
```

### Integration with Frontend

The enhanced data structure makes it easy to display:

- Employee photo/avatar
- Check-in time with method (face/manual)
- Check-out time with method
- Total working hours
- Day completion status
- Department/role information

### Authentication Required

All requests require valid JWT token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```
