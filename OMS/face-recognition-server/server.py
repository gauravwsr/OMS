import os
import base64
import cv2
import numpy as np
import pickle
import face_recognition
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.neighbors import KNeighborsClassifier
import sqlite3
from datetime import datetime

IMAGES_DIR = 'images'
COMPANY_ID = 'demo_company'
ENCODING_FILE = f'face_encodings_{COMPANY_ID}.pkl'
MODEL_FILE = "knn_face_model.pkl"
DB_FILE = "attendance.db"

app = Flask(__name__)
CORS(app)

# --- Attendance DB Setup ---
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        date DATE DEFAULT (DATE('now'))
    )''')
    conn.commit()
    conn.close()

def store_attendance(name):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Check if attendance already marked today
    c.execute("SELECT COUNT(*) FROM attendance WHERE name = ? AND date = DATE('now')", (name,))
    count = c.fetchone()[0]
    
    if count > 0:
        conn.close()
        return False, "Attendance already marked for today"
    
    c.execute("INSERT INTO attendance (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()
    return True, "Attendance marked successfully"

def get_user_attendance_history(name, limit=30):
    """Get attendance history for a specific user"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        SELECT date, timestamp, 
               CASE 
                   WHEN time(timestamp) <= '10:00:00' THEN 'On Time'
                   WHEN time(timestamp) <= '10:30:00' THEN 'Late'
                   ELSE 'Very Late'
               END as status
        FROM attendance 
        WHERE name = ? 
        ORDER BY date DESC 
        LIMIT ?
    """, (name, limit))
    
    rows = c.fetchall()
    conn.close()
    
    return [{'date': row[0], 'time': row[1], 'status': row[2]} for row in rows]

def get_attendance_stats(name):
    """Get attendance statistics for a user"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Total days present this month
    c.execute("""
        SELECT COUNT(*) FROM attendance 
        WHERE name = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    """, (name,))
    this_month = c.fetchone()[0]
    
    # Total days present overall
    c.execute("SELECT COUNT(*) FROM attendance WHERE name = ?", (name,))
    total_days = c.fetchone()[0]
    
    # Check if present today
    c.execute("SELECT COUNT(*) FROM attendance WHERE name = ? AND date = DATE('now')", (name,))
    present_today = c.fetchone()[0] > 0
    
    conn.close()
    
    return {
        'present_today': present_today,
        'this_month': this_month,
        'total_days': total_days
    }
def load_knn_model():
    if not os.path.exists(MODEL_FILE):
        return None
    with open(MODEL_FILE, 'rb') as f:
        return pickle.load(f)

def get_registered_names():
    if not os.path.exists(ENCODING_FILE):
        return []
    with open(ENCODING_FILE, 'rb') as f:
        data = pickle.load(f)
    return list(data.keys())
# ...existing code...

# --- Attendance API ---
@app.route('/api/mark-attendance', methods=['POST'])
def mark_attendance():
    import time
    start_time = time.time()
    
    data = request.get_json()
    image_b64 = data.get('image')
    if not image_b64:
        return jsonify({'message': 'No image provided'}), 400

    try:
        print(f"⏱️ Processing attendance request...")
        
        # Decode the image
        decode_start = time.time()
        img_data = base64.b64decode(image_b64)
        np_img = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        print(f"⏱️ Image decoding took: {time.time() - decode_start:.2f}s")
        
        if img is None:
            return jsonify({'message': 'Invalid image data'}), 400
        
        # Resize image for faster processing while maintaining quality
        original_height, original_width = img.shape[:2]
        if original_width > 800:
            scale_factor = 800 / original_width
            new_width = 800
            new_height = int(original_height * scale_factor)
            img = cv2.resize(img, (new_width, new_height))
            print(f"📏 Resized image from {original_width}x{original_height} to {new_width}x{new_height}")
            
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Use a more robust face detection model
        detection_start = time.time()
        print("🔍 Starting face detection...")
        face_locations = face_recognition.face_locations(rgb, model='hog')
        
        if not face_locations:
            print("⚠️ HOG model found no faces, trying CNN...")
            # Try with CNN model if HOG fails, but with smaller image for speed
            small_rgb = cv2.resize(rgb, (0, 0), fx=0.5, fy=0.5)
            face_locations = face_recognition.face_locations(small_rgb, model='cnn')
            # Scale locations back up
            face_locations = [(int(top*2), int(right*2), int(bottom*2), int(left*2)) 
                            for (top, right, bottom, left) in face_locations]
        
        print(f"✅ Found {len(face_locations)} face(s) in {time.time() - detection_start:.2f}s")
        
        if not face_locations:
            return jsonify({'message': 'No face detected in the image. Please ensure your face is clearly visible and well-lit.'}), 404
            
        encoding_start = time.time()
        print("🔍 Extracting face encodings...")
        encodings = face_recognition.face_encodings(rgb, face_locations)
        print(f"✅ Extracted {len(encodings)} face encoding(s) in {time.time() - encoding_start:.2f}s")
        
        if not encodings:
            return jsonify({'message': 'Could not extract face features. Please try again with better lighting.'}), 404

        recognition_start = time.time()
        knn_model = load_knn_model()
        registered_names = get_registered_names()
        
        if not knn_model:
            return jsonify({'message': 'Face recognition model not trained. Please ensure users are registered.'}), 500

        print(f"🔍 Processing {len(encodings)} face(s) found in image")
        print(f"📋 Registered users in system: {registered_names}")
        
        best_match = None
        best_distance = float('inf')
        
        # Process only the first face for speed
        encoding = encodings[0]
        print("🔍 Performing face recognition...")
        
        # Get multiple neighbors for better accuracy
        distances, indices = knn_model.kneighbors([encoding], n_neighbors=min(3, len(registered_names)))
        
        # Use a more lenient threshold and check multiple neighbors
        min_distance = distances[0][0]
        predicted_name = knn_model.predict([encoding])[0]
        
        print(f"🎯 Face detected - Predicted: {predicted_name}, Distance: {min_distance}")
        print(f"⏱️ Recognition took: {time.time() - recognition_start:.2f}s")
        
        best_match = predicted_name
        best_distance = min_distance
        
        # Adjust threshold based on registration quality - more lenient for better recognition
        threshold = 0.7  # Increased from 0.6 for better recognition with registered users
        
        print(f"🎯 Recognition Results: Best match: {best_match}, Distance: {best_distance:.3f}, Threshold: {threshold}")
        
        if best_match and best_distance < threshold:
            print(f"✅ Face RECOGNIZED: {best_match} (distance: {best_distance:.3f})")
            
            if best_match in registered_names:
                print(f"💾 Storing attendance for: {best_match}")
                success, attendance_message = store_attendance(best_match)
                if success:
                    print(f"✅ Attendance marked successfully for: {best_match}")
                    total_time = time.time() - start_time
                    print(f"⏱️ Total processing time: {total_time:.2f}s")
                    return jsonify({
                        'success': True,
                        'message': f'✅ Attendance marked successfully for {best_match}!',
                        'name': best_match,
                        'confidence': f'{(1 - best_distance) * 100:.1f}%',
                        'distance': best_distance,
                        'attendance_marked': True,
                        'processing_time': f'{total_time:.2f}s'
                    }), 200
                else:
                    print(f"⚠️ Attendance already marked for: {best_match}")
                    total_time = time.time() - start_time
                    print(f"⏱️ Total processing time: {total_time:.2f}s")
                    return jsonify({
                        'success': True,
                        'message': f'✅ Welcome back {best_match}! {attendance_message}',
                        'name': best_match,
                        'confidence': f'{(1 - best_distance) * 100:.1f}%',
                        'distance': best_distance,
                        'attendance_marked': False,
                        'processing_time': f'{total_time:.2f}s'
                    }), 200
            else:
                print(f"❌ User {best_match} not found in registered database")
                return jsonify({
                    'message': f'❌ User {best_match} not found in registered database',
                    'error': 'user_not_in_database'
                }), 403
        else:
            print(f"❌ Face NOT RECOGNIZED. Best match: {best_match}, Distance: {best_distance}, Threshold: {threshold}")
            print(f"Available registered users: {registered_names}")
            
            if best_match:
                return jsonify({
                    'message': f'❌ Face not recognized. Closest match was {best_match} but confidence too low ({(1 - best_distance) * 100:.1f}%). Please ensure good lighting and try again.',
                    'error': 'low_confidence',
                    'closest_match': best_match,
                    'confidence': f'{(1 - best_distance) * 100:.1f}%'
                }), 403
            else:
                return jsonify({
                    'message': '❌ No face match found. Please ensure you are registered in the system.',
                    'error': 'no_match_found',
                    'registered_users': registered_names
                }), 403
        
    except Exception as e:
        print(f"Error in attendance marking: {str(e)}")
        return jsonify({'message': f'Server error: {str(e)}'}), 500

def load_known_encodings():
    if os.path.exists(ENCODING_FILE):
        with open(ENCODING_FILE, 'rb') as f:
            return pickle.load(f)
    return {}

def save_encodings(data):
    with open(ENCODING_FILE, 'wb') as f:
        pickle.dump(data, f)

def train_knn_model():
    data = load_known_encodings()
    X, y = [], []
    for name, encodings in data.items():
        for enc in encodings:
            X.append(enc)
            y.append(name)
    if not X:
        print("❌ No encodings to train KNN.")
        return None
    
    # Use more neighbors for better accuracy with multiple images per person
    n_neighbors = min(5, len(X))  # Use up to 5 neighbors, but not more than total samples
    knn = KNeighborsClassifier(n_neighbors=n_neighbors, weights='distance', algorithm='auto')
    knn.fit(X, y)
    
    with open(MODEL_FILE, 'wb') as f:
        pickle.dump(knn, f)
    print(f"✅ Trained and saved KNN model with {n_neighbors} neighbors as {MODEL_FILE}")
    print(f"✅ Model trained with {len(X)} encodings for {len(set(y))} people")
    return knn

def register_user(name):
    save_path = os.path.join(IMAGES_DIR, COMPANY_ID, name)
    encodings = []
    for img_file in os.listdir(save_path):
        img_path = os.path.join(save_path, img_file)
        img = face_recognition.load_image_file(img_path)
        face_enc = face_recognition.face_encodings(img)
        if face_enc:
            encodings.append(face_enc[0])
    if encodings:
        all_encodings = load_known_encodings()
        all_encodings[name] = encodings
        save_encodings(all_encodings)
        print(f"✅ {name} registered with {len(encodings)} encodings.")
        train_knn_model()
    else:
        print("❌ No valid encodings found for registration.")

@app.route('/recognize_face', methods=['POST'])
def recognize_face():
    """Alternative endpoint for face recognition - same as mark_attendance"""
    return mark_attendance()

@app.route('/register_user', methods=['POST'])  
def register_user_endpoint():
    """Alternative endpoint for user registration - same as register_face"""
    return register_face()

@app.route('/register_face', methods=['POST'])
def register_face():
    data = request.get_json()
    name = data.get('name')
    images = data.get('images', [])
    if not name or not images:
        return jsonify({'error': 'Name and images are required'}), 400
    save_path = os.path.join(IMAGES_DIR, COMPANY_ID, name)
    os.makedirs(save_path, exist_ok=True)
    for idx, img_b64 in enumerate(images):
        try:
            if ',' in img_b64:
                img_b64 = img_b64.split(',')[1]
            img_data = base64.b64decode(img_b64)
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            cv2.imwrite(os.path.join(save_path, f"{name}_{idx+1}.jpg"), img)
        except Exception as e:
            return jsonify({'error': f'Failed to decode image {idx+1}: {str(e)}'}), 500
    register_user(name)
    return jsonify({'message': f'Successfully registered {len(images)} images for {name}.'}), 200

@app.route('/api/registered-users', methods=['GET'])
def get_registered_users():
    """Debug endpoint to check registered users"""
    try:
        # Get users from encodings file
        registered_names = get_registered_names()
        encodings_data = load_known_encodings()
        
        # Also check for users with images but no encodings
        image_users = []
        company_path = os.path.join(IMAGES_DIR, COMPANY_ID)
        if os.path.exists(company_path):
            for item in os.listdir(company_path):
                item_path = os.path.join(company_path, item)
                if os.path.isdir(item_path):
                    image_count = len([f for f in os.listdir(item_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
                    image_users.append({
                        'name': item,
                        'image_count': image_count,
                        'has_encodings': item in registered_names
                    })
        
        users_info = []
        for name in registered_names:
            encoding_count = len(encodings_data.get(name, []))
            users_info.append({
                'name': name,
                'encoding_count': encoding_count
            })
        
        return jsonify({
            'registered_users': users_info,
            'users_with_images': image_users,
            'total_users': len(registered_names),
            'model_exists': os.path.exists(MODEL_FILE),
            'encoding_file_exists': os.path.exists(ENCODING_FILE)
        }), 200
    except Exception as e:
        print(f"Error in get_registered_users: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reregister-user', methods=['POST'])
def reregister_user():
    """Re-register a user from existing images"""
    try:
        data = request.get_json()
        name = data.get('name')
        
        if not name:
            return jsonify({'error': 'Name is required'}), 400
        
        user_path = os.path.join(IMAGES_DIR, COMPANY_ID, name)
        if not os.path.exists(user_path):
            return jsonify({'error': f'No images found for user: {name}'}), 404
        
        print(f"🔄 Re-registering user: {name}")
        register_user(name)
        
        # Verify registration
        registered_names = get_registered_names()
        if name in registered_names:
            encodings_data = load_known_encodings()
            encoding_count = len(encodings_data.get(name, []))
            return jsonify({
                'message': f'Successfully re-registered {name}',
                'encoding_count': encoding_count
            }), 200
        else:
            return jsonify({'error': f'Failed to re-register {name}'}), 500
            
    except Exception as e:
        print(f"Error in re-registration: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-recognition', methods=['GET'])
def test_recognition():
    """Test endpoint to check if face recognition is working"""
    try:
        registered_names = get_registered_names()
        knn_model = load_knn_model()
        
        return jsonify({
            'status': 'Face recognition system is ready',
            'registered_users': registered_names,
            'model_loaded': knn_model is not None,
            'total_users': len(registered_names)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_attendance_history/<name>', methods=['GET'])
def get_attendance_history_api(name):
    """Get attendance history for a specific user"""
    try:
        limit = request.args.get('limit', 30, type=int)
        history = get_user_attendance_history(name, limit)
        return jsonify({
            'success': True,
            'history': history,
            'total_records': len(history)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/get_attendance_stats/<name>', methods=['GET'])
def get_attendance_stats_api(name):
    """Get attendance statistics for a user"""
    try:
        stats = get_attendance_stats(name)
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/get_all_attendance', methods=['GET'])
def get_all_attendance():
    """Get today's attendance for all users"""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        date_filter = request.args.get('date', 'today')
        if date_filter == 'today':
            c.execute("""
                SELECT name, timestamp, 
                       CASE 
                           WHEN time(timestamp) <= '10:00:00' THEN 'On Time'
                           WHEN time(timestamp) <= '10:30:00' THEN 'Late'
                           ELSE 'Very Late'
                       END as status
                FROM attendance 
                WHERE date = DATE('now')
                ORDER BY timestamp ASC
            """)
        else:
            c.execute("""
                SELECT name, timestamp,
                       CASE 
                           WHEN time(timestamp) <= '10:00:00' THEN 'On Time'
                           WHEN time(timestamp) <= '10:30:00' THEN 'Late'
                           ELSE 'Very Late'
                       END as status
                FROM attendance 
                WHERE date = ?
                ORDER BY timestamp ASC
            """, (date_filter,))
        
        rows = c.fetchall()
        conn.close()
        
        attendance_list = [
            {'name': row[0], 'time': row[1], 'status': row[2]} 
            for row in rows
        ]
        
        return jsonify({
            'success': True,
            'attendance': attendance_list,
            'total_present': len(attendance_list),
            'date': date_filter if date_filter != 'today' else datetime.now().strftime('%Y-%m-%d')
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    os.makedirs(IMAGES_DIR, exist_ok=True)
    init_db()
    print("Face Recognition Server starting...")
    print("Available endpoints:")
    print("- POST /register_user - Register new user with images")
    print("- POST /recognize_face - Recognize face and mark attendance") 
    print("- GET /get_attendance_history/<name> - Get user attendance history")
    print("- GET /get_attendance_stats/<name> - Get user attendance statistics")
    print("- GET /get_all_attendance - Get today's attendance list")
    print("- GET /api/test-recognition - Test face recognition system")
    app.run(host='0.0.0.0', port=5001, debug=True)