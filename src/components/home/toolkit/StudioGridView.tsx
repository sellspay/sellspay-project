import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ToolConfig } from './types';
import { useNavigate } from 'react-router-dom';

interface StudioGridViewProps {
  config: ToolConfig;
  displayedText: string;
  toolId: string;
}

// Extended thumbnails for carousel (12 items to allow scrolling)
const toolThumbnails = {
  sfx: [
    { gradient: 'from-amber-800/70 via-orange-900/50 to-stone-900', label: 'Explosion' },
    { gradient: 'from-yellow-700/60 via-amber-800/40 to-black', label: 'Thunder' },
    { gradient: 'from-orange-600/50 via-red-900/40 to-stone-900', label: 'Fire' },
    { gradient: 'from-amber-500/40 via-yellow-800/50 to-black', label: 'Impact' },
    { gradient: 'from-stone-600/60 via-amber-900/30 to-black', label: 'Whoosh' },
    { gradient: 'from-orange-700/50 via-stone-800/60 to-black', label: 'Cinematic' },
    { gradient: 'from-yellow-600/40 via-amber-700/50 to-stone-900', label: 'Ambient' },
    { gradient: 'from-red-800/50 via-orange-900/40 to-black', label: 'Tension' },
    { gradient: 'from-amber-600/60 via-orange-800/50 to-stone-900', label: 'Sci-Fi' },
    { gradient: 'from-yellow-800/50 via-amber-900/40 to-black', label: 'Nature' },
    { gradient: 'from-orange-500/50 via-red-800/50 to-stone-900', label: 'Horror' },
    { gradient: 'from-stone-700/60 via-amber-800/40 to-black', label: 'Action' },
  ],
  vocal: [
    { gradient: 'from-purple-800/70 via-violet-900/50 to-slate-900', label: 'Vocals' },
    { gradient: 'from-fuchsia-700/60 via-purple-800/40 to-black', label: 'Harmony' },
    { gradient: 'from-violet-600/50 via-indigo-900/40 to-slate-900', label: 'Acapella' },
    { gradient: 'from-purple-500/40 via-fuchsia-800/50 to-black', label: 'Choir' },
    { gradient: 'from-indigo-600/60 via-purple-900/30 to-black', label: 'Instrumental' },
    { gradient: 'from-fuchsia-700/50 via-violet-800/60 to-black', label: 'Bass' },
    { gradient: 'from-purple-600/40 via-indigo-700/50 to-slate-900', label: 'Drums' },
    { gradient: 'from-violet-800/50 via-purple-900/40 to-black', label: 'Stems' },
    { gradient: 'from-purple-700/60 via-fuchsia-900/50 to-slate-900', label: 'Melody' },
    { gradient: 'from-indigo-700/50 via-violet-800/40 to-black', label: 'Keys' },
    { gradient: 'from-fuchsia-600/50 via-purple-700/50 to-slate-900', label: 'Strings' },
    { gradient: 'from-violet-700/60 via-indigo-800/40 to-black', label: 'Synth' },
  ],
  manga: [
    { gradient: 'from-pink-800/70 via-rose-900/50 to-slate-900', label: 'Portrait' },
    { gradient: 'from-rose-700/60 via-pink-800/40 to-black', label: 'Action' },
    { gradient: 'from-fuchsia-600/50 via-pink-900/40 to-slate-900', label: 'Fantasy' },
    { gradient: 'from-pink-500/40 via-rose-800/50 to-black', label: 'Chibi' },
    { gradient: 'from-rose-600/60 via-pink-900/30 to-black', label: 'Scenic' },
    { gradient: 'from-pink-700/50 via-fuchsia-800/60 to-black', label: 'Dynamic' },
    { gradient: 'from-rose-600/40 via-pink-700/50 to-slate-900', label: 'Style' },
    { gradient: 'from-fuchsia-800/50 via-rose-900/40 to-black', label: 'Panel' },
    { gradient: 'from-pink-600/60 via-rose-800/50 to-slate-900', label: 'Hero' },
    { gradient: 'from-rose-700/50 via-fuchsia-900/40 to-black', label: 'Villain' },
    { gradient: 'from-pink-800/50 via-pink-700/50 to-slate-900', label: 'Mecha' },
    { gradient: 'from-fuchsia-700/60 via-rose-800/40 to-black', label: 'Romance' },
  ],
  video: [
    { gradient: 'from-cyan-800/70 via-teal-900/50 to-slate-900', label: 'Aerial' },
    { gradient: 'from-sky-700/60 via-cyan-800/40 to-black', label: 'Cinematic' },
    { gradient: 'from-teal-600/50 via-cyan-900/40 to-slate-900', label: 'Nature' },
    { gradient: 'from-cyan-500/40 via-sky-800/50 to-black', label: 'Urban' },
    { gradient: 'from-sky-600/60 via-teal-900/30 to-black', label: 'Portrait' },
    { gradient: 'from-cyan-700/50 via-sky-800/60 to-black', label: 'Motion' },
    { gradient: 'from-teal-600/40 via-cyan-700/50 to-slate-900', label: 'Abstract' },
    { gradient: 'from-sky-800/50 via-cyan-900/40 to-black', label: 'Slow-mo' },
    { gradient: 'from-cyan-600/60 via-teal-800/50 to-slate-900', label: 'Timelapse' },
    { gradient: 'from-sky-700/50 via-cyan-700/40 to-black', label: 'Action' },
    { gradient: 'from-teal-700/50 via-sky-900/50 to-slate-900', label: 'Peaceful' },
    { gradient: 'from-cyan-800/60 via-teal-700/40 to-black', label: 'Dynamic' },
  ],
};

export function StudioGridView({ config, displayedText, toolId }: StudioGridViewProps) {
  const navigate = useNavigate();
  const thumbnails = toolThumbnails[toolId as keyof typeof toolThumbnails] || toolThumbnails.sfx;
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 6;
  
  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + visibleCount < thumbnails.length;
  
  const scrollLeft = () => {
    setStartIndex(Math.max(0, startIndex - visibleCount));
  };
  
  const scrollRight = () => {
    setStartIndex(Math.min(thumbnails.length - visibleCount, startIndex + visibleCount));
  };
  
  const visibleThumbnails = thumbnails.slice(startIndex, startIndex + visibleCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full py-6"
    >
      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-background/80 backdrop-blur-sm border border-foreground/20 transition-all duration-200 ${
            canScrollLeft 
              ? 'hover:bg-foreground/10 cursor-pointer opacity-100' 
              : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
        </button>

        {/* Cards Row */}
        <div className="flex gap-2 sm:gap-3 px-14 sm:px-20">
          {visibleThumbnails.map((thumb, i) => (
            <motion.div
              key={`${startIndex}-${i}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`relative flex-1 aspect-video overflow-hidden bg-gradient-to-br ${thumb.gradient} group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-300`}
            >
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              
              {/* Label */}
              <span className="absolute bottom-2 left-2 text-[10px] sm:text-xs text-foreground/60 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                {thumb.label}
              </span>
              
              {/* Duration for video */}
              {toolId === 'video' && (
                <div className="absolute bottom-2 right-2 text-[8px] sm:text-[10px] text-foreground/50 bg-black/50 px-1.5 py-0.5">
                  0:{15 + (startIndex + i) * 5}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={scrollRight}
          disabled={!canScrollRight}
          className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-background/80 backdrop-blur-sm border border-foreground/20 transition-all duration-200 ${
            canScrollRight 
              ? 'hover:bg-foreground/10 cursor-pointer opacity-100' 
              : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
        </button>
      </div>

      {/* View More Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => navigate('/tools')}
          className="px-8 py-3 border border-foreground/20 text-foreground/80 hover:bg-foreground/5 hover:text-foreground transition-all duration-200 text-sm font-medium tracking-wide"
        >
          View More
        </button>
      </div>
    </motion.div>
  );
}
