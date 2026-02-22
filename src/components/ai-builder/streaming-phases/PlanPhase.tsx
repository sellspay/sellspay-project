import { motion } from 'framer-motion';
import { ListChecks, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhaseIcon } from './PhaseIcon';
import type { StreamPhase } from '../StreamingPhaseCard';

interface PlanPhaseProps {
  phase: StreamPhase;
  planItems: string[];
  completedPlanItems: number;
}

export function PlanPhase({ phase, planItems, completedPlanItems }: PlanPhaseProps) {
  const isActive = phase === 'planning';

  return (
    <motion.div
      key="plan"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0.5 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 mt-1">
        <PhaseIcon
          active={isActive}
          activeClass="bg-blue-500/20 border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
          activeIcon={<ListChecks size={13} className="text-blue-400 animate-pulse" />}
          doneIcon={<CheckCircle2 size={13} className="text-green-500" />}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-2">Plan</p>
        <div className="space-y-1.5">
          {planItems.map((item, idx) => {
            const isCompleted = idx < completedPlanItems;
            const isCurrent = idx === completedPlanItems && phase === 'building';

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="flex items-start gap-2 text-xs"
              >
                {isCompleted ? (
                  <CheckCircle2 size={13} className="text-green-500 mt-0.5 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 size={13} className="text-violet-400 animate-spin mt-0.5 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-border/60 mt-0.5 shrink-0" />
                )}
                <span className={cn(
                  "leading-relaxed",
                  isCompleted ? "text-muted-foreground line-through" :
                  isCurrent ? "text-violet-300" :
                  "text-foreground/70"
                )}>
                  {item}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
