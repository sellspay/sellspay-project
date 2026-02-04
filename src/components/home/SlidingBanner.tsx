import davinciLogo from '@/assets/logos/davinci-resolve.png';
import premiereLogo from '@/assets/logos/premiere-pro.png';
import afterEffectsLogo from '@/assets/logos/after-effects.png';
import openaiLogo from '@/assets/logos/openai-full.png';
import soraLogo from '@/assets/logos/sora-color.png';
import klingLogo from '@/assets/logos/kling-full.png';

const logos = [
  { name: 'DaVinci Resolve', src: davinciLogo },
  { name: 'Premiere Pro', src: premiereLogo },
  { name: 'After Effects', src: afterEffectsLogo },
  { name: 'OpenAI', src: openaiLogo },
  { name: 'Sora', src: soraLogo },
  { name: 'Kling AI', src: klingLogo },
];

export default function SlidingBanner() {
  const renderItems = () => (
    <>
      {logos.map((logo, index) => (
        <div
          key={index}
          className="flex items-center justify-center px-8 sm:px-12 shrink-0"
        >
          <img 
            src={logo.src} 
            alt={logo.name}
            className="h-8 sm:h-10 w-auto object-contain opacity-70"
          />
        </div>
      ))}
    </>
  );

  return (
    <div className="relative w-full py-5 sm:py-6 overflow-hidden border-y border-border/30">
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
          animation: banner-marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
}
