
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sampleDatasets } from '@/utils/contourUtils';
import { Layers, Eye, Download } from 'lucide-react';

const ImageGallery = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
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
                    <Card className="glass-card overflow-hidden h-full flex flex-col group">
                      <div className="relative">
                        <div 
                          className="aspect-video w-full overflow-hidden"
                          style={{ 
                            backgroundImage: `url(${dataset.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
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
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Explore Dataset
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
                >
                  <Download className="w-4 h-4" />
                  Download
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
