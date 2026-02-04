// Editor tools and AI platforms marquee
const partners = [
  { name: 'After Effects', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Adobe_After_Effects_CC_icon.svg' },
  { name: 'Premiere Pro', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Adobe_Premiere_Pro_CC_icon.svg' },
  { name: 'DaVinci Resolve', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/DaVinci_Resolve_17_logo.svg' },
  { name: 'Final Cut Pro', logo: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Final_Cut_Pro_X_10.6_icon.png' },
  { name: 'OpenAI', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg' },
  { name: 'Midjourney', logo: null },
  { name: 'Runway', logo: null },
  { name: 'CapCut', logo: 'https://upload.wikimedia.org/wikipedia/en/b/b0/CapCut_logo.svg' },
  { name: 'Photoshop', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Adobe_Photoshop_CC_icon.svg' },
  { name: 'Blender', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Blender_logo_no_text.svg' },
  { name: 'Cinema 4D', logo: null },
  { name: 'Topaz AI', logo: null },
];

export function PartnerLogos() {
  const allPartners = [...partners, ...partners, ...partners];

  return (
    <section className="relative py-10 sm:py-14 overflow-hidden">
      {/* Edge fade masks - seamless blend */}
      <div className="absolute left-0 top-0 bottom-0 w-32 sm:w-48 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 sm:w-48 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling logos - clean, no shadows */}
      <div className="flex animate-marquee">
        {allPartners.map((partner, index) => (
          <div
            key={`${partner.name}-${index}`}
            className="flex items-center gap-3 px-8 sm:px-12 shrink-0"
          >
            {partner.logo ? (
              <img 
                src={partner.logo} 
                alt={partner.name}
                className="h-6 sm:h-8 w-auto opacity-40 hover:opacity-70 transition-opacity duration-300 grayscale"
              />
            ) : null}
            <span className="text-base sm:text-lg font-medium text-foreground/40 hover:text-foreground/70 transition-colors duration-300 whitespace-nowrap">
              {partner.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
