import { Reveal } from './Reveal';
import { 
  Clapperboard, 
  Palette, 
  Video, 
  Music, 
  Camera, 
  Wand2,
  Film,
  Layers
} from 'lucide-react';

const partners = [
  { name: 'Premiere Pro', icon: Film },
  { name: 'After Effects', icon: Wand2 },
  { name: 'DaVinci Resolve', icon: Palette },
  { name: 'Final Cut Pro', icon: Clapperboard },
  { name: 'CapCut', icon: Video },
  { name: 'Logic Pro', icon: Music },
  { name: 'Lightroom', icon: Camera },
  { name: 'Photoshop', icon: Layers },
];

export function PartnerLogos() {
  const allPartners = [...partners, ...partners];

  return (
    <Reveal>
      <section className="py-16 sm:py-20 overflow-hidden border-b border-border/30 bg-card/20">
        <div className="px-6 sm:px-8 lg:px-12 mb-10 sm:mb-12">
          <p className="text-center text-lg sm:text-xl font-medium text-muted-foreground">
            Compatible with your favorite creative tools
          </p>
        </div>
        
        {/* Marquee container */}
        <div className="relative">
          {/* Edge fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 sm:w-48 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 sm:w-48 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling content - BIGGER */}
          <div className="flex animate-marquee hover:[animation-play-state:paused]">
            {allPartners.map((partner, index) => {
              const Icon = partner.icon;
              return (
                <div
                  key={`${partner.name}-${index}`}
                  className="flex items-center gap-4 sm:gap-5 px-8 sm:px-12 py-5 sm:py-6 mx-4 sm:mx-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:border-primary/30 grayscale hover:grayscale-0 group cursor-default shrink-0"
                >
                  <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-lg sm:text-xl lg:text-2xl font-semibold text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                    {partner.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
