# OMS Server Troubleshooting Guide

## 🚨 Current Issues Identified:

### 1. **Backend Server Timeout (ECONNABORTED)**

- **Problem**: 5-second timeout was too short for file uploads
- **Solution**: ✅ Increased to 30 seconds in Employee.js

### 2. **MongoDB Connection Issues**

- **Problem**: Attendance system shows "MongoDB database connection uncertain"
- **Solution**: Check MongoDB connection in backend

### 3. **Server Connectivity**

- **Problem**: Backend server might not be running
- **Solution**: Use the start-servers.bat script

## 🔧 Quick Fix Steps:

### Step 1: Start All Servers

```bash
# Run this batch file to start all servers at once:
d:\OMS\OMS\start-servers.bat
```

### Step 2: Check Server Status

1. **Backend Server** (Port 5000): http://localhost5000/api/health
2. **Face Recognition** (Port 5001): http://localhost5001
3. **Frontend** (Port 3000): http://localhost3000

### Step 3: Fix MongoDB Connection

```bash
# Check if MongoDB is running:
net start MongoDB

# If not installed, install MongoDB:
# https://www.mongodb.com/try/download/community
```

### Step 4: Backend Dependencies

```bash
cd d:\OMS\OMS\OMS\server-OMS
npm install
npm start
```

### Step 5: Face Recognition Dependencies

```bash
cd d:\OMS\OMS\face-recognition-server
pip install -r requirements.txt
python server.py
```

## 🎯 Employee Registration Improvements Made:

### ✅ Enhanced Error Handling:

- Specific error messages for different failure types
- Server connectivity check before submission
- Better timeout handling

### ✅ Improved User Experience:

- Progressive loading messages
- Server status troubleshooting tips
- 30-second timeout for file uploads
- Document upload validation

### ✅ Better Debugging:

- Console logs throughout the process
- Server health check endpoint usage
- Detailed error reporting

## 📝 Test the Registration:

1. ✅ Start all servers using the batch file
2. ✅ Fill out the employee form
3. ✅ Try uploading documents
4. ✅ Submit and check for improved error messages

## 🔍 Common Error Solutions:

| Error               | Cause               | Solution                      |
| ------------------- | ------------------- | ----------------------------- |
| `ECONNABORTED`      | Timeout/Slow server | ✅ Fixed with 30s timeout     |
| `ERR_NETWORK`       | Server not running  | Start backend with batch file |
| `MongoDB uncertain` | DB connection issue | Check MongoDB service         |
| `400 Bad Request`   | Invalid form data   | Check required fields         |
| `500 Server Error`  | Backend crash       | Check server logs             |

## 🚀 Next Steps:

1. Run the `start-servers.bat` file
2. Test employee registration
3. Check if MongoDB issues are resolved
4. Verify document uploads work properly
