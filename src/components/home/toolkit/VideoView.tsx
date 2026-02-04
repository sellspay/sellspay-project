import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { ToolConfig } from './types';
import { PromptInputBar } from './PromptInputBar';

interface VideoViewProps {
  config: ToolConfig;
  displayedText: string;
}

const videos = [
  { gradient: 'from-cyan-800/50 to-teal-900/60', duration: '0:15' },
  { gradient: 'from-sky-700/40 to-cyan-900/50', duration: '0:22' },
  { gradient: 'from-teal-600/45 to-cyan-800/55', duration: '0:18' },
  { gradient: 'from-cyan-700/35 to-sky-900/50', duration: '0:30' },
];

export function VideoView({ config, displayedText }: VideoViewProps) {
  const [currentVideo, setCurrentVideo] = useState(0);

  const goToPrevious = () => {
    setCurrentVideo((prev) => (prev === 0 ? videos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentVideo((prev) => (prev === videos.length - 1 ? 0 : prev + 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Main Video Display */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 bg-gradient-to-br from-cyan-900/20 via-slate-900/60 to-black">
        {/* Large Video Preview with Slider */}
        <div className="flex-1 relative">
          {/* Video Display */}
          <motion.div 
            key={currentVideo}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`absolute inset-0 bg-gradient-to-br ${videos[currentVideo].gradient} overflow-hidden border border-cyan-500/20`}
          >
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-cyan-400/50 bg-black/30 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/40 hover:border-cyan-400/70 transition-all group">
                <Play className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400 ml-1 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            {/* Video info overlay */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <span className="text-xs text-cyan-300/70 bg-black/40 px-2 py-1">00:00 / {videos[currentVideo].duration}</span>
              <span className="text-xs text-cyan-300/70 bg-black/40 px-2 py-1">1080p</span>
            </div>

            {/* Slide counter */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              {videos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentVideo(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentVideo ? 'bg-cyan-400 w-4' : 'bg-cyan-400/30 hover:bg-cyan-400/50'
                  }`}
                />
              ))}
            </div>

            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-8 h-8">
              <div className="absolute top-0 left-0 w-4 h-px bg-cyan-500/50" />
              <div className="absolute top-0 left-0 w-px h-4 bg-cyan-500/50" />
            </div>
            <div className="absolute top-4 right-4 w-8 h-8">
              <div className="absolute top-0 right-0 w-4 h-px bg-cyan-500/50" />
              <div className="absolute top-0 right-0 w-px h-4 bg-cyan-500/50" />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
          </motion.div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 border border-cyan-500/30 flex items-center justify-center hover:bg-black/70 hover:border-cyan-400/50 transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-cyan-400" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 border border-cyan-500/30 flex items-center justify-center hover:bg-black/70 hover:border-cyan-400/50 transition-all"
          >
            <ChevronRight className="w-6 h-6 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Bottom Prompt Bar */}
      <PromptInputBar 
        displayedText={displayedText} 
        accentColor={config.accentColor}
        bgColor="bg-cyan-900/20"
      />
    </motion.div>
  );
}
