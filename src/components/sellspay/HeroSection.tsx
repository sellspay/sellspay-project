import React from 'react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  overlay?: 'dark' | 'gradient' | 'none';
  className?: string;
}

export function HeroSection({
  title,
  subtitle,
  backgroundImage,
  ctaText,
  onCtaClick,
  overlay = 'dark',
  className = ''
}: HeroSectionProps) {
  const overlayStyles = {
    dark: 'bg-black/60',
    gradient: 'bg-gradient-to-b from-black/80 via-black/40 to-black/80',
    none: '',
  };

  return (
    <section 
      className={`relative min-h-[80vh] flex items-center justify-center overflow-hidden ${className}`}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {overlay !== 'none' && (
        <div className={`absolute inset-0 ${overlayStyles[overlay]}`} />
      )}
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6"
        >
          {title}
        </motion.h1>
        
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-zinc-300 max-w-2xl mx-auto mb-8"
          >
            {subtitle}
          </motion.p>
        )}
        
        {ctaText && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            onClick={onCtaClick}
            className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
          >
            {ctaText}
          </motion.button>
        )}
      </div>
    </section>
  );
}

export default HeroSection;
