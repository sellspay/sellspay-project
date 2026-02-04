import { motion } from 'framer-motion';
import { Wand2 } from 'lucide-react';
import { ToolConfig } from './types';

interface MangaViewProps {
  config: ToolConfig;
}

const gridGradients = [
  'from-pink-900/60 to-slate-900',
  'from-rose-600/50 to-black',
  'from-fuchsia-900/40 to-slate-900',
  'from-pink-700/40 to-black',
  'from-rose-800/30 to-slate-900',
  'from-pink-700/50 to-black',
];

export function MangaView({ config }: MangaViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="relative h-full min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] flex flex-col"
    >
      {/* Bento Grid - 2 tall left + 4 small right */}
      <div className="flex-1 p-4 sm:p-6 bg-gradient-to-br from-pink-900/20 via-slate-900/60 to-black">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3 h-full">
          {/* Left tall image 1 */}
          <div className={`row-span-2 bg-gradient-to-br ${gridGradients[0]} relative overflow-hidden border border-pink-500/10`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute top-6 left-6 w-10 h-10 border-l-2 border-t-2 border-pink-400/20" />
            <span className="absolute bottom-4 left-4 text-xs text-pink-300/50 uppercase tracking-wider">Before</span>
          </div>
          
          {/* Center tall image 2 */}
          <div className={`row-span-2 bg-gradient-to-br ${gridGradients[1]} relative overflow-hidden border border-rose-500/20`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {/* Manga style indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 border border-rose-400/30 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                <Wand2 className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400/70" />
              </div>
            </div>
            <span className="absolute bottom-4 left-4 text-xs text-rose-300/60 uppercase tracking-wider">After</span>
          </div>
          
          {/* Top right images */}
          <div className={`bg-gradient-to-br ${gridGradients[2]} relative overflow-hidden border border-pink-500/10`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <span className="absolute top-2 left-2 text-[10px] text-pink-300/40 uppercase">Before</span>
          </div>
          <div className={`bg-gradient-to-br ${gridGradients[3]} relative overflow-hidden border border-pink-500/10`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-pink-400/20" />
            <span className="absolute top-2 left-2 text-[10px] text-pink-300/40 uppercase">After</span>
          </div>
          
          {/* Bottom right images */}
          <div className={`bg-gradient-to-br ${gridGradients[4]} relative overflow-hidden border border-pink-500/10`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <span className="absolute top-2 left-2 text-[10px] text-pink-300/40 uppercase">Before</span>
          </div>
          <div className={`bg-gradient-to-br ${gridGradients[5]} relative overflow-hidden border border-pink-500/10`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute bottom-3 right-3 text-xs font-medium text-pink-200/70 bg-black/40 backdrop-blur-sm px-3 py-1.5 border border-pink-500/20">
              Manga Generator
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Generate Button */}
      <div className="p-4 sm:p-6 bg-pink-950/30 border-t border-pink-500/20 flex justify-center">
        <button className="px-12 sm:px-20 py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold text-base sm:text-lg transition-all flex items-center gap-3">
          <Wand2 className="w-5 h-5" />
          Generate Result
        </button>
      </div>
    </motion.div>
  );
}
