// VibeCoder Chat Interface - Cache-bust: 2026-02-07
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Code2, CheckCircle2 } from 'lucide-react';
import { ChatInterface } from './VibecoderMessageBubble';
import type { VibecoderMessage } from './hooks/useVibecoderProjects';
import { motion } from 'framer-motion';
import { ChatInputBar, type AIModel } from './ChatInputBar';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useAuth } from '@/lib/auth';
import { LiveThought } from './LiveThought';
import { type AgentStep } from './AgentProgress';
import { InsufficientCreditsCard, parseCreditsError } from './InsufficientCreditsCard';
interface VibecoderChatProps {
  onSendMessage: (message: string, styleProfile?: string) => void;
  onGenerateAsset?: (model: AIModel, prompt: string) => void;
  isStreaming: boolean;
  onCancel: () => void;
  messages: VibecoderMessage[];
  onRateMessage: (messageId: string, rating: -1 | 0 | 1) => void;
  onRestoreToVersion: (messageId: string) => void;
  projectName?: string;
  liveSteps?: string[]; // Real-time transparency logs (legacy fallback)
  // Agent mode props (VibeCoder 2.0)
  agentStep?: AgentStep;
  agentLogs?: string[];
  isAgentMode?: boolean;
  // Controlled model state
  activeModel?: AIModel;
  onModelChange?: (model: AIModel) => void;
  // Style profile state
  activeStyleProfile?: string | null;
  onStyleProfileChange?: (profileId: string | null) => void;
  // VibeCoder 2.0: Architect plan for optional display
  architectPlan?: Record<string, unknown>;
  // Billing callback
  onOpenBilling?: () => void;
  // Error state for credit failures
  agentError?: string;
  agentErrorType?: 'credits' | 'auth' | 'api' | 'unknown';
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
  onGenerateAsset,
  isStreaming, 
  onCancel, 
  messages,
  onRateMessage,
  onRestoreToVersion,
  projectName,
  liveSteps = [],
  agentStep,
  agentLogs = [],
  isAgentMode = false,
  activeModel,
  onModelChange,
  activeStyleProfile,
  onStyleProfileChange,
  onOpenBilling,
  agentError,
  agentErrorType,
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

  // User credits hook
  const { credits: userCredits } = useUserCredits();
  const { isAdmin, isOwner } = useAuth();
  const isPrivileged = isAdmin || isOwner;

  const handleSubmit = (options: { 
    isPlanMode: boolean; 
    model: AIModel; 
    attachments: File[];
    styleProfile?: string;
  }) => {
    if (!input.trim() || isStreaming) return;
    
    // Check if this is an image/video model - route to asset generation
    // This auto-switches to the Image or Video tab
    const isAssetModel = options.model.category === 'image' || options.model.category === 'video';
    
    if (isAssetModel && onGenerateAsset) {
      onGenerateAsset(options.model, input.trim());
      setInput('');
      return;
    }
    
    // Otherwise, continue with code generation
    let finalPrompt = input.trim();
    
    // PLAN MODE: Inject the Architect instruction so AI returns a plan instead of code
    if (options.isPlanMode) {
      finalPrompt = `[ARCHITECT_MODE_ACTIVE]\nUser Request: ${finalPrompt}\n\nINSTRUCTION: Do NOT generate code. Create a detailed implementation plan. Output JSON: { "type": "plan", "title": "...", "summary": "...", "steps": ["step 1", "step 2"] }`;
    }
    
    // Prepend model context if using a non-default model
    if (options.model.id !== 'vibecoder-pro') {
      finalPrompt = `[MODEL: ${options.model.id}]\n${finalPrompt}`;
    }
    
    // TODO: Handle attachments (upload to storage and include URLs in prompt)
    if (options.attachments.length > 0) {
      console.log('Attachments to process:', options.attachments.length);
    }
    
    // Pass style profile to parent
    onSendMessage(finalPrompt, options.styleProfile);
    setInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isStreaming) return;
    onSendMessage(prompt);
  };

  // Show empty state only if there are no messages AND we're not actively streaming
  // During streaming, we should show the agent progress even if messages haven't loaded yet
  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background rounded-r-2xl">
      {/* Header - Clean project name only */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-medium text-sm">{projectName || 'Vibecoder'}</span>
            <span className="text-[10px] text-muted-foreground">
              {messages.length} messages
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded border border-orange-500/30 font-medium">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-2" />
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
            {/* Only render ChatInterface if there are actual messages */}
            {messages.length > 0 && (
              <ChatInterface 
                messages={messages}
                onRateMessage={onRateMessage}
                onRestoreToVersion={onRestoreToVersion}
              />
            )}
            {/* Live Thought Stream - Shows AI thinking in real-time */}
            {isStreaming && (
              <LiveThought 
                logs={agentLogs.length > 0 ? agentLogs : liveSteps} 
                isThinking={true} 
              />
            )}
            
            {/* Credit Error Card - Shows when backend rejects due to insufficient credits */}
            {!isPrivileged && agentStep === 'error' && agentErrorType === 'credits' && agentError && (
              <InsufficientCreditsCard
                {...parseCreditsError(agentError)}
                onUpgrade={() => onOpenBilling?.()}
              />
            )}
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
        userCredits={userCredits}
        isPrivileged={isPrivileged}
        activeModel={activeModel}
        onModelChange={onModelChange}
        activeStyleProfile={activeStyleProfile}
        onStyleProfileChange={onStyleProfileChange}
        onOpenBilling={onOpenBilling}
      />
    </div>
  );
}
