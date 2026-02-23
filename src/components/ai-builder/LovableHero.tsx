import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, ArrowLeft, Mic, Zap, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import heroBg from "@/assets/hero-aurora-bg.jpg";
import { DoorwaySidebar } from "./DoorwaySidebar";
import { ProjectShelf } from "./ProjectShelf";
import { useIsMobile } from "@/hooks/use-mobile";

interface RecentProject {
  id: string;
  name: string;
  thumbnail_url: string | null;
  last_edited_at: string;
  is_starred?: boolean;
}

interface LovableHeroProps {
  onStart: (prompt: string, isPlanMode?: boolean) => void;
  userName?: string;
  variant?: 'fullscreen' | 'embedded';
  onBack?: () => void;
  recentProjects?: RecentProject[];
  onSelectProject?: (projectId: string) => void;
  onToggleStar?: (projectId: string) => void;
  userCredits?: number;
  avatarUrl?: string | null;
  subscriptionTier?: string | null;
  onSignOut?: () => void;
}

export function LovableHero({
  onStart,
  userName = "Creator",
  variant = 'fullscreen',
  onBack,
  recentProjects = [],
  onSelectProject,
  onToggleStar,
  userCredits,
  avatarUrl,
  subscriptionTier,
  onSignOut,
}: LovableHeroProps) {
  const [prompt, setPrompt] = useState("");
  const [isPlanMode, setIsPlanMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);
  const [gateType, setGateType] = useState<'subscription' | 'credits'>('subscription');
  
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 400);
    textarea.style.height = `${Math.max(80, newHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 400 ? "auto" : "hidden";
  }, [prompt]);

  const navigate = useNavigate();
  const { isPremium, credits, hasCredits, goToPricing, loading: subLoading } = useSubscription();

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          setPrompt(prev => prev ? `${prev} ${finalTranscript.trim()}` : finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListening && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch {}
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim()) return;
    
    if (!isPremium) {
      setGateType('subscription');
      setShowGateModal(true);
      return;
    }
    
    if (!hasCredits(25)) {
      setGateType('credits');
      setShowGateModal(true);
      return;
    }

    onStart(prompt, isPlanMode);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const hasSidebar = recentProjects.length > 0 && !isMobile;

  return (
    <div className={`${variant === 'embedded' ? "h-full" : "h-screen"} w-full relative overflow-hidden bg-black flex`}>
      
      {/* Sidebar (desktop only, when projects exist) */}
      {recentProjects.length > 0 && onSelectProject && (
        <DoorwaySidebar
          projects={recentProjects}
          onSelectProject={onSelectProject}
          onNewProject={() => {
            setPrompt("");
            textareaRef.current?.focus();
          }}
          credits={userCredits ?? credits}
          avatarUrl={avatarUrl}
          username={userName}
          subscriptionTier={subscriptionTier}
          onSignOut={onSignOut}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 relative flex flex-col items-center overflow-y-auto">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-black/30" />

        {/* Back Button */}
        {variant === 'fullscreen' ? (
          <button
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-zinc-400 hover:text-white transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={16} />
            <span>Home</span>
          </button>
        ) : onBack ? (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-zinc-400 hover:text-white transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        ) : null}

        {/* Center content (prompt area) */}
        <div className={`relative z-10 w-full max-w-2xl flex flex-col items-center text-center px-4 ${
          recentProjects.length > 0 ? "pt-[12vh]" : "pt-[25vh]"
        } flex-1`}>
          
          {/* Pill Badge */}
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-orange-200 tracking-wide uppercase">
              Agentic V2 Model
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-10 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            What's on your mind, {userName}?
          </h1>

          {/* The Magic Input Bar */}
          <form 
            onSubmit={handleSubmit}
            className="w-full relative group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-rose-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transition-all focus-within:border-orange-500/30 focus-within:bg-zinc-900/90 overflow-hidden">
              
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ask VibeCoder to create a landing page for..."
                rows={1}
                className="w-full bg-transparent border-none text-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0 font-medium resize-none px-5 pt-5 pb-[80px] min-h-[120px] max-h-[400px] scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent leading-relaxed"
                autoFocus
              />

              {/* Left: Plus Button */}
              <div className="absolute bottom-3 left-3 z-10">
                <button 
                  type="button" 
                  className="p-2.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Right: Actions */}
              <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                <div className="flex items-center gap-1 bg-zinc-900/50 rounded-xl p-1 backdrop-blur-md border border-white/5">
                  <button 
                    type="button" 
                    onClick={toggleListening}
                    className={`p-2 transition-all rounded-lg ${
                      isListening 
                        ? 'text-red-400 bg-red-500/20 animate-pulse' 
                        : 'text-zinc-500 hover:text-white hover:bg-white/5'
                    }`}
                    title={isListening ? "Tap to stop" : "Voice input"}
                  >
                    <Mic size={20} />
                  </button>
                  
                  <div className="w-px h-4 bg-white/10 mx-0.5" />
                  
                  <button 
                    type="button"
                    onClick={() => setIsPlanMode(!isPlanMode)}
                    className={`px-2 py-1.5 text-[11px] font-light tracking-wide transition-colors rounded-lg ${
                      isPlanMode 
                        ? 'text-orange-400 bg-orange-500/10' 
                        : 'text-zinc-500 hover:text-orange-400'
                    }`}
                    title="Toggle plan mode"
                  >
                    Plan
                  </button>
                  
                  <div className="w-px h-4 bg-white/10 mx-0.5" />
                  
                  <button 
                    type="submit"
                    disabled={!prompt.trim() || subLoading}
                    className="p-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-lg hover:from-orange-400 hover:to-rose-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 right-4 text-[10px] text-zinc-600 font-medium opacity-0 group-focus-within:opacity-100 transition-opacity">
              Press Enter to send, Shift+Enter for new line
            </div>
          </form>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap justify-center gap-3 mt-10 animate-in fade-in duration-1000 delay-300">
            <SuggestionChip 
              label="SaaS Dashboard" 
              onClick={() => handleSuggestionClick(
                "Build a premium dark-mode SaaS analytics dashboard with: a top stats bar showing MRR, active users, churn rate, and growth percentage with animated counters; a main area chart for revenue trends with gradient fills and hover tooltips; a secondary bar chart for user signups by source; a recent activity feed with avatars and timestamps; a sidebar with glassmorphism showing quick actions. Use zinc-900 background, subtle purple/blue accent gradients, rounded-2xl cards with soft shadows, smooth fade-in animations on load, and hover micro-interactions on all interactive elements. Typography should be clean with tracking-tight headings."
              )} 
            />
            <SuggestionChip 
              label="Portfolio Site" 
              onClick={() => handleSuggestionClick(
                "Create a stunning minimalist portfolio for a senior product designer with: an animated hero section featuring a large serif headline with a subtle text reveal animation; a curated project showcase grid (3 columns) with hover zoom effects and overlay descriptions; an about section with a professional photo, bio, and floating skill tags; a testimonials carousel with client quotes and company logos; a contact section with social links and a simple inquiry form. Use an off-white cream background with deep charcoal text, elegant serif/sans-serif font pairing, generous whitespace, smooth scroll-triggered animations, and delicate accent colors (terracotta or sage green). Include a sticky minimal header."
              )} 
            />
            <SuggestionChip 
              label="E-Commerce" 
              onClick={() => handleSuggestionClick(
                "Design a luxury watch e-commerce landing page with: a cinematic full-bleed hero featuring a large product image with parallax effect and bold headline with gold accent text; a featured collection row with horizontal scroll and product cards showing price, name, and quick-view hover state; a craftsmanship section with split layout (image left, text right) highlighting materials and heritage; a customer reviews section with star ratings and verified badges; a newsletter signup with elegant input styling. Use deep black background with warm gold (#C9A962) accents, sophisticated serif typography, high-contrast product photography, smooth reveal animations, and subtle grain texture overlay for premium feel."
              )} 
            />
          </div>
        </div>

        {/* Project Shelf — full width, outside max-w-2xl container */}
        {onSelectProject && (
          <div className="relative z-10 w-full px-6 pb-6 mt-auto">
            <ProjectShelf
              projects={recentProjects}
              onSelectProject={(id) => {
                if (id.startsWith('tpl-')) {
                  const templates: Record<string, string> = {
                    'tpl-saas': 'Build a premium dark-mode SaaS analytics dashboard with: a top stats bar showing MRR, active users, churn rate, and growth percentage with animated counters; a main area chart for revenue trends with gradient fills; a sidebar with quick actions. Use zinc-900 background, subtle purple/blue accent gradients, rounded-2xl cards with soft shadows, and smooth fade-in animations.',
                    'tpl-portfolio': 'Create a stunning minimalist portfolio for a senior product designer with: an animated hero section with a large serif headline; a curated project showcase grid with hover zoom effects; an about section with a bio and floating skill tags; a contact section with social links. Use off-white cream background with deep charcoal text, elegant serif/sans-serif font pairing, generous whitespace, and smooth scroll-triggered animations.',
                    'tpl-ecommerce': 'Design a luxury watch e-commerce landing page with: a cinematic full-bleed hero with parallax effect and bold headline; a featured collection row with horizontal scroll and product cards; a craftsmanship section with split layout; customer reviews with star ratings. Use deep black background with warm gold accents, sophisticated serif typography, and subtle grain texture overlay.',
                    'tpl-landing': 'Build a modern startup landing page with: a bold hero section with gradient text headline and email signup CTA; a features grid with icons and descriptions; a testimonials section with avatars; a pricing table with 3 tiers; a FAQ accordion; and a footer with social links. Use a dark theme with vibrant gradient accents, clean sans-serif typography, and smooth entrance animations.',
                    'tpl-blog': 'Create an editorial blog homepage with: a large featured post hero with image overlay and category badge; a 3-column grid of recent posts with thumbnails and excerpts; a sidebar with categories, popular posts, and newsletter signup; clean typography with serif headings and sans-serif body. Use a warm cream/white palette with subtle borders and reading-optimized spacing.',
                    'tpl-linktree': 'Create a stylish link-in-bio page with: a profile avatar and name at the top; a bio section; a vertical stack of link cards with icons, labels, and hover animations; social media icons at the bottom. Use a dark gradient background, glassmorphism link cards, and smooth hover scale effects. Make it mobile-first and visually striking.',
                  };
                  const templatePrompt = templates[id];
                  if (templatePrompt) {
                    setPrompt(templatePrompt);
                    textareaRef.current?.focus();
                  }
                } else {
                  onSelectProject(id);
                }
              }}
              onToggleStar={onToggleStar}
            />
          </div>
        )}
      </div>

      {/* Subscription/Credits Gate Modal */}
      <Dialog open={showGateModal} onOpenChange={setShowGateModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
              {gateType === 'subscription' ? (
                <Zap className="w-6 h-6 text-orange-400" />
              ) : (
                <CreditCard className="w-6 h-6 text-orange-400" />
              )}
            </div>
            <DialogTitle className="text-center text-xl">
              {gateType === 'subscription' 
                ? "Upgrade to Unlock VibeCoder" 
                : "Insufficient Credits"}
            </DialogTitle>
            <DialogDescription className="text-center text-zinc-400">
              {gateType === 'subscription' 
                ? "VibeCoder is a premium feature. Upgrade to Creator or Agency to start building AI-powered storefronts."
                : `You need at least 25 credits to generate a storefront. You currently have ${credits} credits.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={() => {
                setShowGateModal(false);
                goToPricing();
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white"
            >
              {gateType === 'subscription' ? "View Plans" : "Top Up Credits"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowGateModal(false)}
              className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SuggestionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs font-medium text-zinc-400 hover:text-white transition-all backdrop-blur-sm"
    >
      {label}
    </button>
  );
}
