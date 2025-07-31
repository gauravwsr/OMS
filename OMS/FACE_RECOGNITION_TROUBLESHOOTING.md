# Face Recognition Attendance Troubleshooting Guide

## Problem: Captured Image Not Matching Registered Face

If the attendance system is not recognizing faces that were previously registered with 20 images, follow these troubleshooting steps:

### 1. Check if Face Recognition Server is Running

- Ensure the Python server is running on port 5001
- Navigate to `face-recognition-server` directory
- Run: `python server.py`
- Check console for any errors

### 2. Verify User Registration

- Use the Debug Info section in the Attendance component
- Click "Show Debug Info" to see registered users
- Ensure the user appears in the list with 20 face encodings

### 3. Check Image Quality During Attendance

- Ensure good lighting conditions
- Face should be clearly visible and centered
- Avoid shadows, glare, or obstructions
- Use the same lighting conditions as during registration

### 4. Common Issues and Solutions

#### Issue: "Face not recognized" error

**Solutions:**

- Increase distance threshold in server.py (currently set to 0.6)
- Re-register the user with better quality images
- Ensure consistent lighting between registration and attendance

#### Issue: "No face detected" error

**Solutions:**

- Improve lighting conditions
- Ensure face is centered in the camera view
- Remove any obstructions (glasses, masks, etc.)
- Try capturing from a different angle

#### Issue: "Face recognition server not running"

**Solutions:**

- Start the Python server: `python server.py`
- Check if port 5001 is available
- Ensure all required Python packages are installed

### 5. Registration Best Practices

- Capture images in various lighting conditions
- Include slight variations in head angle
- Ensure face is clearly visible in all 20 images
- Avoid blurry or low-quality images

### 6. Server Configuration

The face recognition server has been improved with:

- Higher distance threshold (0.6 instead of 0.45)
- Better face detection using both HOG and CNN models
- Multiple neighbor voting for better accuracy
- Enhanced error handling and logging

### 7. Debug Endpoints

- GET `/api/registered-users` - Check registered users and their encoding counts
- Monitor server console for detailed logging during attendance attempts

### 8. Technical Details

- KNN model uses 5 neighbors with distance weighting
- Face encodings are stored in `face_encodings_demo_company.pkl`
- Attendance records are stored in `attendance.db`
- Images are saved in `images/demo_company/` directory

### 9. If Problems Persist

1. Delete existing face encodings: `face_encodings_demo_company.pkl`
2. Delete KNN model: `knn_face_model.pkl`
3. Re-register users with high-quality images
4. Restart the face recognition server

### 10. Checking Logs

Monitor the Python server console for detailed information about:

- Face detection results
- Distance calculations
- Recognition accuracy
- Error messages

The system now provides better debugging information and improved recognition accuracy.
