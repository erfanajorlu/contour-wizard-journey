import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Eye, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Define sample datasets with high-contrast images better suited for contour detection
const sampleDatasets = [
  {
    id: 'portrait',
    name: 'Portrait',
    description: 'Human face with clear features for detection',
    complexity: 'Medium',
    bestFor: 'Face contour detection',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=500&auto=format&cors=1'
  },
  {
    id: 'medical-imaging',
    name: 'Medical Imaging',
    description: 'Medical scans with clear structures',
    complexity: 'High',
    bestFor: 'Medical contour detection',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&cors=1'
  },
  {
    id: 'household-objects',
    name: 'Household Objects',
    description: 'Everyday items with distinct contours',
    complexity: 'Medium',
    bestFor: 'Practicing object detection',
    imageUrl: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=500&auto=format&cors=1'
  },
  {
    id: 'architecture',
    name: 'Architecture',
    description: 'Buildings with clear geometric shapes',
    complexity: 'Medium',
    bestFor: 'Edge detection on structures',
    imageUrl: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=500&auto=format&cors=1'
  }
];

const ImageGallery = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();
  
  const categories = [
    { id: 'all', name: 'All Datasets' },
    { id: 'basic', name: 'Basic' },
    { id: 'medium', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' }
  ];
  
  const getDatasetsByCategory = (category: string) => {
    if (category === 'all') return sampleDatasets;
    
    const complexityMap: Record<string, string[]> = {
      'basic': ['Low'],
      'medium': ['Medium'],
      'advanced': ['High', 'Very High']
    };
    
    return sampleDatasets.filter(
      dataset => complexityMap[category]?.includes(dataset.complexity)
    );
  };
  
  const handleTryImage = (dataset: typeof sampleDatasets[0]) => {
    // Find the processor section and scroll to it
    const processorSection = document.getElementById('processor');
    if (processorSection) {
      processorSection.scrollIntoView({ behavior: 'smooth' });
      
      // Set a timeout to allow scrolling to complete before showing the toast
      setTimeout(() => {
        toast({
          title: "Sample selected",
          description: "Scroll down to see the contour detection in action",
        });
      }, 1000);
    }
    
    // Create and dispatch a custom event with the image URL
    const event = new CustomEvent('sampleImageSelected', { 
      detail: { imageUrl: dataset.imageUrl }
    });
    document.dispatchEvent(event);
  };
  
  const fadeInUpVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.05 * i,
        duration: 0.5,
        ease: [0.645, 0.045, 0.355, 1.000]
      }
    })
  };
  
  return (
    <section id="gallery" className="py-16 px-4 sm:px-6 md:px-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        <div className="text-center mb-16">
          <motion.span 
            className="inline-block text-sm font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary mb-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            Examples
          </motion.span>
          <motion.h2 
            className="text-3xl font-bold tracking-tight md:text-4xl mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Sample Image Gallery
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            Explore various types of images suitable for contour detection algorithms.
          </motion.p>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full flex justify-center mb-8">
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map(category => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {getDatasetsByCategory(category.id).map((dataset, index) => (
                  <motion.div
                    key={dataset.id}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUpVariant}
                  >
                    <Card className="overflow-hidden h-full flex flex-col group">
                      <div className="relative">
                        <div className="aspect-video w-full overflow-hidden bg-muted">
                          <img 
                            src={dataset.imageUrl} 
                            alt={dataset.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error("Failed to load image:", e);
                              (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => setSelectedImage(dataset.imageUrl)}
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </Button>
                        </div>
                      </div>
                      
                      <CardHeader className="pt-4 pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{dataset.name}</CardTitle>
                          <Badge variant="outline" className="ml-2">
                            {dataset.complexity}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {dataset.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="py-2 flex-grow">
                        <p className="text-xs text-muted-foreground">
                          Best for: {dataset.bestFor}
                        </p>
                      </CardContent>
                      
                      <CardFooter className="pt-2 pb-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs w-full gap-1"
                          onClick={() => handleTryImage(dataset)}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Try This Image
                          <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-4xl w-full max-h-[80vh] bg-white rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="aspect-video w-full h-full flex items-center justify-center bg-black/5">
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error("Failed to load preview image");
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-white border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                  onClick={() => setSelectedImage(null)}
                >
                  Close
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-white border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-sm gap-1"
                  onClick={() => {
                    const dataset = sampleDatasets.find(d => d.imageUrl === selectedImage);
                    if (dataset) {
                      handleTryImage(dataset);
                    }
                    setSelectedImage(null);
                  }}
                >
                  Try This Image
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};

export default ImageGallery;
