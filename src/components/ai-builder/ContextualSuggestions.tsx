import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export interface BackendSuggestion {
  label: string;
  prompt: string;
}

interface ContextualSuggestionsProps {
  suggestions?: BackendSuggestion[];
  onSelectSuggestion: (prompt: string) => void;
  isStreaming: boolean;
  className?: string;
  // Legacy props (kept for backward compat but unused now)
  messages?: any[];
}

export function ContextualSuggestions({ 
  suggestions = [],
  onSelectSuggestion, 
  isStreaming,
  className 
}: ContextualSuggestionsProps) {
  // Don't show if streaming or no suggestions
  if (isStreaming || suggestions.length === 0) {
    return null;
  }
  
  // Limit to max 3 suggestions
  const visibleSuggestions = suggestions.slice(0, 3);
  const suggestionsKey = visibleSuggestions.map(s => s.label).join(',');

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {suggestionsKey && (
          <motion.div
            key={suggestionsKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2 px-4 pb-2 overflow-hidden"
          >
            {visibleSuggestions.map((suggestion, idx) => (
              <button
                key={suggestion.label}
                onClick={() => onSelectSuggestion(suggestion.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 border border-border/30 hover:border-border/60 rounded-full transition-all duration-200 hover:shadow-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] shrink-0"
                style={{
                  animation: `fadeIn 0.2s ease ${idx * 0.05}s both`
                }}
              >
                <Sparkles size={12} className="text-violet-400/70 shrink-0" />
                <span className="truncate">{suggestion.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
