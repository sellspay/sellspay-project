import { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
 * Stripped down to essentials:
 * - User messages (right aligned, salmon gradient)
 * - Assistant messages (left aligned, with logo)
 * - Streaming indicator
 * - Chat input passed as children
 */
export function SimpleChat({ messages, isStreaming, streamingLogs = [], children }: SimpleChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);
  
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      {/* Messages area */}
      <ScrollArea className="flex-1 min-h-0 px-4" viewportClassName="!block">
        <div ref={scrollRef} className="py-4 space-y-4">
          {messages.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <img src={sellspayLogo} alt="Vibecoder" className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                What would you like to build?
              </h3>
              <p className="text-sm text-zinc-500 max-w-xs">
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
                    // slightly irregular placement like Lovable
                    idx % 3 === 0 ? "mt-0.5" : idx % 3 === 1 ? "mt-2" : "mt-1",
                    "rounded-md"
                  )}>
                    <img src={sellspayLogo} alt="AI" className="w-full h-full object-cover" />
                  </div>
                )}
                
                {/* Message */}
                <div 
                  className={cn(
                    "text-sm break-words whitespace-pre-wrap",
                    msg.role === 'user' 
                      ? 'max-w-[85%] px-4 py-3 bg-gradient-to-br from-[#FF5533] to-[#E0482B] text-white rounded-2xl rounded-br-md' 
                      : 'max-w-[92%] text-foreground leading-relaxed pl-3 pr-2 py-1'
                  )}
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
                      <div key={i} className="text-xs text-zinc-400 flex items-center gap-2">
                        <span>{log}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                      <span className="text-xs text-violet-400">Working...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                    <span className="text-sm text-zinc-400">Starting build...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Input bar (passed as children) */}
      <div className="shrink-0 border-t border-border/50 bg-background">
        {children}
      </div>
    </div>
  );
}
