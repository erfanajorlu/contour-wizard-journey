
import React from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import ImageProcessor from '@/components/ImageProcessor';
import Tutorial from '@/components/Tutorial';
import ImageGallery from '@/components/ImageGallery';
import Footer from '@/components/Footer';
import { ChevronDown } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 overflow-hidden">
          <div 
            className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'url("https://source.unsplash.com/random/1920x1080/?patterns")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(30px)'
            }}
          ></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <motion.span 
              className="inline-block text-sm font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              Welcome to
            </motion.span>
            
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.645, 0.045, 0.355, 1.000] }}
            >
              <span className="block">Contour-Based</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                Algorithm Explorer
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Discover how contour detection algorithms work through interactive visualizations and step-by-step tutorials. No deep learning expertise required.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="glass-card inline-block px-8 py-6 mb-8">
                <p className="font-medium text-lg mb-4">What you'll learn:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-6 text-left">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span className="text-sm">Fundamentals of contour detection</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span className="text-sm">Image preprocessing techniques</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span className="text-sm">How to select appropriate datasets</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span className="text-sm">Practical application examples</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span className="text-sm">Real-time contour visualization</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    <span className="text-sm">Basic algorithm implementation</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.a
            href="#tutorial"
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            whileHover={{ y: 5 }}
          >
            <span className="text-sm mb-2">Scroll to begin</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </motion.a>
        </section>
        
        <Tutorial />
        <ImageGallery />
        <ImageProcessor />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
