import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pythonContourService, ContourResponse } from "@/services/pythonContourService";
import { Upload, ImageIcon, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const ImageProcessor = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState<number>(127);
  const [contourData, setContourData] = useState<ContourResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>("upload");
  const [sampleList, setSampleList] = useState<Array<{ id: string; name: string; category: string }>>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  // Image conversion and processing functions
  const convertToGrayscale = (imageData: ImageData): ImageData => {
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data.length);

    // First pass: find min and max
    let min = 255;
    let max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      min = Math.min(min, gray);
      max = Math.max(max, gray);
    }

    // Second pass: normalize
    const range = max - min;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const normalized = range === 0 ? gray : ((gray - min) / range) * 255;

      output[i] = normalized;
      output[i + 1] = normalized;
      output[i + 2] = normalized;
      output[i + 3] = 255;
    }

    return new ImageData(output, width, height);
  };

  const applyGaussianBlur = (imageData: ImageData): ImageData => {
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data.length);

    // A 5x5 Gaussian kernel
    const kernel = [
      [1,  4,  6,  4,  1],
      [4, 16, 24, 16,  4],
      [6, 24, 36, 24,  6],
      [4, 16, 24, 16,  4],
      [1,  4,  6,  4,  1],
    ];
    const kernelSize = 5;
    const kernelSum = 256; // sum of the above kernel
    const offset = Math.floor(kernelSize / 2);

    for (let y = offset; y < height - offset; y++) {
      for (let x = offset; x < width - offset; x++) {
        let sum = 0;
        for (let ky = -offset; ky <= offset; ky++) {
          for (let kx = -offset; kx <= offset; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[ky + offset][kx + offset];
            sum += data[idx] * weight; // only need one channel (grayscale)
          }
        }
        const outIdx = (y * width + x) * 4;
        const value = sum / kernelSum;
        output[outIdx] = value;
        output[outIdx + 1] = value;
        output[outIdx + 2] = value;
        output[outIdx + 3] = 255;
      }
    }

    return new ImageData(output, width, height);
  };

  const applyCannyEdgeDetection = (imageData: ImageData): ImageData => {
    const { data, width, height } = imageData;

    // Sobel operator to get gradients
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ];
    const sobelY = [
      [-1, -2, -1],
      [ 0,  0,  0],
      [ 1,  2,  1],
    ];

    // We'll store gradient magnitudes and directions
    const mag = new Float32Array(width * height);
    const dir = new Float32Array(width * height);

    // Helper to get pixel from data (only need grayscale channel)
    const getGray = (x: number, y: number) => data[(y * width + x) * 4];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;

        // Apply Sobel X/Y
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const val = getGray(x + kx, y + ky);
            gx += val * sobelX[ky + 1][kx + 1];
            gy += val * sobelY[ky + 1][kx + 1];
          }
        }

        const idx = y * width + x;
        mag[idx] = Math.sqrt(gx * gx + gy * gy);
        dir[idx] = Math.atan2(gy, gx);
      }
    }

    // Non-Maximum Suppression (NMS)
    const nms = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const angle = dir[idx];
        const magnitude = mag[idx];

        // Determine the direction sector
        const degree = ((angle * 180) / Math.PI) % 180;
        let neighbor1 = 0;
        let neighbor2 = 0;

        // Check neighbors along gradient direction
        if ((degree >= 0 && degree < 22.5) || (degree >= 157.5 && degree < 180)) {
          // left-right
          neighbor1 = mag[idx - 1];
          neighbor2 = mag[idx + 1];
        } else if (degree >= 22.5 && degree < 67.5) {
          // top-left -> bottom-right
          neighbor1 = mag[idx - width - 1];
          neighbor2 = mag[idx + width + 1];
        } else if (degree >= 67.5 && degree < 112.5) {
          // top-bottom
          neighbor1 = mag[idx - width];
          neighbor2 = mag[idx + width];
        } else {
          // top-right -> bottom-left
          neighbor1 = mag[idx - width + 1];
          neighbor2 = mag[idx + width - 1];
        }

        // Suppress if not a local max
        if (magnitude >= neighbor1 && magnitude >= neighbor2) {
          nms[idx] = magnitude;
        } else {
          nms[idx] = 0;
        }
      }
    }

    // Double Threshold
    const highThreshold = 50;
    const lowThreshold = 20;

    // Edge map: 0 = no edge, 1 = weak edge, 2 = strong edge
    const edgeMap = new Uint8ClampedArray(width * height);

    for (let i = 0; i < nms.length; i++) {
      if (nms[i] >= highThreshold) {
        edgeMap[i] = 2; // strong
      } else if (nms[i] >= lowThreshold) {
        edgeMap[i] = 1; // weak
      } else {
        edgeMap[i] = 0; // no edge
      }
    }

    // Hysteresis - connect weak edges to strong edges
    const index = (x: number, y: number) => y * width + x;
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = index(x, y);
        if (edgeMap[idx] === 2) {
          // Check neighbors
          const stack = [[x, y]];
          while (stack.length > 0) {
            const [cx, cy] = stack.pop()!;
            for (const [dx, dy] of directions) {
              const nx = cx + dx;
              const ny = cy + dy;
              const nIdx = index(nx, ny);
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (edgeMap[nIdx] === 1) {
                  edgeMap[nIdx] = 2;
                  stack.push([nx, ny]);
                }
              }
            }
          }
        }
      }
    }

    // Build final black/white image: strong edges => black pixel
    const outData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < edgeMap.length; i++) {
      const outIdx = i * 4;
      if (edgeMap[i] === 2) {
        outData[outIdx] = 0;
        outData[outIdx + 1] = 0;
        outData[outIdx + 2] = 0;
        outData[outIdx + 3] = 255;
      } else {
        outData[outIdx] = 255;
        outData[outIdx + 1] = 255;
        outData[outIdx + 2] = 255;
        outData[outIdx + 3] = 255;
      }
    }

    return new ImageData(outData, width, height);
  };

  // Find starting points for contours
  const findStartPoints = (imageData: ImageData): [number, number][] => {
    const { data, width, height } = imageData;
    const startPoints: [number, number][] = [];
    const visited = new Set<string>();

    const minContourSize = Math.floor((width + height) / 100);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        if (visited.has(key)) continue;

        // black pixel => data[idx] = 0
        const idx = (y * width + x) * 4;
        if (data[idx] === 0) {
          // BFS to see how large this region is
          let contourSize = 0;
          const stack: [number, number][] = [[x, y]];
          const tempVisited = new Set<string>();

          while (stack.length > 0 && contourSize <= minContourSize) {
            const [cx, cy] = stack.pop()!;
            const cKey = `${cx},${cy}`;
            if (tempVisited.has(cKey)) continue;
            tempVisited.add(cKey);
            contourSize++;

            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = cx + dx;
                const ny = cy + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const nIdx = (ny * width + nx) * 4;
                  if (data[nIdx] === 0 && !tempVisited.has(`${nx},${ny}`)) {
                    stack.push([nx, ny]);
                  }
                }
              }
            }
          }

          // If region is large enough, we keep it
          if (contourSize > minContourSize) {
            startPoints.push([x, y]);
            // Mark all visited
            tempVisited.forEach((p) => visited.add(p));
          }
        }
      }
    }

    return startPoints;
  };

  // Trace contour around edges
  const traceContour = (
    imageData: ImageData,
    startX: number,
    startY: number
  ): number[][] => {
    const { data, width, height } = imageData;
    const visited = new Set<string>();
    const contour: number[][] = [];

    const directions = [
      [-1,  0],
      [-1, -1],
      [ 0, -1],
      [ 1, -1],
      [ 1,  0],
      [ 1,  1],
      [ 0,  1],
      [-1,  1],
    ];

    let currentX = startX;
    let currentY = startY;
    let dirIndex = 0;

    do {
      const key = `${currentX},${currentY}`;
      if (!visited.has(key)) {
        contour.push([currentX, currentY]);
        visited.add(key);
      }

      let found = false;
      let count = 0;

      while (count < 8 && !found) {
        const nextDir = (dirIndex + count) % 8;
        const [dx, dy] = directions[nextDir];
        const newX = currentX + dx;
        const newY = currentY + dy;

        if (
          newX >= 0 &&
          newX < width &&
          newY >= 0 &&
          newY < height &&
          data[(newY * width + newX) * 4] === 0
        ) {
          currentX = newX;
          currentY = newY;
          dirIndex = (nextDir + 5) % 8; // turn around
          found = true;
        }
        count++;
      }

      if (!found) break;
    } while (currentX !== startX || currentY !== startY);

    return contour;
  };

  // Smooth contour points
  const smoothContour = (contour: number[][], windowSize = 5): number[][] => {
    const smoothed: number[][] = [];
    const halfWindow = Math.floor(windowSize / 2);
    const length = contour.length;
    if (length === 0) return [];

    for (let i = 0; i < length; i++) {
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      for (let j = -halfWindow; j <= halfWindow; j++) {
        const idx = (i + j + length) % length;
        sumX += contour[idx][0];
        sumY += contour[idx][1];
        count++;
      }
      smoothed.push([
        Math.round(sumX / count),
        Math.round(sumY / count),
      ]);
    }
    return smoothed;
  };

  // Draw contours on the canvas
  const drawContours = (
    ctx: CanvasRenderingContext2D,
    allContours: number[][][]
  ) => {
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;

    // Filter out small contours
    const filtered = allContours.filter((c) => c.length > 100);
    // Sort largest first
    filtered.sort((a, b) => b.length - a.length);

    // Keep top N
    const maxContours = 50;
    const toDraw = filtered.slice(0, maxContours);

    // Smooth & draw
    toDraw.forEach((contour) => {
      const smoothed = smoothContour(contour, 5);
      ctx.beginPath();
      for (let i = 0; i < smoothed.length; i++) {
        const [x, y] = smoothed[i];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    });
  };

  // Process the image with enhanced contour detection
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

    // Check if canvas elements exist
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

      // Scale large images
      if (img.width > maxDimension || img.height > maxDimension) {
        if (img.width > img.height) {
          scaledWidth = maxDimension;
          scaledHeight = (img.height * maxDimension) / img.width;
        } else {
          scaledHeight = maxDimension;
          scaledWidth = (img.width * maxDimension) / img.height;
        }
      }

      // Draw original
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

      // Setup for contour canvas
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
        // 1) Grayscale
        let imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
        imageData = convertToGrayscale(imageData);

        // 2) Gaussian Blur
        imageData = applyGaussianBlur(imageData);

        // 3) Canny Edges
        imageData = applyCannyEdgeDetection(imageData);

        // Replace the canvas with the edges
        ctx.putImageData(imageData, 0, 0);

        // Setup result canvas
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

        // 5) Find contour start points
        const startPoints = findStartPoints(imageData);
        if (startPoints.length === 0) {
          toast({
            title: "Processing result",
            description: "No contours detected in the image.",
            variant: "warning"
          });
          setIsProcessing(false);
          return;
        }

        // 6) Trace all contours
        const allContours = startPoints
          .map(([x, y]) => {
            const c = traceContour(imageData, x, y);
            return c.length > 0 ? c : null;
          })
          .filter(Boolean) as number[][][];

        if (allContours.length === 0) {
          toast({
            title: "Processing result",
            description: "No valid contours found after tracing.",
            variant: "warning"
          });
          setIsProcessing(false);
          return;
        }

        // 7) Draw them on the result canvas
        drawContours(resultCtx, allContours);
        
        toast({
          title: "Processing complete",
          description: `Detected ${allContours.length} contours in the image.`,
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

  // Fetch sample images from the backend
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const samples = await pythonContourService.getMedicalSamples();
        setSampleList(samples);
      } catch (error) {
        console.error("Error fetching samples:", error);
      }
    };

    fetchSamples();
  }, []);

  // Handle image file upload
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

  // Select a sample image
  const handleSelectSample = async (sampleId: string) => {
    try {
      setIsProcessing(true);
      const imageData = await pythonContourService.getSampleImage(sampleId);
      setSelectedImage(imageData);
    } catch (error) {
      toast({
        title: "Sample loading error",
        description: "Failed to load the sample image.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Sample images for demonstration
  const sampleImages = [
    "/assets/sample1.jpg",
    "/assets/sample2.jpg",
    "/assets/sample3.jpg",
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&cors=1",
    "https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=500&auto=format&cors=1",
    "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=500&auto=format&cors=1",
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
          Our advanced algorithm uses edge detection and contour tracing to identify object boundaries.
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

              <div className="my-6">
                <Separator />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="threshold">Processing Threshold</Label>
                  <Slider
                    id="threshold"
                    min={0}
                    max={255}
                    step={1}
                    value={[thresholdValue]}
                    onValueChange={(value) => setThresholdValue(value[0])}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Value: {thresholdValue}</p>
                </div>
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
                    <p className="text-sm font-medium">Edge Detection</p>
                    <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                      <canvas ref={canvasRef} className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Contour Tracing</p>
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
