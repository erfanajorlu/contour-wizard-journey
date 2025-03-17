
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { preprocessingSteps } from '@/utils/contourUtils';

const Tutorial = () => {
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
    <section id="tutorial" className="py-16 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-white to-secondary/30">
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
            Learn
          </motion.span>
          <motion.h2 
            className="text-3xl font-bold tracking-tight md:text-4xl mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Understanding Contour-Based Algorithms
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            Learn how contour detection works and why it's important for image processing.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle>What are Contours?</CardTitle>
                <CardDescription>
                  Understanding the basic concept
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  <span className="font-medium">Contours</span> are simply curves joining all continuous points along a boundary that have the same color or intensity. They are useful for shape analysis, object detection, and recognition.
                </p>
                <p>
                  In image processing, contours act as a powerful tool for extracting information about the shape, size, and location of objects within an image. They represent the outline or silhouette of objects, allowing us to analyze their geometric properties.
                </p>
                <p>
                  Contour detection algorithms identify these boundaries by looking for abrupt changes in pixel intensity, which typically occur at the edges of objects.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  Real-world uses of contour detection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>
                      <span className="font-medium">Medical Imaging:</span> Detecting boundaries of organs, tumors, or anatomical structures in MRI, CT scans, and X-rays.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>
                      <span className="font-medium">Object Tracking:</span> Following moving objects in video surveillance or autonomous vehicles.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>
                      <span className="font-medium">OCR (Optical Character Recognition):</span> Identifying individual characters in text recognition systems.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>
                      <span className="font-medium">Gesture Recognition:</span> Detecting hand movements and gestures in human-computer interaction.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>
                      <span className="font-medium">Manufacturing Quality Control:</span> Inspecting products for defects or inconsistencies.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <div className="mb-16">
          <div className="text-center mb-10">
            <motion.h3 
              className="text-2xl font-bold tracking-tight md:text-3xl mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              The Process of Contour Detection
            </motion.h3>
            <motion.p 
              className="text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Contour detection typically follows these preprocessing steps:
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {preprocessingSteps.map((step, index) => (
              <motion.div
                key={step.id}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={fadeInUpVariant}
              >
                <Card className="glass-card h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground w-6 h-6 mr-2 text-xs">
                        {index + 1}
                      </span>
                      {step.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="text-center mb-10">
            <motion.h3 
              className="text-2xl font-bold tracking-tight md:text-3xl mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              Choosing the Right Dataset
            </motion.h3>
            <motion.p 
              className="text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              When working with contour detection, selecting appropriate datasets is crucial. Different types of images present varying levels of complexity.
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium mb-3">For Beginners</h4>
                <p className="text-muted-foreground mb-3">Start with simple images that have:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>High contrast between objects and background</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>Clear, well-defined edges</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>Minimal noise or texture</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>Simple geometric shapes or silhouettes</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-3">Public Datasets</h4>
                <p className="text-muted-foreground mb-3">Several public datasets are suitable for practicing contour detection:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>
                      <span className="font-medium">BSDS500 (Berkeley Segmentation Dataset):</span> Contains 500 natural images with ground truth segmentations. Perfect for boundary detection algorithms.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>
                      <span className="font-medium">COCO (Common Objects in Context):</span> Large-scale dataset with object segmentations for everyday objects.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>
                      <span className="font-medium">PASCAL VOC:</span> Contains annotated images with object boundaries for various categories.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>
                      <span className="font-medium">Medical Imaging Datasets:</span> ISBI cell tracking datasets or brain MRI datasets offer medical applications.
                    </span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-3">Creating Your Own Dataset</h4>
                <p className="text-muted-foreground mb-3">If you want to create your own dataset:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>Take photos of objects against contrasting backgrounds</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>Ensure consistent lighting conditions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>Start with simple objects and gradually increase complexity</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span>Annotate ground truth boundaries for evaluation</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Tutorial;
