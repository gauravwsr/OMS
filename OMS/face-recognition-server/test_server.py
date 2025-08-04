#!/usr/bin/env python3
"""
Test script for Face Recognition Attendance System
"""

import requests
import json
import base64
import cv2
import time

SERVER_URL = "http://localhost5001"

def test_server_status():
    """Test if the server is running"""
    try:
        response = requests.get(f"{SERVER_URL}/api/test-recognition")
        if response.status_code == 200:
            print("✅ Server is running")
            data = response.json()
            print(f"   Status: {data['status']}")
            print(f"   Registered users: {data['total_users']}")
            print(f"   Model loaded: {data['model_loaded']}")
            return True
        else:
            print("❌ Server responded with error")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return False

def test_attendance_endpoints():
    """Test attendance related endpoints"""
    print("\n📊 Testing Attendance Endpoints:")
    
    # Test get all attendance
    try:
        response = requests.get(f"{SERVER_URL}/get_all_attendance")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Get all attendance: {data['total_present']} people present today")
        else:
            print("❌ Get all attendance failed")
    except Exception as e:
        print(f"❌ Get all attendance error: {e}")

def test_face_recognition_with_webcam():
    """Test face recognition using webcam"""
    print("\n📷 Testing Face Recognition with Webcam:")
    print("Press 'c' to capture and test recognition, 'q' to quit")
    
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Cannot open webcam")
        return
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        cv2.imshow('Face Recognition Test (Press C to capture, Q to quit)', frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('c'):
            # Convert frame to base64
            _, buffer = cv2.imencode('.jpg', frame)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            
            print("🔍 Testing face recognition...")
            try:
                response = requests.post(f"{SERVER_URL}/recognize_face", 
                                       json={'image': img_base64})
                
                if response.status_code == 200:
                    data = response.json()
                    if data['success']:
                        print(f"✅ Face recognized: {data['name']} (confidence: {data['confidence']:.2f})")
                        if data['attendance_marked']:
                            print("✅ Attendance marked successfully!")
                        else:
                            print("⚠️ Attendance already marked today")
                    else:
                        print(f"❌ Recognition failed: {data['message']}")
                else:
                    print(f"❌ Server error: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Recognition test error: {e}")
    
    cap.release()
    cv2.destroyAllWindows()

def main():
    print("🚀 Face Recognition Attendance System Test")
    print("=" * 50)
    
    # Test server status
    if not test_server_status():
        print("\n❌ Please start the server first:")
        print("   cd face-recognition-server")
        print("   python server.py")
        return
    
    # Test attendance endpoints
    test_attendance_endpoints()
    
    # Interactive menu
    while True:
        print("\n📋 Test Options:")
        print("1. Test face recognition with webcam")
        print("2. Check server status")
        print("3. View today's attendance")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            test_face_recognition_with_webcam()
        elif choice == '2':
            test_server_status()
        elif choice == '3':
            test_attendance_endpoints()
        elif choice == '4':
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
