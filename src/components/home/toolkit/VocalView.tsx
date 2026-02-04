import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Upload, Music } from 'lucide-react';
import { ToolConfig } from './types';

interface VocalViewProps {
  config: ToolConfig;
}

// Mini waveform component
function WaveformDisplay({ color, label }: { color: string; label?: string }) {
  const bars = useMemo(() => 
    Array.from({ length: 50 }, () => ({
      height: Math.random() * 0.7 + 0.15,
      duration: 0.6 + Math.random() * 0.5,
    })), []
  );

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-xs text-foreground/60 uppercase tracking-wider">{label}</span>
      )}
      <div className="flex items-center gap-[1px] h-12 sm:h-16">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`flex-1 ${color} rounded-sm animate-pulse`}
            style={{
              height: `${bar.height * 100}%`,
              animationDelay: `${i * 0.03}s`,
              animationDuration: `${bar.duration}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function VocalView({ config }: VocalViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Split Panel Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-4 sm:p-6 bg-gradient-to-br from-purple-900/30 via-slate-900/60 to-black">
        {/* Original Audio Panel */}
        <div className="border border-purple-500/20 bg-black/40 p-4 sm:p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Music className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-400 uppercase tracking-widest font-medium">Original Audio</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            <WaveformDisplay color="bg-purple-500/50" />
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Music className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <span className="text-sm text-foreground">summer_vibes.mp3</span>
                <span className="text-xs text-muted-foreground block">3:42 • 8.2 MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Separated Stems Panel */}
        <div className="border border-violet-500/20 bg-black/40 p-4 sm:p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-violet-400 uppercase tracking-widest font-medium">Separated Stems</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <WaveformDisplay color="bg-violet-400/60" label="Vocals" />
            <WaveformDisplay color="bg-emerald-500/50" label="Instrumental" />
          </div>
        </div>
      </div>

      {/* Bottom Upload Dropzone */}
      <div className="p-4 sm:p-6 bg-purple-950/40 border-t border-purple-500/20">
        <div className="border-2 border-dashed border-purple-500/30 bg-purple-900/10 py-6 px-4 flex items-center justify-center gap-4 hover:border-purple-500/50 hover:bg-purple-900/20 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Upload className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="text-sm text-foreground font-medium">Upload Audio File</span>
            <span className="text-xs text-muted-foreground block">Drag & drop or click to add MP3, WAV, FLAC</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
