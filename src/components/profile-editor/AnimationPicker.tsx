import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

const ANIMATION_OPTIONS: AnimationOption[] = [
  { value: 'none', label: 'None', description: 'No animation' },
  { value: 'fade-in', label: 'Fade In', description: 'Smooth opacity transition' },
  { value: 'slide-up', label: 'Slide Up', description: 'Slides from bottom' },
  { value: 'slide-left', label: 'Slide Left', description: 'Slides from right' },
  { value: 'slide-right', label: 'Slide Right', description: 'Slides from left' },
  { value: 'scale-up', label: 'Scale Up', description: 'Grows into view' },
  { value: 'blur-in', label: 'Blur In', description: 'Blur to focus effect' },
];

interface AnimationPickerProps {
  value: AnimationType;
  onChange: (value: AnimationType) => void;
}

export function AnimationPicker({ value, onChange }: AnimationPickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedOption = ANIMATION_OPTIONS.find(opt => opt.value === value) || ANIMATION_OPTIONS[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className={cn(
            "h-7 px-2 gap-1.5 shadow-lg",
            value !== 'none' && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            {value === 'none' ? 'Animate' : selectedOption.label}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-48 p-1" 
        align="center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-0.5">
          {ANIMATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors",
                "hover:bg-accent",
                value === option.value && "bg-accent"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onChange(option.value);
                setOpen(false);
              }}
            >
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
              {value === option.value && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
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
