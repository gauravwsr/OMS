import os
import base64
import cv2
import numpy as np
import pickle
import face_recognition
import time
import sqlite3
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.neighbors import KNeighborsClassifier
from datetime import datetime
from mongodb_integration import send_attendance_to_mongodb, get_attendance_status_by_time

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
    
    # Check if the table exists and has the correct schema
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance'")
    table_exists = c.fetchone() is not None
    
    if table_exists:
        # Check if date column exists
        c.execute("PRAGMA table_info(attendance)")
        columns = [column[1] for column in c.fetchall()]
        
        if 'date' not in columns:
            print("⚠️ Adding missing 'date' column to attendance table...")
            # Add the date column without default value first
            c.execute("ALTER TABLE attendance ADD COLUMN date DATE")
            # Update existing records to have the correct date based on timestamp
            c.execute("UPDATE attendance SET date = DATE(timestamp) WHERE date IS NULL")
            print("✅ Date column added and existing records updated")
    else:
        # Create table with all columns
        c.execute('''CREATE TABLE attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            date DATE DEFAULT (DATE('now'))
        )''')
        print("✅ Created new attendance table with all columns")
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return "Face Recognition Server is running!"


def store_attendance(name):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Check if attendance already marked today
    c.execute("SELECT COUNT(*) FROM attendance WHERE name = ? AND date = DATE('now')", (name,))
    count = c.fetchone()[0]
    
    if count > 0:
        conn.close()
        return False, "Attendance already marked for today"
    
    # Insert with explicit date
    c.execute("INSERT INTO attendance (name, date) VALUES (?, DATE('now'))", (name,))
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
        
        # Get multiple neighbors for better accuracy and security
        k_neighbors = min(5, len(registered_names))  # Check top 5 matches
        distances, indices = knn_model.kneighbors([encoding], n_neighbors=k_neighbors)
        
        # Perform additional verification with multiple neighbors
        min_distance = distances[0][0]
        predicted_name = knn_model.predict([encoding])[0]
        
        # Calculate confidence early for security checks
        confidence = (1 - min_distance) * 100
        
        # Security check: Ensure the best match is significantly better than others
        if len(distances[0]) > 1:
            second_best_distance = distances[0][1]
            distance_gap = second_best_distance - min_distance
            
            print(f"🔒 Security Analysis:")
            print(f"   - Best match distance: {min_distance:.3f}")
            print(f"   - Second best distance: {second_best_distance:.3f}")
            print(f"   - Distance gap: {distance_gap:.3f}")
            print(f"   - Confidence: {confidence:.1f}%")
            
            # Require significant gap between best and second best match
            # But be more lenient if confidence is high and it's a reasonable match
            min_gap_required = 0.1  # Default minimum gap
            
            # If confidence is high (>70%), allow smaller gap for better user experience
            if confidence >= 70.0:
                min_gap_required = 0.05  # More lenient for high confidence matches
                
            if distance_gap < min_gap_required:  # If gap is too small, it's ambiguous
                print(f"⚠️ SECURITY ALERT: Face match is ambiguous (gap: {distance_gap:.3f}, required: {min_gap_required:.3f})")
                print(f"   - Confidence: {confidence:.1f}%")
                print(f"   - Using {'lenient' if min_gap_required == 0.05 else 'strict'} threshold due to confidence level")
                
                # If confidence is reasonable (≥65%) and we have a clear best match, allow it
                # This handles cases where faces are similar but the system still identifies correctly
                if confidence >= 65.0 and predicted_name in registered_names:
                    print(f"✅ Allowing ambiguous match due to reasonable confidence: {confidence:.1f}%")
                    print(f"💾 Storing attendance for: {predicted_name} (ambiguous but confident match)")
                    
                    # Additional security: Verify user exists and has sufficient training data
                    known_encodings = load_known_encodings()
                    if predicted_name in known_encodings:
                        user_encoding_count = len(known_encodings[predicted_name])
                        if user_encoding_count < 5:
                            print(f"⚠️ SECURITY WARNING: User {predicted_name} has insufficient training data ({user_encoding_count} photos)")
                            return jsonify({
                                'message': f'❌ Insufficient training data for {predicted_name}. Please register more photos.',
                                'error': 'insufficient_training_data',
                                'encoding_count': user_encoding_count
                            }), 403
                    
                    # Get attendance status based on time
                    time_status = get_attendance_status_by_time()
                    
                    # Store in SQLite (existing functionality)
                    success, attendance_message = store_attendance(predicted_name)
                    
                    # Also store in MongoDB
                    mongodb_success, mongodb_message = send_attendance_to_mongodb(predicted_name, time_status)
                    
                    total_time = time.time() - start_time
                    print(f"⏱️ Total processing time: {total_time:.2f}s")
                    
                    if success:
                        print(f"✅ Attendance marked successfully for: {predicted_name} (ambiguous match)")
                        final_message = f'✅ Attendance marked successfully for {predicted_name}! (Ambiguous match with reasonable confidence)'
                        if mongodb_success:
                            final_message += ' (Synced to database)'
                        else:
                            final_message += f' (Warning: {mongodb_message})'
                            
                        return jsonify({
                            'success': True,
                            'message': final_message,
                            'name': predicted_name,
                            'confidence': f'{confidence:.1f}%',
                            'distance': min_distance,
                            'attendance_marked': True,
                            'mongodb_synced': mongodb_success,
                            'status': time_status,
                            'processing_time': f'{total_time:.2f}s',
                            'warning': 'ambiguous_match_allowed',
                            'distance_gap': f'{distance_gap:.3f}',
                            'required_gap': f'{min_gap_required:.3f}'
                        }), 200
                    else:
                        print(f"⚠️ Attendance already marked for: {predicted_name}")
                        return jsonify({
                            'success': True,
                            'message': f'✅ Welcome back {predicted_name}! {attendance_message} (Ambiguous match)',
                            'name': predicted_name,
                            'confidence': f'{confidence:.1f}%',
                            'distance': min_distance,
                            'attendance_marked': False,
                            'mongodb_synced': False,
                            'status': time_status,
                            'processing_time': f'{total_time:.2f}s',
                            'warning': 'ambiguous_match_allowed'
                        }), 200
                else:
                    # Low confidence or unregistered user - return 403 as before
                    return jsonify({
                        'message': '❌ Face recognition is ambiguous. Multiple similar faces detected. Please ensure proper lighting and try again.',
                        'error': 'ambiguous_match',
                        'best_match': predicted_name,
                        'confidence': f'{confidence:.1f}%',
                        'distance_gap': f'{distance_gap:.3f}',
                        'required_gap': f'{min_gap_required:.3f}'
                    }), 403
        
        print(f"🎯 Face detected - Predicted: {predicted_name}, Distance: {min_distance}")
        print(f"⏱️ Recognition took: {time.time() - recognition_start:.2f}s")
        
        best_match = predicted_name
        best_distance = min_distance
        
        # Use a more strict threshold for better security
        threshold = 0.5  # Decreased from 0.7 for stricter face verification
        
        print(f"🎯 Recognition Results: Best match: {best_match}, Distance: {best_distance:.3f}, Threshold: {threshold}")
        
        # Additional verification: Check if the match confidence is high enough
        confidence_threshold = 65.0  # Minimum 65% confidence required
        
        print(f"🔒 Security Check: Confidence: {confidence:.1f}%, Required: {confidence_threshold}%")
        
        if best_match and best_distance < threshold and confidence >= confidence_threshold:
            print(f"✅ Face RECOGNIZED: {best_match} (distance: {best_distance:.3f}, confidence: {confidence:.1f}%)")
            
            # Additional security: Verify user exists in registered database
            if best_match not in registered_names:
                print(f"� SECURITY ALERT: Recognized user {best_match} not in registered database!")
                return jsonify({
                    'message': f'🚨 Security Error: User {best_match} not found in registered database',
                    'error': 'user_not_in_database'
                }), 403
            
            # Additional security: Check if user has sufficient training data
            known_encodings = load_known_encodings()
            if best_match in known_encodings:
                user_encoding_count = len(known_encodings[best_match])
                if user_encoding_count < 5:
                    print(f"⚠️ SECURITY WARNING: User {best_match} has insufficient training data ({user_encoding_count} photos)")
                    return jsonify({
                        'message': f'❌ Insufficient training data for {best_match}. Please register more photos.',
                        'error': 'insufficient_training_data',
                        'encoding_count': user_encoding_count
                    }), 403
                    
                print(f"✅ Security check passed: {best_match} has {user_encoding_count} training photos")
            
            print(f"💾 Storing attendance for: {best_match}")
            
            # Get attendance status based on time
            time_status = get_attendance_status_by_time()
            
            # Store in SQLite (existing functionality)
            success, attendance_message = store_attendance(best_match)
            
            # Also store in MongoDB
            mongodb_success, mongodb_message = send_attendance_to_mongodb(best_match, time_status)
            
            if success:
                print(f"✅ Attendance marked successfully for: {best_match}")
                total_time = time.time() - start_time
                print(f"⏱️ Total processing time: {total_time:.2f}s")
                
                final_message = f'✅ Attendance marked successfully for {best_match}!'
                if mongodb_success:
                    final_message += ' (Synced to database)'
                else:
                    final_message += f' (Warning: {mongodb_message})'
                
                return jsonify({
                    'success': True,
                    'message': final_message,
                    'name': best_match,
                    'confidence': f'{(1 - best_distance) * 100:.1f}%',
                    'distance': best_distance,
                    'attendance_marked': True,
                    'mongodb_synced': mongodb_success,
                    'status': time_status,
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
                    'mongodb_synced': False,
                    'status': time_status,
                    'processing_time': f'{total_time:.2f}s'
                }), 200
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
    
    # Only train if we have sufficient data for each user
    valid_users = []
    for name, encodings in data.items():
        if len(encodings) >= 5:  # Minimum 5 photos per person
            for enc in encodings:
                X.append(enc)
                y.append(name)
            valid_users.append(name)
        else:
            print(f"⚠️ Skipping {name}: only {len(encodings)} photos (minimum 5 required)")
    
    if not X:
        print("❌ No sufficient encodings to train KNN. Each user needs at least 5 photos.")
        return None
    
    if len(valid_users) < 1:
        print("❌ Need at least 1 user with 5+ photos to train model.")
        return None
    
    # Use optimal neighbors for better accuracy
    n_neighbors = min(3, len(X))  # Conservative approach for security
    knn = KNeighborsClassifier(
        n_neighbors=n_neighbors, 
        weights='distance',  # Weight by distance for better accuracy
        algorithm='auto',
        metric='euclidean'  # Use euclidean distance for face recognition
    )
    knn.fit(X, y)
    
    with open(MODEL_FILE, 'wb') as f:
        pickle.dump(knn, f)
    
    print(f"✅ Trained and saved KNN model with {n_neighbors} neighbors as {MODEL_FILE}")
    print(f"✅ Model trained with {len(X)} encodings for {len(valid_users)} people: {valid_users}")
    print(f"🔒 Security: Only users with 5+ photos are included in model")
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

@app.route('/api/delete-user/<username>', methods=['DELETE'])
def delete_user(username):
    """Delete user's images and remove from recognition model"""
    try:
        print(f"🗑️ Request to delete user: {username}")
        
        # Path to user's images directory
        user_images_path = os.path.join(IMAGES_DIR, COMPANY_ID, username)
        
        deleted_items = {
            'images_deleted': 0,
            'folder_removed': False,
            'encodings_removed': False,
            'model_retrained': False
        }
        
        # Delete user's images folder if it exists
        if os.path.exists(user_images_path):
            import shutil
            try:
                # Count images before deletion
                image_files = [f for f in os.listdir(user_images_path) 
                             if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                deleted_items['images_deleted'] = len(image_files)
                
                # Remove the entire folder
                shutil.rmtree(user_images_path)
                deleted_items['folder_removed'] = True
                print(f"✅ Deleted {deleted_items['images_deleted']} images for {username}")
                
            except Exception as e:
                print(f"❌ Error deleting image folder: {str(e)}")
        else:
            print(f"⚠️ No image folder found for {username}")
        
        # Remove user from encodings file
        if os.path.exists(ENCODING_FILE):
            try:
                encodings_data = load_known_encodings()
                if username in encodings_data:
                    del encodings_data[username]
                    save_encodings(encodings_data)
                    deleted_items['encodings_removed'] = True
                    print(f"✅ Removed encodings for {username}")
                else:
                    print(f"⚠️ No encodings found for {username}")
            except Exception as e:
                print(f"❌ Error removing encodings: {str(e)}")
        
        # Retrain the model if there are still users
        try:
            remaining_users = get_registered_names()
            if remaining_users:
                train_knn_model()
                deleted_items['model_retrained'] = True
                print(f"✅ Model retrained with {len(remaining_users)} remaining users")
            else:
                # Delete model file if no users left
                if os.path.exists(MODEL_FILE):
                    os.remove(MODEL_FILE)
                print("✅ No users remaining, model file removed")
        except Exception as e:
            print(f"❌ Error retraining model: {str(e)}")
        
        # Also remove from SQLite attendance if needed (optional)
        try:
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("DELETE FROM attendance WHERE name = ?", (username,))
            deleted_attendance_records = c.rowcount
            conn.commit()
            conn.close()
            print(f"✅ Removed {deleted_attendance_records} attendance records for {username}")
            deleted_items['attendance_records_removed'] = deleted_attendance_records
        except Exception as e:
            print(f"❌ Error removing attendance records: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': f'Successfully deleted all data for user: {username}',
            'deleted_items': deleted_items,
            'username': username
        }), 200
        
    except Exception as e:
        print(f"❌ Error in delete_user: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'username': username
        }), 500

@app.route('/api/retrain-model', methods=['POST'])
def retrain_model():
    """Retrain the KNN model with current user data"""
    try:
        print("🔄 Manual model retraining requested...")
        
        # Get current data
        data = load_known_encodings()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No user data available to train model'
            }), 400
        
        # Show current data status
        user_stats = {}
        for name, encodings in data.items():
            user_stats[name] = len(encodings)
        
        print(f"📊 Current user data: {user_stats}")
        
        # Train model
        knn_model = train_knn_model()
        
        if knn_model is None:
            return jsonify({
                'success': False,
                'message': 'Failed to train model. Ensure each user has at least 5 photos.',
                'user_stats': user_stats
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Model retrained successfully',
            'user_stats': user_stats,
            'total_users': len([name for name, count in user_stats.items() if count >= 5])
        }), 200
        
    except Exception as e:
        print(f"❌ Error retraining model: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/delete-all-users', methods=['DELETE'])
def delete_all_users():
    """Delete all users and reset the system (admin function)"""
    try:
        deleted_items = {
            'users_deleted': 0,
            'total_images': 0,
            'folders_removed': 0
        }
        
        # Get list of all users before deletion
        company_path = os.path.join(IMAGES_DIR, COMPANY_ID)
        if os.path.exists(company_path):
            user_folders = [f for f in os.listdir(company_path) 
                          if os.path.isdir(os.path.join(company_path, f))]
            
            for user_folder in user_folders:
                user_path = os.path.join(company_path, user_folder)
                image_files = [f for f in os.listdir(user_path) 
                             if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                deleted_items['total_images'] += len(image_files)
                deleted_items['users_deleted'] += 1
            
            # Remove all user folders
            import shutil
            shutil.rmtree(company_path)
            os.makedirs(company_path, exist_ok=True)
            deleted_items['folders_removed'] = len(user_folders)
        
        # Delete encodings file
        if os.path.exists(ENCODING_FILE):
            os.remove(ENCODING_FILE)
        
        # Delete model file
        if os.path.exists(MODEL_FILE):
            os.remove(MODEL_FILE)
        
        # Clear attendance database
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("DELETE FROM attendance")
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'All users and data deleted successfully',
            'deleted_items': deleted_items
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/disk-usage', methods=['GET'])
def get_disk_usage():
    """Get disk usage information for face recognition images"""
    try:
        usage_info = {
            'total_users': 0,
            'total_images': 0,
            'total_size_mb': 0,
            'users_breakdown': []
        }
        
        company_path = os.path.join(IMAGES_DIR, COMPANY_ID)
        if os.path.exists(company_path):
            user_folders = [f for f in os.listdir(company_path) 
                          if os.path.isdir(os.path.join(company_path, f))]
            
            for user_folder in user_folders:
                user_path = os.path.join(company_path, user_folder)
                image_files = [f for f in os.listdir(user_path) 
                             if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                
                # Calculate folder size
                folder_size = 0
                for image_file in image_files:
                    file_path = os.path.join(user_path, image_file)
                    if os.path.exists(file_path):
                        folder_size += os.path.getsize(file_path)
                
                user_info = {
                    'name': user_folder,
                    'image_count': len(image_files),
                    'size_mb': round(folder_size / (1024 * 1024), 2)
                }
                
                usage_info['users_breakdown'].append(user_info)
                usage_info['total_images'] += len(image_files)
                usage_info['total_size_mb'] += user_info['size_mb']
            
            usage_info['total_users'] = len(user_folders)
            usage_info['total_size_mb'] = round(usage_info['total_size_mb'], 2)
        
        return jsonify({
            'success': True,
            'usage_info': usage_info
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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
    app.run(host='0.0.0.0', port=5002, debug=True)