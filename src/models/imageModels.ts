/**
 * Central registry of all image generation models.
 * Used by the UI (model selector) and the backend (edge function mapping).
 */

export type ModelCategory = "fast" | "realistic" | "stylized" | "anime" | "product";

export interface ImageModel {
  id: string;
  name: string;
  category: ModelCategory;
  description: string;
  tag?: "Recommended" | "Pro" | "New" | "Fast" | "HD";
  /** Gemini endpoint the edge function should resolve to */
  backendModel: string;
  /** Credits charged per generation */
  creditCost: number;
}

export const IMAGE_MODELS: ImageModel[] = [
  // ── Fast ──
  {
    id: "nano-banana-2",
    name: "Nano Banana 2",
    category: "fast",
    description: "Fast, balanced general model — great default",
    tag: "Recommended",
    backendModel: "gemini-3.1-flash-image-preview",
    creditCost: 1,
  },
  {
    id: "sdxl-turbo",
    name: "SDXL Turbo",
    category: "fast",
    description: "Ultra-fast drafts and iterations",
    tag: "Fast",
    backendModel: "gemini-2.5-flash-image",
    creditCost: 1,
  },
  {
    id: "nano-banana",
    name: "Nano Banana",
    category: "fast",
    description: "Lightweight balanced image model",
    backendModel: "gemini-2.5-flash-image",
    creditCost: 1,
  },
  {
    id: "flux-2-dev",
    name: "Flux.2 Dev",
    category: "fast",
    description: "Open-source research model by Black Forest Labs",
    tag: "New",
    backendModel: "gemini-3.1-flash-image-preview",
    creditCost: 1,
  },

  // ── Realistic ──
  {
    id: "flux-pro",
    name: "Flux Pro",
    category: "realistic",
    description: "High-quality photorealistic renders",
    tag: "Pro",
    backendModel: "gemini-3.1-flash-image-preview",
    creditCost: 2,
  },
  {
    id: "flux-2-pro",
    name: "Flux.2 Pro",
    category: "realistic",
    description: "Next-gen photorealism by Black Forest Labs",
    tag: "New",
    backendModel: "gemini-3-pro-image-preview",
    creditCost: 3,
  },
  {
    id: "photo-real-v2",
    name: "Photo Real v2",
    category: "realistic",
    description: "Photoreal portraits and scenes",
    tag: "HD",
    backendModel: "gemini-3-pro-image-preview",
    creditCost: 2,
  },
  {
    id: "cinematic-scene",
    name: "Cinematic Scene",
    category: "realistic",
    description: "Film-grade dramatic compositions",
    tag: "Pro",
    backendModel: "gemini-3-pro-image-preview",
    creditCost: 2,
  },
  {
    id: "seedream-5.0",
    name: "Seedream 5.0",
    category: "realistic",
    description: "ByteDance's flagship photorealistic model",
    tag: "New",
    backendModel: "gemini-3-pro-image-preview",
    creditCost: 2,
  },

  // ── Stylized ──
  {
    id: "recraft-v3",
    name: "Recraft V3",
    category: "stylized",
    description: "Graphic design and vector-leaning art",
    backendModel: "gemini-3.1-flash-image-preview",
    creditCost: 1,
  },
  {
    id: "juggernaut-flux",
    name: "Juggernaut Flux",
    category: "stylized",
    description: "Stylized realism with artistic flair",
    tag: "New",
    backendModel: "gemini-3.1-flash-image-preview",
    creditCost: 1,
  },
  {
    id: "editorial-fashion",
    name: "Editorial Fashion",
    category: "stylized",
    description: "Luxury editorial and moodboard visuals",
    tag: "Pro",
    backendModel: "gemini-3.1-flash-image-preview",
    creditCost: 2,
  },
  {
    id: "grok-imagine",
    name: "Grok Imagine",
    category: "stylized",
    description: "xAI's creative image generation engine",
    tag: "New",
    backendModel: "gemini-3-pro-image-preview",
    creditCost: 3,
  },
  {
    id: "artlist-original-1.0",
    name: "Artlist Original 1.0",
    category: "stylized",
    description: "Artlist's creative-focused generation model",
    tag: "New",
    backendModel: "gemini-3.1-flash-image-preview",
    creditCost: 2,
  },

  // ── Anime ──
  {
    id: "anime-xl",
    name: "Anime XL",
    category: "anime",
    description: "Illustration and anime-style art",
    backendModel: "gemini-2.5-flash-image",
    creditCost: 1,
  },
  {
    id: "anime-diffusion",
    name: "Anime Diffusion",
    category: "anime",
    description: "Classic anime aesthetic, detailed linework",
    tag: "New",
    backendModel: "gemini-3.1-flash-image-preview",
    creditCost: 1,
  },

  // ── Product ──
  {
    id: "product-shot-pro",
    name: "Product Studio",
    category: "product",
    description: "Clean ecommerce product renders",
    tag: "Pro",
    backendModel: "gemini-3-pro-image-preview",
    creditCost: 2,
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    category: "product",
    description: "Highest-quality general + product model",
    tag: "HD",
    backendModel: "gemini-3-pro-image-preview",
    creditCost: 2,
  },
];
/** Category display metadata */
export const MODEL_CATEGORIES: Record<ModelCategory, { label: string; emoji: string }> = {
  fast: { label: "Fast Models", emoji: "⚡" },
  realistic: { label: "Realistic", emoji: "📷" },
  stylized: { label: "Stylized", emoji: "🎨" },
  anime: { label: "Anime", emoji: "✨" },
  product: { label: "Product", emoji: "📦" },
};

/** Group models by category */
export function getModelsByCategory(): Record<ModelCategory, ImageModel[]> {
  return IMAGE_MODELS.reduce((acc, model) => {
    if (!acc[model.category]) acc[model.category] = [];
    acc[model.category].push(model);
    return acc;
  }, {} as Record<ModelCategory, ImageModel[]>);
}

/** Look up a model by ID */
export function getModelById(id: string): ImageModel | undefined {
  return IMAGE_MODELS.find((m) => m.id === id);
}
