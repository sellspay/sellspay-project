import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Package, Tag, X } from "lucide-react";
import type { ProductContext } from "@/components/tools/SourceSelector";

interface ProductDetailModalProps {
  product: ProductContext | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  onConfirm,
}: ProductDetailModalProps) {
  if (!product) return null;

  const price = product.price_cents != null
    ? `$${(product.price_cents / 100).toFixed(2)}`
    : "Free";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-[#0F1115] border-white/[0.06]">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-2 min-h-[480px]">
          {/* Left: Image */}
          <div className="relative bg-black flex items-center justify-center overflow-hidden">
            {product.cover_image_url ? (
              <img
                src={product.cover_image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground/20">
                <Package className="h-16 w-16" />
                <p className="text-xs">No image</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0F1115]/40 pointer-events-none" />
          </div>

          {/* Right: Details */}
          <div className="p-8 flex flex-col">
            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/[0.05] text-foreground/50"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h2 className="text-2xl font-bold text-foreground leading-tight">
              {product.name}
            </h2>

            {/* Price */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground tabular-nums">{price}</span>
              {product.currency && (
                <span className="text-xs text-muted-foreground/40 uppercase">{product.currency}</span>
              )}
            </div>

            {/* Description */}
            <div className="mt-5 flex-1 overflow-y-auto">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-foreground/60 leading-relaxed whitespace-pre-line">
                {product.description || product.excerpt || "No description available."}
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="mt-6 w-full py-3.5 text-sm font-semibold text-white rounded-xl shadow-lg shadow-orange-500/10 transition-all hover:shadow-xl hover:shadow-orange-500/20"
              style={{ background: "linear-gradient(180deg, #FF7A1A 0%, #E85C00 100%)" }}
            >
              Use This Product For Campaign
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
