
# Python Backend for Contour Detection

This folder contains a Python-based backend service for enhanced contour detection using OpenCV. This provides much better performance and accuracy compared to the JavaScript implementation, especially for complex images like medical scans.

## Requirements

- Python 3.6+
- Flask
- OpenCV
- NumPy
- PIL (Pillow)

## Installation

1. Install the required packages:

```bash
pip install -r requirements.txt
```

## Running the Server

1. Navigate to the `src/python` directory:

```bash
cd src/python
```

2. Start the Flask server:

```bash
python contour_server.py
```

The server will start on http://localhost:5000

## API Endpoints

### POST /api/detect_contours
Processes an image and detects contours.

**Request Body:**
```json
{
  "image": "base64_encoded_image_data",
  "threshold": 128
}
```

**Response:**
```json
{
  "contours": [
    {
      "points": [{"x": 10, "y": 20}, ...],
      "closed": true
    },
    ...
  ],
  "count": 5,
  "visualizations": {
    "grayscale": "data:image/png;base64,...",
    "threshold": "data:image/png;base64,...",
    "contour": "data:image/png;base64,..."
  }
}
```

### GET /api/medical_samples
Returns a list of available medical samples.

**Response:**
```json
{
  "samples": [
    {"id": "brain-mri", "name": "Brain MRI", "category": "medical"},
    ...
  ]
}
```

### GET /api/sample/{sample_id}
Returns a specific sample image by ID.

**Response:**
```json
{
  "image": "data:image/png;base64,..."
}
```

## Integrating with the Web Application

The web application automatically tries to connect to this Python backend when started. If it can't connect, it will fall back to the JavaScript implementation.

To ensure best performance, especially for medical images, make sure this backend is running before using the web application.
