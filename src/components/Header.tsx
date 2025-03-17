
import React from 'react';
import { motion } from 'framer-motion';

const Header = () => {
  return (
    <motion.header 
      className="w-full py-6 px-4 sm:px-6 md:px-8 z-10"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
            Contour Wizard
          </span>
          <h1 className="text-xl font-semibold text-primary sm:text-2xl tracking-tight">
            Journey
          </h1>
        </motion.div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <motion.a 
            href="#tutorial" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            whileHover={{ y: -1 }}
            transition={{ duration: 0.2 }}
          >
            Tutorial
          </motion.a>
          <motion.a 
            href="#gallery" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            whileHover={{ y: -1 }}
            transition={{ duration: 0.2 }}
          >
            Gallery
          </motion.a>
          <motion.a 
            href="#processor" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            whileHover={{ y: -1 }}
            transition={{ duration: 0.2 }}
          >
            Image Processor
          </motion.a>
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;
