import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Reveal } from './Reveal';
import { AudioWaveform, MicVocal, Brush, Clapperboard } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { SFXView, VocalView, MangaView, VideoView, StudioGridView, ToolType, ToolConfig } from './toolkit';

const tools: ToolConfig[] = [
  {
    id: 'sfx',
    name: 'SFX Generator',
    icon: AudioWaveform,
    prompts: [
      'Cinematic explosion with debris...',
      'Sci-fi laser beam charging up...',
      'Thunderstorm with heavy rain...',
      'Footsteps on gravel path...',
    ],
    accentColor: 'text-amber-400',
    bgGradient: 'from-amber-900/40 to-stone-900',
  },
  {
    id: 'vocal',
    name: 'Vocal Remover',
    icon: MicVocal,
    prompts: [
      'Extract vocals from track...',
      'Isolate instrumental stems...',
      'Remove background noise...',
      'Separate drums and bass...',
    ],
    accentColor: 'text-purple-400',
    bgGradient: 'from-purple-900/40 to-slate-900',
  },
  {
    id: 'manga',
    name: 'Manga Generator',
    icon: Brush,
    prompts: [
      'Anime hero in dynamic pose...',
      'Kawaii character design...',
      'Epic battle scene panel...',
      'Serene cherry blossom background...',
    ],
    accentColor: 'text-pink-400',
    bgGradient: 'from-pink-900/40 to-slate-900',
  },
  {
    id: 'video',
    name: 'Video Generator',
    icon: Clapperboard,
    prompts: [
      'Drone shot over mountains...',
      'Slow-motion water splash...',
      'Timelapse of city lights...',
      'Cinematic car chase scene...',
    ],
    accentColor: 'text-cyan-400',
    bgGradient: 'from-cyan-900/40 to-slate-900',
  },
];

export function ToolsShowcase() {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<ToolType>('sfx');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const activeConfig = useMemo(() => tools.find(t => t.id === activeTool)!, [activeTool]);

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

  // Render the appropriate view based on active tool
  const renderToolView = () => {
    switch (activeTool) {
      case 'sfx':
        return <SFXView key="sfx" config={activeConfig} displayedText={displayedText} />;
      case 'vocal':
        return <VocalView key="vocal" config={activeConfig} />;
      case 'manga':
        return <MangaView key="manga" config={activeConfig} />;
      case 'video':
        return <VideoView key="video" config={activeConfig} displayedText={displayedText} />;
      default:
        return null;
    }
  };

  return (
    <Reveal>
      <section className="py-16 sm:py-24">
        <div className="px-4 sm:px-8 lg:px-12">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-7xl sm:text-8xl lg:text-9xl xl:text-[10rem] font-serif font-normal text-foreground tracking-tight italic">
              AI Studio
            </h2>
            <p className="text-xl sm:text-2xl text-muted-foreground mt-4 max-w-2xl mx-auto">
              Professional AI tools for modern creators
            </p>
            
            {/* CTA Button */}
            <button
              onClick={() => navigate('/tools')}
              className="mt-8 px-12 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg transition-colors duration-200"
            >
              Explore Tools
            </button>
          </div>

          {/* Main Tool Showcase Card */}
          <div className="relative mx-auto w-full mb-8" style={{ maxWidth: '1400px' }}>
            {/* Subtle border accent */}
            <div className="absolute -inset-px bg-gradient-to-br from-foreground/10 via-transparent to-foreground/5 pointer-events-none" />
            
            {/* Card with subtle border - fixed 16:11 aspect ratio */}
            <div className="relative overflow-hidden border border-foreground/10 bg-card/30" style={{ aspectRatio: '16 / 11' }}>
              <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center gap-1 bg-card/95 backdrop-blur-md border border-foreground/20 px-3 py-2">
                  <span className="text-sm font-medium text-foreground pr-3 border-r border-foreground/20">AI Studio</span>
                  <div className="flex items-center gap-1 pl-2">
                    {tools.map((tool) => {
                      const Icon = tool.icon;
                      const isActive = activeTool === tool.id;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => setActiveTool(tool.id)}
                          className={`w-9 h-9 flex items-center justify-center transition-all duration-200 ${
                            isActive 
                              ? 'border-2 border-primary bg-primary/10' 
                              : 'border border-foreground/10 bg-transparent hover:bg-muted/30'
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

              {/* Original Tool-Specific Views */}
              <AnimatePresence mode="wait">
                {renderToolView()}
              </AnimatePresence>
              
              {/* Decorative corner accents */}
              <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none z-10">
                <div className="absolute top-6 right-6 w-14 h-px bg-foreground/20" />
                <div className="absolute top-6 right-6 w-px h-14 bg-foreground/20" />
              </div>
              <div className="absolute bottom-0 left-0 w-28 h-28 pointer-events-none z-10">
                <div className="absolute bottom-6 left-6 w-14 h-px bg-foreground/20" />
                <div className="absolute bottom-6 left-6 w-px h-14 bg-foreground/20" />
              </div>
            </div>
          </div>

          {/* NEW: Additional Grid Gallery Below */}
          <div className="relative mx-auto w-full" style={{ maxWidth: '1400px' }}>
            <div className="absolute -inset-px bg-gradient-to-br from-foreground/10 via-transparent to-foreground/5 pointer-events-none" />
            
            <div className="relative overflow-hidden border border-foreground/10 bg-card/30" style={{ aspectRatio: '16 / 7' }}>
              <StudioGridView 
                config={activeConfig} 
                displayedText={displayedText}
                toolId={activeTool}
              />
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
