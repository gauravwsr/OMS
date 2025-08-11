import requests
import json
from datetime import datetime

def send_attendance_to_mongodb(name, status):
    """Send attendance data to MongoDB through Node.js backend"""
    try:
        # First, get all employees to find the correct candidateId
        employees_response = requests.get(
            "http://146.190.165.62:5000/api/candidates",
            timeout=5
        )
        
        if employees_response.status_code != 200:
            return False, "Failed to fetch employee list"
        
        employees_data = employees_response.json()
        if not employees_data.get('success'):
            return False, "Failed to get employees data"
        
        # Find employee by name
        target_employee = None
        for employee in employees_data.get('data', []):
            if employee.get('fullName', '').lower() == name.lower():
                target_employee = employee
                break
        
        if not target_employee:
            return False, f"Employee '{name}' not found in database"
        
        # Map face recognition status to attendance status
        attendance_status = "Present"
        if status == "On Time":
            attendance_status = "On Time"
        elif status == "Late":
            attendance_status = "Late"
        elif status == "Very Late":
            attendance_status = "Very Late"
        
        # Prepare data for backend API with correct candidateId
        attendance_data = {
            "candidateId": target_employee.get('candidateId'),
            "status": attendance_status,
            "timestamp": datetime.now().isoformat()
        }
        
        # Send to Node.js backend
        response = requests.post(
            "http://146.190.165.62:5000/api/candidates/attendance/mark",
            json=attendance_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 200:
            print(f"✅ Attendance data sent to MongoDB for {name} (ID: {target_employee.get('candidateId')})")
            return True, "Attendance marked in MongoDB"
        else:
            print(f"❌ Failed to send attendance to MongoDB: {response.status_code} - {response.text}")
            return False, f"MongoDB error: {response.status_code}"
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error connecting to MongoDB backend: {str(e)}")
        return False, f"Connection error: {str(e)}"
    except Exception as e:
        print(f"❌ Unexpected error sending to MongoDB: {str(e)}")
        return False, f"Unexpected error: {str(e)}"

def get_attendance_status_by_time():
    """Determine attendance status based on current time"""
    current_time = datetime.now().time()
    
    # Define time thresholds (you can adjust these)
    on_time_threshold = datetime.strptime("10:00:00", "%H:%M:%S").time()
    late_threshold = datetime.strptime("10:30:00", "%H:%M:%S").time()
    
    if current_time <= on_time_threshold:
        return "On Time"
    elif current_time <= late_threshold:
        return "Late"
    else:
        return "Very Late"
