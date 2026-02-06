import { useRef, useEffect } from 'react';
import { 
  Sparkles, Check, ThumbsUp, ThumbsDown, 
  Copy, MoreHorizontal, Terminal, Code2, Cpu, Undo2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StepList, StepListSkeleton } from './StepList';
import { generateDefaultSteps, type BuildStep } from './types/chat';
import type { VibecoderMessage } from './hooks/useVibecoderProjects';

// Extended message type with steps
export interface MessageWithSteps extends VibecoderMessage {
  steps?: BuildStep[];
}

// --- HELPER: INFER ACTION TYPE ---
function getMessageMeta(content: string, hasCode: boolean) {
  if (!hasCode) return { type: 'chat', label: 'Response', icon: Sparkles };
  if (content.toLowerCase().includes('create') || content.length < 50) {
    return { type: 'create', label: 'Create Page', icon: Cpu };
  }
  return { type: 'update', label: 'Update Code', icon: Code2 };
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
        {/* Full message display - no truncation, with safe word-break */}
        <div className="prose prose-sm prose-invert max-w-none leading-relaxed break-words whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </motion.div>
  );
}

// --- AI CARD (The "Lovable" Look) ---
interface AssistantCardProps {
  message: MessageWithSteps;
  onRate?: (rating: -1 | 0 | 1) => void;
  onRestoreCode?: () => void;
  canRestore?: boolean;
  isStreaming?: boolean;
}

function AssistantCard({ message, onRate, onRestoreCode, canRestore, isStreaming }: AssistantCardProps) {
  const hasCode = !!message.code_snapshot;
  const { label, icon: Icon } = getMessageMeta(message.content, hasCode);

  // Friendly message if it's just a raw "Generated..." text
  const displayContent = message.content === "Generated your storefront design." 
    ? "I've drafted a premium layout based on your request. Check the preview!" 
    : message.content;

  // Generate steps if not provided (for backwards compatibility)
  const steps = message.steps || (hasCode ? generateDefaultSteps(hasCode, message.content) : undefined);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-4 mb-8 group w-full max-w-full"
    >
      {/* AI AVATAR */}
      <div className="shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Sparkles size={14} className="text-white" />
        </div>
      </div>

      {/* CARD BODY - min-w-0 prevents flex child from growing beyond container */}
      <div className="flex-1 min-w-0 max-w-full space-y-2">
        
        {/* 1. THE MESSAGE BUBBLE */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm p-5 shadow-sm w-full">
          {/* Full message display - no truncation, with safe word-break */}
          <div className="prose prose-sm prose-invert max-w-none text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
            {displayContent}
          </div>

          {/* 2. STEP-BY-STEP BREAKDOWN */}
          {isStreaming && !steps && <StepListSkeleton />}
          {steps && steps.length > 0 && (
            <StepList steps={steps} isStreaming={isStreaming} />
          )}

          {/* 3. THE "ACTION" PILL (Only if code changed) */}
          {hasCode && !isStreaming && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800">
                <Icon size={12} className="text-zinc-500" />
                <span className="text-[11px] font-mono text-zinc-400">{label}</span>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <Check size={10} className="text-green-500" />
                <span className="text-[10px] font-bold text-green-500 tracking-wide uppercase">Applied</span>
              </div>

              {/* Restore button for older messages */}
              {canRestore && onRestoreCode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  onClick={onRestoreCode}
                  title="Restore this version"
                >
                  <Undo2 className="h-3 w-3" />
                  Restore
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 4. THE TOOLBAR (Hidden until hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
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
            </>
          )}
          <div className="w-px h-3 bg-zinc-800 mx-1" />
          <button 
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" 
            onClick={handleCopy}
            title="Copy Text"
          >
            <Copy size={14} />
          </button>
          <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <MoreHorizontal size={14} />
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
        <Terminal size={20} className="text-zinc-500" />
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
    return <UserBubble content={message.content} />;
  }
  
  return (
    <AssistantCard 
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
