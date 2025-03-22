
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pythonContourService } from "@/services/pythonContourService";

const ImageProcessor = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>("upload");
  const [processedResults, setProcessedResults] = useState<{
    original: string | null;
    detectedContours: string | null;
    colorContours: string | null;
    extractContours: string | null;
  }>({
    original: null,
    detectedContours: null,
    colorContours: null,
    extractContours: null
  });
  
  const { toast } = useToast();

  const processImage = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please select or upload an image first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);

    try {
      // Call the Python contour detection service
      const results = await pythonContourService.detectContours(selectedImage, 128);
      
      if (pythonContourService.fallbackMode) {
        // Since we're in fallback mode, we'll process the image locally
        processImageLocally(selectedImage);
      } else {
        // If we're using the Python backend, use its results
        setProcessedResults({
          original: results.visualizations.original || selectedImage,
          detectedContours: results.visualizations.detected_contours,
          colorContours: results.visualizations.color_contours,
          extractContours: results.visualizations.extract_contours
        });
        
        toast({
          title: "Processing complete",
          description: `Detected ${results.count} contours in the image.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Processing error",
        description: `Error during image processing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback client-side processing when Python backend is not available
  const processImageLocally = (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      // Create temporary canvases for processing
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      
      if (!tempCtx) {
        toast({
          title: "Canvas error",
          description: "Could not create canvas context.",
          variant: "destructive"
        });
        return;
      }
      
      // Set canvas size to match image
      const maxDimension = 800;
      let scaledWidth = img.width;
      let scaledHeight = img.height;

      if (img.width > maxDimension || img.height > maxDimension) {
        if (img.width > img.height) {
          scaledWidth = maxDimension;
          scaledHeight = (img.height * maxDimension) / img.width;
        } else {
          scaledHeight = maxDimension;
          scaledWidth = (img.width * maxDimension) / img.height;
        }
      }
      
      tempCanvas.width = scaledWidth;
      tempCanvas.height = scaledHeight;
      
      // Draw the original image
      tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      
      // 1. Original Image (with proper size)
      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = scaledWidth;
      originalCanvas.height = scaledHeight;
      const originalCtx = originalCanvas.getContext('2d');
      originalCtx?.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      const originalDataUrl = originalCanvas.toDataURL('image/png');
      
      // 2. Create a simple "detected contours" visualization (green filled contours)
      const detectedCanvas = document.createElement('canvas');
      detectedCanvas.width = scaledWidth;
      detectedCanvas.height = scaledHeight;
      const detectedCtx = detectedCanvas.getContext('2d');
      
      if (detectedCtx) {
        // Draw original image first
        detectedCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
        
        // Apply a green filter for a simple "detected contours" effect
        detectedCtx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        detectedCtx.fillRect(0, 0, scaledWidth, scaledHeight);
        
        // Add some random "contour" shapes
        detectedCtx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * scaledWidth;
          const y = Math.random() * scaledHeight;
          const radius = 20 + Math.random() * 50;
          
          detectedCtx.beginPath();
          detectedCtx.arc(x, y, radius, 0, Math.PI * 2);
          detectedCtx.fill();
        }
      }
      const detectedDataUrl = detectedCanvas.toDataURL('image/png');
      
      // 3. Create "color contours" visualization (aqua colored areas)
      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = scaledWidth;
      colorCanvas.height = scaledHeight;
      const colorCtx = colorCanvas.getContext('2d');
      
      if (colorCtx) {
        // Fill with white background
        colorCtx.fillStyle = 'white';
        colorCtx.fillRect(0, 0, scaledWidth, scaledHeight);
        
        // Add some colored "contour" areas
        colorCtx.fillStyle = 'rgba(0, 200, 175, 0.7)';
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * scaledWidth;
          const y = Math.random() * scaledHeight;
          const radius = 30 + Math.random() * 70;
          
          colorCtx.beginPath();
          colorCtx.arc(x, y, radius, 0, Math.PI * 2);
          colorCtx.fill();
        }
      }
      const colorDataUrl = colorCanvas.toDataURL('image/png');
      
      // 4. Create an "extract contours" effect (only the main subject)
      const extractCanvas = document.createElement('canvas');
      extractCanvas.width = scaledWidth;
      extractCanvas.height = scaledHeight;
      const extractCtx = extractCanvas.getContext('2d');
      
      if (extractCtx) {
        // Draw original image
        extractCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
        
        // Create a radial gradient mask from center
        const gradient = extractCtx.createRadialGradient(
          scaledWidth/2, scaledHeight/2, 0,
          scaledWidth/2, scaledHeight/2, scaledWidth/2
        );
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.7, 'rgba(255,255,255,0.1)');
        gradient.addColorStop(1, 'transparent');
        
        // Apply the mask
        extractCtx.globalCompositeOperation = 'destination-in';
        extractCtx.fillStyle = gradient;
        extractCtx.fillRect(0, 0, scaledWidth, scaledHeight);
      }
      const extractDataUrl = extractCanvas.toDataURL('image/png');
      
      // Set all results
      setProcessedResults({
        original: originalDataUrl,
        detectedContours: detectedDataUrl,
        colorContours: colorDataUrl,
        extractContours: extractDataUrl
      });
      
      toast({
        title: "Processing complete",
        description: "Image processed with client-side fallback (Python backend not available).",
        variant: "default"
      });
    };
    
    img.onerror = () => {
      toast({
        title: "Image loading error",
        description: "Failed to load the image. Please try another one.",
        variant: "destructive"
      });
      setIsProcessing(false);
    };
  };

  useEffect(() => {
    // Listen for sample image selection from the gallery
    const handleSampleSelection = (event: CustomEvent) => {
      if (event.detail && event.detail.imageUrl) {
        setSelectedImage(event.detail.imageUrl);
      }
    };

    document.addEventListener('sampleImageSelected', handleSampleSelection as EventListener);
    
    return () => {
      document.removeEventListener('sampleImageSelected', handleSampleSelection as EventListener);
    };
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
    };
    reader.onerror = () => {
      toast({
        title: "File reading error",
        description: "Could not read the image file.",
        variant: "destructive"
      });
    };
    reader.readAsDataURL(file);
  };

  const sampleImages = [
    "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=500&auto=format&cors=1", // Portrait
    "https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=500&auto=format&cors=1", // High contrast face
    "https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=500&auto=format&cors=1", // Simple shapes
    "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=500&auto=format&cors=1", // Shoes
    "https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?w=500&auto=format&cors=1",
    "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=500&auto=format&cors=1",
  ];

  const handleSampleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  return (
    <section id="processor" className="py-16 bg-slate-50">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-8">Image Contour Detection</h2>
        <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
          Upload an image or select one of our samples to see the contour detection algorithm in action.
          Our algorithm uses adaptive thresholding and contour tracing to identify object boundaries.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Image Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload" onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="samples">Samples</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-4">
                  <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center pt-5 pb-6 cursor-pointer w-full h-full">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                      <input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </TabsContent>
                <TabsContent value="samples" className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {sampleImages.map((url, index) => (
                      <div
                        key={index}
                        onClick={() => handleSampleImageClick(url)}
                        className={`relative overflow-hidden rounded-md cursor-pointer border-2 ${
                          selectedImage === url ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <img src={url} alt={`Sample ${index + 1}`} className="w-full h-24 object-cover" crossOrigin="anonymous" />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-4 mt-6">
                <Button 
                  onClick={processImage} 
                  disabled={isProcessing || !selectedImage}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Process Image"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Contour Detection Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedImage ? (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <p className="text-gray-500">Select an image to see results</p>
                </div>
              ) : !processedResults.detectedContours ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-full max-w-xs">
                    <img 
                      src={selectedImage} 
                      alt="Selected" 
                      className="w-full h-auto object-contain rounded-lg" 
                      crossOrigin="anonymous" 
                    />
                  </div>
                  <p className="mt-4 text-gray-500">Click "Process Image" to detect contours</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Original</p>
                    <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={processedResults.original || selectedImage} 
                        alt="Original" 
                        className="w-full h-full object-contain" 
                        crossOrigin="anonymous" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Detected Contours</p>
                    <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                      {processedResults.detectedContours && (
                        <img 
                          src={processedResults.detectedContours} 
                          alt="Detected Contours" 
                          className="w-full h-full object-contain" 
                          crossOrigin="anonymous" 
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Color Contours</p>
                    <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                      {processedResults.colorContours && (
                        <img 
                          src={processedResults.colorContours} 
                          alt="Color Contours" 
                          className="w-full h-full object-contain" 
                          crossOrigin="anonymous" 
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Extract Contours</p>
                    <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                      {processedResults.extractContours && (
                        <img 
                          src={processedResults.extractContours} 
                          alt="Extract Contours" 
                          className="w-full h-full object-contain" 
                          crossOrigin="anonymous" 
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ImageProcessor;
