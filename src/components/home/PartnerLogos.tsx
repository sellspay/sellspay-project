import { Reveal } from './Reveal';

// Using text-based logos for a clean, professional look
const partners = [
  { name: 'Microsoft', logo: '⊞' },
  { name: 'Google', logo: null },
  { name: 'Apple', logo: '' },
  { name: 'Adobe', logo: null },
  { name: 'Netflix', logo: null },
  { name: 'Spotify', logo: null },
  { name: 'Amazon', logo: null },
  { name: 'Disney', logo: null },
  { name: 'Warner Bros', logo: null },
  { name: 'Sony', logo: null },
];

export function PartnerLogos() {
  const allPartners = [...partners, ...partners, ...partners];

  return (
    <section className="relative py-12 sm:py-16 overflow-hidden">
      {/* Subtle top/bottom borders only */}
      <div className="absolute inset-x-0 top-0 h-px bg-border/20" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-border/20" />
      
      {/* Edge fade masks - blend seamlessly */}
      <div className="absolute left-0 top-0 bottom-0 w-40 sm:w-64 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-40 sm:w-64 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling logos - minimal, professional */}
      <div className="flex animate-marquee">
        {allPartners.map((partner, index) => (
          <div
            key={`${partner.name}-${index}`}
            className="flex items-center justify-center px-10 sm:px-16 shrink-0"
          >
            <span className="text-xl sm:text-2xl font-semibold text-foreground/30 hover:text-foreground/60 transition-colors duration-300 whitespace-nowrap tracking-wide">
              {partner.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
