import React, { useState, useEffect, useRef, forwardRef } from "react";
import { ChevronDown, ChevronRight, Loader2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const scrollRef = useRef<HTMLDivElement>(null);

    // Live timer
    useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isThinking) {
        setSeconds(0); // Reset on new thinking session
        interval = setInterval(() => setSeconds((s) => s + 1), 1000);
      }
      return () => clearInterval(interval);
    }, [isThinking]);

    // Auto-scroll logs
    useEffect(() => {
      if (isExpanded && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [logs, isExpanded]);

    if (!isThinking && logs.length === 0) return null;

    // THINKING MODE: Simple "Thinking..." indicator with no logs
    if (mode === 'thinking') {
      if (!isThinking) return null;
      
      return (
        <div
          ref={ref}
          className={cn(
            "w-full max-w-[90%] mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
            className
          )}
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            <span>Thinking...</span>
          </div>
        </div>
      );
    }

    // BUILDING MODE: Show detailed logs (existing behavior)
    // Only switch to building mode once we have actual logs
    const hasBuildingLogs = logs.length > 0;
    
    if (!hasBuildingLogs && isThinking) {
      // Still in initial thinking phase, show simple indicator
      return (
        <div
          ref={ref}
          className={cn(
            "w-full max-w-[90%] mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
            className
          )}
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            <span>Thinking...</span>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[90%] mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
          className
        )}
      >
        
        {/* HEADER (Always Visible) */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium mb-2 select-none group"
        >
          {isExpanded ? (
            <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
          
          <span className="flex items-center gap-2">
            {isThinking ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                </span>
                <span>Building for {seconds}s</span>
              </>
            ) : (
              <span className="text-muted-foreground">Built in {seconds}s</span>
            )}
          </span>
        </button>

        {/* EXPANDABLE LOG CONTAINER */}
        {isExpanded && (
          <div className="bg-card/50 border border-border rounded-lg overflow-hidden backdrop-blur-sm">
            
            {/* HEADER BAR */}
            <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-card/80">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Terminal size={12} />
                <span className="text-[10px] font-mono uppercase tracking-wider">Execution Log</span>
              </div>
              {isThinking && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
            </div>

            {/* LOG STREAM */}
            <div 
              ref={scrollRef}
              className="p-3 max-h-[200px] overflow-y-auto font-mono text-[11px] space-y-1.5 text-muted-foreground custom-scrollbar"
            >
              {logs.map((log, i) => {
                // Clean the log message
                const cleanLog = log.replace(/^\[LOG:\s*/, '').replace(/\]$/, '').replace(/^>\s*/, '').trim();
                const isError = log.toLowerCase().includes('error');
                
                return (
                  <div key={i} className="flex gap-2 animate-in fade-in duration-300">
                    <span className="text-muted-foreground/50 select-none shrink-0">›</span>
                    <span
                      className={cn(
                        "break-words",
                        isError ? "text-destructive" : "text-foreground/80"
                      )}
                    >
                      {cleanLog}
                    </span>
                  </div>
                );
              })}
              
              {isThinking && (
                <div className="flex gap-2 opacity-50">
                  <span className="text-muted-foreground/50">›</span>
                  <span className="animate-pulse">_</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PREVIEW LINE (When Collapsed) */}
        {!isExpanded && logs.length > 0 && (
          <div className="ml-6 text-xs text-muted-foreground/70 truncate font-mono">
            {logs[logs.length - 1].replace(/^\[LOG:\s*/, '').replace(/\]$/, '').replace(/^>\s*/, '').trim()}
            {isThinking && '...'}
          </div>
        )}
      </div>
    );
  }
);

LiveThought.displayName = "LiveThought";
