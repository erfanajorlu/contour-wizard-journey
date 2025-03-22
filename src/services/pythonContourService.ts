
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
   * Process an image with the Python contour detection API
   */
  async detectContours(imageData: string, threshold: number): Promise<ContourResponse> {
    if (this.fallbackMode) {
      console.warn('Running in fallback mode - Python backend not available');
      // Return fallback data with sample images for all four visualizations
      return {
        contours: [],
        count: 0,
        visualizations: {
          original: imageData, // Just use the input image as original
          detected_contours: '',
          color_contours: '',
          extract_contours: '',
          grayscale: '',
          threshold: ''
        }
      };
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
