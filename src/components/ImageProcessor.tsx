
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image as ImageIcon, RefreshCw, ZoomIn, ZoomOut, AlertCircle, Cpu } from 'lucide-react';
import { 
  findContours, 
  drawContours, 
  convertToGrayscale, 
  applyThreshold, 
  sampleImages,
  processImageWithPython,
  getMedicalSamples,
  getSampleImage
} from '@/utils/contourUtils';
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Add a global type for the window object to include our custom property
declare global {
  interface Window {
    selectedSampleImage?: keyof typeof sampleImages;
  }
}

interface MedicalSample {
  id: string;
  name: string;
  category: string;
}

const ImageProcessor = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [threshold, setThreshold] = useState(128);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [usePython, setUsePython] = useState(true);
  const [medicalSamples, setMedicalSamples] = useState<MedicalSample[]>([]);
  const [selectedMedicalSample, setSelectedMedicalSample] = useState<string>('');
  const [pythonVisualizations, setPythonVisualizations] = useState<{
    grayscale: string;
    threshold: string;
    contour: string;
  } | null>(null);
  const { toast } = useToast();
  
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const grayscaleCanvasRef = useRef<HTMLCanvasElement>(null);
  const thresholdCanvasRef = useRef<HTMLCanvasElement>(null);
  const contourCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const steps = [
    { id: 'original', name: 'Original Image', ref: originalCanvasRef },
    { id: 'grayscale', name: 'Grayscale', ref: grayscaleCanvasRef },
    { id: 'threshold', name: 'Threshold', ref: thresholdCanvasRef },
    { id: 'contour', name: 'Contour Detection', ref: contourCanvasRef }
  ];
  
  // Fetch medical samples from Python backend
  useEffect(() => {
    if (usePython) {
      const fetchMedicalSamples = async () => {
        try {
          const samples = await getMedicalSamples();
          setMedicalSamples(samples);
        } catch (error) {
          console.error('Failed to fetch medical samples:', error);
          toast({
            title: "Python Backend Error",
            description: "Could not connect to Python backend. Make sure it's running at localhost:5000",
            variant: "destructive",
          });
          setUsePython(false);
        }
      };
      
      fetchMedicalSamples();
    }
  }, [usePython]);
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUrl(result);
      setPythonVisualizations(null);
      toast({
        title: "Image uploaded",
        description: `Processing with ${usePython ? 'Python backend' : 'JavaScript'} contour detection algorithm`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };
  
  // Reset processing
  const handleReset = () => {
    setCurrentStep(0);
    setPythonVisualizations(null);
  };
  
  // Load sample image
  const loadSampleImage = (sampleKey: keyof typeof sampleImages) => {
    setSelectedMedicalSample('');
    setImageUrl(sampleImages[sampleKey]);
    setPythonVisualizations(null);
    toast({
      title: "Sample image loaded",
      description: `Processing with ${usePython ? 'Python backend' : 'JavaScript'} contour detection algorithm`,
    });
  };
  
  // Load medical sample
  const loadMedicalSample = async (sampleId: string) => {
    if (!sampleId) return;
    
    try {
      setIsProcessing(true);
      const imageData = await getSampleImage(sampleId);
      if (imageData) {
        setSelectedMedicalSample(sampleId);
        setImageUrl(imageData);
        setPythonVisualizations(null);
        toast({
          title: "Medical sample loaded",
          description: "Processing medical image with contour detection algorithm",
        });
      }
    } catch (error) {
      toast({
        title: "Error loading sample",
        description: "Could not load the selected medical sample",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Listen for sample image selection from gallery
  useEffect(() => {
    const handleSampleImageSelected = (e: Event) => {
      const customEvent = e as CustomEvent<{ sampleKey: keyof typeof sampleImages }>;
      if (customEvent.detail?.sampleKey) {
        loadSampleImage(customEvent.detail.sampleKey);
      }
    };
    
    document.addEventListener('sampleImageSelected', handleSampleImageSelected as EventListener);
    
    // Check if there's a sample image selected from the gallery via the window object
    if (window.selectedSampleImage) {
      loadSampleImage(window.selectedSampleImage);
      window.selectedSampleImage = undefined; // Clear it after use
    }
    
    return () => {
      document.removeEventListener('sampleImageSelected', handleSampleImageSelected as EventListener);
    };
  }, []);
  
  // Process image with Python backend
  const processImageWithPythonBackend = async () => {
    if (!imageUrl) return;
    
    try {
      setIsProcessing(true);
      
      const response = await processImageWithPython(imageUrl, threshold);
      
      // Update visualizations 
      setPythonVisualizations(response.visualizations);
      
      // Update current step
      setCurrentStep(0);
      
      toast({
        title: "Python processing complete",
        description: `Found ${response.count} contours in the image`,
      });
    } catch (error) {
      console.error('Python processing error:', error);
      toast({
        title: "Python processing failed",
        description: "Could not process the image with the Python backend. Check that the server is running.",
        variant: "destructive",
      });
      
      // Fall back to JavaScript implementation
      setUsePython(false);
      processImage();
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Process image with JavaScript implementation
  const processImage = () => {
    if (!imageUrl || !originalImage) return;
    
    setIsProcessing(true);
    
    // Original Image
    const originalCanvas = originalCanvasRef.current;
    const originalCtx = originalCanvas?.getContext('2d');
    
    // Grayscale
    const grayscaleCanvas = grayscaleCanvasRef.current;
    const grayscaleCtx = grayscaleCanvas?.getContext('2d');
    
    // Threshold
    const thresholdCanvas = thresholdCanvasRef.current;
    const thresholdCtx = thresholdCanvas?.getContext('2d');
    
    // Contour
    const contourCanvas = contourCanvasRef.current;
    const contourCtx = contourCanvas?.getContext('2d');
    
    if (!originalCtx || !grayscaleCtx || !thresholdCtx || !contourCtx) {
      setIsProcessing(false);
      toast({
        title: "Processing error",
        description: "Could not get canvas context",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate scaled dimensions
    const maxWidth = originalCanvas.width;
    const maxHeight = originalCanvas.height;
    const aspectRatio = originalImage.width / originalImage.height;
    
    let scaledWidth = maxWidth;
    let scaledHeight = scaledWidth / aspectRatio;
    
    if (scaledHeight > maxHeight) {
      scaledHeight = maxHeight;
      scaledWidth = scaledHeight * aspectRatio;
    }
    
    // Clear canvases
    originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    grayscaleCtx.clearRect(0, 0, grayscaleCanvas.width, grayscaleCanvas.height);
    thresholdCtx.clearRect(0, 0, thresholdCanvas.width, thresholdCanvas.height);
    contourCtx.clearRect(0, 0, contourCanvas.width, contourCanvas.height);
    
    // Draw original image
    originalCtx.drawImage(
      originalImage, 
      (originalCanvas.width - scaledWidth) / 2, 
      (originalCanvas.height - scaledHeight) / 2, 
      scaledWidth, 
      scaledHeight
    );
    
    // Get image data
    const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
    
    // Convert to grayscale
    const grayscaleData = convertToGrayscale(imageData);
    const grayscaleImageData = new ImageData(originalCanvas.width, originalCanvas.height);
    
    for (let i = 0; i < grayscaleData.length; i++) {
      const value = grayscaleData[i];
      const index = i * 4;
      grayscaleImageData.data[index] = value;
      grayscaleImageData.data[index + 1] = value;
      grayscaleImageData.data[index + 2] = value;
      grayscaleImageData.data[index + 3] = 255;
    }
    
    grayscaleCtx.putImageData(grayscaleImageData, 0, 0);
    
    // Apply threshold
    const thresholdData = applyThreshold(grayscaleData, threshold);
    const thresholdImageData = new ImageData(originalCanvas.width, originalCanvas.height);
    
    for (let i = 0; i < thresholdData.length; i++) {
      const value = thresholdData[i];
      const index = i * 4;
      thresholdImageData.data[index] = value;
      thresholdImageData.data[index + 1] = value;
      thresholdImageData.data[index + 2] = value;
      thresholdImageData.data[index + 3] = 255;
    }
    
    thresholdCtx.putImageData(thresholdImageData, 0, 0);
    
    // Find contours
    contourCtx.drawImage(originalImage, 
      (contourCanvas.width - scaledWidth) / 2, 
      (contourCanvas.height - scaledHeight) / 2, 
      scaledWidth, 
      scaledHeight
    );
    
    try {
      const contours = findContours(thresholdData, originalCanvas.width, originalCanvas.height);
      drawContours(contourCtx, contours);
      
      toast({
        title: "Processing complete",
        description: `Found ${contours.length} contours in the image`,
      });
    } catch (error) {
      console.error("Error finding contours:", error);
      toast({
        title: "Contour detection error",
        description: "There was an error processing contours",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
  };
  
  // Update canvas with Python visualizations
  useEffect(() => {
    if (!pythonVisualizations) return;
    
    const drawVisualization = (canvasRef: React.RefObject<HTMLCanvasElement>, imageUrl: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.src = imageUrl;
      
      img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate scaled dimensions
        const maxWidth = canvas.width;
        const maxHeight = canvas.height;
        const aspectRatio = img.width / img.height;
        
        let scaledWidth = maxWidth;
        let scaledHeight = scaledWidth / aspectRatio;
        
        if (scaledHeight > maxHeight) {
          scaledHeight = maxHeight;
          scaledWidth = scaledHeight * aspectRatio;
        }
        
        // Draw image
        ctx.drawImage(
          img, 
          (canvas.width - scaledWidth) / 2, 
          (canvas.height - scaledHeight) / 2, 
          scaledWidth, 
          scaledHeight
        );
      };
    };
    
    // Draw original image
    if (originalImage) {
      const canvas = originalCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate scaled dimensions
        const maxWidth = canvas.width;
        const maxHeight = canvas.height;
        const aspectRatio = originalImage.width / originalImage.height;
        
        let scaledWidth = maxWidth;
        let scaledHeight = scaledWidth / aspectRatio;
        
        if (scaledHeight > maxHeight) {
          scaledHeight = maxHeight;
          scaledWidth = scaledHeight * aspectRatio;
        }
        
        // Draw image
        ctx.drawImage(
          originalImage, 
          (canvas.width - scaledWidth) / 2, 
          (canvas.height - scaledHeight) / 2, 
          scaledWidth, 
          scaledHeight
        );
      }
    }
    
    // Draw visualizations from Python backend
    drawVisualization(grayscaleCanvasRef, pythonVisualizations.grayscale);
    drawVisualization(thresholdCanvasRef, pythonVisualizations.threshold);
    drawVisualization(contourCanvasRef, pythonVisualizations.contour);
    
  }, [pythonVisualizations, originalImage]);
  
  // Load image when URL changes
  useEffect(() => {
    if (!imageUrl) return;
    
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setOriginalImage(img);
      setCurrentStep(0);
    };
    img.onerror = () => {
      toast({
        title: "Image loading error",
        description: "Failed to load the image",
        variant: "destructive",
      });
    };
  }, [imageUrl]);
  
  // Process image when originalImage is set or when processing options change
  useEffect(() => {
    if (originalImage) {
      if (usePython) {
        processImageWithPythonBackend();
      } else {
        processImage();
      }
    }
  }, [originalImage, threshold, usePython]);
  
  // Handle next step button
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Handle previous step button
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Zoom in
  const zoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 2));
  };
  
  // Zoom out
  const zoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.5));
  };
  
  return (
    <section id="processor" className="py-16 px-4 sm:px-6 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        <div className="text-center mb-12">
          <motion.span 
            className="inline-block text-sm font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary mb-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            Interactive
          </motion.span>
          <motion.h2 
            className="text-3xl font-bold tracking-tight md:text-4xl mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Image Processor
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            Upload your own image or use our sample images to see contour detection in action. Follow the step-by-step process to understand how the algorithm works.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <Card className="glass-card overflow-hidden">
              <CardHeader>
                <CardTitle>Upload Image</CardTitle>
                <CardDescription>
                  Select an image for contour detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label 
                  htmlFor="image-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-primary/60" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Click to upload</span> or drag and drop
                    </p>
                  </div>
                  <input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </label>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <p className="text-sm text-muted-foreground">Or try a sample image:</p>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleImage('basicShapes')}
                    className="w-full"
                  >
                    Basic Shapes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleImage('householdObjects')}
                    className="w-full"
                  >
                    Household Objects
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleImage('naturalScenes')}
                    className="w-full"
                  >
                    Natural Scenes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleImage('medicalImaging')}
                    className="w-full"
                  >
                    Medical Imaging
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            {usePython && medicalSamples.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Medical Samples</CardTitle>
                  <CardDescription>
                    Real medical images for contour detection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedMedicalSample} onValueChange={loadMedicalSample}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a medical sample" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicalSamples.map((sample) => (
                        <SelectItem key={sample.id} value={sample.id}>
                          {sample.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Adjust parameters for contour detection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Switch 
                    id="python-mode" 
                    checked={usePython}
                    onCheckedChange={setUsePython}
                  />
                  <Label htmlFor="python-mode" className="flex items-center">
                    <Cpu className="w-4 h-4 mr-2" />
                    Use Python Backend
                  </Label>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Threshold</label>
                    <span className="text-xs text-muted-foreground">{threshold}</span>
                  </div>
                  <Slider
                    value={[threshold]}
                    min={0}
                    max={255}
                    step={1}
                    onValueChange={(value) => setThreshold(value[0])}
                    disabled={!originalImage || isProcessing}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Controls the cutoff between black and white pixels
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  disabled={!originalImage || isProcessing}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={usePython ? processImageWithPythonBackend : processImage}
                  disabled={!originalImage || isProcessing}
                >
                  Process Image
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>About Python-based Contour Detection</CardTitle>
                <CardDescription>
                  How the algorithm works
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-4">
                <p>
                  Our Python backend uses OpenCV's powerful contour detection algorithms for precise boundary identification:
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Converting the image to grayscale using OpenCV's optimized methods</li>
                  <li>Applying Gaussian blur to reduce noise and improve detection</li>
                  <li>Creating a binary image through adaptive thresholding</li>
                  <li>Using OpenCV's findContours function to efficiently extract boundaries</li>
                  <li>Analyzing and filtering contours based on their properties</li>
                </ol>
                <p className="flex items-start gap-2 text-xs mt-4">
                  <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Python provides significantly better performance for medical image processing tasks compared to JavaScript.</span>
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-8">
            <Card className="glass-card overflow-hidden h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{steps[currentStep].name}</CardTitle>
                  <CardDescription>
                    Step {currentStep + 1} of {steps.length}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={zoomOut}
                    disabled={!originalImage}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs w-8 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={zoomIn}
                    disabled={!originalImage}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <Tabs 
                defaultValue="original" 
                value={steps[currentStep].id}
                className="h-full flex flex-col"
              >
                <CardContent className="pb-0 px-2">
                  <TabsList className="grid grid-cols-4 mb-2">
                    {steps.map((step, index) => (
                      <TabsTrigger 
                        key={step.id} 
                        value={step.id}
                        onClick={() => setCurrentStep(index)}
                        disabled={!originalImage}
                      >
                        {step.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </CardContent>
                
                <CardContent className="flex-1 relative overflow-auto p-2">
                  <div 
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-in-out"
                    style={{ transform: `scale(${zoom})` }}
                  >
                    {steps.map((step) => (
                      <TabsContent 
                        key={step.id} 
                        value={step.id} 
                        className="absolute inset-0 flex items-center justify-center mt-0 h-full"
                      >
                        <canvas 
                          ref={step.ref} 
                          width={640} 
                          height={480} 
                          className="border border-border rounded-md"
                        />
                      </TabsContent>
                    ))}
                    
                    {!originalImage && (
                      <div className="flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                        <ImageIcon className="w-12 h-12 opacity-20" />
                        <p>Upload an image or select a sample to begin</p>
                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                          {Object.keys(sampleImages).map((key) => (
                            <Button 
                              key={key} 
                              variant="outline" 
                              size="sm"
                              onClick={() => loadSampleImage(key as keyof typeof sampleImages)}
                            >
                              {key === 'basicShapes' ? 'Basic Shapes' :
                               key === 'householdObjects' ? 'Household Objects' :
                               key === 'naturalScenes' ? 'Natural Scenes' :
                               'Medical Imaging'}
                            </Button>
                          ))}
                        </div>
                        {medicalSamples.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-2 text-sm font-medium">Medical Samples:</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {medicalSamples.map((sample) => (
                                <Button 
                                  key={sample.id} 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => loadMedicalSample(sample.id)}
                                >
                                  {sample.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                          <p className="text-sm font-medium">
                            Processing with {usePython ? 'Python' : 'JavaScript'}...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between pt-0">
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                    disabled={currentStep === 0 || !originalImage}
                  >
                    Previous
                  </Button>
                  <Button 
                    onClick={nextStep}
                    disabled={currentStep === steps.length - 1 || !originalImage}
                  >
                    Next Step
                  </Button>
                </CardFooter>
              </Tabs>
            </Card>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ImageProcessor;
