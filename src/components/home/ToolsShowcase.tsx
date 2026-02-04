import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Reveal } from './Reveal';
import { ChevronRight, Sparkles, Music, Image, Video, Mic, Wand2, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ToolType = 'sfx' | 'vocal' | 'manga' | 'video';

interface ToolConfig {
  id: ToolType;
  name: string;
  icon: React.ElementType;
  prompts: string[];
  gradients: string[];
  accentColor: string;
}

const tools: ToolConfig[] = [
  {
    id: 'sfx',
    name: 'SFX Generator',
    icon: Sparkles,
    prompts: [
      'Cinematic explosion with debris...',
      'Sci-fi laser beam charging up...',
      'Thunderstorm with heavy rain...',
      'Footsteps on gravel path...',
    ],
    gradients: [
      'from-amber-900/60 to-stone-900',
      'from-orange-600/50 to-black',
      'from-yellow-900/40 to-stone-900',
      'from-amber-700/40 to-black',
      'from-orange-800/30 to-stone-900',
      'from-yellow-700/50 to-black',
    ],
    accentColor: 'text-amber-400',
  },
  {
    id: 'vocal',
    name: 'Vocal Remover',
    icon: Mic,
    prompts: [
      'Extract vocals from track...',
      'Isolate instrumental stems...',
      'Remove background noise...',
      'Separate drums and bass...',
    ],
    gradients: [
      'from-purple-900/60 to-slate-900',
      'from-violet-600/50 to-black',
      'from-fuchsia-900/40 to-slate-900',
      'from-purple-700/40 to-black',
      'from-violet-800/30 to-slate-900',
      'from-pink-700/50 to-black',
    ],
    accentColor: 'text-purple-400',
  },
  {
    id: 'manga',
    name: 'Manga Generator',
    icon: Wand2,
    prompts: [
      'Anime hero in dynamic pose...',
      'Kawaii character design...',
      'Epic battle scene panel...',
      'Serene cherry blossom background...',
    ],
    gradients: [
      'from-pink-900/60 to-slate-900',
      'from-rose-600/50 to-black',
      'from-red-900/40 to-slate-900',
      'from-pink-700/40 to-black',
      'from-rose-800/30 to-slate-900',
      'from-red-700/50 to-black',
    ],
    accentColor: 'text-pink-400',
  },
  {
    id: 'video',
    name: 'Video Generator',
    icon: Film,
    prompts: [
      'Drone shot over mountains...',
      'Slow-motion water splash...',
      'Timelapse of city lights...',
      'Cinematic car chase scene...',
    ],
    gradients: [
      'from-cyan-900/60 to-slate-900',
      'from-teal-600/50 to-black',
      'from-sky-900/40 to-slate-900',
      'from-cyan-700/40 to-black',
      'from-blue-800/30 to-slate-900',
      'from-teal-700/50 to-black',
    ],
    accentColor: 'text-cyan-400',
  },
];

export function ToolsShowcase() {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<ToolType>('sfx');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const activeConfig = tools.find(t => t.id === activeTool)!;

  // Typewriter effect
  useEffect(() => {
    const currentPrompt = activeConfig.prompts[currentPromptIndex];
    
    if (isTyping) {
      if (displayedText.length < currentPrompt.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentPrompt.slice(0, displayedText.length + 1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        // Finished typing, wait then start erasing
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayedText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 30);
        return () => clearTimeout(timeout);
      } else {
        // Finished erasing, move to next prompt
        setCurrentPromptIndex((prev) => (prev + 1) % activeConfig.prompts.length);
        setIsTyping(true);
      }
    }
  }, [displayedText, isTyping, currentPromptIndex, activeConfig.prompts]);

  // Reset animation when tool changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentPromptIndex(0);
    setIsTyping(true);
  }, [activeTool]);

  return (
    <Reveal>
      <section className="py-16 sm:py-24">
        <div className="px-4 sm:px-8 lg:px-12">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-7xl sm:text-8xl lg:text-9xl xl:text-[10rem] font-serif font-normal text-foreground tracking-tight italic">
              AI Toolkit
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground mt-4 max-w-2xl mx-auto">
              The only organized AI platform for creators
            </p>
            
            {/* CTA Button */}
            <button
              onClick={() => navigate('/tools')}
              className="mt-8 px-12 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg transition-colors duration-200"
            >
              Go to Toolkit
            </button>
          </div>

          {/* MASSIVE Card Container - Near full-width */}
          <div className="relative mx-auto" style={{ maxWidth: 'calc(100vw - 48px)' }}>
            {/* Subtle border accent */}
            <div className="absolute -inset-px bg-gradient-to-br from-foreground/10 via-transparent to-foreground/5 pointer-events-none" />
            
            {/* Card with subtle border */}
            <div className="relative overflow-hidden border border-foreground/10 bg-card/30 p-4 sm:p-6 lg:p-8">
              {/* Image Grid - Bento style - MASSIVE */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTool}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3 lg:gap-4"
                  style={{ minHeight: 'calc(100vh - 400px)', maxHeight: '800px' }}
                >
                  {/* Left tall image */}
                  <div className={`row-span-2 bg-gradient-to-br ${activeConfig.gradients[0]} relative overflow-hidden group`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-6 left-6 w-10 h-10 border-l-2 border-t-2 border-foreground/20" />
                  </div>
                  
                  {/* Center tall image */}
                  <div className={`row-span-2 bg-gradient-to-br ${activeConfig.gradients[1]} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {/* Play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 border border-foreground/30 bg-background/10 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[24px] border-l-foreground/80 border-y-[14px] border-y-transparent ml-2" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Top right images */}
                  <div className={`bg-gradient-to-br ${activeConfig.gradients[2]} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                  <div className={`bg-gradient-to-br ${activeConfig.gradients[3]} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-foreground/20" />
                  </div>
                  
                  {/* Bottom right images */}
                  <div className={`bg-gradient-to-br ${activeConfig.gradients[4]} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                  <div className={`bg-gradient-to-br ${activeConfig.gradients[5]} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-4 right-4 text-xs font-medium text-foreground/70 bg-background/40 backdrop-blur-sm px-3 py-1.5 border border-foreground/10">
                      {activeConfig.name}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Floating toggle bar in center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="flex items-center gap-2 bg-card/95 backdrop-blur-md border border-foreground/20 px-4 py-3">
                  <span className="text-base font-semibold text-foreground pr-3 border-r border-foreground/20">AI Toolkit</span>
                  <div className="flex items-center gap-1">
                    {tools.map((tool) => {
                      const Icon = tool.icon;
                      const isActive = activeTool === tool.id;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => setActiveTool(tool.id)}
                          className={`w-10 h-10 flex items-center justify-center border transition-all duration-200 ${
                            isActive 
                              ? 'border-primary/50 bg-primary/20' 
                              : 'border-foreground/10 bg-muted/30 hover:bg-muted/50'
                          }`}
                          title={tool.name}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom prompt bar with animated text */}
              <div className="absolute bottom-10 sm:bottom-12 left-1/2 -translate-x-1/2 z-10 w-full max-w-xl px-6">
                <div className="flex items-center gap-4 bg-card/90 backdrop-blur-md border border-foreground/15 px-5 py-4">
                  <div className="flex gap-1.5">
                    <div className="w-10 h-10 flex items-center justify-center border border-foreground/15 bg-muted/20">
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center border border-foreground/15 bg-muted/20">
                      <Video className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-base ${activeConfig.accentColor}`}>
                      {displayedText}
                      <span className="animate-pulse">|</span>
                    </span>
                  </div>
                  <button className="w-11 h-11 flex items-center justify-center bg-primary/20 border border-primary/30 hover:bg-primary/30 transition-colors shrink-0">
                    <ChevronRight className="h-5 w-5 text-primary rotate-[-90deg]" />
                  </button>
                </div>
              </div>
              
              {/* Decorative corner accents */}
              <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none">
                <div className="absolute top-6 right-6 w-14 h-px bg-foreground/20" />
                <div className="absolute top-6 right-6 w-px h-14 bg-foreground/20" />
              </div>
              <div className="absolute bottom-0 left-0 w-28 h-28 pointer-events-none">
                <div className="absolute bottom-6 left-6 w-14 h-px bg-foreground/20" />
                <div className="absolute bottom-6 left-6 w-px h-14 bg-foreground/20" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
