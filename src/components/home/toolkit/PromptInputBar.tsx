import { ChevronRight, Image, Video } from 'lucide-react';

interface PromptInputBarProps {
  displayedText: string;
  accentColor: string;
  bgColor?: string;
}

export function PromptInputBar({ displayedText, accentColor, bgColor = 'bg-muted/20' }: PromptInputBarProps) {
  return (
    <div className={`p-4 sm:p-6 ${bgColor} border-t border-foreground/10`}>
      <div className="flex items-center gap-4 bg-card/90 backdrop-blur-md border border-foreground/15 px-4 sm:px-5 py-3 sm:py-4 max-w-2xl mx-auto">
        <div className="flex gap-1.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border border-foreground/15 bg-muted/20">
            <Image className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border border-foreground/15 bg-muted/20">
            <Video className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-sm sm:text-base ${accentColor}`}>
            {displayedText}
            <span className="animate-pulse">|</span>
          </span>
        </div>
        <button className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-primary/20 border border-primary/30 hover:bg-primary/30 transition-colors shrink-0">
          <ChevronRight className="h-5 w-5 text-primary rotate-[-90deg]" />
        </button>
      </div>
    </div>
  );
}
