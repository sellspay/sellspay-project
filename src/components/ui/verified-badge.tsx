import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface VerifiedBadgeProps {
  isAdmin?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VerifiedBadge({ isAdmin = false, size = 'md', className = '' }: VerifiedBadgeProps) {
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
          className={`${sizeClasses[size]} rounded-full bg-blue-500 flex items-center justify-center transition-all duration-300 shrink-0 ${
            isAdmin ? 'hover:animate-hue-rotate cursor-pointer' : ''
          } ${className}`}
          style={isAdmin ? { 
            ['--tw-bg-opacity' as string]: 1,
          } : undefined}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            className={`${checkSizes[size]} text-white transition-all duration-300`}
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
        <p>{isAdmin ? 'Verified Creator / Owner' : 'Verified Creator'}</p>
      </TooltipContent>
    </Tooltip>
  );
}
