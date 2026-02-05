import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Square, RefreshCw, Code2, Sparkles, Undo2 } from 'lucide-react';
import sellspayLogo from '@/assets/sellspay-s-logo-new.png';
import { ChatInterface } from './VibecoderMessageBubble';
import type { VibecoderMessage } from './hooks/useVibecoderProjects';

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
  onRestoreToVersion: (messageId: string) => void; // Changed: now takes messageId
  projectName?: string;
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
            {isStreaming && (
              <div className="flex gap-4 mb-8">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-sm">
                    <Sparkles size={14} className="text-violet-400 animate-pulse" />
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Generating code...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-border/30 bg-background">
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
            disabled={isStreaming}
            className="flex-1 h-10 bg-muted/30 border-border/40"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="h-10 w-10 shrink-0 bg-violet-600 hover:bg-violet-500"
          >
            {isStreaming ? (
              <Square className="w-4 h-4 fill-current" onClick={(e) => { e.preventDefault(); onCancel(); }} />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
