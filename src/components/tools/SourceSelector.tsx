import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Package, Search, X, Image as ImageIcon, Check } from "lucide-react";
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
  /** Single-select mode */
  selectedProduct?: ProductContext | null;
  onProductSelect?: (product: ProductContext | null) => void;
  /** Multi-select mode */
  multiSelect?: boolean;
  selectedProducts?: ProductContext[];
  onProductsChange?: (products: ProductContext[]) => void;
  /** Hide the built-in selected product display (when parent renders its own) */
  hideSelectedDisplay?: boolean;
  /** Expose picker open for external triggers */
  onOpenPicker?: () => void;
  pickerRef?: React.MutableRefObject<{ open: () => void } | null>;
}

export function SourceSelector({
  mode,
  onModeChange,
  selectedProduct,
  onProductSelect,
  multiSelect = false,
  selectedProducts = [],
  onProductsChange,
  hideSelectedDisplay = false,
  pickerRef,
}: SourceSelectorProps) {
  const { user, profile } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductContext[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingSelections, setPendingSelections] = useState<ProductContext[]>([]);

  // Expose openPicker to parent via ref
  if (pickerRef) {
    pickerRef.current = { open: () => openPicker() };
  }

  const openPicker = async () => {
    if (!profile) return;
    setPickerOpen(true);
    setLoading(true);
    if (multiSelect) {
      setPendingSelections([...selectedProducts]);
    }
    const { data } = await supabase
      .from("products")
      .select("id, name, description, excerpt, cover_image_url, tags, price_cents, currency")
      .eq("creator_id", profile.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50);
    setProducts((data as ProductContext[]) || []);
    setLoading(false);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const togglePending = (product: ProductContext) => {
    setPendingSelections((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  };

  const confirmMultiSelect = () => {
    onProductsChange?.(pendingSelections);
    setPickerOpen(false);
  };

  const handleSingleSelect = (product: ProductContext) => {
    onProductSelect?.(product);
    setPickerOpen(false);
  };

  const clearAll = () => {
    if (multiSelect) {
      onProductsChange?.([]);
    } else {
      onProductSelect?.(null);
    }
    onModeChange("blank");
  };

  const hasSelection = multiSelect
    ? selectedProducts.length > 0
    : !!selectedProduct;

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Source
        </span>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={clearAll}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "blank"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            Blank
          </button>
          <button
            onClick={() => {
              onModeChange("product");
              openPicker();
            }}
            className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              mode === "product"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            Use Product
            {multiSelect && selectedProducts.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {selectedProducts.length}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Selected Product Display */}
      {mode === "product" && hasSelection && !hideSelectedDisplay && (
        <div className="space-y-2">
          {multiSelect ? (
            selectedProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  {p.price_cents != null && (
                    <p className="text-xs text-muted-foreground">${(p.price_cents / 100).toFixed(2)} {p.currency?.toUpperCase()}</p>
                  )}
                </div>
                <button onClick={() => onProductsChange?.(selectedProducts.filter((s) => s.id !== p.id))} className="shrink-0 p-1 rounded hover:bg-white/[0.08] transition-colors">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ))
          ) : selectedProduct ? (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              {selectedProduct.cover_image_url ? (
                <img src={selectedProduct.cover_image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{selectedProduct.name}</p>
                {selectedProduct.price_cents != null && (
                  <p className="text-xs text-muted-foreground">${(selectedProduct.price_cents / 100).toFixed(2)} {selectedProduct.currency?.toUpperCase()}</p>
                )}
              </div>
              <button onClick={() => openPicker()} className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-white/[0.08]">
                Change
              </button>
              <button onClick={clearAll} className="shrink-0 p-1 rounded hover:bg-white/[0.08] transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Product Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {multiSelect ? "Select Products" : "Select a Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="max-h-72">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No products found</p>
            ) : (
              <div className="space-y-1">
                {filtered.map((p) => {
                  const isSelected = multiSelect
                    ? pendingSelections.some((s) => s.id === p.id)
                    : selectedProduct?.id === p.id;

                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        multiSelect ? togglePending(p) : handleSingleSelect(p)
                      }
                      className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-colors ${
                        isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {multiSelect && (
                        <Checkbox checked={isSelected} className="shrink-0" />
                      )}
                      {p.cover_image_url ? (
                        <img
                          src={p.cover_image_url}
                          alt=""
                          className="w-10 h-10 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {p.name}
                        </p>
                        {p.price_cents != null && (
                          <p className="text-xs text-muted-foreground">
                            ${(p.price_cents / 100).toFixed(2)}{" "}
                            {p.currency?.toUpperCase()}
                          </p>
                        )}
                      </div>
                      {!multiSelect && isSelected && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          {multiSelect && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {pendingSelections.length} selected
              </span>
              <Button size="sm" className="text-xs gap-1" onClick={confirmMultiSelect}>
                <Check className="h-3 w-3" /> Confirm
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
