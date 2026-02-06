import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Code2, Sparkles, Undo2, CheckCircle2 } from 'lucide-react';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
import { ChatInterface } from './VibecoderMessageBubble';
import type { VibecoderMessage } from './hooks/useVibecoderProjects';
import { motion } from 'framer-motion';
import { ChatInputBar } from './ChatInputBar';
interface VibecoderChatProps {
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
  onCancel: () => void;
  onReset: () => void;
  onUndo: () => void;
  hasCode: boolean;
  canUndo: boolean;
  messages: VibecoderMessage[];
  onRateMessage: (messageId: string, rating: -1 | 0 | 1) => void;
  onRestoreToVersion: (messageId: string) => void;
  projectName?: string;
  liveSteps?: string[]; // Real-time transparency logs
}

// Live Building Card - shows steps as they stream in
function LiveBuildingCard({ steps }: { steps: string[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 mb-8"
    >
      {/* Pulsing Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
          <Loader2 size={14} className="text-violet-400 animate-spin" />
        </div>
      </div>
      
      {/* Building Card */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm p-5 shadow-sm">
        <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
          Building your request...
        </p>
        
        {/* Live Steps List */}
        {steps.length > 0 && (
          <div className="space-y-3">
            {steps.map((step, idx) => {
              // Last step is "running", previous steps are "done"
              const isRunning = idx === steps.length - 1;
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 text-xs font-mono"
                >
                  {isRunning ? (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <Loader2 size={12} className="text-violet-400 animate-spin" />
                    </div>
                  ) : (
                    <CheckCircle2 size={14} className="text-green-500" />
                  )}
                  <span className={isRunning ? "text-violet-300 animate-pulse" : "text-zinc-500"}>
                    {step}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
        
        {/* Fallback if no steps yet */}
        {steps.length === 0 && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Initializing...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const QUICK_PROMPTS = [
  { label: 'Premium Store', prompt: 'A luxury dark mode storefront for selling premium digital products with glassmorphism cards and violet accents' },
  { label: 'Creator Portfolio', prompt: 'A bold, modern creator portfolio with hero section, featured works gallery, and contact CTA' },
  { label: 'SaaS Landing', prompt: 'A clean SaaS landing page with pricing tiers, feature grid, testimonials, and gradient backgrounds' },
  { label: 'Minimal Blog', prompt: 'A minimal, elegant blog layout with typography focus, article cards, and newsletter signup' },
];

const PLACEHOLDER_EXAMPLES = [
  "A dark anime storefront for selling editing packs...",
  "A premium creator page with neon accents...",
  "A minimal portfolio with bold typography...",
  "A gaming-themed store with vibrant colors...",
];

export function VibecoderChat({ 
  onSendMessage, 
  isStreaming, 
  onCancel, 
  onReset,
  onUndo,
  hasCode,
  canUndo,
  messages,
  onRateMessage,
  onRestoreToVersion,
  projectName,
  liveSteps = [],
}: VibecoderChatProps) {
  const [input, setInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Rotate placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isStreaming) return;
    onSendMessage(prompt);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <img src={sellspayLogo} alt="" className="w-6 h-6 object-contain" />
            <Sparkles className="w-3 h-3 text-violet-400 absolute -top-1 -right-1" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{projectName || 'Vibecoder'}</span>
            <span className="text-[10px] text-muted-foreground">
              {messages.length} messages
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded border border-violet-500/30 font-medium">
            BETA
          </span>
          {isStreaming && (
            <span className="text-xs text-violet-400 animate-pulse flex items-center gap-1.5 ml-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Streaming...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canUndo && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onUndo}
              className="gap-1.5 text-muted-foreground"
              disabled={isStreaming}
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </Button>
          )}
          {hasCode && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onReset}
              className="gap-1.5 text-muted-foreground"
              disabled={isStreaming}
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-6 py-4" ref={scrollRef}>
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 py-12">
            {/* Logo */}
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-violet-500/20 rounded-full scale-[2]" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 via-blue-500/10 to-background border border-violet-500/30 flex items-center justify-center shadow-xl">
                <Code2 className="w-10 h-10 text-violet-400" />
              </div>
            </div>

            <div className="space-y-3 max-w-sm">
              <h3 className="text-xl font-semibold">Vibecoder</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Describe your vision. I'll generate the complete React code in real-time.
              </p>
            </div>

            {/* Quick prompts */}
            <div className="w-full pt-4 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                Quick Start
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((item) => (
                  <Button
                    key={item.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt(item.prompt)}
                    disabled={isStreaming}
                    className="text-xs h-8 px-4 bg-muted/50 hover:bg-violet-500/10 hover:border-violet-500/30 border-border/50"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <ChatInterface 
              messages={messages}
              onRateMessage={onRateMessage}
              onRestoreToVersion={onRestoreToVersion}
            />
            {/* Show Live Building Card during streaming */}
            {isStreaming && <LiveBuildingCard steps={liveSteps} />}
          </>
        )}
      </div>

      {/* Premium Chat Input */}
      <ChatInputBar
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isGenerating={isStreaming}
        onCancel={onCancel}
        placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
      />
    </div>
  );
}
