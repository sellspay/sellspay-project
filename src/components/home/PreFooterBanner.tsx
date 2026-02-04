import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

export function PreFooterBanner() {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section 
      ref={ref}
      className="relative w-full overflow-hidden py-8 sm:py-12"
    >
      {/* Massive text with gradient mask for bottom blur/fade */}
      <div 
        className={cn(
          "relative transition-all duration-1000 ease-out",
          isVisible 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-8"
        )}
      >
        <h2 
          className="text-[18vw] sm:text-[16vw] lg:text-[14vw] font-bold leading-[0.85] tracking-tighter text-center whitespace-nowrap select-none"
          style={{
            /* Text with gradient fade - solid at top, fading/blurring at bottom */
            background: 'linear-gradient(to bottom, hsl(var(--foreground)) 0%, hsl(var(--foreground)) 40%, hsl(var(--foreground) / 0.6) 70%, hsl(var(--foreground) / 0.15) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          SellsPay
        </h2>
        
        {/* Blur overlay on bottom half for depth effect */}
        <div 
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.3) 50%, hsl(var(--background) / 0.7) 100%)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 40%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40%)',
          }}
        />
      </div>
    </section>
  );
}
