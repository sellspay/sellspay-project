import React from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { 
  AnimationType, 
  getAnimationStyles, 
  getAnimatedStyles 
} from '@/components/profile-editor/AnimationPicker';

interface AnimatedSectionProps {
  animation: AnimationType;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedSection({ 
  animation, 
  children, 
  className,
  style 
}: AnimatedSectionProps) {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    triggerOnce: true,
  });

  if (animation === 'none') {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const animationStyle = isVisible 
    ? { ...getAnimationStyles(animation), ...getAnimatedStyles(animation) }
    : getAnimationStyles(animation);

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, ...animationStyle }}
    >
      {children}
    </div>
  );
}
