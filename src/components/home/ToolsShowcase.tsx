import { useNavigate } from 'react-router-dom';
import { Reveal } from './Reveal';
import { ChevronRight } from 'lucide-react';

// Sample tool showcase images - using placeholder gradients
const toolImages = [
  { id: 1, gradient: 'from-amber-900/60 to-stone-900', label: null },
  { id: 2, gradient: 'from-orange-600/40 to-black', label: 'Video' },
  { id: 3, gradient: 'from-sky-900/50 to-slate-900', label: null },
  { id: 4, gradient: 'from-red-900/40 to-stone-900', label: null },
  { id: 5, gradient: 'from-cyan-800/30 to-slate-900', label: null },
  { id: 6, gradient: 'from-orange-700/50 to-black', label: 'Video' },
];

export function ToolsShowcase() {
  const navigate = useNavigate();

  return (
    <Reveal>
      <section className="py-20 sm:py-28 lg:py-36">
        <div className="px-6 sm:px-8 lg:px-12">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-serif font-normal text-foreground tracking-tight italic">
              AI Toolkit
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mt-4">
              The only organized AI platform for creators
            </p>
            
            {/* CTA Button - Primary accent */}
            <button
              onClick={() => navigate('/tools')}
              className="mt-8 px-10 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base transition-colors duration-200"
            >
              Go to Toolkit
            </button>
          </div>

          {/* Massive Card Container */}
          <div className="relative max-w-6xl mx-auto">
            {/* Card with subtle border and glass effect */}
            <div className="relative overflow-hidden border border-border/30 bg-card/20 backdrop-blur-sm p-3 sm:p-4">
              {/* Image Grid - Bento style */}
              <div className="grid grid-cols-4 grid-rows-2 gap-1.5 sm:gap-2 aspect-[2/1]">
                {/* Left tall image */}
                <div className={`row-span-2 bg-gradient-to-br ${toolImages[0].gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                
                {/* Center tall image */}
                <div className={`row-span-2 bg-gradient-to-br ${toolImages[1].gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {toolImages[1].label && (
                    <span className="absolute bottom-3 right-3 text-xs font-medium text-white/70 bg-black/40 px-2 py-1">
                      {toolImages[1].label}
                    </span>
                  )}
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[10px] border-y-transparent ml-1" />
                    </div>
                  </div>
                </div>
                
                {/* Top right images */}
                <div className={`bg-gradient-to-br ${toolImages[2].gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className={`bg-gradient-to-br ${toolImages[3].gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                
                {/* Bottom right images */}
                <div className={`bg-gradient-to-br ${toolImages[4].gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className={`bg-gradient-to-br ${toolImages[5].gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {toolImages[5].label && (
                    <span className="absolute bottom-2 right-2 text-xs font-medium text-white/70 bg-black/40 px-2 py-0.5">
                      {toolImages[5].label}
                    </span>
                  )}
                </div>
              </div>

              {/* Floating toggle button in center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="flex items-center gap-1 bg-card/90 backdrop-blur-md border border-border/50 px-4 py-2">
                  <span className="text-sm font-medium text-foreground">AI Toolkit</span>
                  <div className="flex items-center gap-0.5 ml-2 border-l border-border/50 pl-2">
                    <div className="w-6 h-6 flex items-center justify-center bg-muted/50">
                      <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="w-6 h-6 flex items-center justify-center">
                      <Music className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom prompt bar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
                <div className="flex items-center gap-3 bg-card/80 backdrop-blur-md border border-border/40 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-7 h-7 flex items-center justify-center bg-muted/50 border border-border/30">
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="w-7 h-7 flex items-center justify-center bg-muted/50 border border-border/30">
                      <Video className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground flex-1">Describe what you want to create...</span>
                  <button className="w-8 h-8 flex items-center justify-center bg-muted/50 border border-border/30 hover:bg-muted transition-colors">
                    <ChevronRight className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

// Import icons
import { Sparkles, Music, Image, Video } from 'lucide-react';