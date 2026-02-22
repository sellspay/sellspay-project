import { motion } from 'framer-motion';
import { Code2, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StreamPhase } from '../StreamingPhaseCard';

interface BuildingPhaseProps {
  phase: StreamPhase;
  elapsedSeconds: number;
}

export function BuildingPhase({ phase, elapsedSeconds }: BuildingPhaseProps) {
  const isRetrying = phase === 'retrying';

  return (
    <motion.div
      key="building"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 mt-1">
        <div className={cn(
          "w-7 h-7 rounded-full border flex items-center justify-center",
          isRetrying
            ? "bg-amber-500/20 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
            : "bg-orange-500/20 border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.4)]"
        )}>
          {isRetrying ? (
            <RefreshCw size={13} className="text-amber-400 animate-spin" />
          ) : (
            <Code2 size={13} className="text-orange-400 animate-pulse" />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wider",
            isRetrying
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
              : "bg-orange-500/15 text-orange-400 border-orange-500/30"
          )}>
            {isRetrying ? 'Retrying' : 'Building'}
          </span>
          <Loader2 size={12} className={cn("animate-spin", isRetrying ? "text-amber-400" : "text-orange-400")} />
          <span className="text-[10px] text-muted-foreground/60">{elapsedSeconds}s</span>
        </div>
        {isRetrying && (
          <p className="text-xs text-amber-400/70 mt-1">Code was incomplete, retrying generation...</p>
        )}
      </div>
    </motion.div>
  );
}
