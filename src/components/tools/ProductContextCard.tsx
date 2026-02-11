import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { X, Pencil, Check, Image as ImageIcon, Plus } from "lucide-react";
import type { ProductContext } from "./SourceSelector";

interface ProductContextCardProps {
  products: ProductContext[];
  onRemove: (productId: string) => void;
  onContextOverride?: (productId: string, override: string) => void;
  multiSelect?: boolean;
  onAddAnother?: () => void;
}

export function ProductContextCard({
  products,
  onRemove,
  onContextOverride,
  multiSelect,
  onAddAnother,
}: ProductContextCardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftOverride, setDraftOverride] = useState("");

  const startEdit = (product: ProductContext) => {
    setEditingId(product.id);
    setDraftOverride(product.description || product.excerpt || "");
  };

  const confirmEdit = () => {
    if (editingId && onContextOverride) {
      onContextOverride(editingId, draftOverride);
    }
    setEditingId(null);
    setDraftOverride("");
  };

  if (products.length === 0) return null;

  return (
    <div className="space-y-2">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-card"
        >
          <div className="flex items-start gap-3">
            {product.cover_image_url ? (
              <img
                src={product.cover_image_url}
                alt=""
                className="w-12 h-12 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {product.name}
              </p>
              {product.price_cents != null && (
                <p className="text-xs text-muted-foreground">
                  ${(product.price_cents / 100).toFixed(2)}{" "}
                  {product.currency?.toUpperCase()}
                </p>
              )}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.tags.slice(0, 4).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => startEdit(product)}
                title="Edit context"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onRemove(product.id)}
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Inline context editor */}
          {editingId === product.id && (
            <div className="space-y-2">
              <Textarea
                value={draftOverride}
                onChange={(e) => setDraftOverride(e.target.value)}
                placeholder="Override product context for this generation…"
                className="text-xs min-h-[60px]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={confirmEdit}
                >
                  <Check className="h-3 w-3" /> Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {multiSelect && onAddAnother && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={onAddAnother}
        >
          <Plus className="h-3.5 w-3.5" /> Add another product
        </Button>
      )}
    </div>
  );
}
