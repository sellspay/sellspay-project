import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { ToolConfig } from './types';
import { PromptInputBar } from './PromptInputBar';

interface VideoViewProps {
  config: ToolConfig;
  displayedText: string;
}

const thumbnails = [
  'from-cyan-800/50 to-teal-900/60',
  'from-sky-700/40 to-cyan-900/50',
  'from-teal-600/45 to-cyan-800/55',
  'from-cyan-700/35 to-sky-900/50',
];

export function VideoView({ config, displayedText }: VideoViewProps) {
  const [selectedThumb, setSelectedThumb] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="relative h-full min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] flex flex-col"
    >
      {/* Main Video Display */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 bg-gradient-to-br from-cyan-900/20 via-slate-900/60 to-black">
        {/* Large Video Preview */}
        <div className={`flex-1 bg-gradient-to-br ${thumbnails[selectedThumb]} relative overflow-hidden border border-cyan-500/20 min-h-[300px]`}>
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-cyan-400/50 bg-black/30 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/40 hover:border-cyan-400/70 transition-all group">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400 ml-1 group-hover:scale-110 transition-transform" />
            </div>
          </div>

          {/* Video info overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <span className="text-xs text-cyan-300/70 bg-black/40 px-2 py-1">00:00 / 00:15</span>
            <span className="text-xs text-cyan-300/70 bg-black/40 px-2 py-1">1080p</span>
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
        </div>

        {/* Thumbnail Slider */}
        <div className="flex gap-2 sm:gap-3 mt-4">
          {thumbnails.map((gradient, i) => (
            <button
              key={i}
              onClick={() => setSelectedThumb(i)}
              className={`flex-1 aspect-video bg-gradient-to-br ${gradient} relative overflow-hidden border transition-all ${
                selectedThumb === i 
                  ? 'border-cyan-400/70 ring-1 ring-cyan-400/30' 
                  : 'border-cyan-500/20 hover:border-cyan-500/40'
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className={`w-4 h-4 ${selectedThumb === i ? 'text-cyan-300' : 'text-cyan-400/50'}`} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute bottom-1 right-1 text-[8px] text-cyan-300/60">0:{i + 1}5</span>
            </button>
          ))}
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
