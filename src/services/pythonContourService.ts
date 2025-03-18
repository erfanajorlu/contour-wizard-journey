
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

  /**
   * Process an image with the Python contour detection API
   */
  async detectContours(imageData: string, threshold: number): Promise<ContourResponse> {
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
