import type { ProductContext } from "./SourceSelector";

/**
 * Generates frame-based prompt suggestions from product data.
 * Tools can consume these to pre-populate prompt fields.
 */
export function buildProductFramePrompts(product: ProductContext): string[] {
  const name = product.name;
  const desc = product.description || product.excerpt || "";
  const price =
    product.price_cents != null
      ? `$${(product.price_cents / 100).toFixed(2)}`
      : null;
  const tags = product.tags?.join(", ") || "";

  return [
    // Frame 1: Hook
    `Introducing "${name}" — ${desc.slice(0, 80)}${desc.length > 80 ? "…" : ""}`,
    // Frame 2: Benefits
    tags
      ? `Key highlights: ${tags}. ${desc.slice(0, 120)}`
      : `Here's what you get: ${desc.slice(0, 140)}`,
    // Frame 3: Social proof / what's included
    `Everything included with "${name}". Trusted by creators worldwide.`,
    // Frame 4: CTA
    price
      ? `Get "${name}" now for just ${price}. Limited time.`
      : `Get "${name}" now — it's free. Grab it before it's gone.`,
  ];
}
