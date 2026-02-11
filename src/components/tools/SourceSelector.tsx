import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Package, Search, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type SourceMode = "blank" | "product";

export interface ProductContext {
  id: string;
  name: string;
  description: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  price_cents: number | null;
  currency: string | null;
}

interface SourceSelectorProps {
  mode: SourceMode;
  onModeChange: (mode: SourceMode) => void;
  selectedProduct: ProductContext | null;
  onProductSelect: (product: ProductContext | null) => void;
}

export function SourceSelector({ mode, onModeChange, selectedProduct, onProductSelect }: SourceSelectorProps) {
  const { user } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductContext[]>([]);
  const [loading, setLoading] = useState(false);

  const openPicker = async () => {
    if (!user) return;
    setPickerOpen(true);
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, description, excerpt, cover_image_url, tags, price_cents, currency")
      .eq("creator_id", user.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50);
    setProducts((data as ProductContext[]) || []);
    setLoading(false);
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</span>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => { onModeChange("blank"); onProductSelect(null); }}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode === "blank" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            Blank
          </button>
          <button
            onClick={() => { onModeChange("product"); openPicker(); }}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode === "product" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            Use Product
          </button>
        </div>
      </div>

      {/* Selected product card */}
      {mode === "product" && selectedProduct && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
          {selectedProduct.cover_image_url ? (
            <img src={selectedProduct.cover_image_url} alt="" className="w-12 h-12 rounded-md object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{selectedProduct.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{selectedProduct.excerpt || selectedProduct.description}</p>
            {selectedProduct.tags && selectedProduct.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {selectedProduct.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { onProductSelect(null); onModeChange("blank"); }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Product Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Select a Product
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <ScrollArea className="max-h-72">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No products found</p>
            ) : (
              <div className="space-y-1">
                {filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onProductSelect(p); setPickerOpen(false); }}
                    className="flex items-center gap-3 w-full p-2.5 rounded-lg text-left hover:bg-muted/50 transition-colors"
                  >
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      {p.price_cents != null && (
                        <p className="text-xs text-muted-foreground">${(p.price_cents / 100).toFixed(2)} {p.currency?.toUpperCase()}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
