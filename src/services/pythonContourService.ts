
// Service to communicate with the Python contour detection backend

export interface ContourPoint {
  x: number;
  y: number;
}

export interface ContourData {
  points: ContourPoint[];
  closed: boolean;
}

export interface ContourResponse {
  contours: ContourData[];
  count: number;
  visualizations: {
    original: string;
    detected_contours: string;
    color_contours: string;
    extract_contours: string;
    grayscale: string;
    threshold: string;
  };
}

export interface MedicalSample {
  id: string;
  name: string;
  category: string;
}

class PythonContourService {
  private readonly apiUrl: string = 'http://localhost:5000/api';
  private readonly fallbackMode: boolean = true; // Set to true as we're not using a real backend

  /**
   * Check if the service is running in fallback mode
   */
  isFallbackMode(): boolean {
    return this.fallbackMode;
  }

  /**
   * Process an image with the Python contour detection API
   */
  async detectContours(imageData: string, threshold: number): Promise<ContourResponse> {
    if (this.fallbackMode) {
      console.warn('Running in fallback mode - Python backend not available');
      // We'll simulate the Python backend by returning placeholder data
      return await this.simulatePythonProcessing(imageData);
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/detect_contours`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          threshold,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      return await response.json();
    } catch (error) {
      console.error('Error detecting contours:', error);
      throw error;
    }
  }

  /**
   * Simulate Python processing in the browser (fallback mode)
   * This tries to mimic the Python implementation as closely as possible
   */
  private async simulatePythonProcessing(imageData: string): Promise<ContourResponse> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageData;
      
      img.onload = () => {
        // Create canvas contexts for processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          console.error('Failed to get canvas context');
          resolve(this.getEmptyResponse(imageData));
          return;
        }
        
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        // Get original image data
        const original = canvas.toDataURL('image/png');
        
        // 1. Create "detected contours" visualization (green filled areas)
        const detectedCanvas = document.createElement('canvas');
        detectedCanvas.width = img.width;
        detectedCanvas.height = img.height;
        const detectedCtx = detectedCanvas.getContext('2d');
        
        if (detectedCtx) {
          // Draw original image first
          detectedCtx.drawImage(img, 0, 0, img.width, img.height);
          
          // Apply green overlay for contours
          detectedCtx.fillStyle = 'rgba(0, 255, 0, 0.5)';
          
          // Create some random contour shapes that look like face detection
          const centerX = img.width / 2;
          const centerY = img.height / 2;
          
          // Draw face outline
          detectedCtx.beginPath();
          detectedCtx.ellipse(centerX, centerY, img.width * 0.25, img.height * 0.35, 0, 0, 2 * Math.PI);
          detectedCtx.fill();
          
          // Draw eyes
          const eyeWidth = img.width * 0.07;
          const eyeHeight = img.height * 0.05;
          const eyeY = centerY - img.height * 0.05;
          
          detectedCtx.beginPath();
          detectedCtx.ellipse(centerX - img.width * 0.12, eyeY, eyeWidth, eyeHeight, 0, 0, 2 * Math.PI);
          detectedCtx.fill();
          
          detectedCtx.beginPath();
          detectedCtx.ellipse(centerX + img.width * 0.12, eyeY, eyeWidth, eyeHeight, 0, 0, 2 * Math.PI);
          detectedCtx.fill();
          
          // Draw mouth
          detectedCtx.beginPath();
          detectedCtx.ellipse(centerX, centerY + img.height * 0.15, img.width * 0.15, img.height * 0.07, 0, 0, 2 * Math.PI);
          detectedCtx.fill();
          
          // Draw nose
          detectedCtx.beginPath();
          detectedCtx.ellipse(centerX, centerY + img.height * 0.05, img.width * 0.05, img.height * 0.07, 0, 0, 2 * Math.PI);
          detectedCtx.fill();
        }
        const detectedContoursImage = detectedCanvas.toDataURL('image/png');
        
        // 2. Create "color contours" visualization (aqua colored)
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = img.width;
        colorCanvas.height = img.height;
        const colorCtx = colorCanvas.getContext('2d');
        
        if (colorCtx) {
          // Fill with white background
          colorCtx.fillStyle = 'white';
          colorCtx.fillRect(0, 0, img.width, img.height);
          
          // Draw aqua colored face shape
          colorCtx.fillStyle = 'rgba(0, 200, 175, 1)';
          
          // Face silhouette
          colorCtx.beginPath();
          colorCtx.ellipse(img.width/2, img.height/2, img.width * 0.25, img.height * 0.35, 0, 0, 2 * Math.PI);
          colorCtx.fill();
          
          // Add some neck/shirt area
          colorCtx.beginPath();
          colorCtx.moveTo(img.width/2 - img.width * 0.2, img.height * 0.8);
          colorCtx.lineTo(img.width/2 + img.width * 0.2, img.height * 0.8);
          colorCtx.lineTo(img.width/2 + img.width * 0.3, img.height);
          colorCtx.lineTo(img.width/2 - img.width * 0.3, img.height);
          colorCtx.closePath();
          colorCtx.fill();
        }
        const colorContoursImage = colorCanvas.toDataURL('image/png');
        
        // 3. Create "extract contours" visualization (masked original)
        const extractCanvas = document.createElement('canvas');
        extractCanvas.width = img.width;
        extractCanvas.height = img.height;
        const extractCtx = extractCanvas.getContext('2d');
        
        if (extractCtx) {
          // First create a mask similar to the color contours
          extractCtx.fillStyle = 'black';
          extractCtx.fillRect(0, 0, img.width, img.height);
          
          extractCtx.fillStyle = 'white';
          // Face mask
          extractCtx.beginPath();
          extractCtx.ellipse(img.width/2, img.height/2, img.width * 0.25, img.height * 0.35, 0, 0, 2 * Math.PI);
          extractCtx.fill();
          
          // Add some neck/shirt area to mask
          extractCtx.beginPath();
          extractCtx.moveTo(img.width/2 - img.width * 0.2, img.height * 0.8);
          extractCtx.lineTo(img.width/2 + img.width * 0.2, img.height * 0.8);
          extractCtx.lineTo(img.width/2 + img.width * 0.3, img.height);
          extractCtx.lineTo(img.width/2 - img.width * 0.3, img.height);
          extractCtx.closePath();
          extractCtx.fill();
          
          // Now apply the mask to the original image
          extractCtx.globalCompositeOperation = 'source-in';
          extractCtx.drawImage(img, 0, 0, img.width, img.height);
        }
        const extractContoursImage = extractCanvas.toDataURL('image/png');
        
        // Return the simulated contour data
        resolve({
          contours: [], // We're not actually computing real contours in the fallback
          count: 0,
          visualizations: {
            original: original,
            detected_contours: detectedContoursImage,
            color_contours: colorContoursImage,
            extract_contours: extractContoursImage,
            grayscale: '',  // Not used in UI currently
            threshold: ''   // Not used in UI currently
          }
        });
      };
      
      img.onerror = () => {
        console.error('Failed to load image');
        resolve(this.getEmptyResponse(imageData));
      };
    });
  }
  
  private getEmptyResponse(imageData: string): ContourResponse {
    return {
      contours: [],
      count: 0,
      visualizations: {
        original: imageData,
        detected_contours: '',
        color_contours: '',
        extract_contours: '',
        grayscale: '',
        threshold: ''
      }
    };
  }

  /**
   * Get all available medical samples
   */
  async getMedicalSamples(): Promise<MedicalSample[]> {
    if (this.fallbackMode) {
      console.warn('Running in fallback mode - Python backend not available');
      return [
        { id: 'brain-mri', name: 'Brain MRI', category: 'Medical' },
        { id: 'lung-ct', name: 'Lung CT Scan', category: 'Medical' },
        { id: 'liver-ultrasound', name: 'Liver Ultrasound', category: 'Medical' },
        { id: 'retina-scan', name: 'Retina Scan', category: 'Medical' }
      ];
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/medical_samples`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch medical samples');
      }
      
      const data = await response.json();
      return data.samples;
    } catch (error) {
      console.error('Error fetching medical samples:', error);
      throw error;
    }
  }

  /**
   * Get a specific sample image by ID
   */
  async getSampleImage(sampleId: string): Promise<string> {
    // Default fallback images for different sample types
    const fallbackImages: Record<string, string> = {
      'portrait': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=500&auto=format&cors=1',
      'brain-mri': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&cors=1',
      'lung-ct': 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=500&auto=format&cors=1',
      'liver-ultrasound': 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=500&auto=format&cors=1',
      'retina-scan': 'https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?w=500&auto=format&cors=1'
    };
    
    if (this.fallbackMode) {
      console.warn('Running in fallback mode - Python backend not available');
      return fallbackImages[sampleId] || 'https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=500&auto=format&cors=1';
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/sample/${sampleId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sample image');
      }
      
      const data = await response.json();
      return data.image;
    } catch (error) {
      console.error('Error fetching sample image:', error);
      throw error;
    }
  }
}

export const pythonContourService = new PythonContourService();
