import { Sparkles, Zap, Music, Palette, Video, Wand2 } from 'lucide-react';

const bannerItems = [
  { icon: Wand2, text: 'Voice Isolator', highlight: true },
  { icon: Music, text: 'Music Splitter' },
  { icon: Palette, text: 'Manga Generator' },
  { icon: Video, text: 'Professional Editors' },
  { icon: Sparkles, text: 'Premium Assets' },
  { icon: Zap, text: 'LUTs & Presets' },
];

export default function SlidingBanner() {
  // Duplicate items for seamless loop
  const items = [...bannerItems, ...bannerItems, ...bannerItems];

  return (
    <div className="relative w-full py-4 overflow-hidden bg-gradient-to-r from-primary/5 via-transparent to-accent/5 border-y border-border/30">
      {/* Gradient overlays for seamless edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
      
      <div className="flex animate-marquee">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-8 shrink-0"
          >
            <div className={`p-1.5 rounded-lg ${item.highlight ? 'bg-primary/20' : 'bg-muted/50'}`}>
              <item.icon className={`h-4 w-4 ${item.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <span className={`text-sm font-medium whitespace-nowrap ${item.highlight ? 'text-primary' : 'text-muted-foreground'}`}>
              {item.text}
            </span>
            <span className="text-muted-foreground/30">•</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}