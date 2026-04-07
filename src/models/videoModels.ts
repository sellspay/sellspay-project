/**
 * Central registry of all video generation models.
 * Used by the UI (model selector) and the backend (edge function mapping).
 */

export type VideoModelCategory = "text-to-video" | "image-to-video" | "video-to-video";

export interface VideoModel {
  id: string;
  name: string;
  category: VideoModelCategory;
  description: string;
  tag?: "Recommended" | "Pro" | "New" | "Fast" | "HD";
  /** Credits charged per generation */
  creditCost: number;
  /** Whether this model is currently available */
  available: boolean;
}

export const VIDEO_MODELS: VideoModel[] = [
  // ── Text to Video ──
  {
    id: "kling-2.6-pro",
    name: "Kling 2.6 Pro",
    category: "text-to-video",
    description: "Battle-tested video generation with consistent quality",
    tag: "Recommended",
    creditCost: 50,
    available: true,
  },
  {
    id: "kling-3.0",
    name: "Kling 3.0",
    category: "text-to-video",
    description: "Next-gen Kling with improved motion coherence",
    tag: "New",
    creditCost: 50,
    available: true,
  },
  {
    id: "kling-o3",
    name: "Kling O3",
    category: "text-to-video",
    description: "Premium reasoning-enhanced video model",
    tag: "Pro",
    creditCost: 70,
    available: true,
  },
  {
    id: "veo-3.1",
    name: "Veo 3.1",
    category: "text-to-video",
    description: "Google's latest video model — cinematic quality",
    tag: "New",
    creditCost: 80,
    available: true,
  },
  {
    id: "sora-2",
    name: "Sora 2",
    category: "text-to-video",
    description: "OpenAI's flagship video generation model",
    tag: "Pro",
    creditCost: 80,
    available: true,
  },
  {
    id: "grok-imagine-video",
    name: "Grok Imagine",
    category: "text-to-video",
    description: "xAI's creative video generation engine",
    tag: "New",
    creditCost: 60,
    available: true,
  },

  // ── Image to Video ──
  {
    id: "kling-i2v",
    name: "Kling 2.6 Pro",
    category: "image-to-video",
    description: "Animate any image with precise motion control",
    tag: "Recommended",
    creditCost: 50,
    available: true,
  },
  {
    id: "kling-3.0-i2v",
    name: "Kling 3.0",
    category: "image-to-video",
    description: "Next-gen image animation with improved physics",
    tag: "New",
    creditCost: 50,
    available: true,
  },

  // ── Video to Video ──
  {
    id: "kling-motion-control",
    name: "Kling Motion Control",
    category: "video-to-video",
    description: "Transfer motion between videos with precision",
    tag: "Pro",
    creditCost: 50,
    available: true,
  },
];

/** Category display metadata */
export const VIDEO_MODEL_CATEGORIES: Record<VideoModelCategory, { label: string; emoji: string }> = {
  "text-to-video": { label: "Text to Video", emoji: "✍️" },
  "image-to-video": { label: "Image to Video", emoji: "🖼️" },
  "video-to-video": { label: "Video to Video", emoji: "🎬" },
};

/** Group models by category */
export function getVideoModelsByCategory(): Record<VideoModelCategory, VideoModel[]> {
  return VIDEO_MODELS.reduce((acc, model) => {
    if (!acc[model.category]) acc[model.category] = [];
    acc[model.category].push(model);
    return acc;
  }, {} as Record<VideoModelCategory, VideoModel[]>);
}

/** Look up a model by ID */
export function getVideoModelById(id: string): VideoModel | undefined {
  return VIDEO_MODELS.find((m) => m.id === id);
}
