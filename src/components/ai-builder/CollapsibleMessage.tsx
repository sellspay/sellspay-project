import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleMessageProps {
  content: string;
  isUser: boolean;
}

export function CollapsibleMessage({ content, isUser }: CollapsibleMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Threshold: If longer than ~400 characters, collapse it.
  const isLongText = content.length > 400; 

  return (
    <div className={`relative ${!isExpanded && isLongText ? 'max-h-[200px] overflow-hidden' : ''}`}>
      
      {/* THE TEXT CONTENT */}
      <div className={`
        prose prose-sm max-w-none leading-relaxed break-words break-all whitespace-pre-wrap
        ${isUser ? 'text-white prose-invert' : 'text-zinc-300 prose-invert'}
      `}>
        {content}
      </div>

      {/* FADE OUT (Only if long and not expanded) */}
      {!isExpanded && isLongText && (
        <div 
          className={`absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t to-transparent pointer-events-none ${
            isUser ? 'from-[#E0482B]' : 'from-zinc-900'
          }`}
        />
      )}

      {/* TOGGLE BUTTON */}
      {isLongText && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative z-10 mt-2 text-xs font-bold flex items-center gap-1 hover:underline ${
            isUser ? 'text-white/80' : 'text-violet-400'
          }`}
        >
          {isExpanded ? (
            <>Show Less <ChevronUp size={12} /></>
          ) : (
            <>View More <ChevronDown size={12} /></>
          )}
        </button>
      )}
    </div>
  );
}
