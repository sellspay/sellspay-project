import { Sparkles, Wand2, Video, Music, Mic, Layers, Cpu, Zap } from 'lucide-react';

// AI tools and platforms that creators use
const partners = [
  { name: 'Sora', icon: Sparkles },
  { name: 'Veo', icon: Video },
  { name: 'Nano Banana', icon: Zap },
  { name: 'Kling', icon: Wand2 },
  { name: 'Seedance', icon: Layers },
  { name: 'Seedream', icon: Layers },
  { name: 'Flux', icon: Cpu },
  { name: 'ElevenLabs', icon: Mic },
  { name: 'Runway', icon: Video },
  { name: 'Midjourney', icon: Sparkles },
  { name: 'OpenAI', icon: Cpu },
  { name: 'Topaz AI', icon: Wand2 },
];

export function PartnerLogos() {
  const allPartners = [...partners, ...partners];

  return (
    <section className="relative py-4 overflow-hidden bg-background">
      {/* Edge fade masks - seamless blend into background */}
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling content - clean, professional */}
      <div className="flex animate-marquee">
        {allPartners.map((partner, index) => {
          const Icon = partner.icon;
          return (
            <div
              key={`${partner.name}-${index}`}
              className="flex items-center gap-2 px-6 sm:px-8 shrink-0"
            >
              <Icon className="h-4 w-4 text-foreground/40" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground/40 whitespace-nowrap tracking-wide">
                {partner.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}