const bannerItems = [
  'Voice Isolator',
  'Music Splitter',
  'Professional Editors',
  'Premium Assets',
  'LUTs & Presets',
  'Audio Tools',
  'Video Templates',
  'SFX Packs',
];

export default function SlidingBanner() {
  const renderItems = () => (
    <>
      {bannerItems.map((text, index) => (
        <div
          key={index}
          className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 shrink-0"
        >
          <span className="text-sm sm:text-base font-medium whitespace-nowrap text-muted-foreground">
            {text}
          </span>
          <span className="text-border/50">·</span>
        </div>
      ))}
    </>
  );

  return (
    <div className="relative w-full py-4 sm:py-5 overflow-hidden border-y border-border/30">
      {/* Edge fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Two identical tracks for seamless loop */}
      <div className="flex">
        <div className="flex shrink-0 animate-banner-marquee">
          {renderItems()}
        </div>
        <div className="flex shrink-0 animate-banner-marquee">
          {renderItems()}
        </div>
      </div>

      <style>{`
        @keyframes banner-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-banner-marquee {
          animation: banner-marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
