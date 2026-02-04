// Editor tools and AI platforms - text only, clean and professional
const partners = [
  'After Effects',
  'Premiere Pro',
  'DaVinci Resolve',
  'Final Cut Pro',
  'OpenAI',
  'Midjourney',
  'Runway',
  'CapCut',
  'Photoshop',
  'Blender',
  'Cinema 4D',
  'Topaz AI',
];

export function PartnerLogos() {
  const allPartners = [...partners, ...partners];

  return (
    <section className="relative py-8 sm:py-10 overflow-hidden">
      {/* Edge fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling text - minimal */}
      <div className="flex animate-marquee">
        {allPartners.map((name, index) => (
          <span
            key={`${name}-${index}`}
            className="px-6 sm:px-10 text-sm sm:text-base font-medium text-foreground/30 hover:text-foreground/50 transition-colors duration-300 whitespace-nowrap shrink-0"
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
