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

// Render a single group of logos
function LogoGroup({ keyPrefix }: { keyPrefix: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '40px',
        paddingRight: '40px',
        flex: '0 0 auto',
      }}
    >
      {logos.map((logo, index) => (
        <img
          key={`${keyPrefix}-${index}`}
          src={logo.src}
          alt={logo.name}
          style={{
            height: '28px',
            width: 'auto',
            objectFit: 'contain',
            filter: 'grayscale(1) invert(1)',
            opacity: 0.6,
            flex: '0 0 auto',
          }}
        />
      ))}
    </div>
  );
}

export default function SlidingBanner() {
  return (
    <div
      style={{ overflow: 'hidden', width: '100%' }}
      className="relative py-4 sm:py-5 border-y border-border/30"
    >
      {/* Edge fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Track: max-content width + two identical groups + -50% translate = seamless */}
      <div
        className="sliding-banner-track"
        style={{
          display: 'flex',
          width: 'max-content',
          willChange: 'transform',
        }}
      >
        <LogoGroup keyPrefix="a" />
        <LogoGroup keyPrefix="b" />
      </div>

      <style>{`
        .sliding-banner-track {
          animation: sliding-banner-scroll 18s linear infinite;
        }
        @keyframes sliding-banner-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
