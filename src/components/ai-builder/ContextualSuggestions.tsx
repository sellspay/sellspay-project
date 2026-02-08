import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Palette, Layout, Type, Image, Zap, ShoppingBag, Users, Star, Plus } from 'lucide-react';
import type { VibecoderMessage } from './hooks/useVibecoderProjects';

interface ContextualSuggestionsProps {
  messages: VibecoderMessage[];
  onSelectSuggestion: (prompt: string) => void;
  isStreaming: boolean;
  className?: string;
}

interface Suggestion {
  label: string;
  prompt: string;
  icon: React.ElementType;
}

// Category-based suggestion pools
const SUGGESTION_POOLS: Record<string, Suggestion[]> = {
  // Generic suggestions for any storefront
  generic: [
    { label: 'Add testimonials', prompt: 'Add a testimonials section with customer reviews and ratings', icon: Star },
    { label: 'Improve hero', prompt: 'Make the hero section more impactful with better typography and animations', icon: Layout },
    { label: 'Add CTA section', prompt: 'Add a strong call-to-action section with a compelling message', icon: Zap },
  ],
  
  // Product-focused suggestions
  products: [
    { label: 'Product grid', prompt: 'Add a beautiful product grid showcasing my items with hover effects', icon: ShoppingBag },
    { label: 'Featured product', prompt: 'Add a featured product spotlight section with large imagery', icon: Star },
    { label: 'Product categories', prompt: 'Add product category filters with animated transitions', icon: Layout },
    { label: 'Pricing table', prompt: 'Add a professional pricing comparison table', icon: Plus },
  ],
  
  // Course/education suggestions
  courses: [
    { label: 'Curriculum section', prompt: 'Add an expandable curriculum section showing course modules', icon: Layout },
    { label: 'Instructor bio', prompt: 'Add an instructor bio section with credentials and photo', icon: Users },
    { label: 'Student testimonials', prompt: 'Add student success stories with before/after results', icon: Star },
    { label: 'Lesson preview', prompt: 'Add a locked lesson preview section showing what subscribers get', icon: Zap },
  ],
  
  // Creator/portfolio suggestions
  creator: [
    { label: 'About section', prompt: 'Add an about me section with my story and journey', icon: Users },
    { label: 'Portfolio gallery', prompt: 'Add a portfolio gallery showcasing my best work', icon: Image },
    { label: 'Social proof', prompt: 'Add a social proof section with follower counts and achievements', icon: Star },
    { label: 'Collections', prompt: 'Add collection rows to organize my products by category', icon: Layout },
  ],
  
  // Design/styling suggestions
  styling: [
    { label: 'Add animations', prompt: 'Add smooth scroll animations and micro-interactions', icon: Sparkles },
    { label: 'Improve typography', prompt: 'Improve the typography with better font pairing and hierarchy', icon: Type },
    { label: 'Color refresh', prompt: 'Refresh the color palette to be more vibrant and cohesive', icon: Palette },
    { label: 'Add gradients', prompt: 'Add beautiful gradient backgrounds and overlays', icon: Palette },
  ],
  
  // Subscription/membership suggestions
  subscriptions: [
    { label: 'Subscription tiers', prompt: 'Add subscription tier cards with feature comparison', icon: Star },
    { label: 'Member benefits', prompt: 'Add a member benefits section showing exclusive perks', icon: Zap },
    { label: 'FAQ section', prompt: 'Add an FAQ accordion answering common subscription questions', icon: Plus },
  ],
};

// Analyze messages to detect the project context/type
function detectProjectContext(messages: VibecoderMessage[]): string[] {
  const allContent = messages
    .map(m => (m.content || '').toLowerCase())
    .join(' ');
  
  const contexts: string[] = [];
  
  // Detect product-focused projects
  if (allContent.match(/product|shop|store|selling|digital|download|pack|preset|lut/)) {
    contexts.push('products');
  }
  
  // Detect course/education projects
  if (allContent.match(/course|lesson|curriculum|tutorial|learn|teaching|student|module|chapter/)) {
    contexts.push('courses');
  }
  
  // Detect creator/portfolio projects
  if (allContent.match(/creator|portfolio|artist|work|showcase|gallery|brand|personal/)) {
    contexts.push('creator');
  }
  
  // Detect subscription/membership focus
  if (allContent.match(/subscription|member|tier|plan|premium|exclusive|paywall|unlock/)) {
    contexts.push('subscriptions');
  }
  
  // Detect styling/design requests
  if (allContent.match(/color|style|animation|design|typography|font|gradient|theme/)) {
    contexts.push('styling');
  }
  
  // Always include generic if nothing specific detected
  if (contexts.length === 0) {
    contexts.push('generic');
  }
  
  return contexts;
}

// Get keywords from recent messages to avoid suggesting things already done
function getRecentKeywords(messages: VibecoderMessage[]): Set<string> {
  const recentMessages = messages.slice(-6); // Last 3 exchanges
  const keywords = new Set<string>();
  
  recentMessages.forEach(m => {
    const content = (m.content || '').toLowerCase();
    // Extract key action words
    const matches = content.match(/(?:add|create|build|make|improve|change|update)\s+(?:a\s+)?(\w+)/g);
    matches?.forEach(match => {
      const word = match.split(/\s+/).pop();
      if (word) keywords.add(word);
    });
  });
  
  return keywords;
}

export function ContextualSuggestions({ 
  messages, 
  onSelectSuggestion, 
  isStreaming,
  className 
}: ContextualSuggestionsProps) {
  // Generate contextual suggestions based on conversation
  const suggestions = useMemo(() => {
    if (messages.length === 0) return [];
    
    const contexts = detectProjectContext(messages);
    const recentKeywords = getRecentKeywords(messages);
    
    // Collect suggestions from detected contexts
    const allSuggestions: Suggestion[] = [];
    contexts.forEach(context => {
      const pool = SUGGESTION_POOLS[context] || [];
      allSuggestions.push(...pool);
    });
    
    // Also add some generic ones for variety
    if (!contexts.includes('generic')) {
      allSuggestions.push(...SUGGESTION_POOLS.generic);
    }
    
    // Filter out suggestions that match recently discussed topics
    const filtered = allSuggestions.filter(s => {
      const suggestionWords = s.label.toLowerCase().split(/\s+/);
      return !suggestionWords.some(word => recentKeywords.has(word));
    });
    
    // Deduplicate by label and take 3-4 random ones
    const unique = Array.from(new Map(filtered.map(s => [s.label, s])).values());
    const shuffled = unique.sort(() => Math.random() - 0.5);
    
    return shuffled.slice(0, 4);
  }, [messages]);
  
  // Don't show if streaming or no suggestions
  if (isStreaming || suggestions.length === 0 || messages.length === 0) {
    return null;
  }
  
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        <motion.div
          key={suggestions.map(s => s.label).join(',')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex flex-wrap gap-2 px-4 pb-2"
        >
          {suggestions.map((suggestion, idx) => {
            const Icon = suggestion.icon;
            return (
              <motion.button
                key={suggestion.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onSelectSuggestion(suggestion.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 border border-border/30 hover:border-border/60 rounded-full transition-all duration-200 hover:shadow-sm"
              >
                <Icon size={12} className="text-violet-400/70" />
                <span>{suggestion.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
