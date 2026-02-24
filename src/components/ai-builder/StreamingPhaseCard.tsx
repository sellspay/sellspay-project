import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Code2, Brain, ListChecks, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StreamPhase = 'analyzing' | 'planning' | 'building' | 'retrying' | 'complete' | 'idle';

export interface StreamingPhaseData {
  phase: StreamPhase;
  analysisText?: string;
  planItems?: string[];
  completedPlanItems?: number;
  summaryText?: string;
  elapsedSeconds?: number;
  confidenceScore?: number;
  confidenceReason?: string;
  codeProgressBytes?: number;
  codeProgressElapsed?: number;
}

interface StreamingPhaseCardProps {
  data: StreamingPhaseData;
  className?: string;
}

export const StreamingPhaseCard = forwardRef<HTMLDivElement, StreamingPhaseCardProps>(
  ({ data, className }, ref) => {
  const { phase, analysisText, planItems, completedPlanItems = 0, summaryText, elapsedSeconds = 0, confidenceScore, confidenceReason, codeProgressBytes = 0, codeProgressElapsed = 0 } = data;

  // Use code progress elapsed when in building phase, otherwise use provided elapsed
  const displayElapsed = phase === 'building' && codeProgressElapsed > 0 ? codeProgressElapsed : elapsedSeconds;

  // Format bytes for display
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div ref={ref} className={cn("space-y-3 mb-6", className)}>
      <AnimatePresence mode="popLayout">
        {/* ANALYZING PHASE: Streaming text bubble */}
        {(phase === 'analyzing' || analysisText) && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0.5 }}
            className="flex gap-3"
          >
            <div className="flex-shrink-0 mt-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center border",
                phase === 'analyzing' 
                  ? "bg-violet-500/20 border-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.4)]" 
                  : "bg-muted/50 border-border/50"
              )}>
                {phase === 'analyzing' ? (
                  <Brain size={13} className="text-violet-400 animate-pulse" />
                ) : (
                  <CheckCircle2 size={13} className="text-green-500" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Analysis</p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {analysisText || 'Analyzing your request...'}
                {phase === 'analyzing' && (
                  <span className="inline-block w-1.5 h-4 bg-violet-400 ml-0.5 animate-pulse rounded-sm" />
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* PLANNING PHASE: Checklist */}
        {(phase === 'planning' || (planItems && planItems.length > 0)) && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0.5 }}
            className="flex gap-3"
          >
            <div className="flex-shrink-0 mt-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center border",
                phase === 'planning' 
                  ? "bg-blue-500/20 border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.4)]" 
                  : "bg-muted/50 border-border/50"
              )}>
                {phase === 'planning' ? (
                  <ListChecks size={13} className="text-blue-400 animate-pulse" />
                ) : (
                  <CheckCircle2 size={13} className="text-green-500" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-2">Plan</p>
              <div className="space-y-1.5">
                {planItems?.map((item, idx) => {
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
        )}

        {/* BUILDING PHASE: Phase pill + spinner */}
        {(phase === 'building' || phase === 'retrying') && (
          <motion.div
            key="building"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="flex-shrink-0 mt-1">
              <div className={cn(
                "w-7 h-7 rounded-full border flex items-center justify-center",
                phase === 'retrying'
                  ? "bg-amber-500/20 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "bg-orange-500/20 border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.4)]"
              )}>
                {phase === 'retrying' ? (
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
                  phase === 'retrying'
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-orange-500/15 text-orange-400 border-orange-500/30"
                )}>
                  {phase === 'retrying' ? 'Retrying' : 'Building'}
                </span>
                <Loader2 size={12} className={phase === 'retrying' ? "text-amber-400 animate-spin" : "text-orange-400 animate-spin"} />
                <span className="text-[10px] text-muted-foreground/60">{displayElapsed}s</span>
              </div>
              {phase === 'retrying' ? (
                <p className="text-xs text-amber-400/70 mt-1">Code was incomplete, retrying generation...</p>
              ) : codeProgressBytes > 0 ? (
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Generating code... {formatBytes(codeProgressBytes)} written
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Writing code for your project...
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* COMPLETE PHASE: Success badge + Confidence */}
        {phase === 'complete' && (summaryText || confidenceScore !== undefined) && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex gap-3"
          >
            <div className="flex-shrink-0 mt-1">
              <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                <Sparkles size={13} className="text-green-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/15 text-green-400 rounded border border-green-500/30 font-medium uppercase tracking-wider">
                  Build Successful
                </span>
                {elapsedSeconds > 0 && (
                  <span className="text-[10px] text-muted-foreground/50">{elapsedSeconds}s</span>
                )}
                {confidenceScore !== undefined && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                    confidenceScore >= 80
                      ? "bg-green-500/15 text-green-400 border-green-500/30"
                      : confidenceScore >= 60
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      : "bg-red-500/15 text-red-400 border-red-500/30"
                  )}>
                    {confidenceScore}% confident
                  </span>
                )}
              </div>
              {summaryText && (
                <p className="text-xs text-foreground/70 leading-relaxed">{summaryText}</p>
              )}
              {confidenceScore !== undefined && confidenceScore < 60 && confidenceReason && (
                <p className="text-[10px] text-amber-400/70 mt-1 italic">
                  ⚠️ {confidenceReason} — Consider reviewing changes.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  }
);

StreamingPhaseCard.displayName = "StreamingPhaseCard";
