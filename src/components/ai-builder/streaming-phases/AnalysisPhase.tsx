import { motion } from 'framer-motion';
import { Brain, CheckCircle2 } from 'lucide-react';
import { PhaseIcon } from './PhaseIcon';
import type { StreamPhase } from '../StreamingPhaseCard';

interface AnalysisPhaseProps {
  phase: StreamPhase;
  analysisText?: string;
}

export function AnalysisPhase({ phase, analysisText }: AnalysisPhaseProps) {
  const isActive = phase === 'analyzing';

  return (
    <motion.div
      key="analysis"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0.5 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 mt-1">
        <PhaseIcon
          active={isActive}
          activeClass="bg-violet-500/20 border-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
          activeIcon={<Brain size={13} className="text-violet-400 animate-pulse" />}
          doneIcon={<CheckCircle2 size={13} className="text-green-500" />}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Analysis</p>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {analysisText || 'Analyzing your request...'}
          {isActive && (
            <span className="inline-block w-1.5 h-4 bg-violet-400 ml-0.5 animate-pulse rounded-sm" />
          )}
        </p>
      </div>
    </motion.div>
  );
}
