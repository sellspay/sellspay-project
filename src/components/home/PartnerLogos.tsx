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
      <section className="py-14 sm:py-16 overflow-hidden border-b border-border/30">
        <div className="px-4 sm:px-8 lg:px-12 mb-10">
          <p className="text-center text-sm sm:text-base font-medium text-muted-foreground uppercase tracking-widest">
            Trusted by creators using
          </p>
        </div>
        
        {/* Marquee container */}
        <div className="relative">
          {/* Edge fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling content */}
          <div className="flex animate-marquee hover:[animation-play-state:paused]">
            {allPartners.map((partner, index) => {
              const Icon = partner.icon;
              return (
                <div
                  key={`${partner.name}-${index}`}
                  className="flex items-center gap-3 sm:gap-4 px-6 sm:px-10 py-4 sm:py-5 mx-3 sm:mx-5 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:border-primary/30 grayscale hover:grayscale-0 group cursor-default shrink-0"
                >
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-base sm:text-lg font-semibold text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
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
