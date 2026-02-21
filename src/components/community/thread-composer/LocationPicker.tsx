import { useState } from 'react';
import { ArrowLeft, Search, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface LocationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (location: string) => void;
}

const SUGGESTED_PLACES = [
  'New York, NY',
  'Los Angeles, CA',
  'London, UK',
  'Tokyo, Japan',
  'Paris, France',
  'Sydney, Australia',
  'Toronto, Canada',
  'Berlin, Germany',
  'Dubai, UAE',
  'Singapore',
];

export function LocationPicker({ open, onOpenChange, onSelect }: LocationPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = query
    ? SUGGESTED_PLACES.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : SUGGESTED_PLACES;

  const handleSelect = (place: string) => {
    onSelect(place);
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 sm:max-w-[420px] rounded-2xl p-0 gap-0 [&>button]:hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-sm font-bold text-foreground flex-1 text-center pr-8">Choose a place</h2>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border/30">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search places"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="pl-10 pr-10 h-10 bg-muted/30 border-border/40 rounded-lg text-sm"
            />
            <Button variant="ghost" size="icon" className="absolute right-1 h-8 w-8 text-muted-foreground">
              <Navigation className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length > 0 ? (
            <div className="py-1">
              {filtered.map(place => (
                <button
                  key={place}
                  onClick={() => handleSelect(place)}
                  className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted/40 transition-colors"
                >
                  {place}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No places found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
