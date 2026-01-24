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
  // Duplicate for seamless loop
  const allPartners = [...partners, ...partners];

  return (
    <Reveal>
      <section className="py-12 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mb-8">
          <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Trusted by creators using
          </p>
        </div>
        
        {/* Marquee container */}
        <div className="relative">
          {/* Edge fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling content */}
          <div className="flex animate-marquee hover:[animation-play-state:paused]">
            {allPartners.map((partner, index) => {
              const Icon = partner.icon;
              return (
                <div
                  key={`${partner.name}-${index}`}
                  className="flex items-center gap-3 px-8 py-4 mx-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:border-border grayscale hover:grayscale-0 group cursor-default shrink-0"
                >
                  <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
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
