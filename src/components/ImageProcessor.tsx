
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ImageProcessor = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>("upload");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Improved image processing functions based on the Python example
  const convertToGrayscale = (imageData: ImageData): ImageData => {
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      output[i] = gray;
      output[i + 1] = gray;
      output[i + 2] = gray;
      output[i + 3] = 255;
    }

    return new ImageData(output, width, height);
  };

  const applyAdaptiveThreshold = (imageData: ImageData): ImageData => {
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data.length);
    const blockSize = 21; // Must be odd
    const C = 5; // Constant subtracted from mean
    const halfBlockSize = Math.floor(blockSize / 2);

    // Helper function to compute index
    const idx = (x: number, y: number) => (y * width + x) * 4;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate adaptive threshold for each pixel
        let sum = 0;
        let count = 0;
        
        // Compute local mean
        for (let dy = -halfBlockSize; dy <= halfBlockSize; dy++) {
          for (let dx = -halfBlockSize; dx <= halfBlockSize; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += data[idx(nx, ny)];
              count++;
            }
          }
        }
        
        const mean = sum / count;
        const threshold = mean - C;
        
        // Apply threshold (inverted as in the Python example)
        const pixelValue = data[idx(x, y)] <= threshold ? 255 : 0;
        const index = idx(x, y);
        output[index] = pixelValue;
        output[index + 1] = pixelValue;
        output[index + 2] = pixelValue;
        output[index + 3] = 255;
      }
    }

    return new ImageData(output, width, height);
  };

  const findContours = (binaryImageData: ImageData): number[][][] => {
    const { data, width, height } = binaryImageData;
    const visited = new Uint8Array(width * height);
    const contours: number[][][] = [];

    // Helper function to get pixel value at (x,y)
    const getPixel = (x: number, y: number): number => {
      if (x < 0 || x >= width || y < 0 || y >= height) return 0;
      return data[(y * width + x) * 4] === 255 ? 1 : 0;
    };

    // Helper function to check if point is already visited
    const isVisited = (x: number, y: number): boolean => {
      return visited[y * width + x] === 1;
    };

    // Mark a point as visited
    const markVisited = (x: number, y: number): void => {
      visited[y * width + x] = 1;
    };

    // Direction vectors for 8-connected neighborhood
    const dx = [1, 1, 0, -1, -1, -1, 0, 1];
    const dy = [0, -1, -1, -1, 0, 1, 1, 1];

    // Find starting points for contours (white pixels with black neighbors)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (getPixel(x, y) === 1 && !isVisited(x, y)) {
          // Found a potential contour starting point
          const contour: number[][] = [];
          let cx = x;
          let cy = y;
          let dir = 7; // Start direction (assuming we came from the right)

          do {
            contour.push([cx, cy]);
            markVisited(cx, cy);

            // Find the next pixel in the contour
            let found = false;
            let newDir = (dir + 5) % 8; // Start looking at the leftmost direction relative to current direction
            
            for (let i = 0; i < 8; i++) {
              const nx = cx + dx[newDir];
              const ny = cy + dy[newDir];
              
              if (getPixel(nx, ny) === 1 && !isVisited(nx, ny)) {
                cx = nx;
                cy = ny;
                dir = newDir;
                found = true;
                break;
              }
              
              newDir = (newDir + 1) % 8;
            }
            
            if (!found) break;
          } while (cx !== x || cy !== y);
          
          if (contour.length > 20) { // Filter out small contours
            contours.push(contour);
          }
        }
      }
    }

    return contours;
  };

  const drawContours = (
    ctx: CanvasRenderingContext2D, 
    contours: number[][][], 
    fillColor: string = 'rgba(0, 200, 175, 0.5)',
    strokeColor: string = 'rgb(0, 255, 0)'
  ) => {
    // First draw the filled contours
    ctx.fillStyle = fillColor;
    
    for (const contour of contours) {
      if (contour.length < 3) continue;
      
      ctx.beginPath();
      ctx.moveTo(contour[0][0], contour[0][1]);
      
      for (let i = 1; i < contour.length; i++) {
        ctx.lineTo(contour[i][0], contour[i][1]);
      }
      
      ctx.closePath();
      ctx.fill();
    }
    
    // Then draw the outlines
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    
    for (const contour of contours) {
      if (contour.length < 3) continue;
      
      ctx.beginPath();
      ctx.moveTo(contour[0][0], contour[0][1]);
      
      for (let i = 1; i < contour.length; i++) {
        ctx.lineTo(contour[i][0], contour[i][1]);
      }
      
      ctx.closePath();
      ctx.stroke();
    }
  };

  const processImage = () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please select or upload an image first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);

    if (!canvasRef.current || !originalCanvasRef.current || !resultCanvasRef.current) {
      toast({
        title: "Canvas error",
        description: "Could not get canvas context. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = selectedImage;
    
    img.onload = () => {
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

      const originalCtx = originalCanvasRef.current!.getContext("2d");
      if (!originalCtx) {
        toast({
          title: "Canvas error",
          description: "Could not get canvas context for original image.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      originalCanvasRef.current!.width = scaledWidth;
      originalCanvasRef.current!.height = scaledHeight;
      originalCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      const ctx = canvasRef.current!.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        toast({
          title: "Canvas error",
          description: "Could not get canvas context for processing.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      canvasRef.current!.width = scaledWidth;
      canvasRef.current!.height = scaledHeight;
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      try {
        // 1. Convert to grayscale
        let imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
        const grayscaleData = convertToGrayscale(imageData);
        ctx.putImageData(grayscaleData, 0, 0);
        
        // 2. Apply adaptive threshold (binarization)
        const thresholdData = applyAdaptiveThreshold(grayscaleData);
        ctx.putImageData(thresholdData, 0, 0);
        
        // Prepare the result canvas
        const resultCtx = resultCanvasRef.current!.getContext("2d");
        if (!resultCtx) {
          toast({
            title: "Canvas error",
            description: "Could not get canvas context for result image.",
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
        
        resultCanvasRef.current!.width = scaledWidth;
        resultCanvasRef.current!.height = scaledHeight;
        resultCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
        
        // 3. Find and draw contours
        const contours = findContours(thresholdData);
        
        if (contours.length === 0) {
          toast({
            title: "Processing result",
            description: "No contours detected in the image. Try another image with clearer edges.",
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
        
        // Draw contours on original image
        drawContours(resultCtx, contours);
        
        toast({
          title: "Processing complete",
          description: `Detected ${contours.length} contours in the image.`,
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
    "https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?w=500&auto=format&cors=1",
    "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=500&auto=format&cors=1",
    "https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=500&auto=format&cors=1",
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&cors=1",
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Original</p>
                    <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                      <canvas ref={originalCanvasRef} className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Threshold</p>
                    <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                      <canvas ref={canvasRef} className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Contour Detection</p>
                    <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                      <canvas ref={resultCanvasRef} className="w-full h-full object-contain" />
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
