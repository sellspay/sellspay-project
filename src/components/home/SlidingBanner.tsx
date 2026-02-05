import davinciLogo from '@/assets/logos/davinci-resolve.png';
import premiereLogo from '@/assets/logos/premiere-pro.png';
import afterEffectsLogo from '@/assets/logos/after-effects.png';
import openaiLogo from '@/assets/logos/openai-full.png';
import soraLogo from '@/assets/logos/sora-color.png';
import klingLogo from '@/assets/logos/kling-full.png';
import pikaLogo from '@/assets/logos/pika.png';
import veo3Logo from '@/assets/logos/veo3.png';

const logos = [
  { name: 'DaVinci Resolve', src: davinciLogo },
  { name: 'Premiere Pro', src: premiereLogo },
  { name: 'After Effects', src: afterEffectsLogo },
  { name: 'OpenAI', src: openaiLogo },
  { name: 'Sora', src: soraLogo },
  { name: 'Kling AI', src: klingLogo },
  { name: 'Pika', src: pikaLogo },
  { name: 'Veo 3', src: veo3Logo },
];

export default function SlidingBanner() {
  // We render TWO identical rows side-by-side inside a single "track".
  // Animating translateX(-50%) moves by exactly one row width → seamless loop.
  const LogoRow = () => (
    <div className="flex items-center gap-10 sm:gap-12 pr-10 sm:pr-12 shrink-0">
      {logos.map((logo, index) => (
        <img
          key={index}
          src={logo.src}
          alt={logo.name}
          className="h-7 sm:h-8 w-auto object-contain grayscale invert opacity-60"
        />
      ))}
    </div>
  );

  return (
    <div className="relative w-full py-4 sm:py-5 overflow-hidden border-y border-border/30">
      {/* Edge fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling track - two identical rows; animate by -50% for seamless loop */}
      <div className="flex w-max animate-marquee-scroll">
        <LogoRow />
        <LogoRow />
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee-scroll {
          animation: marquee-scroll 18s linear infinite;
        }
      `}</style>
    </div>
  );
}
