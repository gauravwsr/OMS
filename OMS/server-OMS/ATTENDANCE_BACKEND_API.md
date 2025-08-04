# Attendance System Backend API Documentation

## Overview

This document describes the comprehensive attendance management backend system that has been separated from the frontend and integrated into the server-OMS project.

## Base URL

```
http://142.93.213.81:5001/api/attendance
```

## Authentication

All endpoints (except health check) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 1. Health Check

**GET** `/health`

- **Description**: Check the health status of the attendance service
- **Authentication**: Not required
- **Response**:

```json
{
  "status": "healthy",
  "service": "attendance-api",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "status": "connected",
    "totalRecords": 150
  }
}
```

### 2. Face Recognition Health Check

**GET** `/face-recognition/health`

- **Description**: Check the health status of the face recognition server
- **Authentication**: Not required
- **Response**:

```json
{
  "message": "Face recognition health check",
  "status": "healthy",
  "server": {
    "status": "running",
    "port": 5001
  }
}
```

### 3. Mark Attendance

**POST** `/mark`

- **Description**: Mark attendance for the authenticated user
- **Authentication**: Required
- **Request Body**:

#### Manual Attendance:

```json
{
  "method": "manual",
  "status": "present",
  "location": "Office",
  "notes": "On time arrival"
}
```

#### Face Recognition Attendance:

```json
{
  "method": "face_recognition",
  "imageData": "base64_encoded_image_string",
  "confidence": "95.2%",
  "recognizedName": "John Doe",
  "faceRecognitionDetails": {
    "detectionDetails": {...},
    "processingTime": "2.5s"
  }
}
```

- **Response** (Success):

```json
{
  "message": "Attendance marked successfully",
  "attendance": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "method": "face_recognition",
    "status": "present",
    "confidence": "95.2%",
    "recognizedName": "John Doe",
    "timestamp": "2024-01-01T09:00:00.000Z"
    // ... other fields
  }
}
```

### 4. Get Today's Attendance

**GET** `/today`

- **Description**: Check if attendance is already marked for today
- **Authentication**: Required
- **Response**:

```json
{
  "message": "Today's attendance found",
  "attendance": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "method": "face_recognition",
    "timestamp": "2024-01-01T09:00:00.000Z"
    // ... other fields
  },
  "hasAttendance": true
}
```

### 5. Get Attendance History

**GET** `/history`

- **Description**: Get attendance history for the authenticated user
- **Authentication**: Required
- **Query Parameters**:

  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Records per page (default: 10)
  - `startDate` (optional): Filter from date (YYYY-MM-DD)
  - `endDate` (optional): Filter to date (YYYY-MM-DD)
  - `method` (optional): Filter by method (manual, face_recognition)
  - `status` (optional): Filter by status (present, absent, late)

- **Response**:

```json
{
  "message": "Attendance history fetched successfully",
  "records": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "method": "face_recognition",
      "confidence": "95.2%",
      "timestamp": "2024-01-01T09:00:00.000Z"
      // ... other fields
    }
  ],
  "pagination": {
    "current": 1,
    "total": 5,
    "count": 47,
    "limit": 10
  }
}
```

### 6. Get Recent Attendance (Admin)

**GET** `/recent`

- **Description**: Get recent attendance records across all users
- **Authentication**: Required
- **Query Parameters**:
  - `limit` (optional): Number of records (default: 10)
- **Response**:

```json
{
  "message": "Recent attendance fetched successfully",
  "records": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "userId": {
        "name": "John Doe",
        "email": "john@company.com",
        "employeeId": "EMP001",
        "department": "Engineering"
      },
      "method": "face_recognition",
      "timestamp": "2024-01-01T09:00:00.000Z"
      // ... other fields
    }
  ]
}
```

### 7. Get All Attendance Records (Admin Only)

**GET** `/all`

- **Description**: Get comprehensive attendance analytics and records
- **Authentication**: Required (Admin/HR role)
- **Query Parameters**:
  - `startDate`, `endDate`, `method`, `status`, `department`, `page`, `limit`
- **Response**:

```json
{
  "message": "Attendance records fetched successfully",
  "analytics": {
    "overview": {
      "totalRecords": 1250,
      "uniqueUsers": 45,
      "avgConfidence": 92.5
    },
    "byMethod": [
      {
        "_id": "face_recognition",
        "count": 950,
        "avgConfidence": 93.2
      },
      {
        "_id": "manual",
        "count": 300,
        "avgConfidence": null
      }
    ],
    "byDepartment": [...],
    "hourlyDistribution": [...],
    "dailyTrend": [...]
  }
}
```

### 8. Get Attendance Analytics (Admin Only)

**GET** `/analytics`

- **Description**: Get detailed attendance analytics
- **Authentication**: Required (Admin/HR role)
- **Query Parameters**: Same as `/all`
- **Response**: Same analytics structure as `/all`

### 9. Delete Attendance Record (Super Admin Only)

**DELETE** `/:attendanceId`

- **Description**: Delete an attendance record
- **Authentication**: Required (Super Admin role)
- **Response**:

```json
{
  "message": "Attendance record deleted successfully"
}
```

## Data Models

### Attendance Model

```javascript
{
  userId: ObjectId,           // Reference to User
  method: String,            // 'manual' | 'face_recognition'
  status: String,            // 'present' | 'absent' | 'late'
  timestamp: Date,           // When attendance was marked
  confidence: String,        // Face recognition confidence (e.g., "95.2%")
  recognizedName: String,    // Name recognized by face recognition
  faceRecognitionDetails: {
    detectionDetails: Object,
    processingTime: String,
    faceCoordinates: Object,
    imageMetadata: Object
  },
  systemInfo: {
    userAgent: String,
    ipAddress: String,
    platform: String,
    browser: String
  },
  location: String,          // Physical location
  notes: String,             // Additional notes
  metadata: {
    source: String,          // 'web_application' | 'face_recognition_api'
    apiVersion: String,
    requestId: String
  },
  auditLog: [Object]         // Audit trail for changes
}
```

## Error Responses

### Common Error Format

```json
{
  "message": "Error description",
  "error": "Detailed error information",
  "errorCode": "ERROR_CODE"
}
```

### Error Codes

- `SERVER_UNAVAILABLE`: Face recognition server not running
- `RECOGNITION_FAILED`: Face not recognized
- `NO_FACE_DETECTED`: No face found in image
- `INVALID_IMAGE`: Invalid image data
- `TIMEOUT`: Face recognition timeout

## Integration with Face Recognition Server

The backend integrates with a Python face recognition server running on port 5001:

### Face Recognition Flow:

1. Frontend captures image and sends to backend
2. Backend validates user registration
3. Backend forwards image to face recognition server
4. Face recognition server processes and returns results
5. Backend saves comprehensive attendance data to MongoDB
6. Backend returns response to frontend

### Required Face Recognition Server Endpoints:

- `GET /api/registered-users` - Get list of registered users
- `POST /api/mark-attendance` - Process face recognition
- `GET /health` - Health check

## Security Features

1. **JWT Authentication**: All endpoints require valid JWT tokens
2. **Role-based Access**: Admin/HR endpoints restricted by user role
3. **Face Recognition Validation**: Minimum confidence threshold (65%)
4. **User Verification**: Recognized face must match logged-in user
5. **Audit Logging**: All changes tracked with user information
6. **Input Validation**: Comprehensive request validation

## Frontend Integration

Update your frontend API calls to point to the new backend:

```javascript
// Old frontend URL (if using local face recognition)
const oldUrl = "http://localhost:5001/api/mark-attendance";

// New backend URL
const newUrl = "http://142.93.213.81:5001/api/attendance/mark";

// Example usage
const response = await axios.post(
  newUrl,
  {
    method: "face_recognition",
    imageData: base64Image,
  },
  {
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
  }
);
```

## Testing

Use the provided test script to verify backend functionality:

```bash
cd server-OMS
node test_attendance_backend.js
```

## Dependencies

Ensure these packages are installed in server-OMS:

- mongoose (MongoDB ODM)
- express (Web framework)
- axios (HTTP client for face recognition server)
- jsonwebtoken (JWT authentication)
- bcryptjs (Password hashing)

## Configuration

Set these environment variables in your `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/oms
JWT_SECRET=your-secret-key
PORT=5000
```

## Notes

1. The face recognition server (Python) should run on port 5001
2. This backend runs on port 5000
3. Frontend should update API calls to use the new backend URLs
4. All face recognition data is now stored in MongoDB with comprehensive metadata
5. Case-insensitive name matching is implemented for face recognition
6. Proper error handling and logging throughout the system
