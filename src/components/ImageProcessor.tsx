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
      // Add error handling for the image format
      if (!selectedImage.startsWith('data:image')) {
        // If the image is a URL (not a data URL), fetch it and convert to base64
        const response = await fetch(selectedImage, { mode: 'cors' });
        const blob = await response.blob();
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          await processImageData(base64data);
        };
      } else {
        // Process data URL directly
        await processImageData(selectedImage);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Processing error",
        description: `Error during image processing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  // New helper function to process image data
  const processImageData = async (imageData: string) => {
    try {
      // Call the Python contour detection service
      const results = await pythonContourService.detectContours(imageData, 128);
      
      // Use the results directly, whether from Python backend or fallback
      setProcessedResults({
        original: results.visualizations.original || imageData,
        detectedContours: results.visualizations.detected_contours,
        colorContours: results.visualizations.color_contours,
        extractContours: results.visualizations.extract_contours
      });
      
      toast({
        title: "Processing complete",
        description: pythonContourService.isFallbackMode() 
          ? "Image processed with client-side fallback (Python backend not available)." 
          : `Detected ${results.count} contours in the image.`,
        variant: "default"
      });
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
