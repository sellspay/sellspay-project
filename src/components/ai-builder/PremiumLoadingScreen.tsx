import React from "react";
import sellspayLogo from "@/assets/sellspay-s-logo-new.png";
import heroBg from "@/assets/hero-aurora-bg.jpg";

export function PremiumLoadingScreen() {
  return (
    // ENSURE bg-black is here to fix the "red background" bug
    <div className="h-screen w-full relative overflow-hidden bg-black flex flex-col items-center justify-center p-4 z-50">
      
      {/* Background Image - Same as LovableHero for continuity */}
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

        {/* Headline */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500">
          Architecting your solution...
        </h2>
        
        {/* Subtext */}
        <p className="text-zinc-400 text-sm mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-delay:100ms]">
          Spinning up secure sandbox environment
        </p>

        {/* PROGRESS BAR */}
        <div className="w-64 h-1 bg-zinc-800/50 rounded-full overflow-hidden relative animate-in fade-in duration-500 [animation-delay:200ms]">
          {/* Animated Gradient Bar */}
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500 w-[30%] animate-loading-bar rounded-full" />
        </div>

        {/* Subtle status dots */}
        <div className="flex items-center gap-2 mt-6 text-xs text-zinc-500">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>Initializing VibeCoder v2</span>
        </div>
      </div>
    </div>
  );
}
