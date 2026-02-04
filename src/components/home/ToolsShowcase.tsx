import { useNavigate } from 'react-router-dom';
import { Reveal } from './Reveal';
import { ChevronRight, Sparkles, Music, Image, Video } from 'lucide-react';

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
      <section className="py-24 sm:py-32 lg:py-40">
        <div className="px-8 sm:px-12 lg:px-20">
          {/* Header */}
          <div className="text-center mb-14 sm:mb-20">
            <h2 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-serif font-normal text-foreground tracking-tight italic">
              AI Toolkit
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground mt-6 max-w-2xl mx-auto">
              The only organized AI platform for creators
            </p>
            
            {/* CTA Button */}
            <button
              onClick={() => navigate('/tools')}
              className="mt-10 px-12 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg transition-colors duration-200"
            >
              Go to Toolkit
            </button>
          </div>

          {/* MASSIVE Card Container - Almost hero-sized */}
          <div className="relative max-w-7xl mx-auto">
            {/* Subtle white border accent */}
            <div className="absolute -inset-px bg-gradient-to-br from-foreground/10 via-transparent to-foreground/5 pointer-events-none" />
            
            {/* Card with subtle border */}
            <div className="relative overflow-hidden border border-foreground/10 bg-card/30 p-4 sm:p-6">
              {/* Image Grid - Bento style - MUCH LARGER */}
              <div className="grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3 aspect-[2.2/1] min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
                {/* Left tall image */}
                <div className={`row-span-2 bg-gradient-to-br ${toolImages[0].gradient} relative overflow-hidden group`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {/* Decorative corner element */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-foreground/20" />
                </div>
                
                {/* Center tall image */}
                <div className={`row-span-2 bg-gradient-to-br ${toolImages[1].gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {toolImages[1].label && (
                    <span className="absolute bottom-4 right-4 text-xs font-medium text-foreground/70 bg-background/40 backdrop-blur-sm px-3 py-1.5 border border-foreground/10">
                      {toolImages[1].label}
                    </span>
                  )}
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 border border-foreground/30 bg-background/10 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[20px] border-l-foreground/80 border-y-[12px] border-y-transparent ml-1.5" />
                    </div>
                  </div>
                </div>
                
                {/* Top right images */}
                <div className={`bg-gradient-to-br ${toolImages[2].gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className={`bg-gradient-to-br ${toolImages[3].gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {/* Decorative corner element */}
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-foreground/20" />
                </div>
                
                {/* Bottom right images */}
                <div className={`bg-gradient-to-br ${toolImages[4].gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className={`bg-gradient-to-br ${toolImages[5].gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {toolImages[5].label && (
                    <span className="absolute bottom-3 right-3 text-xs font-medium text-foreground/70 bg-background/40 backdrop-blur-sm px-2 py-1 border border-foreground/10">
                      {toolImages[5].label}
                    </span>
                  )}
                </div>
              </div>

              {/* Floating toggle button in center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="flex items-center gap-2 bg-card/95 backdrop-blur-md border border-foreground/20 px-5 py-3">
                  <span className="text-base font-semibold text-foreground">AI Toolkit</span>
                  <div className="flex items-center gap-1 ml-3 border-l border-foreground/20 pl-3">
                    <div className="w-8 h-8 flex items-center justify-center border border-foreground/10 bg-muted/30">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center border border-foreground/10">
                      <Music className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom prompt bar */}
              <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 w-full max-w-lg px-6">
                <div className="flex items-center gap-4 bg-card/90 backdrop-blur-md border border-foreground/15 px-5 py-4">
                  <div className="flex gap-1.5">
                    <div className="w-9 h-9 flex items-center justify-center border border-foreground/15 bg-muted/20">
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="w-9 h-9 flex items-center justify-center border border-foreground/15 bg-muted/20">
                      <Video className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <span className="text-base text-muted-foreground flex-1">Describe what you want to create...</span>
                  <button className="w-10 h-10 flex items-center justify-center bg-primary/20 border border-primary/30 hover:bg-primary/30 transition-colors">
                    <ChevronRight className="h-5 w-5 text-primary rotate-[-90deg]" />
                  </button>
                </div>
              </div>
              
              {/* Decorative corner accents - white contrast elements */}
              <div className="absolute top-0 right-0 w-24 h-24">
                <div className="absolute top-4 right-4 w-12 h-px bg-foreground/20" />
                <div className="absolute top-4 right-4 w-px h-12 bg-foreground/20" />
              </div>
              <div className="absolute bottom-0 left-0 w-24 h-24">
                <div className="absolute bottom-4 left-4 w-12 h-px bg-foreground/20" />
                <div className="absolute bottom-4 left-4 w-px h-12 bg-foreground/20" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}