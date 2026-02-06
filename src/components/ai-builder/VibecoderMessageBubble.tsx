import { useRef, useEffect } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, Copy, Undo2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import type { VibecoderMessage } from './hooks/useVibecoderProjects';
import type { BuildStep } from './types/chat';

// Extended message type with steps
export interface MessageWithSteps extends VibecoderMessage {
  steps?: BuildStep[];
}

// --- USER BUBBLE (The "Salmon" Look) ---
function UserBubble({ content }: { content: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end mb-6 w-full"
    >
      <div className="max-w-[85%] bg-gradient-to-br from-[#FF5533] to-[#E0482B] text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-lg shadow-orange-900/10 text-sm font-medium leading-relaxed">
        <div className="break-words whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </motion.div>
  );
}

// --- AI RESPONSE (Clean markdown, no cards) ---
interface AssistantMessageProps {
  message: MessageWithSteps;
  onRate?: (rating: -1 | 0 | 1) => void;
  onRestoreCode?: () => void;
  canRestore?: boolean;
  isStreaming?: boolean;
}

function AssistantMessage({ message, onRate, onRestoreCode, canRestore, isStreaming }: AssistantMessageProps) {
  const hasCode = !!message.code_snapshot;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-3 mb-6 group w-full"
    >
      {/* AI Avatar */}
      <div className="shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Sparkles size={14} className="text-white" />
        </div>
      </div>

      {/* Message Content - Pure Markdown */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* The AI's actual response rendered as markdown */}
        <div className="text-zinc-300 text-sm leading-relaxed">
          {isStreaming && !message.content ? (
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span>Thinking...</span>
            </div>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none 
              prose-headings:text-zinc-100 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
              prose-p:text-zinc-300 prose-p:my-2
              prose-strong:text-zinc-100 prose-strong:font-semibold
              prose-ul:my-2 prose-ul:space-y-1
              prose-li:text-zinc-300 prose-li:my-0.5
              prose-li:marker:text-violet-500
              prose-code:text-violet-400 prose-code:bg-zinc-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
              prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-lg
              prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
              [&_ul]:list-disc [&_ul]:pl-4
              [&_ol]:list-decimal [&_ol]:pl-4
            ">
              <ReactMarkdown
                components={{
                  // Custom checkbox rendering for ✅ style items
                  li: ({ children, ...props }) => {
                    const text = String(children);
                    // Check if starts with emoji checkmarks
                    if (text.startsWith('✅') || text.startsWith('☑') || text.startsWith('✓')) {
                      return (
                        <li className="flex items-start gap-2 list-none ml-0" {...props}>
                          <span className="text-green-500 shrink-0">✓</span>
                          <span>{text.replace(/^[✅☑✓]\s*/, '')}</span>
                        </li>
                      );
                    }
                    if (text.startsWith('⚠') || text.startsWith('⚠️')) {
                      return (
                        <li className="flex items-start gap-2 list-none ml-0 text-amber-400" {...props}>
                          <span className="shrink-0">⚠</span>
                          <span>{text.replace(/^[⚠️⚠]\s*/, '')}</span>
                        </li>
                      );
                    }
                    return <li {...props}>{children}</li>;
                  },
                  // Bold headers get special treatment
                  strong: ({ children }) => (
                    <strong className="text-zinc-100 font-semibold">{children}</strong>
                  ),
                  // Inline code for file names
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) {
                      return <code className={className}>{children}</code>;
                    }
                    return (
                      <code className="text-violet-400 bg-zinc-800/60 px-1.5 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Minimal action bar - only show restore button if applicable */}
        {hasCode && !isStreaming && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800/50">
            {canRestore && onRestoreCode && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800"
                onClick={onRestoreCode}
              >
                <Undo2 className="h-3 w-3" />
                Restore this version
              </Button>
            )}
            <span className="text-[10px] text-zinc-600 italic">Code applied to preview</span>
          </div>
        )}

        {/* Hover toolbar */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRate && (
            <>
              <button 
                className={cn(
                  "p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors",
                  message.rating === 1 && "text-violet-400 bg-violet-500/10"
                )}
                onClick={() => onRate(message.rating === 1 ? 0 : 1)}
                title="Helpful"
              >
                <ThumbsUp size={14} />
              </button>
              <button 
                className={cn(
                  "p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors",
                  message.rating === -1 && "text-red-400 bg-red-500/10"
                )}
                onClick={() => onRate(message.rating === -1 ? 0 : -1)}
                title="Not Helpful"
              >
                <ThumbsDown size={14} />
              </button>
              <div className="w-px h-3 bg-zinc-800 mx-1" />
            </>
          )}
          <button 
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" 
            onClick={handleCopy}
            title="Copy Text"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- EMPTY STATE ---
function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-4 border border-zinc-800">
        <Sparkles size={20} className="text-zinc-500" />
      </div>
      <p className="text-sm text-zinc-500">History is empty. Start building.</p>
    </div>
  );
}

// --- MAIN EXPORTS ---
interface VibecoderMessageBubbleProps {
  message: MessageWithSteps;
  onRate?: (rating: -1 | 0 | 1) => void;
  onRestoreCode?: () => void;
  canRestore?: boolean;
  isStreaming?: boolean;
}

export function VibecoderMessageBubble({
  message,
  onRate,
  onRestoreCode,
  canRestore = false,
  isStreaming = false,
}: VibecoderMessageBubbleProps) {
  if (message.role === 'user') {
    return <UserBubble content={message.content ?? ''} />;
  }
  
  return (
    <AssistantMessage 
      message={message} 
      onRate={onRate} 
      onRestoreCode={onRestoreCode}
      canRestore={canRestore}
      isStreaming={isStreaming}
    />
  );
}

// Export ChatInterface for direct use
interface ChatInterfaceProps {
  messages: MessageWithSteps[];
  onRateMessage: (messageId: string, rating: -1 | 0 | 1) => void;
  onRestoreToVersion: (messageId: string) => void;
  streamingMessageId?: string | null;
}

export function ChatInterface({ 
  messages, 
  onRateMessage, 
  onRestoreToVersion,
  streamingMessageId 
}: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
      {messages.map((msg, index) => (
        <VibecoderMessageBubble
          key={msg.id}
          message={msg}
          onRate={(rating) => onRateMessage(msg.id, rating)}
          onRestoreCode={msg.code_snapshot ? () => onRestoreToVersion(msg.id) : undefined}
          canRestore={index < messages.length - 1 && !!msg.code_snapshot}
          isStreaming={msg.id === streamingMessageId}
        />
      ))}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}

// Re-export types for external use
export { type BuildStep } from './types/chat';
