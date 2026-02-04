import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ToolConfig } from './types';
import { PromptInputBar } from './PromptInputBar';

interface SFXViewProps {
  config: ToolConfig;
  displayedText: string;
}

export function SFXView({ config, displayedText }: SFXViewProps) {
  // Generate stable waveform bars on mount
  const waveformBars = useMemo(() => 
    Array.from({ length: 120 }, () => ({
      height: Math.random() * 0.6 + 0.2,
      duration: 0.8 + Math.random() * 0.4,
    })), []
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Waveform Background */}
      <div className="flex-1 bg-gradient-to-br from-amber-900/40 via-stone-900/60 to-black relative overflow-hidden">
        {/* Animated Waveform Container */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="flex items-center gap-[2px] sm:gap-1 h-[60%] w-full max-w-5xl">
            {waveformBars.map((bar, i) => (
              <div
                key={i}
                className="flex-1 bg-amber-500/50 rounded-sm animate-pulse"
                style={{
                  height: `${bar.height * 100}%`,
                  animationDelay: `${i * 0.02}s`,
                  animationDuration: `${bar.duration}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none" />
        
        {/* Decorative corners */}
        <div className="absolute top-6 left-6 w-12 h-12">
          <div className="absolute top-0 left-0 w-8 h-px bg-amber-500/40" />
          <div className="absolute top-0 left-0 w-px h-8 bg-amber-500/40" />
        </div>
        <div className="absolute bottom-6 right-6 w-12 h-12">
          <div className="absolute bottom-0 right-0 w-8 h-px bg-amber-500/40" />
          <div className="absolute bottom-0 right-0 w-px h-8 bg-amber-500/40" />
        </div>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-amber-400/30 text-4xl sm:text-6xl font-serif italic tracking-wider">
            SFX Generator
          </span>
        </div>
      </div>

      {/* Bottom Prompt Bar */}
      <PromptInputBar 
        displayedText={displayedText} 
        accentColor={config.accentColor}
        bgColor="bg-amber-900/20"
      />
    </motion.div>
  );
}
