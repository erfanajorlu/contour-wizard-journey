
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
    grayscale: string;
    threshold: string;
    contour: string;
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
      return {
        contours: [],
        count: 0,
        visualizations: {
          grayscale: '',
          threshold: '',
          contour: ''
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
        { id: 'sample1', name: 'Sample 1', category: 'Basic' },
        { id: 'sample2', name: 'Sample 2', category: 'Advanced' }
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
    if (this.fallbackMode) {
      console.warn('Running in fallback mode - Python backend not available');
      return 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&cors=1';
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
