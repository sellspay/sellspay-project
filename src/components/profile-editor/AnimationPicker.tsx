import React from 'react';
import { Check, Play, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type AnimationType = 
  | 'none'
  | 'fade-in'
  | 'slide-up'
  | 'slide-left'
  | 'slide-right'
  | 'scale-up'
  | 'blur-in';

interface AnimationOption {
  value: AnimationType;
  label: string;
  description: string;
  icon: string;
}

const ANIMATION_OPTIONS: AnimationOption[] = [
  { value: 'none', label: 'None', description: 'No animation', icon: '⏹' },
  { value: 'fade-in', label: 'Fade In', description: 'Smooth opacity', icon: '✨' },
  { value: 'slide-up', label: 'Slide Up', description: 'From bottom', icon: '⬆️' },
  { value: 'slide-left', label: 'Slide Left', description: 'From right', icon: '⬅️' },
  { value: 'slide-right', label: 'Slide Right', description: 'From left', icon: '➡️' },
  { value: 'scale-up', label: 'Scale Up', description: 'Grow effect', icon: '📐' },
  { value: 'blur-in', label: 'Blur In', description: 'Focus effect', icon: '🔮' },
];

export { ANIMATION_OPTIONS };

interface AnimationPickerProps {
  value: AnimationType;
  onChange: (value: AnimationType) => void;
  onPreview?: () => void;
}

// Inline picker for the section editor panel (new design)
export function AnimationPickerInline({ value, onChange, onPreview }: AnimationPickerProps) {
  const [previewingAnimation, setPreviewingAnimation] = React.useState<AnimationType | null>(null);

  const handlePreview = (animation: AnimationType) => {
    if (animation === 'none') return;
    setPreviewingAnimation(animation);
    setTimeout(() => setPreviewingAnimation(null), 700);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Section Animation</span>
        </div>
        {value !== 'none' && onPreview && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={onPreview}
          >
            <Play className="h-3 w-3" />
            Preview
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {ANIMATION_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          const isPreviewing = previewingAnimation === option.value;
          
          return (
            <button
              key={option.value}
              className={cn(
                "relative flex items-center gap-2 p-2.5 rounded-lg text-left text-sm transition-all border",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-border hover:bg-secondary/50",
                isPreviewing && option.value !== 'none' && "animate-pulse"
              )}
              onClick={() => {
                onChange(option.value);
                handlePreview(option.value);
              }}
            >
              <span className="text-base">{option.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs">{option.label}</div>
              </div>
              {isSelected && (
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
      
      {value !== 'none' && (
        <p className="text-xs text-muted-foreground">
          This animation plays when visitors scroll to this section.
        </p>
      )}
    </div>
  );
}

// Legacy popover picker for backward compatibility
export function AnimationPicker({ value, onChange, onPreview }: AnimationPickerProps) {
  // This is now deprecated - use AnimationPickerInline in the style panel
  return null;
}

// CSS helper for scroll-triggered animations
export const getAnimationStyles = (animation: AnimationType): React.CSSProperties => {
  const baseTransition = 'opacity 0.6s ease-out, transform 0.6s ease-out, filter 0.6s ease-out';
  
  switch (animation) {
    case 'fade-in':
      return {
        opacity: 0,
        transition: baseTransition,
      };
    case 'slide-up':
      return {
        opacity: 0,
        transform: 'translateY(30px)',
        transition: baseTransition,
      };
    case 'slide-left':
      return {
        opacity: 0,
        transform: 'translateX(30px)',
        transition: baseTransition,
      };
    case 'slide-right':
      return {
        opacity: 0,
        transform: 'translateX(-30px)',
        transition: baseTransition,
      };
    case 'scale-up':
      return {
        opacity: 0,
        transform: 'scale(0.95)',
        transition: baseTransition,
      };
    case 'blur-in':
      return {
        opacity: 0,
        filter: 'blur(10px)',
        transition: baseTransition,
      };
    default:
      return {};
  }
};

export const getAnimatedStyles = (animation: AnimationType): React.CSSProperties => {
  switch (animation) {
    case 'fade-in':
    case 'slide-up':
    case 'slide-left':
    case 'slide-right':
    case 'scale-up':
      return {
        opacity: 1,
        transform: 'none',
      };
    case 'blur-in':
      return {
        opacity: 1,
        filter: 'blur(0)',
      };
    default:
      return {};
  }
};
