
import base64
import io
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from PIL import Image

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

@app.route('/api/detect_contours', methods=['POST'])
def detect_contours():
    # Get image data and parameters from the request
    data = request.json
    image_data = data.get('image')
    threshold_value = int(data.get('threshold', 128))
    
    try:
        # Decode base64 image
        image_data = image_data.split(',')[1] if ',' in image_data else image_data
        decoded_image = base64.b64decode(image_data)
        image = np.array(Image.open(io.BytesIO(decoded_image)))
        
        # Convert to grayscale if image is RGB
        if len(image.shape) > 2:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
            
        # Apply Gaussian blur to reduce noise (optional)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply binary threshold
        _, thresh = cv2.threshold(blurred, threshold_value, 255, cv2.THRESH_BINARY)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Convert contours to serializable format
        serialized_contours = []
        for contour in contours:
            points = []
            for point in contour:
                x, y = point[0]
                points.append({"x": int(x), "y": int(y)})
            serialized_contours.append({
                "points": points,
                "closed": True
            })
        
        # Create visualizations
        # 1. Grayscale image
        _, grayscale_buffer = cv2.imencode('.png', gray)
        grayscale_base64 = base64.b64encode(grayscale_buffer).decode('utf-8')
        
        # 2. Threshold image
        _, threshold_buffer = cv2.imencode('.png', thresh)
        threshold_base64 = base64.b64encode(threshold_buffer).decode('utf-8')
        
        # 3. Contour visualization
        contour_image = np.zeros_like(image)
        if len(contour_image.shape) == 2:
            contour_image = cv2.cvtColor(contour_image, cv2.COLOR_GRAY2RGB)
        
        cv2.drawContours(contour_image, contours, -1, (0, 170, 255), 2)
        _, contour_buffer = cv2.imencode('.png', contour_image)
        contour_base64 = base64.b64encode(contour_buffer).decode('utf-8')
        
        return jsonify({
            'contours': serialized_contours,
            'count': len(serialized_contours),
            'visualizations': {
                'grayscale': f'data:image/png;base64,{grayscale_base64}',
                'threshold': f'data:image/png;base64,{threshold_base64}',
                'contour': f'data:image/png;base64,{contour_base64}'
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medical_samples', methods=['GET'])
def get_medical_samples():
    """Return a list of medical sample images for contour detection."""
    sample_files = [
        {'id': 'brain-mri', 'name': 'Brain MRI', 'category': 'medical'},
        {'id': 'lung-ct', 'name': 'Lung CT Scan', 'category': 'medical'},
        {'id': 'liver-ultrasound', 'name': 'Liver Ultrasound', 'category': 'medical'},
        {'id': 'retina-scan', 'name': 'Retina Scan', 'category': 'medical'}
    ]
    
    return jsonify({'samples': sample_files})

@app.route('/api/sample/<sample_id>', methods=['GET'])
def get_sample(sample_id):
    """Return base64 sample image data by ID."""
    samples = {
        'brain-mri': load_medical_sample('brain-mri'),
        'lung-ct': load_medical_sample('lung-ct'),
        'liver-ultrasound': load_medical_sample('liver-ultrasound'),
        'retina-scan': load_medical_sample('retina-scan')
    }
    
    if sample_id in samples:
        return jsonify({'image': samples[sample_id]})
    else:
        return jsonify({'error': 'Sample not found'}), 404

def load_medical_sample(sample_id):
    """Load a sample medical image as base64."""
    # In a real application, these would be actual medical images from a database or file system
    # For demonstration, we're creating synthetic medical-like images
    
    width, height = 512, 512
    image = np.zeros((height, width), dtype=np.uint8)
    
    if sample_id == 'brain-mri':
        # Create a brain MRI-like image
        cv2.ellipse(image, (width//2, height//2), (180, 240), 0, 0, 360, 200, -1)
        cv2.ellipse(image, (width//2, height//2), (150, 200), 0, 0, 360, 50, -1)
        cv2.ellipse(image, (width//2 - 50, height//2 - 30), (50, 60), 0, 0, 360, 150, -1)
        cv2.ellipse(image, (width//2 + 50, height//2 - 30), (50, 60), 0, 0, 360, 150, -1)
        
    elif sample_id == 'lung-ct':
        # Create a lung CT-like image
        cv2.rectangle(image, (0, 0), (width, height), 100, -1)
        cv2.ellipse(image, (width//3, height//2), (80, 150), 0, 0, 360, 20, -1)
        cv2.ellipse(image, (2*width//3, height//2), (80, 150), 0, 0, 360, 20, -1)
        
    elif sample_id == 'liver-ultrasound':
        # Create a liver ultrasound-like image
        image = np.random.randint(10, 70, (height, width), dtype=np.uint8)
        mask = np.zeros((height, width), dtype=np.uint8)
        cv2.ellipse(mask, (width//2, height//2), (150, 120), 0, 0, 360, 255, -1)
        liver = np.random.randint(80, 150, (height, width), dtype=np.uint8)
        image = np.where(mask > 0, liver, image)
        
    elif sample_id == 'retina-scan':
        # Create a retina scan-like image
        image = np.ones((height, width), dtype=np.uint8) * 50
        cv2.circle(image, (width//2, height//2), 200, 100, -1)
        cv2.circle(image, (width//2, height//2), 60, 220, -1)
        
        # Add blood vessels
        for i in range(8):
            angle = i * np.pi / 4
            x1, y1 = width//2, height//2
            x2 = int(x1 + 180 * np.cos(angle))
            y2 = int(y1 + 180 * np.sin(angle))
            cv2.line(image, (x1, y1), (x2, y2), 150, 3)
            
    # Add some noise
    noise = np.random.normal(0, 15, (height, width)).astype(np.int8)
    image = cv2.add(image, noise)
    
    # Convert to base64
    _, buffer = cv2.imencode('.png', image)
    image_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return f'data:image/png;base64,{image_base64}'

if __name__ == '__main__':
    app.run(debug=True, port=5000)
