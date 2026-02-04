import { motion } from 'framer-motion';
import { ToolConfig } from './types';
import { PromptInputBar } from './PromptInputBar';

interface StudioGridViewProps {
  config: ToolConfig;
  displayedText: string;
  toolId: string;
}

// Cinematic gradient thumbnails for each tool type
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
  ],
};

export function StudioGridView({ config, displayedText, toolId }: StudioGridViewProps) {
  const thumbnails = toolThumbnails[toolId as keyof typeof toolThumbnails] || toolThumbnails.sfx;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Cinematic Image Grid */}
      <div className="flex-1 p-4 sm:p-6 pt-16 sm:pt-20 bg-gradient-to-br from-background via-card/40 to-background">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3 h-full">
          {thumbnails.map((thumb, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`relative overflow-hidden border border-foreground/10 bg-gradient-to-br ${thumb.gradient} group cursor-pointer hover:border-foreground/30 transition-all duration-300`}
            >
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              
              {/* Decorative elements */}
              {i === 0 && (
                <div className="absolute top-3 left-3 w-6 h-6">
                  <div className="absolute top-0 left-0 w-3 h-px bg-foreground/30" />
                  <div className="absolute top-0 left-0 w-px h-3 bg-foreground/30" />
                </div>
              )}
              {i === 3 && (
                <div className="absolute top-3 right-3 w-6 h-6">
                  <div className="absolute top-0 right-0 w-3 h-px bg-foreground/30" />
                  <div className="absolute top-0 right-0 w-px h-3 bg-foreground/30" />
                </div>
              )}
              
              {/* Label */}
              <span className="absolute bottom-2 left-2 text-[10px] sm:text-xs text-foreground/50 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                {thumb.label}
              </span>
              
              {/* Play indicator for video */}
              {toolId === 'video' && (
                <div className="absolute bottom-2 right-2 text-[8px] text-foreground/40 bg-black/40 px-1.5 py-0.5">
                  0:{15 + i * 5}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Prompt Bar */}
      <PromptInputBar 
        displayedText={displayedText} 
        accentColor={config.accentColor}
        bgColor="bg-card/60"
      />
    </motion.div>
  );
}
