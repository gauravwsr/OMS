# Face Recognition Server - WSGI Fix

## Problem Solved

The error you encountered was due to Gunicorn looking for a missing `wsgi` module. This has been fixed by creating the necessary WSGI entry point and configuration files.

## Files Added/Modified

### 1. wsgi.py

- WSGI entry point for Gunicorn
- Properly imports the Flask app from server.py
- Initializes database and creates necessary directories

### 2. gunicorn.conf.py

- Gunicorn configuration file
- Optimized settings for the face recognition server
- Configured to run on port 5002

### 3. requirements.txt

- Added gunicorn==21.2.0 to the dependencies

### 4. Startup Scripts

- `start_server.bat` - Production server with Gunicorn (Windows)
- `start_dev_server.bat` - Development server with Flask (Windows)
- `start_server.sh` - Production server with Gunicorn (Linux/Unix)

## How to Run

### Option 1: Production Server (Recommended)

```bash
# Windows
start_server.bat

# Linux/Unix
chmod +x start_server.sh
./start_server.sh
```

### Option 2: Development Server

```bash
# Windows
start_dev_server.bat

# Linux/Unix
python server.py
```

### Option 3: Manual Gunicorn Command

```bash
# After activating virtual environment and installing requirements
gunicorn --config gunicorn.conf.py wsgi:app
```

## Server Endpoints

- POST /register_user - Register new user with images
- POST /recognize_face - Recognize face and mark attendance
- GET /get_attendance_history/<name> - Get user attendance history
- GET /get_attendance_stats/<name> - Get user attendance statistics
- GET /get_all_attendance - Get today's attendance list
- GET /api/test-recognition - Test face recognition system

## Server URL

- http://localhost:5002 or http://0.0.0.0:5002

## Troubleshooting

1. Make sure Python 3.7+ is installed
2. Ensure all requirements are installed: `pip install -r requirements.txt`
3. Check that port 5002 is not in use by another application
4. For Windows, make sure you have Visual C++ build tools for face_recognition library
