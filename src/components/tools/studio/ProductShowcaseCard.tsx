import { motion } from "framer-motion";
import { Package, ExternalLink, RefreshCw, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductContext } from "@/components/tools/SourceSelector";

interface ProductShowcaseCardProps {
  product: ProductContext | null;
  onChangeProduct: () => void;
  onViewDetails: () => void;
  onSelectProduct: () => void;
}

export function ProductShowcaseCard({
  product,
  onChangeProduct,
  onViewDetails,
  onSelectProduct,
}: ProductShowcaseCardProps) {
  if (!product) {
    return (
      <button
        onClick={onSelectProduct}
        className="group w-full rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/[0.15] transition-all duration-300 overflow-hidden"
      >
        <div className="aspect-[16/7] flex flex-col items-center justify-center gap-3 p-8">
          <div className="h-14 w-14 rounded-2xl bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
            <Package className="h-6 w-6 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground/50 group-hover:text-foreground/70 transition-colors">
              No product selected
            </p>
            <p className="text-xs text-muted-foreground/30 mt-1">
              Select a product to begin your campaign
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary/20 transition-colors">
              <Package className="h-3.5 w-3.5" />
              Select Product
            </span>
          </div>
        </div>
      </button>
    );
  }

  const price = product.price_cents != null
    ? `$${(product.price_cents / 100).toFixed(2)}`
    : null;

  const description = product.description || product.excerpt || "";
  const truncatedDesc = description.length > 160 ? description.slice(0, 160) + "…" : description;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="group relative w-full rounded-2xl overflow-hidden bg-white/[0.02] ring-1 ring-white/[0.06]"
    >
      {/* 16:9 Hero Image */}
      <div className="relative aspect-[16/7] w-full overflow-hidden">
        {product.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/[0.04] to-white/[0.01] flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/15" />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content over image */}
        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2">
                {product.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-white/10 text-white/70 backdrop-blur-sm"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h3 className="text-xl font-bold text-white leading-tight truncate">
              {product.name}
            </h3>

            {truncatedDesc && (
              <p className="text-xs text-white/50 mt-1.5 leading-relaxed line-clamp-2 max-w-lg">
                {truncatedDesc}
              </p>
            )}
          </div>

          {/* Price badge */}
          {price && (
            <div className="shrink-0 px-3.5 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
              <p className="text-sm font-bold text-white tabular-nums">{price}</p>
              {product.currency && (
                <p className="text-[9px] text-white/40 text-center uppercase">
                  {product.currency}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-t border-white/[0.04]">
        <button
          onClick={onChangeProduct}
          className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Change Product
        </button>

        <button
          onClick={onViewDetails}
          className="flex items-center gap-1.5 text-xs text-[#FF7A1A]/70 hover:text-[#FF7A1A] transition-colors font-medium"
        >
          View Full Details
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}
