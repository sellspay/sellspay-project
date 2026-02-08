import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Code2, CheckCircle2 } from 'lucide-react';
import { ChatInterface } from './VibecoderMessageBubble';
import type { VibecoderMessage } from './hooks/useVibecoderProjects';
import { motion } from 'framer-motion';
import { ChatInputBar, type AIModel } from './ChatInputBar';
import { useUserCredits } from '@/hooks/useUserCredits';
import { type AgentStep } from './AgentProgress';
import { LiveThought } from './LiveThought';
import { PlanApprovalCard } from './PlanApprovalCard';
import type { PlanData } from './useStreamingCode';
import { type StylePreset, generateStylePrompt } from './stylePresets';

interface VibecoderChatProps {
  onSendMessage: (displayMessage: string, aiPrompt?: string) => void;
  onGenerateAsset?: (model: AIModel, prompt: string) => void;
  isStreaming: boolean;
  onCancel: () => void;
  messages: VibecoderMessage[];
  messagesLoading?: boolean; // Prevent flash during message load
  onRateMessage: (messageId: string, rating: -1 | 0 | 1) => void;
  onRestoreToVersion: (messageId: string) => void;
  projectName?: string;
  liveSteps?: string[]; // Real-time transparency logs (legacy fallback)
  // Agent mode props (new premium experience)
  agentStep?: AgentStep;
  agentLogs?: string[];
  isAgentMode?: boolean;
  // Controlled model state
  activeModel?: AIModel;
  onModelChange?: (model: AIModel) => void;
  // Billing callback
  onOpenBilling?: () => void;
  // Controlled style state
  activeStyle?: StylePreset;
  onStyleChange?: (style: StylePreset) => void;
  // Pending plan for approval
  pendingPlan?: { plan: PlanData; originalPrompt: string } | null;
  onApprovePlan?: (originalPrompt: string) => void;
  onRejectPlan?: () => void;
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
  { 
    label: 'Premium Product Landing', 
    prompt: 'Create a luxury premium landing page for selling digital products. Include: stunning hero section with animated gradient background, floating product mockups with parallax effects, glassmorphism cards showcasing features, animated testimonials carousel, trust badges section, pricing with hover animations, FAQ accordion, and a bold CTA footer. Use smooth scroll animations, subtle micro-interactions, and a dark mode aesthetic with violet/purple accents.' 
  },
  { 
    label: 'Course Platform', 
    prompt: 'Build a professional online course landing page with: cinematic hero with course preview video, curriculum breakdown with expandable modules, instructor bio section, student success stories grid, subscription pricing tiers (Free, Pro, Premium) with feature comparison, locked content preview cards showing what subscribers get access to, progress tracking UI mockup, money-back guarantee badge, and newsletter signup. Include smooth animations and a modern educational aesthetic.' 
  },
  { 
    label: 'Creator Storefront', 
    prompt: 'Design a bold creator storefront for selling digital products and content. Include: large hero with creator branding, featured products grid with hover effects, subscription tier cards, recent uploads carousel, social proof section with follower counts, about the creator section, collection galleries, and a sticky navigation bar. Use dramatic typography, vibrant accent colors, and cinematic animations.' 
  },
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
  messagesLoading = false,
  onRateMessage,
  onRestoreToVersion,
  projectName,
  liveSteps = [],
  agentStep,
  agentLogs = [],
  isAgentMode = false,
  activeModel,
  onModelChange,
  onOpenBilling,
  activeStyle,
  onStyleChange,
  pendingPlan,
  onApprovePlan,
  onRejectPlan,
}: VibecoderChatProps) {
  const [input, setInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isApprovingPlan, setIsApprovingPlan] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset approval state when a new plan arrives or plan is cleared
  useEffect(() => {
    if (pendingPlan) {
      // New plan arrived - reset to pending (not executing)
      setIsApprovingPlan(false);
    }
  }, [pendingPlan]);

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

  const handleSubmit = (options: { 
    isPlanMode: boolean; 
    model: AIModel; 
    attachments: File[];
    style?: StylePreset;
  }) => {
    if (!input.trim() || isStreaming) return;
    
    // Check if this is an image/video model - route to asset generation
    const isAssetModel = options.model.category === 'image' || options.model.category === 'video';
    
    if (isAssetModel && onGenerateAsset) {
      onGenerateAsset(options.model, input.trim());
      setInput('');
      return;
    }
    
    // Clean user prompt (what they typed) - this is what gets shown in the chat
    const cleanPrompt = input.trim();
    
    // Build the prompt that goes to the AI backend (may include system instructions)
    let aiPrompt = cleanPrompt;
    
    // STYLE INJECTION: If a style is selected (and not "None"), prepend the style context
    // This ensures the generated code follows the selected visual design system
    if (options.style && options.style.id !== 'none') {
      const styleContext = generateStylePrompt(options.style);
      if (styleContext) {
        aiPrompt = `${styleContext}\n\nUser Request: ${cleanPrompt}`;
      }
    }
    
    // Prepend model context if using a non-default model
    if (options.model.id !== 'vibecoder-pro') {
      aiPrompt = `[MODEL: ${options.model.id}]\n${aiPrompt}`;
    }
    
    // TODO: Handle attachments (upload to storage and include URLs in prompt)
    if (options.attachments.length > 0) {
      console.log('Attachments to process:', options.attachments.length);
    }
    
    // Send the CLEAN prompt for display, but pass the AI prompt for processing
    // The onSendMessage handler will receive this and should save the clean version
    onSendMessage(cleanPrompt, aiPrompt);
    setInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isStreaming) return;
    onSendMessage(prompt);
  };

  // Show empty state only if:
  // 1. There are no messages AND
  // 2. We're not actively streaming AND
  // 3. Messages are not currently loading (prevents flash)
  const isEmpty = messages.length === 0 && !isStreaming && !messagesLoading;

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
            
            {/* 📋 PLAN APPROVAL CARD: Show when AI returns a plan for user approval */}
            {pendingPlan && (
              <PlanApprovalCard
                planId={`plan-${Date.now()}`}
                title={pendingPlan.plan.title}
                summary={pendingPlan.plan.summary}
                steps={pendingPlan.plan.steps}
                onApprove={() => {
                  setIsApprovingPlan(true);
                  onApprovePlan?.(pendingPlan.originalPrompt);
                }}
                onReject={() => {
                  onRejectPlan?.();
                }}
                isApproving={isApprovingPlan}
                status={isApprovingPlan ? 'executing' : 'pending'}
              />
            )}
            
            {/* 🔴 LIVE THOUGHT: Show real-time AI thinking/logs during streaming */}
            {(isStreaming || isAgentMode) && (
              <LiveThought 
                logs={agentLogs.length > 0 ? agentLogs : liveSteps}
                isThinking={isStreaming}
                className="mt-4"
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
        activeModel={activeModel}
        onModelChange={onModelChange}
        onOpenBilling={onOpenBilling}
      />
    </div>
  );
}
