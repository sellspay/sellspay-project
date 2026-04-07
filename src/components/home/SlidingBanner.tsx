import { useEffect, useRef } from 'react';
import davinciLogo from '@/assets/logos/davinci-resolve.png';
import premiereLogo from '@/assets/logos/premiere-pro.png';
import afterEffectsLogo from '@/assets/logos/after-effects.png';
import openaiLogo from '@/assets/logos/openai-full.png';
import soraLogo from '@/assets/logos/sora-color.png';
import klingLogo from '@/assets/logos/kling-full.png';
import pikaLogo from '@/assets/logos/pika.png';
import veo3Logo from '@/assets/logos/veo3.png';

type LogoItem = {
  name: string;
  src: string;
  imageClassName: string;
  filter: string;
  opacity?: number;
};

const logos: LogoItem[] = [
  {
    name: 'DaVinci Resolve',
    src: davinciLogo,
    imageClassName: 'h-10 sm:h-11',
    filter: 'grayscale(1) brightness(1.22) contrast(1.06)',
    opacity: 0.84,
  },
  {
    name: 'Premiere Pro',
    src: premiereLogo,
    imageClassName: 'h-9 sm:h-10',
    filter: 'grayscale(1) brightness(1.18) contrast(1.12)',
    opacity: 0.82,
  },
  {
    name: 'After Effects',
    src: afterEffectsLogo,
    imageClassName: 'h-9 sm:h-10',
    filter: 'grayscale(1) brightness(1.18) contrast(1.12)',
    opacity: 0.82,
  },
  {
    name: 'OpenAI',
    src: openaiLogo,
    imageClassName: 'h-7 sm:h-8',
    filter: 'invert(1) grayscale(1) brightness(0.92)',
    opacity: 0.84,
  },
  {
    name: 'Sora',
    src: soraLogo,
    imageClassName: 'h-10 sm:h-11',
    filter: 'grayscale(1) brightness(1.2) contrast(1.08)',
    opacity: 0.84,
  },
  {
    name: 'Kling AI',
    src: klingLogo,
    imageClassName: 'h-6 sm:h-7',
    filter: 'invert(1) grayscale(1) brightness(0.94)',
    opacity: 0.8,
  },
  {
    name: 'Pika',
    src: pikaLogo,
    imageClassName: 'h-8 sm:h-9',
    filter: 'grayscale(1) brightness(1.16) contrast(1.1)',
    opacity: 0.82,
  },
  {
    name: 'Veo 3',
    src: veo3Logo,
    imageClassName: 'h-6 sm:h-7',
    filter: 'invert(1) grayscale(1) brightness(0.94)',
    opacity: 0.78,
  },
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

    const images = Array.from(originalContent.querySelectorAll('img'));

    if (images.length === 0) {
      init();
    } else {
      let resolved = 0;
      const handleResolved = () => {
        resolved += 1;
        if (resolved === images.length) init();
      };

      images.forEach((img) => {
        if (img.complete) {
          handleResolved();
        } else {
          img.addEventListener('load', handleResolved, { once: true });
          img.addEventListener('error', handleResolved, { once: true });
        }
      });
    }

    const handleResize = () => init();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (styleRef.current) styleRef.current.remove();
    };
  }, []);

  return (
    <section className="relative overflow-hidden border-y border-border/40 bg-background py-8 sm:py-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 blur-3xl"
        style={{
          background: 'radial-gradient(circle at top center, hsl(var(--primary) / 0.14), transparent 68%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="mb-6 flex items-center justify-center gap-4 px-6">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-border sm:w-16" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-foreground/70">
          Powered by
        </p>
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-border sm:w-16" />
      </div>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background via-background to-transparent sm:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background via-background to-transparent sm:w-40" />

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
            className="flex flex-none items-center gap-12 pr-12 sm:gap-16 sm:pr-16"
          >
            {logos.map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className="flex min-w-[100px] flex-none items-center justify-center px-1 sm:min-w-[124px]"
              >
                <img
                  src={logo.src}
                  alt={logo.name}
                  loading="lazy"
                  className={`w-auto object-contain ${logo.imageClassName}`}
                  style={{
                    filter: logo.filter,
                    opacity: logo.opacity ?? 0.82,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
