import { useEffect, useRef } from 'react';
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
  const trackRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const originalContent = contentRef.current;
    if (!track || !originalContent) return;

    const SPEED = 40;
    const animName = 'marquee-scroll-' + Math.random().toString(36).slice(2, 9);

    const init = () => {
      track.style.animation = 'none';
      const clones = track.querySelectorAll('[data-clone]');
      clones.forEach((clone) => clone.remove());
      const contentWidth = originalContent.offsetWidth;
      const viewportWidth = track.parentElement?.offsetWidth || window.innerWidth;
      const clonesNeeded = Math.ceil((viewportWidth * 2) / contentWidth);
      for (let i = 0; i < clonesNeeded; i++) {
        const clone = originalContent.cloneNode(true) as HTMLElement;
        clone.setAttribute('data-clone', 'true');
        track.appendChild(clone);
      }
      const duration = contentWidth / SPEED;
      if (styleRef.current) styleRef.current.remove();
      const style = document.createElement('style');
      style.textContent = `
        @keyframes ${animName} {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(${-contentWidth}px, 0, 0); }
        }
      `;
      document.head.appendChild(style);
      styleRef.current = style;
      track.style.animation = `${animName} ${duration}s linear infinite`;
    };

    const images = originalContent.querySelectorAll('img');
    let loadedCount = 0;
    const totalImages = images.length;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalImages) init();
    };
    images.forEach((img) => {
      if (img.complete) checkAllLoaded();
      else {
        img.addEventListener('load', checkAllLoaded);
        img.addEventListener('error', checkAllLoaded);
      }
    });
    if (totalImages === 0 || loadedCount >= totalImages) init();

    const handleResize = () => init();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (styleRef.current) styleRef.current.remove();
    };
  }, []);

  return (
    <div className="relative py-8 sm:py-10 border-y border-border/20">
      {/* Section label */}
      <div className="text-center mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Powered By
        </p>
      </div>
      
      <div style={{ overflow: 'hidden', width: '100%' }} className="relative">
        {/* Edge fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div
          ref={trackRef}
          style={{
            display: 'flex',
            width: 'max-content',
            willChange: 'transform',
          }}
        >
          <div
            ref={contentRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '56px',
              paddingRight: '56px',
              flex: '0 0 auto',
            }}
          >
            {logos.map((logo, index) => (
              <img
                key={index}
                src={logo.src}
                alt={logo.name}
                style={{
                  height: '32px',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'grayscale(1) brightness(2)',
                  opacity: 0.6,
                  flex: '0 0 auto',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
