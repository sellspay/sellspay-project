import { Sparkles, Zap, Music, Palette, Video, Wand2, AudioLines, Clapperboard } from 'lucide-react';

const bannerItems = [
  { icon: Wand2, text: 'Voice Isolator', color: 'from-violet-500 to-purple-600' },
  { icon: Music, text: 'Music Splitter', color: 'from-pink-500 to-rose-600' },
  { icon: Palette, text: 'Manga Generator', color: 'from-cyan-500 to-blue-600' },
  { icon: Video, text: 'Professional Editors', color: 'from-amber-500 to-orange-600' },
  { icon: Sparkles, text: 'Premium Assets', color: 'from-emerald-500 to-teal-600' },
  { icon: Zap, text: 'LUTs & Presets', color: 'from-yellow-500 to-amber-600' },
  { icon: AudioLines, text: 'Audio Tools', color: 'from-indigo-500 to-violet-600' },
  { icon: Clapperboard, text: 'Video Templates', color: 'from-fuchsia-500 to-pink-600' },
];

export default function SlidingBanner() {
  // Duplicate items for seamless loop - need at least 2 full copies
  const items = [...bannerItems, ...bannerItems];

  return (
    <div className="group/banner relative w-full py-5 overflow-hidden bg-gradient-to-r from-card/50 via-background to-card/50 border-y border-border/20">
      {/* Premium gradient overlays for seamless edges */}
      <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
      
      <div className="flex w-max animate-banner-marquee group-hover/banner:[animation-play-state:paused]">
        {items.map((item, index) => (
          <div
            key={index}
            className="group/item flex items-center gap-3 px-8 shrink-0 cursor-pointer"
          >
            {/* Icon with gradient background on hover */}
            <div className="relative p-2 rounded-xl bg-muted/30 border border-transparent group-hover/item:border-primary/30 group-hover/item:bg-gradient-to-br group-hover/item:from-primary/20 group-hover/item:to-accent/10 group-hover/item:scale-125 group-hover/item:shadow-lg group-hover/item:shadow-primary/20 transition-all duration-300">
              <item.icon className="h-4 w-4 text-muted-foreground group-hover/item:text-primary group-hover/item:drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)] transition-all duration-300" />
            </div>
            
            {/* Text with gradient on hover */}
            <span className="text-sm font-semibold whitespace-nowrap text-muted-foreground group-hover/item:text-transparent group-hover/item:bg-gradient-to-r group-hover/item:bg-clip-text group-hover/item:from-primary group-hover/item:to-accent group-hover/item:scale-110 transition-all duration-300 origin-left">
              {item.text}
            </span>
            
            {/* Separator dot */}
            <span className="text-border/50 group-hover/item:text-primary/50 transition-colors duration-300 ml-2">•</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes banner-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-banner-marquee {
          animation: banner-marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}