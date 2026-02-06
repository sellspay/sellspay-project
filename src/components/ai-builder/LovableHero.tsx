import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, ArrowLeft, Mic, Zap, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import heroBg from "@/assets/hero-aurora-bg.jpg";

interface LovableHeroProps {
  onStart: (prompt: string, isPlanMode?: boolean) => void;
  userName?: string;
}

export function LovableHero({ onStart, userName = "Creator" }: LovableHeroProps) {
  const [prompt, setPrompt] = useState("");
  const [isPlanMode, setIsPlanMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);
  const [gateType, setGateType] = useState<'subscription' | 'credits'>('subscription');
  
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const { isPremium, credits, hasCredits, goToPricing, loading: subLoading } = useSubscription();

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false; // Only get final results to avoid duplicates
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        // Get the final transcript from the last result
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript;
          setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      console.warn('Speech recognition not supported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Don't clear - append to existing text
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim()) return;
    
    // Gate check: must have premium subscription AND credits
    if (!isPremium) {
      setGateType('subscription');
      setShowGateModal(true);
      return;
    }
    
    if (!hasCredits(25)) { // Vibecoder costs 25 credits
      setGateType('credits');
      setShowGateModal(true);
      return;
    }

    onStart(prompt, isPlanMode);
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Just paste into the input - don't auto-start
    setPrompt(suggestion);
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black flex flex-col items-center justify-center p-4">
      
      {/* Background Image - Full opacity for 4K quality */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      
      {/* Subtle overlay for text readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Back Button */}
      <button
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate('/');
          }
        }}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-zinc-400 hover:text-white transition-all backdrop-blur-sm"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
        
        {/* Pill Badge */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-orange-200 tracking-wide uppercase">
            Agentic V2 Model
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-10 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          What's on your mind, {userName}?
        </h1>

        {/* The Magic Input Bar */}
        <form 
          onSubmit={handleSubmit}
          className="w-full relative group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-rose-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl transition-all focus-within:border-orange-500/30 focus-within:bg-zinc-900/90 focus-within:scale-[1.01]">
            
            {/* Add Button */}
            <button 
              type="button" 
              className="p-3 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all mr-2"
            >
              <Plus size={20} />
            </button>

            {/* Text Input */}
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask VibeCoder to create a landing page for..."
              className="flex-1 bg-transparent border-none text-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0 font-medium"
              autoFocus
            />

            {/* Action Icons */}
            <div className="flex items-center gap-1 pl-2">
              {/* Microphone / Voice Button */}
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
              
              {/* Plan Toggle */}
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
              
              {/* Submit Button */}
              <button 
                type="submit"
                disabled={!prompt.trim() || subLoading}
                className="p-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl hover:from-orange-400 hover:to-rose-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </form>

        {/* Suggestion Chips - now just paste text */}
        <div className="flex flex-wrap justify-center gap-3 mt-8 animate-in fade-in duration-1000 delay-300">
          <SuggestionChip label="SaaS Dashboard" onClick={() => handleSuggestionClick("Create a dark mode SaaS dashboard")} />
          <SuggestionChip label="Portfolio Site" onClick={() => handleSuggestionClick("Build a minimalist portfolio for a designer")} />
          <SuggestionChip label="E-Commerce" onClick={() => handleSuggestionClick("Design a luxury watch store landing page")} />
        </div>
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

