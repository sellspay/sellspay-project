import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface VerifiedBadgeProps {
  isOwner?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VerifiedBadge = React.forwardRef<HTMLDivElement, VerifiedBadgeProps>(
  function VerifiedBadge({ isOwner = false, size = 'md', className = '' }, ref) {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const checkSizes = {
      sm: 'w-2.5 h-2.5',
      md: 'w-3 h-3',
      lg: 'w-3.5 h-3.5',
    };

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={ref}
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
              isOwner ? 'animate-hue-rotate' : 'bg-blue-500'
            } ${className}`}
            style={isOwner ? {
              background: 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)',
              backgroundSize: '400% 400%',
            } : undefined}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className={`${checkSizes[size]} text-white transition-all duration-300 translate-y-[0.5px]`}
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isOwner ? 'Verified Creator / Owner' : 'Verified Creator'}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
);
