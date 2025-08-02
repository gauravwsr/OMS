# Minimum Working Hours Policy Implementation

## Overview

This feature implements a **6-hour minimum working hours policy** that prevents employees from checking out until they have completed at least 6 hours of work since their check-in time.

## Feature Details

### Policy Rule

- **Minimum Working Hours**: 6 hours
- **Enforcement**: Applied to both manual and face recognition check-out attempts
- **Calculation**: Time difference between check-in and attempted check-out

### Implementation Locations

#### 1. Controller Level (`attendanceController.js`)

- **Location**: Lines 66-95 (after attendance type determination)
- **Function**: `markAttendance`
- **Validation**: Checks time difference before processing check-out

#### 2. Service Level (`attendanceService.js`)

- **Location**: Lines 775-810 (in face recognition processing)
- **Function**: `processFaceRecognitionAttendanceWithType`
- **Validation**: Prevents face recognition check-out before minimum hours

### Error Response Format

When an employee tries to check out before completing 6 hours:

```json
{
  "message": "You must work for at least 6 hours before checking out",
  "error": "MINIMUM_WORKING_HOURS_NOT_COMPLETED",
  "details": {
    "checkInTime": "2025-08-02T09:00:00.000Z",
    "currentTime": "2025-08-02T13:30:00.000Z",
    "workedHours": 4,
    "workedMinutes": 30,
    "minimumRequired": 6,
    "remainingTime": {
      "hours": 1,
      "minutes": 30
    },
    "canCheckOutAt": "2025-08-02T15:00:00.000Z"
  }
}
```

### Response Fields Explained

- **checkInTime**: When the employee checked in today
- **currentTime**: Current server time
- **workedHours**: Total hours worked so far (floor value)
- **workedMinutes**: Additional minutes worked
- **minimumRequired**: Required minimum hours (6)
- **remainingTime**: How much more time is needed
- **canCheckOutAt**: Exact time when check-out will be allowed

## Implementation Logic

### Time Calculation

```javascript
const timeDifferenceInHours = (currentTime - checkInTime) / (1000 * 60 * 60);
const MINIMUM_WORKING_HOURS = 6;

if (timeDifferenceInHours < MINIMUM_WORKING_HOURS) {
  // Prevent check-out and return error
}
```

### Remaining Time Calculation

```javascript
const remainingTime = MINIMUM_WORKING_HOURS - timeDifferenceInHours;
const remainingHours = Math.floor(remainingTime);
const remainingMinutes = Math.ceil((remainingTime - remainingHours) * 60);
```

### Check-out Allowed Time

```javascript
const canCheckOutAt = new Date(
  checkInTime.getTime() + MINIMUM_WORKING_HOURS * 60 * 60 * 1000
);
```

## Use Cases

### Scenario 1: Early Check-out Attempt

- **Check-in**: 9:00 AM
- **Check-out attempt**: 1:30 PM (4.5 hours)
- **Result**: ❌ Blocked - Need 1.5 more hours
- **Allowed at**: 3:00 PM

### Scenario 2: Valid Check-out

- **Check-in**: 9:00 AM
- **Check-out attempt**: 4:00 PM (7 hours)
- **Result**: ✅ Allowed - Exceeds minimum requirement

### Scenario 3: Exact Minimum

- **Check-in**: 9:00 AM
- **Check-out attempt**: 3:00 PM (6 hours exactly)
- **Result**: ✅ Allowed - Meets minimum requirement

## Error Codes

- **MINIMUM_WORKING_HOURS_NOT_COMPLETED**: Primary error code for policy violation
- **MIN_HOURS_NOT_COMPLETED**: Alternative error code for face recognition

## Configuration

### Modifying Minimum Hours

To change the minimum working hours requirement:

1. **In Controller** (`attendanceController.js`):

   ```javascript
   const MINIMUM_WORKING_HOURS = 6; // Change this value
   ```

2. **In Service** (`attendanceService.js`):
   ```javascript
   const MINIMUM_WORKING_HOURS = 6; // Change this value
   ```

### Best Practices

- Keep both values synchronized
- Consider business requirements (lunch breaks, etc.)
- Document any changes for compliance

## Testing Scenarios

### Test Case 1: Manual Check-out Before 6 Hours

```bash
curl -X POST http://localhost:3000/api/attendance/mark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"attendance_type": "check_out"}'
```

### Test Case 2: Face Recognition Check-out Before 6 Hours

```bash
curl -X POST http://localhost:3000/api/attendance/mark \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "face_recognition",
    "attendance_type": "check_out",
    "imageData": "base64_image_data"
  }'
```

## Benefits

### Employee Management

- Ensures minimum work commitment
- Standardizes working hours
- Prevents premature departures

### HR Compliance

- Automated policy enforcement
- Clear audit trail
- Consistent rule application

### System Integrity

- Prevents gaming of attendance system
- Maintains work hour standards
- Reduces manual oversight needed

## Future Enhancements

### Potential Features

1. **Configurable minimum hours per employee/role**
2. **Break time exclusions**
3. **Holiday/weekend different policies**
4. **Override permissions for managers**
5. **Notification system for approaching minimum**

### Integration Points

- HR dashboard for policy monitoring
- Email/SMS notifications
- Manager approval workflows
- Payroll system integration

## Troubleshooting

### Common Issues

1. **Time Zone Problems**

   - Ensure server and client use same timezone
   - Check timestamp formatting

2. **Check-in Record Missing**

   - Verify employee checked in today
   - Check database connection

3. **Calculation Errors**
   - Validate timestamp formats
   - Check for daylight saving time issues

### Debug Information

The error response includes comprehensive debugging information to help identify issues and provide clear feedback to employees about when they can check out.
