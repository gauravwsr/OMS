# Employee CRUD & Face Recognition Testing Guide

## System Components Testing

### 1. Backend Server Testing

#### Start Backend Server

```bash
cd server-OMS
npm run dev
```

#### Test CRUD APIs

```bash
# Create Employee
curl -X POST http://142.93.213.81:5001/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "EMP001",
    "fullName": "Test Employee",
    "role": "Employee",
    "subRole": "Developer",
    "personalMail": "test@example.com",
    "phoneNo": "1234567890",
    "gender": "Male",
    "password": "temp123"
  }'

# Get All Employees
curl http://142.93.213.81:5001/api/candidates

# Update Employee
curl -X PUT http://142.93.213.81:5001/api/candidates/EMP001 \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Updated Name"}'

# Delete Employee
curl -X DELETE http://142.93.213.81:5001/api/candidates/EMP001
```

### 2. Face Recognition Server Testing

#### Start Face Recognition Server

```bash
cd face-recognition-server
python server.py
```

#### Test Endpoints

```bash
# Get Registered Users
curl http://localhost:5001/api/registered-users

# Test Face Recognition (with base64 image)
curl -X POST http://localhost:5001/api/mark-attendance \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_image_data_here"}'
```

### 3. Frontend Testing

#### Start Frontend

```bash
cd Office-management-system
npm start
```

#### Test Features

1. **Employee List Page** (`/database`)

   - View all employees
   - Filter by employee type
   - Search functionality
   - Edit/Delete buttons

2. **Add Employee** (`/database/employee`)

   - Fill form and submit
   - Face registration option
   - Validation checks

3. **Edit Employee** (`/database/edit/:id`)
   - Pre-filled form data
   - Face registration status
   - Update functionality

## Complete Testing Workflow

### 1. Employee Registration Flow

```
1. Navigate to /database
2. Click "Add Employee"
3. Fill required fields:
   - candidateId: EMP001
   - fullName: John Doe
   - role: Employee
   - subRole: Developer
   - personalMail: john@example.com
   - phoneNo: 9876543210
   - gender: Male
   - password: temp123
4. Click "Register Face"
5. Capture 5-10 images
6. Submit form
7. Verify in database
```

### 2. Edit Employee Flow

```
1. Go to employee list
2. Click "Edit" on any employee
3. Verify pre-filled data
4. Check face registration status
5. If not registered: Click "Register Face"
6. If registered: Shows "✅ Face registration completed"
7. Update any field
8. Submit changes
```

### 3. Face Recognition Testing

```
1. Ensure employee is registered with face
2. Go to face attendance page
3. Allow camera access
4. Show face to camera
5. Verify recognition and attendance marking
6. Check attendance in employee list
```

## Database Verification

### Check MongoDB Data

```javascript
// Connect to MongoDB
db.candidates.find({ candidateId: "EMP001" });

// Check face encodings
db.candidates.find(
  {
    candidateId: "EMP001",
  },
  {
    faceEncodings: 1,
    faceImagePaths: 1,
    attendanceMark: 1,
    attendanceHistory: 1,
  }
);

// Check attendance history
db.candidates.find(
  {
    candidateId: "EMP001",
  },
  {
    attendanceHistory: 1,
    totalPresentDays: 1,
    lastAttendanceDate: 1,
  }
);
```

## Common Issues & Solutions

### 1. Face Recognition Server Issues

```
Problem: Server not starting
Solution:
- Check Python version (3.7+)
- Install requirements: pip install -r requirements.txt
- Check port 5001 availability

Problem: Face not recognized
Solution:
- Ensure good lighting
- Capture clear images during registration
- Check model training logs
```

### 2. Backend API Issues

```
Problem: Employee not created
Solution:
- Check required fields validation
- Verify unique candidateId
- Check MongoDB connection

Problem: Face encodings not stored
Solution:
- Verify API endpoint /api/candidates/:id/face-encodings
- Check request payload format
- Verify candidateId exists
```

### 3. Frontend Issues

```
Problem: Edit page not loading data
Solution:
- Check API response in network tab
- Verify route parameter :id
- Check error console

Problem: Face registration modal not opening
Solution:
- Check camera permissions
- Verify webcam access
- Check browser compatibility
```

## Success Indicators

### ✅ Successful Implementation Checklist

1. **CRUD Operations**

   - [ ] Create employee works
   - [ ] Employee list displays correctly
   - [ ] Edit form pre-fills data
   - [ ] Update saves changes
   - [ ] Delete removes employee

2. **Face Registration**

   - [ ] Camera opens in modal
   - [ ] Images can be captured
   - [ ] Registration success message
   - [ ] Face encodings stored in DB
   - [ ] Status shows "registered"

3. **Face Recognition**

   - [ ] Registered faces are recognized
   - [ ] Attendance marked automatically
   - [ ] Status updated in employee list
   - [ ] History recorded in database

4. **Data Consistency**
   - [ ] All data stored in candidates collection
   - [ ] No data in users collection
   - [ ] Attendance history properly maintained
   - [ ] Face encodings linked to correct employee

## Performance Testing

### Load Testing

```bash
# Test multiple simultaneous employee creation
for i in {1..10}; do
  curl -X POST http://142.93.213.81:5001/api/candidates \
    -H "Content-Type: application/json" \
    -d "{
      \"candidateId\": \"EMP00$i\",
      \"fullName\": \"Employee $i\",
      \"role\": \"Employee\",
      \"subRole\": \"Developer\",
      \"personalMail\": \"emp$i@example.com\",
      \"phoneNo\": \"123456789$i\",
      \"gender\": \"Male\",
      \"password\": \"temp123\"
    }" &
done
```

### Face Recognition Performance

```
- Test with multiple users registered
- Measure recognition time
- Test under different lighting conditions
- Verify accuracy with different face angles
```

## Security Testing

### Input Validation

```
- Test with invalid email formats
- Test with duplicate candidateIds
- Test with missing required fields
- Test with SQL injection attempts
- Test with XSS payloads
```

### Authentication

```
- Test password hashing
- Verify login functionality
- Test session management
- Check authorization levels
```

## Monitoring & Logs

### Backend Logs

```
- API request/response logs
- Database operation logs
- Error handling logs
- Performance metrics
```

### Face Recognition Logs

```
- Registration success/failure
- Recognition accuracy logs
- Processing time logs
- Error handling logs
```

### Frontend Logs

```
- Component rendering logs
- API call logs
- User interaction logs
- Error boundary logs
```
