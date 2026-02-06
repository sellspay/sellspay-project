import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import sellspayLogo from "@/assets/sellspay-s-logo-new.png";
import heroBg from "@/assets/hero-aurora-bg.jpg";

// Minimum time the loading screen should be visible (in ms)
const MIN_LOADING_TIME = 4000;

// Loading status messages that cycle
const LOADING_MESSAGES = [
  { headline: "Architecting your solution...", subtext: "Spinning up secure sandbox environment" },
  { headline: "Loading your workspace...", subtext: "Preparing AI-powered canvas" },
  { headline: "Almost ready...", subtext: "Finalizing your studio" },
];

interface PremiumLoadingScreenProps {
  onComplete?: () => void;
  forceShow?: boolean; // If true, will always show (for external control)
}

export function PremiumLoadingScreen({ onComplete, forceShow }: PremiumLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Animate progress bar smoothly to 100% over MIN_LOADING_TIME
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / MIN_LOADING_TIME) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        // Start fade out animation
        setIsExiting(true);
        // After fade animation completes, call onComplete
        setTimeout(() => {
          onComplete?.();
        }, 500); // Match fade-out duration
      }
    }, 16); // ~60fps updates

    return () => clearInterval(interval);
  }, [onComplete]);

  // Cycle through messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);

    return () => clearInterval(messageInterval);
  }, []);

  const currentMessage = LOADING_MESSAGES[messageIndex];

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="h-screen w-full fixed inset-0 overflow-hidden bg-black flex flex-col items-center justify-center p-4 z-50"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Animated ambient glow orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-violet-600/10 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse-slow [animation-delay:1000ms]" />
          </div>
          
          {/* MAIN CONTENT */}
          <div className="relative z-10 flex flex-col items-center">
            
            {/* Pulsing Logo Container */}
            <div className="mb-8 relative">
              {/* Subtle glow behind logo */}
              <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full animate-pulse-slow scale-150" />
              
              <div className="relative bg-zinc-900/80 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl shadow-orange-500/10 animate-pulse">
                <img 
                  src={sellspayLogo} 
                  alt="SellsPay" 
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>

            {/* Dynamic Headline */}
            <AnimatePresence mode="wait">
              <motion.h2
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight"
              >
                {currentMessage.headline}
              </motion.h2>
            </AnimatePresence>
            
            {/* Dynamic Subtext */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`sub-${messageIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-zinc-400 text-sm mb-8"
              >
                {currentMessage.subtext}
              </motion.p>
            </AnimatePresence>

            {/* SMOOTH PROGRESS BAR */}
            <div className="w-64 h-1.5 bg-zinc-800/50 rounded-full overflow-hidden relative">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>

            {/* Progress percentage */}
            <div className="flex items-center gap-2 mt-6 text-xs text-zinc-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>VibeCoder v2 • {Math.round(progress)}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
