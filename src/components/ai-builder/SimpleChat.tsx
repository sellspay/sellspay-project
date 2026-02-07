import { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface SimpleChatProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingLogs?: string[];
  children?: React.ReactNode; // For the input bar
}

/**
 * SimpleChat - Minimal chat UI for Vibecoder
 * 
 * Features:
 * - Auto-scroll to bottom on new messages
 * - Visible high-contrast scrollbar
 * - User messages (right aligned, salmon gradient)
 * - Assistant messages (left aligned, with logo)
 */
export function SimpleChat({ messages, isStreaming, streamingLogs = [], children }: SimpleChatProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom on new messages or streaming updates
  useEffect(() => {
    // Use scrollIntoView on the bottom sentinel for reliable scroll behavior
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isStreaming, streamingLogs]);
  
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      {/* Messages area - native div with overflow for reliable scrolling + visible scrollbar */}
      <div 
        ref={scrollContainerRef}
        className={cn(
          "flex-1 min-h-0 px-4 overflow-x-hidden overflow-y-auto",
          // Visible scrollbar styles
          "scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent",
          // Webkit scrollbar (Chrome, Safari, Edge)
          "[&::-webkit-scrollbar]:w-2",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:bg-zinc-600",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:hover:bg-zinc-500"
        )}
        style={{
          scrollbarWidth: 'thin', // Firefox
          scrollbarColor: 'rgb(82 82 91) transparent', // Firefox: thumb track
        }}
      >
        <div className="py-4 space-y-4 pr-2">
          {messages.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <img src={sellspayLogo} alt="Vibecoder" className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                What would you like to build?
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Describe your storefront vision and I'll generate the code for you.
              </p>
            </div>
          ) : (
            // Message list
            messages.map((msg, idx) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {/* Assistant avatar */}
                {msg.role === 'assistant' && (
                  <div className={cn(
                    "shrink-0 w-8 h-8 overflow-hidden",
                    idx % 3 === 0 ? "mt-0.5" : idx % 3 === 1 ? "mt-2" : "mt-1",
                    "rounded-md"
                  )}>
                    <img src={sellspayLogo} alt="AI" className="w-full h-full object-cover" />
                  </div>
                )}
                
                {/* Message - NUCLEAR TEXT CONSTRAINT for full visibility */}
                <div 
                  className={cn(
                    "text-sm",
                    msg.role === 'user' 
                      ? 'max-w-[85%] px-4 py-3 bg-gradient-to-br from-[#FF5533] to-[#E0482B] text-white rounded-2xl rounded-br-md' 
                      : 'max-w-[92%] text-foreground leading-relaxed pl-3 pr-4 py-1'
                  )}
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    overflowX: 'hidden',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          
          {/* Streaming indicator with live logs */}
          {isStreaming && (
            <div className="flex gap-3 justify-start">
              <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden">
                <img src={sellspayLogo} alt="AI" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-[200px]">
                {streamingLogs.length > 0 ? (
                  <div className="space-y-1">
                    {streamingLogs.map((log, i) => (
                      <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{log}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                      <span className="text-xs text-primary">Working...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">Starting build...</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Bottom sentinel for auto-scroll */}
          <div ref={bottomRef} className="h-px" />
        </div>
      </div>
      
      {/* Input bar (passed as children) - STICKY positioning for guaranteed visibility */}
      <div className="shrink-0 sticky bottom-0 z-10 border-t border-border/50 bg-background">
        {children}
      </div>
    </div>
  );
}
