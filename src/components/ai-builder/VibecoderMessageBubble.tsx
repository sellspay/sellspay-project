import { useRef, useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import type { VibecoderMessage } from './hooks/useVibecoderProjects';
import type { BuildStep } from './types/chat';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
import { PolicyViolationCard } from './PolicyViolationCard';
import { RevertConfirmDialog } from './RevertConfirmDialog';

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
  isLatestCodeMessage?: boolean; // NEW: Show prominent undo for latest code message
}

function AssistantMessage({ 
  message, 
  onRate, 
  onRestoreCode, 
  canRestore, 
  isStreaming,
  isLatestCodeMessage = false 
}: AssistantMessageProps) {
  const hasCode = !!message.code_snapshot;
  const [showRevertDialog, setShowRevertDialog] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
  };

  const handleRevertClick = () => {
    setShowRevertDialog(true);
  };

  const handleConfirmRevert = () => {
    setShowRevertDialog(false);
    onRestoreCode?.();
  };

  // Show prominent undo button for the latest code message (always visible, not hover)
  const showProminentUndo = isLatestCodeMessage && canRestore && hasCode && !isStreaming;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-3 mb-6 group w-full"
    >
      {/* AI Avatar - Brand Logo */}
      <div className="shrink-0 mt-1">
        <img src={sellspayLogo} alt="AI" className="w-7 h-7 object-contain" />
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
            <div className="prose prose-sm prose-invert max-w-none">
              {(() => {
                const content = message.content || '';
                // Split out confidence line if present
                const confMatch = content.match(/\n?\n?=== CONFIDENCE === (\d+)\s*(.*)/);
                const mainContent = confMatch ? content.replace(confMatch[0], '').trim() : content;
                const confScore = confMatch ? parseInt(confMatch[1], 10) : null;
                const confReason = confMatch ? confMatch[2]?.trim() : null;
                
                return (
                  <>
                    <ReactMarkdown
                      components={{
                        p: ({ children, ...props }) => (
                          <p className="mb-4 last:mb-0 leading-relaxed text-zinc-300" {...props}>
                            {children}
                          </p>
                        ),
                        a: ({ children, ...props }) => (
                          <a className="text-violet-400 hover:text-violet-300 hover:underline transition-colors" {...props}>
                            {children}
                          </a>
                        ),
                        code: ({ children, className }) => {
                          const isBlock = className?.includes('language-');
                          if (isBlock) {
                            return <code className={className}>{children}</code>;
                          }
                          return (
                            <code className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-xs font-mono text-violet-300 border border-zinc-700/50">
                              {children}
                            </code>
                          );
                        },
                        ol: ({ children, ...props }) => (
                          <ol className="list-decimal pl-5 space-y-4 mb-4 marker:text-zinc-400 marker:font-semibold" {...props}>
                            {children}
                          </ol>
                        ),
                        ul: ({ children, ...props }) => (
                          <ul className="list-disc pl-5 space-y-2 mb-4 marker:text-zinc-500" {...props}>
                            {children}
                          </ul>
                        ),
                        li: ({ children, ...props }) => (
                          <li className="pl-1 text-zinc-300 leading-relaxed" {...props}>
                            {children}
                          </li>
                        ),
                        strong: ({ children, ...props }) => (
                          <strong className="font-semibold text-white" {...props}>
                            {children}
                          </strong>
                        ),
                        h1: ({ children, ...props }) => (
                          <h1 className="text-lg font-bold text-zinc-100 mt-4 mb-2" {...props}>{children}</h1>
                        ),
                        h2: ({ children, ...props }) => (
                          <h2 className="text-base font-semibold text-zinc-100 mt-3 mb-2" {...props}>{children}</h2>
                        ),
                        h3: ({ children, ...props }) => (
                          <h3 className="text-sm font-semibold text-zinc-200 mt-2 mb-1" {...props}>{children}</h3>
                        ),
                      }}
                    >
                      {mainContent}
                    </ReactMarkdown>
                    
                    {/* Confidence Score Display */}
                    {confScore !== null && (
                      <div className="mt-3 pt-2 border-t border-zinc-800/40">
                        <p className="text-xs text-zinc-500">
                          <span className="font-mono font-semibold text-zinc-400">=== CONFIDENCE === {confScore}</span>
                          {confReason && <span className="ml-1">{confReason}</span>}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Code applied note + PROMINENT UNDO BUTTON (always visible for latest) */}
        {hasCode && !isStreaming && (
          <div className="mt-3 pt-3 border-t border-zinc-800/50 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 italic">Code applied to preview</span>
            
            {/* PROMINENT UNDO PILL - Always visible for latest code message */}
            {showProminentUndo && (
              <button
                onClick={handleRevertClick}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg 
                           bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white
                           text-xs font-medium transition-colors border border-zinc-700/50"
              >
                <RotateCcw size={12} />
                Undo Change
              </button>
            )}
          </div>
        )}

        {/* Hover toolbar - rating + copy (undo moved to prominent position above) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Only show revert in hover toolbar for non-latest messages */}
          {canRestore && onRestoreCode && !isLatestCodeMessage && (
            <>
              <button
                className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                onClick={handleRevertClick}
                title="Revert to this version"
              >
                <RotateCcw size={14} />
              </button>
              <div className="w-px h-3 bg-zinc-800 mx-1" />
            </>
          )}
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

      {/* Revert Confirmation Dialog */}
      <RevertConfirmDialog
        open={showRevertDialog}
        onOpenChange={setShowRevertDialog}
        onConfirm={handleConfirmRevert}
      />
    </motion.div>
  );
}

// --- EMPTY STATE ---
function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-4 border border-zinc-800 p-2.5">
        <img src={sellspayLogo} alt="" className="w-full h-full object-contain opacity-50" />
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
  isLatestCodeMessage?: boolean; // NEW: Show prominent undo for latest code message
}

export function VibecoderMessageBubble({
  message,
  onRate,
  onRestoreCode,
  canRestore = false,
  isStreaming = false,
  isLatestCodeMessage = false,
}: VibecoderMessageBubbleProps) {
  if (message.role === 'user') {
    return <UserBubble content={message.content ?? ''} />;
  }
  
  // Render policy violation card for blocked requests
  if (message.meta_data?.type === 'policy_violation') {
    return (
      <PolicyViolationCard
        category={message.meta_data.category || 'Policy Restriction'}
        message={message.content || ''}
      />
    );
  }
  
  return (
    <AssistantMessage 
      message={message} 
      onRate={onRate} 
      onRestoreCode={onRestoreCode}
      canRestore={canRestore}
      isStreaming={isStreaming}
      isLatestCodeMessage={isLatestCodeMessage}
    />
  );
}

// Export ChatInterface for direct use
interface ChatInterfaceProps {
  messages: MessageWithSteps[];
  onRateMessage: (messageId: string, rating: -1 | 0 | 1) => void;
  onRestoreToVersion: (messageId: string) => void;
  streamingMessageId?: string | null;
  canUndo?: boolean; // NEW: Whether undo is possible (at least 2 valid snapshots)
}

export function ChatInterface({ 
  messages, 
  onRateMessage, 
  onRestoreToVersion,
  streamingMessageId,
  canUndo = false 
}: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyState />;
  }

  // Find the latest assistant message with code for prominent undo display
  const latestCodeMessageIndex = [...messages]
    .map((m, i) => ({ msg: m, idx: i }))
    .filter(({ msg }) => msg.role === 'assistant' && msg.code_snapshot)
    .pop()?.idx ?? -1;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
      {messages.map((msg, index) => {
        // Determine if this is the latest code message (for prominent undo)
        const isLatestCodeMessage = index === latestCodeMessageIndex;
        
        return (
          <VibecoderMessageBubble
            key={msg.id}
            message={msg}
            onRate={(rating) => onRateMessage(msg.id, rating)}
            onRestoreCode={msg.code_snapshot ? () => onRestoreToVersion(msg.id) : undefined}
            canRestore={!!msg.code_snapshot && (canUndo || index < messages.length - 1)}
            isStreaming={msg.id === streamingMessageId}
            isLatestCodeMessage={isLatestCodeMessage && canUndo}
          />
        );
      })}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}

// Re-export types for external use
export { type BuildStep } from './types/chat';
