import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image as ImageIcon, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

function EnhancedImageProcessor() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const grayscaleCanvasRef = useRef<HTMLCanvasElement>(null);
  const edgeCanvasRef = useRef<HTMLCanvasElement>(null);
  const contourCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { id: 'original', name: 'Original Image', ref: originalCanvasRef },
    { id: 'grayscale', name: 'Grayscale', ref: grayscaleCanvasRef },
    { id: 'edges', name: 'Edge Detection', ref: edgeCanvasRef },
    { id: 'contour', name: 'Contour Detection', ref: contourCanvasRef }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUrl(result);
      toast({
        title: "Image uploaded",
        description: "Processing with enhanced contour detection algorithm",
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
  
  const handleReset = () => {
    setCurrentStep(0);
  };
  
  // Zoom in
  const zoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 2));
  };
  
  // Zoom out
  const zoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.5));
  };

  // Load sample image
  const loadSampleImage = (url: string) => {
    setImageUrl(url);
    toast({
      title: "Sample image loaded",
      description: "Processing with enhanced contour detection algorithm",
    });
  };

  // ------------------------
  // 1) Convert to grayscale
  // ------------------------
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

  // ------------------------------------
  // 2) Apply an enhanced Gaussian blur
  // ------------------------------------
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

  // ---------------------------------------------
  // 3) Canny Edge Detection (Sobel + NMS + Hysteresis)
  // ---------------------------------------------
  const applyCannyEdgeDetection = (imageData: ImageData): ImageData => {
    const { data, width, height } = imageData;

    // 3.1) Sobel operator to get gradients
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

    // We'll store:
    //  - gradient magnitudes in mag[]
    //  - gradient directions in dir[] (radians)
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

    // 3.2) Non-Maximum Suppression (NMS)
    const nms = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const angle = dir[idx];
        const magnitude = mag[idx];

        // Determine the direction sector (0°, 45°, 90°, 135°, etc.)
        // We'll round angle to one of four main directions.
        const degree = ((angle * 180) / Math.PI) % 180;
        let neighbor1 = 0;
        let neighbor2 = 0;

        // We check neighbors along gradient direction:
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

    // 3.3) Double Threshold
    // Tweak these thresholds for best results per image:
    const highThreshold = 50;  // e.g. 50
    const lowThreshold = 20;   // e.g. 20
    // You may need to adjust these for your images.

    // We'll create a temporary array to mark edges:
    //   0 = no edge
    //   1 = weak edge
    //   2 = strong edge
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

    // 3.4) Hysteresis
    // If a weak edge (1) is connected to a strong edge (2), upgrade it to strong
    const index = (x: number, y: number) => y * width + x;

    // BFS/DFS approach to connect edges
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

    // 3.5) Build final black/white image: strong edges => black pixel
    const outData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < edgeMap.length; i++) {
      const outIdx = i * 4;
      // We'll treat "strong edge" (2) as black, everything else white:
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

  // -------------------------------------------
  // 4) (Optional) Morphological Closing
  //    This can help fill small gaps in edges.
  // -------------------------------------------
  const applyMorphologicalClose = (imageData: ImageData): ImageData => {
    // You can experiment with this step:
    //   1) Dilation
    //   2) Erosion
    // This is optional but can help on certain images.
    const dilated = dilate(imageData);
    const closed = erode(dilated);
    return closed;
  };

  const dilate = (imageData: ImageData): ImageData => {
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data.length);

    const getVal = (x: number, y: number) => data[(y * width + x) * 4];
    const kernelSize = 3;
    const offset = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let minVal = 255;
        for (let ky = -offset; ky <= offset; ky++) {
          for (let kx = -offset; kx <= offset; kx++) {
            const nx = x + kx;
            const ny = y + ky;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const val = getVal(nx, ny);
              // Because edges are black=0, white=255, for "dilation" of black edges,
              // we look for the min in a 3x3 region
              if (val < minVal) minVal = val;
            }
          }
        }
        const outIdx = (y * width + x) * 4;
        output[outIdx] = minVal;
        output[outIdx + 1] = minVal;
        output[outIdx + 2] = minVal;
        output[outIdx + 3] = 255;
      }
    }

    return new ImageData(output, width, height);
  };

  const erode = (imageData: ImageData): ImageData => {
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data.length);

    const getVal = (x: number, y: number) => data[(y * width + x) * 4];
    const kernelSize = 3;
    const offset = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let maxVal = 0;
        for (let ky = -offset; ky <= offset; ky++) {
          for (let kx = -offset; kx <= offset; kx++) {
            const nx = x + kx;
            const ny = y + ky;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const val = getVal(nx, ny);
              // Because edges are black=0, white=255, for "erosion" we look for the max
              // in that region (which preserves black if it's truly an edge).
              if (val > maxVal) maxVal = val;
            }
          }
        }
        const outIdx = (y * width + x) * 4;
        output[outIdx] = maxVal;
        output[outIdx + 1] = maxVal;
        output[outIdx + 2] = maxVal;
        output[outIdx + 3] = 255;
      }
    }

    return new ImageData(output, width, height);
  };

  // -------------------------------------------------------
  // 5) Find large "black" areas in the final edge map
  //    to identify contour start points
  // -------------------------------------------------------
  const findStartPoints = (imageData: ImageData): [number, number][] => {
    const { data, width, height } = imageData;
    const startPoints: [number, number][] = [];
    const visited = new Set<string>();

    // Increase minContourSize if you want to skip small/noisy contours
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
                if (
                  nx >= 0 &&
                  nx < width &&
                  ny >= 0 &&
                  ny < height
                ) {
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

  // -------------------------------------------------------
  // 6) Moore-Neighbor contour tracing around each start
  // -------------------------------------------------------
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

  // --------------------------------
  // 7) Smoothing & drawing contours
  // --------------------------------
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

  // ------------------------------------------
  // Main function that processes the image
  // ------------------------------------------
  const processImage = () => {
    if (!imageUrl) return;
    
    const originalCtx = originalCanvasRef.current?.getContext('2d');
    const grayscaleCtx = grayscaleCanvasRef.current?.getContext('2d');
    const edgeCtx = edgeCanvasRef.current?.getContext('2d');
    const contourCtx = contourCanvasRef.current?.getContext('2d', { willReadFrequently: true });
    
    if (!originalCtx || !grayscaleCtx || !edgeCtx || !contourCtx) {
      toast({
        title: "Processing error",
        description: "Could not get canvas context",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const maxDimension = 600;
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

      // Set canvas sizes
      const canvases = [originalCanvasRef, grayscaleCanvasRef, edgeCanvasRef, contourCanvasRef];
      canvases.forEach(canvasRef => {
        if (canvasRef.current) {
          canvasRef.current.width = scaledWidth;
          canvasRef.current.height = scaledHeight;
        }
      });

      // Draw original image
      originalCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      // 1) Draw original to grayscale canvas first
      grayscaleCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      
      // 1a) Convert to grayscale
      let imageData = grayscaleCtx.getImageData(0, 0, scaledWidth, scaledHeight);
      const grayscaleData = convertToGrayscale(imageData);
      grayscaleCtx.putImageData(grayscaleData, 0, 0);

      // 2) Edge detection: apply Gaussian blur then Canny
      edgeCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      let edgeImageData = edgeCtx.getImageData(0, 0, scaledWidth, scaledHeight);
      const blurredData = applyGaussianBlur(convertToGrayscale(edgeImageData));
      const edgeData = applyCannyEdgeDetection(blurredData);
      edgeCtx.putImageData(edgeData, 0, 0);

      // 3) Draw contours
      contourCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      
      // Find contours
      try {
        // Get the edge data for contour detection
        const edgeImageForContours = edgeCtx.getImageData(0, 0, scaledWidth, scaledHeight);
        
        // Find start points
        const startPoints = findStartPoints(edgeImageForContours);
        
        if (startPoints.length === 0) {
          toast({
            title: "Contour detection",
            description: "No contours found in the image",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }
        
        // Trace all contours
        const allContours = startPoints
          .map(([x, y]) => {
            const c = traceContour(edgeImageForContours, x, y);
            return c.length > 0 ? c : null;
          })
          .filter(Boolean) as number[][][];
        
        // Draw contours on the final canvas
        drawContours(contourCtx, allContours);
        
        toast({
          title: "Processing complete",
          description: `Found ${allContours.length} contours in the image`,
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
    
    img.onerror = () => {
      toast({
        title: "Image loading error",
        description: "Failed to load the image",
        variant: "destructive",
      });
      setIsProcessing(false);
    };
  };

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

  useEffect(() => {
    if (imageUrl) {
      processImage();
    }
  }, [imageUrl]);
  
  const sampleImages = [
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&cors=1",
    "https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=500&auto=format&cors=1",
    "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=500&auto=format&cors=1",
  ];

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
            Enhanced
          </motion.span>
          <motion.h2 
            className="text-3xl font-bold tracking-tight md:text-4xl mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Advanced Contour Detection
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            Upload your own image or use our sample images to see advanced contour detection in action. This algorithm uses Canny edge detection for enhanced accuracy.
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
                  htmlFor="enhanced-image-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-primary/60" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Click to upload</span> or drag and drop
                    </p>
                  </div>
                  <input 
                    id="enhanced-image-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </label>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <p className="text-sm text-muted-foreground">Or try a sample image:</p>
                <div className="grid grid-cols-1 gap-2 w-full">
                  {sampleImages.map((url, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      size="sm"
                      onClick={() => loadSampleImage(url)}
                      className="w-full"
                    >
                      Sample Image {index + 1}
                    </Button>
                  ))}
                </div>
              </CardFooter>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>About Advanced Contour Detection</CardTitle>
                <CardDescription>
                  How this algorithm works
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-4">
                <p>
                  This enhanced contour detection uses the following steps:
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Advanced grayscale conversion with contrast normalization</li>
                  <li>Gaussian blur with optimized 5x5 kernel</li>
                  <li>Canny edge detection (Sobel + Non-Maximum Suppression + Hysteresis)</li>
                  <li>Moore-Neighbor tracing algorithm to find contour paths</li>
                  <li>Contour smoothing and filtering for cleaner results</li>
                </ol>
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
                    disabled={!imageUrl}
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
                    disabled={!imageUrl}
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
                        disabled={!imageUrl}
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
                    
                    {!imageUrl && (
                      <div className="flex flex-col items-center justify-center space-y-4 text-muted-foreground">
                        <ImageIcon className="w-12 h-12 opacity-20" />
                        <p>Upload an image or select a sample to begin</p>
                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                          {sampleImages.map((url, index) => (
                            <Button 
                              key={index} 
                              variant="outline" 
                              size="sm"
                              onClick={() => loadSampleImage(url)}
                            >
                              Sample {index + 1}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                          <p className="text-sm font-medium">
                            Processing image...
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
                    disabled={currentStep === 0 || !imageUrl}
                  >
                    Previous
                  </Button>
                  <Button 
                    onClick={nextStep}
                    disabled={currentStep === steps.length - 1 || !imageUrl}
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
}

export default EnhancedImageProcessor;
