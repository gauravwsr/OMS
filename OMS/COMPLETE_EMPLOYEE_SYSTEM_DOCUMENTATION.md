# Office Management System (OMS) - Employee CRUD & Face Recognition Integration

## Overview

यह comprehensive Office Management System है जो employee management के साथ-साथ face recognition based attendance system provide करता है। सभी data MongoDB के candidates collection में store होता है।

## Features Implemented

### 1. Employee CRUD Operations

- **Create**: नए employees को register करना
- **Read**: Employee list को view करना with filters
- **Update**: Employee details को edit करना
- **Delete**: Employees को remove करना

### 2. Face Recognition Integration

- Employee registration के समय face capture
- Face encodings को database में store करना
- Attendance marking through face recognition
- SQLite और MongoDB दोनों में attendance data sync

### 3. Attendance Management

- Real-time attendance marking
- Attendance history tracking
- Time-based status (On Time, Late, Very Late)
- Dashboard में attendance visualization

## Technical Implementation

### Backend Structure

#### 1. Candidate Model (`models/Candidate.js`)

```javascript
// Enhanced with attendance fields
faceEncodings: [String],        // Face data for recognition
faceImagePaths: [String],       // Image paths
attendanceMark: String,         // Current status
lastAttendanceDate: Date,       // Last marked date
totalPresentDays: Number,       // Total count
attendanceHistory: [{          // Full history
  date: Date,
  status: String,
  timestamp: Date
}]
```

#### 2. API Endpoints (`routes/candidateRoutes.js`)

```javascript
// CRUD Operations
POST   /api/candidates                    // Create employee
GET    /api/candidates                    // Get all employees
GET    /api/candidates/:id               // Get single employee
PUT    /api/candidates/:id               // Update employee
DELETE /api/candidates/:id               // Delete employee

// Face Recognition & Attendance
POST   /api/candidates/attendance/mark         // Mark attendance
GET    /api/candidates/:id/attendance/history  // Get history
PUT    /api/candidates/:id/face-encodings      // Update face data
GET    /api/candidates/attendance/all          // All records
```

#### 3. Controller Methods (`controllers/candidateController.js`)

```javascript
// New methods added:
markAttendance(); // Marks attendance with status
getAttendanceHistory(); // Retrieves attendance records
updateFaceEncodings(); // Stores face recognition data
getAllAttendanceRecords(); // Admin dashboard data
```

### Frontend Components

#### 1. Employee List (`Components/Db.js`)

- Enhanced with Edit और Delete buttons
- Real-time data filtering
- CSV export functionality
- Mobile responsive design

#### 2. Edit Employee (`Components/EditEmployee.js`)

- Complete form for editing employee details
- Data pre-filling from backend
- Validation और error handling
- Navigation integration

#### 3. Employee Registration (`Components/Employee.js`)

- Face capture integration
- Backend storage of face encodings
- Real-time preview
- Success/error notifications

### Face Recognition Server

#### 1. Core Server (`face-recognition-server/server.py`)

```python
# Enhanced features:
- MongoDB integration through REST API
- Time-based attendance status
- Improved face recognition accuracy
- Error handling और logging
```

#### 2. MongoDB Integration (`mongodb_integration.py`)

```python
# Functions:
send_attendance_to_mongodb()    # Sync to MongoDB
get_attendance_status_by_time() # Determine status by time
```

## Database Schema

### Candidates Collection (MongoDB)

```javascript
{
  candidateId: String,           // Unique ID
  fullName: String,              // Employee name
  role: String,                  // Admin/Employee/Intern
  subRole: String,               // HR/Developer/etc

  // Face Recognition
  faceEncodings: [String],       // Base64 face data
  faceImagePaths: [String],      // Image storage paths

  // Attendance
  attendanceMark: String,        // Current status
  lastAttendanceDate: Date,      // Last attendance
  totalPresentDays: Number,      // Count of present days
  attendanceHistory: [{
    date: Date,
    status: String,
    timestamp: Date
  }],

  // Personal Info
  personalMail: String,
  phoneNo: String,
  gender: String,
  // ... other fields
}
```

## Installation & Setup

### 1. Backend Setup

```bash
cd server-OMS
npm install
npm run dev
```

### 2. Frontend Setup

```bash
cd Office-management-system
npm install
npm start
```

### 3. Face Recognition Server

```bash
cd face-recognition-server
pip install -r requirements.txt
python server.py
```

## API Usage Examples

### 1. Create Employee

```javascript
POST /api/candidates
{
  "candidateId": "EMP001",
  "fullName": "John Doe",
  "role": "Employee",
  "subRole": "Developer",
  "personalMail": "john@example.com",
  "phoneNo": "1234567890",
  "gender": "Male",
  "password": "temp123"
}
```

### 2. Mark Attendance

```javascript
POST /api/candidates/attendance/mark
{
  "candidateId": "EMP001",
  "status": "On Time",
  "timestamp": "2025-01-01T09:30:00Z"
}
```

### 3. Update Face Encodings

```javascript
PUT /api/candidates/EMP001/face-encodings
{
  "faceEncodings": ["base64_encoded_data"],
  "faceImagePaths": ["face_images/john_doe"]
}
```

## Key Features

### 1. Complete CRUD Operations

- ✅ Create new employees
- ✅ Read/View employee list with filters
- ✅ Update employee information
- ✅ Delete employees with confirmation

### 2. Face Recognition Integration

- ✅ Face capture during registration
- ✅ Face encodings stored in database
- ✅ Real-time attendance marking
- ✅ MongoDB sync for attendance data

### 3. Data Flow

```
Employee Registration → Face Capture → Store in MongoDB
Face Recognition → Attendance Mark → Update Database
Employee List → CRUD Operations → Real-time Updates
```

## Security Features

- Password hashing with bcrypt
- Input validation
- Error handling
- Database connection security

## Mobile Responsive

- Responsive design for all screen sizes
- Touch-friendly interface
- Mobile-optimized forms

## Future Enhancements

- Role-based access control
- Advanced reporting
- Email notifications
- Bulk operations
- Advanced analytics dashboard

## Troubleshooting

### Common Issues:

1. **Face Recognition Server Not Starting**: Check Python dependencies
2. **Database Connection**: Verify MongoDB connection string
3. **CORS Errors**: Check backend CORS configuration
4. **Face Detection Fails**: Ensure good lighting conditions

### Logs Location:

- Backend: Console output
- Face Recognition: Python server console
- Frontend: Browser console

## Support

For technical support या queries, check:

- Backend logs in server-OMS console
- Face recognition logs in Python server
- Frontend errors in browser console
