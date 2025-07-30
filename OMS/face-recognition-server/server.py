import os
import base64
import cv2
import numpy as np
import pickle
import face_recognition
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.neighbors import KNeighborsClassifier

# CONFIG
IMAGES_DIR = 'images'
COMPANY_ID = 'demo_company'
ENCODING_FILE = f'face_encodings_{COMPANY_ID}.pkl'
MODEL_FILE = "knn_face_model.pkl"

app = Flask(__name__)
CORS(app)

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
    knn = KNeighborsClassifier(n_neighbors=3)
    knn.fit(X, y)
    with open(MODEL_FILE, 'wb') as f:
        pickle.dump(knn, f)
    print(f"✅ Trained and saved KNN model as {MODEL_FILE}")
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

if __name__ == '__main__':
    os.makedirs(IMAGES_DIR, exist_ok=True)
    app.run(host='0.0.0.0', port=5001, debug=True)