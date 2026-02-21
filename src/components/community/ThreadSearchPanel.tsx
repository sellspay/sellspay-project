import { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

const SEARCH_FILTER_OPTIONS = [
  { id: 'all', label: 'All categories' },
  { id: 'help', label: 'Help & Advice' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'discussion', label: 'Discussion' },
  { id: 'promotion', label: 'Promotion' },
  { id: 'feedback', label: 'Feedback' },
];

interface ThreadSearchPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearchChange: (query: string) => void;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export function ThreadSearchPanel({ open, onOpenChange, onSearchChange, activeCategory = 'all', onCategoryChange }: ThreadSearchPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const debouncedValue = useDebounce(inputValue, 300);

  useEffect(() => {
    onSearchChange(debouncedValue);
  }, [debouncedValue, onSearchChange]);

  const handleClear = () => {
    setInputValue('');
  };

  if (!open) return null;

  return (
    <div className="space-y-4">
      {/* Search header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Search</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => { onOpenChange(false); handleClear(); setShowFilters(false); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search input */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          autoFocus
          className="pl-11 pr-12 h-12 bg-muted/40 border-border/40 rounded-xl text-sm focus:bg-muted/60 focus:border-primary/40 transition-all"
        />
        {inputValue ? (
          <Button variant="ghost" size="icon" className="absolute right-1 h-8 w-8 hover:bg-muted rounded-lg" onClick={handleClear}>
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="absolute right-1 h-8 w-8 hover:bg-muted rounded-lg" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Filter chips */}
      {showFilters && onCategoryChange && (
        <div className="flex flex-wrap gap-2 pt-1">
          {SEARCH_FILTER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => onCategoryChange(opt.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                activeCategory === opt.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}