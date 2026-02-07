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
export function SimpleChat({ messages, isStreaming, children }: SimpleChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages area */}
      <ScrollArea className="flex-1 px-4" viewportClassName="!block">
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
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-3",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {/* Assistant avatar */}
                {msg.role === 'assistant' && (
                  <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden">
                    <img src={sellspayLogo} alt="AI" className="w-full h-full object-cover" />
                  </div>
                )}
                
                {/* Message bubble */}
                <div 
                  className={cn(
                    "max-w-[80%] px-4 py-3 rounded-2xl text-sm break-words whitespace-pre-wrap",
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-[#FF5533] to-[#E0482B] text-white rounded-br-md' 
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-md border border-zinc-700/50'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          
          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex gap-3 justify-start">
              <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden">
                <img src={sellspayLogo} alt="AI" className="w-full h-full object-cover" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-zinc-800 border border-zinc-700/50">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Input bar (passed as children) */}
      <div className="shrink-0 border-t border-zinc-800">
        {children}
      </div>
    </div>
  );
}
