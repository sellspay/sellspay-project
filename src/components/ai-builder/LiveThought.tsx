import React, { useState, useEffect, useRef, forwardRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface LiveThoughtProps {
  logs: string[];
  isThinking: boolean;
  className?: string;
  /** 
   * Mode determines display behavior:
   * - 'thinking': Just show "Thinking..." (for questions/chat)
   * - 'building': Show detailed logs (for code changes)
   */
  mode?: 'thinking' | 'building';
}

export const LiveThought = forwardRef<HTMLDivElement, LiveThoughtProps>(
  function LiveThought({ logs, isThinking, className, mode = 'building' }: LiveThoughtProps, ref) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [dots, setDots] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Live timer
    useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isThinking) {
        setSeconds(0);
        interval = setInterval(() => setSeconds((s) => s + 1), 1000);
      }
      return () => clearInterval(interval);
    }, [isThinking]);

    // Animated dots
    useEffect(() => {
      if (!isThinking) return;
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }, [isThinking]);

    // Auto-scroll logs
    useEffect(() => {
      if (isExpanded && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [logs, isExpanded]);

    if (!isThinking && logs.length === 0) return null;

    const hasRealLogs = logs.length > 0;
    const isThinkingPhase = isThinking && !hasRealLogs;
    const isBuildingPhase = isThinking && hasRealLogs;

    // THINKING PHASE: Clean minimal text
    if (isThinkingPhase || mode === 'thinking') {
      if (!isThinking) return null;
      
      return (
        <div
          ref={ref}
          className={cn(
            "w-full max-w-[90%] mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
            className
          )}
        >
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <span className="opacity-70">Thinking{dots}</span>
          </div>
        </div>
      );
    }

    // BUILDING PHASE: Clean log view
    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[90%] mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
          className
        )}
      >
        {/* HEADER */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs mb-2 select-none group"
        >
          {isExpanded ? (
            <ChevronDown size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
          ) : (
            <ChevronRight size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
          )}
          
          {isBuildingPhase ? (
            <span className="opacity-70">Working · {seconds}s</span>
          ) : (
            <span className="opacity-50">Completed · {seconds}s</span>
          )}
        </button>

        {/* EXPANDABLE LOG CONTAINER */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border border-border/50 rounded-lg overflow-hidden bg-card/30">
                <div 
                  ref={scrollRef}
                  className="p-3 max-h-[180px] overflow-y-auto text-[11px] space-y-1 text-muted-foreground custom-scrollbar"
                >
                  {logs.map((log, i) => {
                    const cleanLog = log.replace(/^\[LOG:\s*/, '').replace(/\]$/, '').replace(/^>\s*/, '').trim();
                    const isError = log.toLowerCase().includes('error');
                    
                    return (
                      <div key={i} className="flex gap-2 animate-in fade-in duration-200">
                        <span className="opacity-30 select-none shrink-0">›</span>
                        <span className={cn(
                          "break-words leading-relaxed",
                          isError ? "text-destructive" : "text-foreground/60"
                        )}>
                          {cleanLog}
                        </span>
                      </div>
                    );
                  })}
                  
                  {isBuildingPhase && (
                    <div className="flex gap-2 opacity-30">
                      <span>›</span>
                      <span className="animate-pulse">_</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PREVIEW LINE (When Collapsed) */}
        {!isExpanded && logs.length > 0 && (
          <div className="ml-4 text-[11px] text-muted-foreground/50 truncate">
            {logs[logs.length - 1].replace(/^\[LOG:\s*/, '').replace(/\]$/, '').replace(/^>\s*/, '').trim()}
            {isBuildingPhase && '...'}
          </div>
        )}
      </div>
    );
  }
);

LiveThought.displayName = "LiveThought";
