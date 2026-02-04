import { motion } from 'framer-motion';
import { Wand2 } from 'lucide-react';
import { ToolConfig } from './types';

interface MangaViewProps {
  config: ToolConfig;
}

const beforeAfterPairs = [
  { before: 'from-pink-800/30 to-slate-900', after: 'from-rose-500/40 to-pink-900/60' },
  { before: 'from-pink-700/25 to-slate-900', after: 'from-fuchsia-500/45 to-rose-800/50' },
  { before: 'from-pink-900/35 to-slate-900', after: 'from-pink-400/50 to-fuchsia-900/60' },
  { before: 'from-pink-800/20 to-slate-900', after: 'from-rose-400/55 to-pink-800/55' },
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
      {/* Before/After Grid */}
      <div className="flex-1 p-4 sm:p-6 bg-gradient-to-br from-pink-900/20 via-slate-900/60 to-black">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3 h-full">
          {beforeAfterPairs.map((pair, i) => (
            <>
              {/* Before Card */}
              <div 
                key={`before-${i}`}
                className={`bg-gradient-to-br ${pair.before} relative overflow-hidden border border-pink-500/10`}
              >
                <span className="absolute top-2 left-2 text-[10px] sm:text-xs text-pink-300/50 uppercase tracking-wider font-medium">
                  Before
                </span>
                {/* Mock photo lines */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <div className="w-16 h-20 border border-pink-400/30 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border border-pink-400/30" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              
              {/* After Card */}
              <div 
                key={`after-${i}`}
                className={`bg-gradient-to-br ${pair.after} relative overflow-hidden border border-rose-500/20`}
              >
                <span className="absolute top-2 left-2 text-[10px] sm:text-xs text-rose-200/60 uppercase tracking-wider font-medium">
                  After
                </span>
                {/* Mock manga style lines */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <div className="w-16 h-20 flex flex-col gap-1 items-center justify-center">
                    <div className="w-full h-1 bg-rose-300/40" />
                    <div className="w-3/4 h-1 bg-rose-300/40" />
                    <div className="w-full h-1 bg-rose-300/40" />
                    <div className="w-1/2 h-1 bg-rose-300/40" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                
                {/* Manga sparkle effect on some cards */}
                {i === 1 && (
                  <div className="absolute top-4 right-4 text-rose-300/60">
                    <Wand2 className="w-4 h-4" />
                  </div>
                )}
              </div>
            </>
          ))}
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
