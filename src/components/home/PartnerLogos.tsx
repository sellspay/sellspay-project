// AI tools and platforms that creators use - with real logos
const partners = [
  { name: 'OpenAI', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg' },
  { name: 'Midjourney', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png' },
  { name: 'Runway', logo: 'https://images.seeklogo.com/logo-png/52/1/runway-logo-png_seeklogo-523703.png' },
  { name: 'ElevenLabs', logo: 'https://images.seeklogo.com/logo-png/61/1/elevenlabs-logo-png_seeklogo-610844.png' },
  { name: 'Sora', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg' },
  { name: 'Kling', logo: 'https://framerusercontent.com/images/7NLMd59EzeMffhR3fSWAkQWec.png' },
  { name: 'Topaz AI', logo: 'https://images.seeklogo.com/logo-png/52/2/topaz-labs-logo-png_seeklogo-522489.png' },
  { name: 'Flux', logo: 'https://blackforestlabs.ai/wp-content/uploads/2024/07/bfl-logo-t-1-1.svg' },
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
              className="h-5 w-5 object-contain opacity-50 grayscale"
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
