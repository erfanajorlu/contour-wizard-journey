
// Simple implementation of contour detection logic for educational purposes
// This is a simplified version to demonstrate concepts

export interface ContourPoint {
  x: number;
  y: number;
}

export interface ContourData {
  points: ContourPoint[];
  closed: boolean;
}

// Convert canvas data to grayscale
export const convertToGrayscale = (
  imageData: ImageData
): Uint8ClampedArray => {
  const data = imageData.data;
  const gray = new Uint8ClampedArray(imageData.width * imageData.height);
  
  for (let i = 0; i < data.length; i += 4) {
    // Standard grayscale conversion formula
    const grayValue = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    gray[i / 4] = grayValue;
  }
  
  return gray;
};

// Simple threshold operation
export const applyThreshold = (
  grayscale: Uint8ClampedArray,
  threshold: number
): Uint8ClampedArray => {
  const binary = new Uint8ClampedArray(grayscale.length);
  
  for (let i = 0; i < grayscale.length; i++) {
    binary[i] = grayscale[i] > threshold ? 255 : 0;
  }
  
  return binary;
};

// Simplified contour tracing algorithm (Square Tracing algorithm)
export const findContours = (
  binary: Uint8ClampedArray,
  width: number,
  height: number
): ContourData[] => {
  const visited = new Uint8ClampedArray(binary.length);
  const contours: ContourData[] = [];
  
  // Helper function to check if a pixel is a border pixel
  const isBorderPixel = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    
    // A pixel is a border pixel if it's white and has at least one black neighbor
    if (binary[y * width + x] === 0) return false;
    
    // Check 4-connectivity
    const neighbors = [
      { dx: 1, dy: 0 },  // right
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }, // left
      { dx: 0, dy: -1 }  // up
    ];
    
    for (const { dx, dy } of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (binary[ny * width + nx] === 0) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Trace a contour starting from point (startX, startY)
  const traceContour = (startX: number, startY: number): ContourData => {
    const contour: ContourPoint[] = [];
    let x = startX;
    let y = startY;
    let dir = 0; // 0: right, 1: down, 2: left, 3: up
    
    const directions = [
      { dx: 1, dy: 0 },  // right
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }, // left
      { dx: 0, dy: -1 }  // up
    ];
    
    do {
      contour.push({ x, y });
      visited[y * width + x] = 1;
      
      // Try to turn right
      dir = (dir + 3) % 4;
      
      // Find next border pixel by rotating direction
      let found = false;
      for (let i = 0; i < 4; i++) {
        const nx = x + directions[dir].dx;
        const ny = y + directions[dir].dy;
        
        if (isBorderPixel(nx, ny) && !visited[ny * width + nx]) {
          x = nx;
          y = ny;
          found = true;
          break;
        }
        
        // If not found, turn left
        dir = (dir + 1) % 4;
      }
      
      if (!found) break;
      
    } while (x !== startX || y !== startY);
    
    return {
      points: contour,
      closed: x === startX && y === startY
    };
  };
  
  // Find all contours
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isBorderPixel(x, y) && !visited[y * width + x]) {
        contours.push(traceContour(x, y));
      }
    }
  }
  
  return contours;
};

// Draw contours on a canvas
export const drawContours = (
  ctx: CanvasRenderingContext2D,
  contours: ContourData[],
  color: string = '#00AAFF'
): void => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  for (const contour of contours) {
    const { points, closed } = contour;
    if (points.length < 2) continue;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    if (closed) {
      ctx.closePath();
    }
    
    ctx.stroke();
  }
};

// Example datasets for contour detection
export const sampleDatasets = [
  {
    id: 'basic-shapes',
    name: 'Basic Shapes',
    description: 'Simple geometric shapes like circles, rectangles, triangles',
    imageUrl: 'https://source.unsplash.com/random/300x200/?shapes',
    complexity: 'Low',
    bestFor: 'Learning the basics of contour detection'
  },
  {
    id: 'household-objects',
    name: 'Household Objects',
    description: 'Common household items with well-defined edges',
    imageUrl: 'https://source.unsplash.com/random/300x200/?objects',
    complexity: 'Medium',
    bestFor: 'Practicing contour detection on real objects'
  },
  {
    id: 'natural-scenes',
    name: 'Natural Scenes',
    description: 'Landscapes, plants, and natural elements',
    imageUrl: 'https://source.unsplash.com/random/300x200/?nature',
    complexity: 'High',
    bestFor: 'Advanced contour detection in complex environments'
  },
  {
    id: 'medical-imaging',
    name: 'Medical Imaging',
    description: 'X-rays, MRIs, and other medical scans',
    imageUrl: 'https://source.unsplash.com/random/300x200/?xray',
    complexity: 'Very High',
    bestFor: 'Professional applications in medical image analysis'
  }
];

// Preprocessing steps for educational purposes
export const preprocessingSteps = [
  {
    id: 'grayscale',
    name: 'Convert to Grayscale',
    description: 'Simplifies the image by removing color information, allowing the algorithm to focus on intensity changes only.'
  },
  {
    id: 'gaussian-blur',
    name: 'Apply Gaussian Blur',
    description: 'Reduces noise and detail in the image, making it easier to detect significant contours.'
  },
  {
    id: 'threshold',
    name: 'Thresholding',
    description: 'Converts the grayscale image to binary (black and white) by setting all pixels above a threshold to white and all others to black.'
  },
  {
    id: 'edge-detection',
    name: 'Edge Detection',
    description: 'Applies algorithms like Canny, Sobel, or Prewitt to identify edges in the image.'
  },
  {
    id: 'contour-tracing',
    name: 'Contour Tracing',
    description: 'Follows the boundaries of objects in the binary image to extract contours.'
  }
];
