import openaiLogo from '@/assets/logos/openai.png';
import midjourneyLogo from '@/assets/logos/midjourney.png';
import runwayLogo from '@/assets/logos/runway.png';
import elevenlabsLogo from '@/assets/logos/elevenlabs.png';
import soraLogo from '@/assets/logos/sora.png';
import klingLogo from '@/assets/logos/kling.png';
import topazLogo from '@/assets/logos/topaz.png';
import fluxLogo from '@/assets/logos/flux.jpg';

const partners = [
  { name: 'OpenAI', logo: openaiLogo },
  { name: 'Midjourney', logo: midjourneyLogo },
  { name: 'Runway', logo: runwayLogo },
  { name: 'ElevenLabs', logo: elevenlabsLogo },
  { name: 'Sora', logo: soraLogo },
  { name: 'Kling', logo: klingLogo },
  { name: 'Topaz AI', logo: topazLogo },
  { name: 'Flux', logo: fluxLogo },
];

export function PartnerLogos() {
  const allPartners = [...partners, ...partners];

  return (
    <section className="relative py-5 overflow-hidden bg-background border-y border-border/20">
      {/* Edge fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling content */}
      <div className="flex animate-marquee">
        {allPartners.map((partner, index) => (
          <div
            key={`${partner.name}-${index}`}
            className="flex items-center gap-2.5 px-8 sm:px-10 shrink-0"
          >
            <img 
              src={partner.logo} 
              alt={partner.name}
              className="h-6 w-6 object-contain rounded-sm opacity-60 grayscale"
            />
            <span className="text-sm font-medium text-foreground/50 whitespace-nowrap tracking-wide">
              {partner.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
