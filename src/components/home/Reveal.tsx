import { forwardRef } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  blur?: boolean;
  className?: string;
}

export const Reveal = forwardRef<HTMLDivElement, RevealProps>(({
  children,
  delay = 0,
  direction = 'up',
  blur = false,
  className,
}, forwardedRef) => {
  const [observerRef, isVisible] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.15,
    triggerOnce: true,
  });

  const directionStyles = {
    up: 'translate-y-5',
    down: '-translate-y-5',
    left: 'translate-x-5',
    right: '-translate-x-5',
  };

  return (
    <div
      ref={(node) => {
        // Assign both refs
        (observerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      className={cn(
        'transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        isVisible
          ? 'opacity-100 translate-x-0 translate-y-0 blur-0'
          : cn('opacity-0', directionStyles[direction], blur && 'blur-[6px]'),
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
});

Reveal.displayName = 'Reveal';

interface RevealStaggerProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  blur?: boolean;
  className?: string;
  itemClassName?: string;
}

export function RevealStagger({
  children,
  staggerDelay = 90,
  direction = 'up',
  blur = false,
  className,
  itemClassName,
}: RevealStaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <Reveal
          key={index}
          delay={index * staggerDelay}
          direction={direction}
          blur={blur}
          className={itemClassName}
        >
          {child}
        </Reveal>
      ))}
    </div>
  );
}
