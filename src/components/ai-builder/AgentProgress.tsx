import React, { useEffect, useRef } from "react";
import { 
  Loader2, CheckCircle2, FileCode, Terminal, 
  BrainCircuit, Search, AlertCircle, Package
} from "lucide-react";
import { motion } from "framer-motion";

export type AgentStep = 
  | 'idle' 
  | 'architect'    // NEW: Creating blueprint
  | 'planning'     // Analyzing plan
  | 'building'     // NEW: Generating code  
  | 'linting'      // NEW: Validating code
  | 'healing'      // NEW: Auto-fixing errors
  | 'reading' 
  | 'writing' 
  | 'installing' 
  | 'verifying' 
  | 'done' 
  | 'error';

interface AgentProgressProps {
  currentStep: AgentStep;
  logs: string[];
}

export function AgentProgress({ currentStep, logs }: AgentProgressProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const progress = getStepProgress(currentStep);
  const isDone = currentStep === 'done';
  const isError = currentStep === 'error';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md overflow-hidden shadow-2xl"
    >
      {/* HEADER: STATUS BAR */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-zinc-800 ${
        isDone ? 'bg-green-500/10' : isError ? 'bg-red-500/10' : 'bg-violet-500/5'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${
            isDone ? 'bg-green-500/20 text-green-400' : 
            isError ? 'bg-red-500/20 text-red-400' : 
            'bg-violet-500/20 text-violet-400'
          }`}>
            <StepIcon step={currentStep} />
          </div>
          <span className={`text-sm font-medium ${
            isDone ? 'text-green-400' : isError ? 'text-red-400' : 'text-zinc-200'
          }`}>
            {getStepLabel(currentStep)}
          </span>
        </div>

        {/* Animated dots (only while running) */}
        {!isDone && !isError && (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1, 0.8]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.2,
                  delay: i * 0.2 
                }}
                className="w-1.5 h-1.5 rounded-full bg-violet-400"
              />
            ))}
          </div>
        )}
      </div>

      {/* BODY: LOG STREAM */}
      <div 
        ref={scrollRef}
        className="h-48 overflow-y-auto font-mono text-xs p-4 space-y-1.5 bg-black/30"
      >
        {logs.map((log, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-start gap-2"
          >
            <span className="text-zinc-600 shrink-0">
              [{new Date().toLocaleTimeString([], { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              })}]
            </span>
            <span className="text-zinc-300">
              {log.startsWith(">") ? (
                <span className="text-violet-300 font-medium">{log}</span>
              ) : (
                log
              )}
            </span>
          </motion.div>
        ))}
        
        {/* Blinking cursor (while running) */}
        {!isDone && !isError && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="inline-block text-violet-400 ml-[88px]"
          >
            _
          </motion.span>
        )}
      </div>

      {/* FOOTER: PROGRESS BAR */}
      <div className="h-1 bg-zinc-900 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full ${
            isDone 
              ? 'bg-green-500' 
              : isError 
                ? 'bg-red-500' 
                : 'bg-gradient-to-r from-violet-500 to-blue-500'
          }`}
        />
      </div>
    </motion.div>
  );
}

// --- HELPERS ---

function StepIcon({ step }: { step: AgentStep }) {
  const size = 16;
  
  switch (step) {
    case 'architect':
      return <BrainCircuit size={size} className="animate-pulse" />;
    case 'planning': 
      return <BrainCircuit size={size} className="animate-pulse" />;
    case 'building':
      return <FileCode size={size} className="animate-pulse" />;
    case 'linting':
      return <Search size={size} />;
    case 'healing':
      return <Terminal size={size} className="animate-pulse" />;
    case 'reading': 
      return <Search size={size} />;
    case 'writing': 
      return <FileCode size={size} />;
    case 'installing': 
      return <Package size={size} />;
    case 'verifying': 
      return <Terminal size={size} />;
    case 'done': 
      return <CheckCircle2 size={size} />;
    case 'error': 
      return <AlertCircle size={size} />;
    default: 
      return <Loader2 size={size} className="animate-spin" />;
  }
}

function getStepLabel(step: AgentStep): string {
  switch (step) {
    case 'architect': return "Creating Blueprint...";
    case 'planning': return "Analyzing Architecture...";
    case 'building': return "Generating Code...";
    case 'linting': return "Validating Code...";
    case 'healing': return "Self-Correcting...";
    case 'reading': return "Analyzing Context...";
    case 'writing': return "Writing Code...";
    case 'installing': return "Updating Dependencies...";
    case 'verifying': return "Running Verification...";
    case 'done': return "Complete";
    case 'error': return "Process Failed";
    default: return "Initializing...";
  }
}

function getStepProgress(step: AgentStep): number {
  switch (step) {
    case 'idle': return 0;
    case 'architect': return 10;
    case 'planning': return 20;
    case 'building': return 40;
    case 'linting': return 70;
    case 'healing': return 80;
    case 'reading': return 30;
    case 'writing': return 50;
    case 'installing': return 85;
    case 'verifying': return 95;
    case 'done': return 100;
    case 'error': return 100;
    default: return 0;
  }
}
