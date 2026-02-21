import { useState, useEffect, useCallback } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';

interface ThreadSearchPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearchChange: (query: string) => void;
}

export function ThreadSearchPanel({ open, onOpenChange, onSearchChange }: ThreadSearchPanelProps) {
  const [inputValue, setInputValue] = useState('');
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
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => { onOpenChange(false); handleClear(); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search input */}
      <div className="relative">
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
            <div className="absolute right-3">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}