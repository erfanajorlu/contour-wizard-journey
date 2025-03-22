import React from "react";
import { motion } from "framer-motion";
import { Github, Linkedin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      className="w-full py-12 px-4 sm:px-6 md:px-8 border-t border-border"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        <motion.div
          className="mb-6 flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
            Contour Wizard
          </span>
          <h3 className="text-lg font-semibold text-primary tracking-tight">
            Journey
          </h3>
        </motion.div>

        <p className="text-muted-foreground text-sm max-w-xl mb-8">
          This application provides an educational introduction to contour-based
          algorithms. Use it to learn about image processing concepts and
          experiment with different contour detection techniques.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <motion.a
            href="#tutorial"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            whileHover={{ y: -1 }}
            transition={{ duration: 0.2 }}
          >
            Tutorial
          </motion.a>
          <span className="hidden sm:inline text-muted-foreground">•</span>
          <motion.a
            href="#gallery"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            whileHover={{ y: -1 }}
            transition={{ duration: 0.2 }}
          >
            Gallery
          </motion.a>
          <span className="hidden sm:inline text-muted-foreground">•</span>
          <motion.a
            href="#processor"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            whileHover={{ y: -1 }}
            transition={{ duration: 0.2 }}
          >
            Image Processor
          </motion.a>
        </div>

        <div className="mb-4 flex flex-col items-center">
          <p className="text-sm font-medium text-primary mb-2">
            Written by Erfan Ajorlu
          </p>
          <div className="flex gap-4 items-center">
            <motion.a
              href="https://github.com/erfanajorlu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              whileHover={{ y: -2 }}
            >
              <Github size={20} />
            </motion.a>
            <motion.a
              href="https://www.linkedin.com/in/erfan-ajorlu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              whileHover={{ y: -2 }}
            >
              <Linkedin size={20} />
            </motion.a>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          © {currentYear} Contour Wizard Journey. All rights reserved.
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
