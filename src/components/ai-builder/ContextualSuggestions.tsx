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
  
  const suggestionsKey = suggestions.map(s => s.label).join(',');

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
            className="flex flex-wrap gap-2 px-4 pb-2"
          >
            {suggestions.map((suggestion, idx) => (
              <button
                key={suggestion.label}
                onClick={() => onSelectSuggestion(suggestion.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 border border-border/30 hover:border-border/60 rounded-full transition-all duration-200 hover:shadow-sm"
                style={{
                  opacity: 1,
                  transform: 'scale(1)',
                  animation: `fadeIn 0.2s ease ${idx * 0.05}s both`
                }}
              >
                <Sparkles size={12} className="text-violet-400/70" />
                <span>{suggestion.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
