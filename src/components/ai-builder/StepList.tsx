import { useState } from "react";
import { 
  CheckCircle2, Circle, Loader2, ChevronDown, ChevronRight, 
  FileCode, Package, Lightbulb, Wrench, Sparkles, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { BuildStep } from "./types/chat";

// Icon mapping for step types
const STEP_ICONS = {
  plan: Lightbulb,
  create_file: FileCode,
  update_code: Wrench,
  install_package: Package,
  analyze: Eye,
  finish: Sparkles,
} as const;

interface StepListProps {
  steps: BuildStep[];
  isStreaming?: boolean;
}

export function StepList({ steps, isStreaming = false }: StepListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 overflow-hidden">
      {steps.map((step, idx) => {
        const isRunning = step.status === 'running' || (isStreaming && idx === steps.length - 1 && step.status !== 'completed');
        const isDone = step.status === 'completed';
        const isExpanded = expandedId === step.id;
        const StepIcon = STEP_ICONS[step.type] || Wrench;

        return (
          <div key={step.id} className="border-b border-zinc-800/50 last:border-0">
            {/* STEP HEADER */}
            <button 
              onClick={() => step.details && setExpandedId(isExpanded ? null : step.id)}
              className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                step.details ? 'hover:bg-zinc-900/50 cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* STATUS INDICATOR */}
              <div className="shrink-0 relative">
                {isRunning ? (
                  <Loader2 size={16} className="text-violet-400 animate-spin" />
                ) : isDone ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : (
                  <Circle size={16} className="text-zinc-600" />
                )}
              </div>

              {/* STEP TYPE ICON */}
              <StepIcon size={14} className={isDone ? "text-zinc-400" : "text-zinc-600"} />

              {/* LABEL */}
              <span className={`text-xs font-mono flex-1 ${isDone ? "text-zinc-300" : "text-zinc-500"}`}>
                {step.label}
                {step.fileName && (
                  <span className="text-zinc-500 ml-1.5">({step.fileName})</span>
                )}
              </span>

              {/* EXPAND ARROW */}
              {step.details && (
                <div className="text-zinc-600">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              )}
            </button>

            {/* STEP DETAILS (The Code Diff/Explanation) */}
            <AnimatePresence>
              {isExpanded && step.details && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-black border-t border-zinc-800/50">
                    <pre className="p-3 text-[10px] text-zinc-400 font-mono overflow-x-auto custom-scrollbar max-h-48">
                      {step.details}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// Skeleton version for loading state
export function StepListSkeleton() {
  return (
    <div className="mt-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-b border-zinc-800/50 last:border-0 p-3 flex items-center gap-3">
          <Loader2 size={16} className="text-violet-400 animate-spin" />
          <div className="h-3 bg-zinc-800 rounded w-32 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
