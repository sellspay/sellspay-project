import { useState, useCallback } from "react";
import { Search, X, Loader2, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect } from "react";

interface Gif {
  id: string;
  title: string;
  url: string;
  preview: string;
  width: string;
  height: string;
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

export function GifPicker({ onSelect }: GifPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const searchGifs = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setGifs([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("search-giphy", {
        body: { query: searchQuery, limit: 20 },
      });

      if (error) throw error;
      setGifs(data.gifs || []);
    } catch (err) {
      console.error("Error searching GIFs:", err);
      setError("Failed to search GIFs");
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchGifs(debouncedQuery);
  }, [debouncedQuery, searchGifs]);

  const handleSelect = (gifUrl: string) => {
    onSelect(gifUrl);
    setOpen(false);
    setQuery("");
    setGifs([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-accent"
        >
          <Image className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search GIFs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 pr-8 h-8"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-8 w-8"
                onClick={() => setQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="h-64 overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              {error}
            </div>
          )}

          {!loading && !error && gifs.length === 0 && query && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No GIFs found
            </div>
          )}

          {!loading && !error && gifs.length === 0 && !query && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Search for a GIF
            </div>
          )}

          {!loading && gifs.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelect(gif.url)}
                  className="relative overflow-hidden rounded-md hover:ring-2 hover:ring-primary transition-all"
                >
                  <img
                    src={gif.preview}
                    alt={gif.title}
                    className="w-full h-24 object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-2 border-t border-border text-center">
          <span className="text-xs text-muted-foreground">Powered by GIPHY</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
