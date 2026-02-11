import {
  FileText, Image, LayoutTemplate, PackagePlus,
  MessageSquare, Clapperboard, Hash, GalleryHorizontal,
  AudioLines, Mic, AudioWaveform, Split, Speech,
  Eraser, Maximize, Sparkles, Subtitles,
  Scissors, Merge, RefreshCw, CircleDot, FileAudio, Activity,
  Wand2, PenLine, HelpCircle, Search, Package,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "quick_tool" | "campaign" | "store_assistant";
export type ToolSubcategory = "store_growth" | "social_content" | "media_creation" | "utility";

export interface ToolRegistryEntry {
  id: string;
  name: string;
  category: ToolCategory;
  subcategory?: ToolSubcategory;
  icon: LucideIcon;
  description: string;
  creditCost: number;
  isPro: boolean;
  isActive: boolean;
  sortOrder: number;
  /** Maps to existing tool page route, if any */
  legacyRoute?: string;
  comingSoon?: boolean;
  /** Supports image enhance/regenerate or video promo/reference modes */
  supportsModes?: "image" | "video";
  /** Supports multi-product selection (bundle tools) */
  supportsMultiProduct?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  FileText, Image, LayoutTemplate, PackagePlus,
  MessageSquare, Clapperboard, Hash, GalleryHorizontal,
  AudioLines, Mic, AudioWaveform, Split, Speech,
  Eraser, Maximize, Sparkles, Subtitles,
  Scissors, Merge, RefreshCw, CircleDot, FileAudio, Activity,
  Wand2, PenLine, HelpCircle, Search, Package,
};

export function getIconByName(name: string): LucideIcon {
  return ICON_MAP[name] || Sparkles;
}

// Client-side registry mirroring the DB seed data
export const toolsRegistry: ToolRegistryEntry[] = [
  // ── Store Growth ──
  { id: "product-description", name: "Product Description", category: "quick_tool", subcategory: "store_growth", icon: FileText, description: "Generate SEO-optimized product descriptions from your product data", creditCost: 1, isPro: false, isActive: true, sortOrder: 10, comingSoon: true },
  { id: "thumbnail-generator", name: "Thumbnail Generator", category: "quick_tool", subcategory: "store_growth", icon: Image, description: "Create eye-catching product thumbnails with AI", creditCost: 2, isPro: false, isActive: true, sortOrder: 20, comingSoon: true, supportsModes: "image" },
  { id: "sales-page-sections", name: "Sales Page Sections", category: "quick_tool", subcategory: "store_growth", icon: LayoutTemplate, description: "Generate hero, features, testimonials, and FAQ sections", creditCost: 1, isPro: true, isActive: true, sortOrder: 30, comingSoon: true },
  { id: "upsell-suggestions", name: "Upsell & Bundle Ideas", category: "quick_tool", subcategory: "store_growth", icon: PackagePlus, description: "AI-powered bundle and upsell recommendations", creditCost: 1, isPro: true, isActive: true, sortOrder: 40, comingSoon: true, supportsMultiProduct: true },

  // ── Social Content ──
  { id: "social-posts-pack", name: "10 Posts from Product", category: "quick_tool", subcategory: "social_content", icon: MessageSquare, description: "Generate 10 social media posts from your product listing", creditCost: 2, isPro: false, isActive: true, sortOrder: 50, comingSoon: true },
  { id: "short-form-script", name: "Short-Form Script", category: "quick_tool", subcategory: "social_content", icon: Clapperboard, description: "Generate scripts for TikTok, Reels, and Shorts", creditCost: 1, isPro: false, isActive: true, sortOrder: 60, comingSoon: true, supportsModes: "video" },
  { id: "caption-hashtags", name: "Caption & Hashtags Pack", category: "quick_tool", subcategory: "social_content", icon: Hash, description: "Engaging captions with optimized hashtag sets", creditCost: 1, isPro: false, isActive: true, sortOrder: 70, comingSoon: true },
  { id: "carousel-generator", name: "Carousel Generator", category: "quick_tool", subcategory: "social_content", icon: GalleryHorizontal, description: "Create multi-slide carousel posts for Instagram", creditCost: 2, isPro: true, isActive: true, sortOrder: 80, comingSoon: true },

  // ── Media Creation ──
  { id: "sfx-generator", name: "SFX Generator", category: "quick_tool", subcategory: "media_creation", icon: AudioLines, description: "Generate custom sound effects with AI", creditCost: 1, isPro: false, isActive: true, sortOrder: 90, legacyRoute: "sfx-generator" },
  { id: "voice-isolator", name: "Voice Isolator", category: "quick_tool", subcategory: "media_creation", icon: Mic, description: "Separate vocals from background audio", creditCost: 1, isPro: false, isActive: true, sortOrder: 100, legacyRoute: "voice-isolator" },
  { id: "sfx-isolator", name: "SFX Isolator", category: "quick_tool", subcategory: "media_creation", icon: AudioWaveform, description: "Isolate sound effects from mixed audio", creditCost: 1, isPro: false, isActive: true, sortOrder: 110, legacyRoute: "sfx-isolator" },
  { id: "music-splitter", name: "Music Splitter", category: "quick_tool", subcategory: "media_creation", icon: Split, description: "Split audio into stems (vocals, drums, bass, etc.)", creditCost: 1, isPro: false, isActive: true, sortOrder: 120, legacyRoute: "music-splitter" },
  { id: "tts-voiceover", name: "TTS Voiceover", category: "quick_tool", subcategory: "media_creation", icon: Speech, description: "Text-to-speech voiceovers in multiple voices", creditCost: 1, isPro: true, isActive: true, sortOrder: 130, comingSoon: true },

  // ── Creator Utility ──
  { id: "background-remover", name: "Background Remover", category: "quick_tool", subcategory: "utility", icon: Eraser, description: "Remove image backgrounds instantly", creditCost: 1, isPro: false, isActive: true, sortOrder: 140, comingSoon: true, supportsModes: "image" },
  { id: "image-upscaler", name: "Image Upscaler", category: "quick_tool", subcategory: "utility", icon: Maximize, description: "Upscale images to higher resolution", creditCost: 1, isPro: false, isActive: true, sortOrder: 150, comingSoon: true, supportsModes: "image" },
  { id: "audio-cleanup", name: "Audio Cleanup", category: "quick_tool", subcategory: "utility", icon: Sparkles, description: "Remove noise and enhance audio quality", creditCost: 1, isPro: false, isActive: true, sortOrder: 160, comingSoon: true },
  { id: "subtitle-generator", name: "Subtitle Generator", category: "quick_tool", subcategory: "utility", icon: Subtitles, description: "Auto-generate subtitles and captions", creditCost: 1, isPro: true, isActive: true, sortOrder: 170, comingSoon: true },
  { id: "audio-cutter", name: "Audio Cutter", category: "quick_tool", subcategory: "utility", icon: Scissors, description: "Trim and cut audio files", creditCost: 0, isPro: false, isActive: true, sortOrder: 180, legacyRoute: "audio-cutter" },
  { id: "audio-joiner", name: "Audio Joiner", category: "quick_tool", subcategory: "utility", icon: Merge, description: "Join multiple audio files together", creditCost: 0, isPro: false, isActive: true, sortOrder: 190, legacyRoute: "audio-joiner" },
  { id: "audio-converter", name: "Audio Converter", category: "quick_tool", subcategory: "utility", icon: RefreshCw, description: "Convert between audio formats", creditCost: 0, isPro: false, isActive: true, sortOrder: 200, legacyRoute: "audio-converter" },
  { id: "audio-recorder", name: "Audio Recorder", category: "quick_tool", subcategory: "utility", icon: CircleDot, description: "Record audio directly in browser", creditCost: 0, isPro: false, isActive: true, sortOrder: 210, legacyRoute: "audio-recorder" },
  { id: "video-to-audio", name: "Video to Audio", category: "quick_tool", subcategory: "utility", icon: FileAudio, description: "Extract audio from video files", creditCost: 0, isPro: false, isActive: true, sortOrder: 220, legacyRoute: "video-to-audio" },
  { id: "waveform-generator", name: "Waveform Generator", category: "quick_tool", subcategory: "utility", icon: Activity, description: "Create visual waveform images from audio", creditCost: 0, isPro: false, isActive: true, sortOrder: 230, legacyRoute: "waveform-generator" },

  // ── Store Assistant ──
  { id: "generate-hero", name: "Generate Hero Section", category: "store_assistant", icon: Wand2, description: "AI-generate a hero section for your storefront", creditCost: 3, isPro: true, isActive: true, sortOrder: 300, comingSoon: true },
  { id: "rewrite-brand-voice", name: "Rewrite in Brand Voice", category: "store_assistant", icon: PenLine, description: "Rewrite your store copy using your brand voice", creditCost: 2, isPro: true, isActive: true, sortOrder: 310, comingSoon: true },
  { id: "create-faq", name: "Create FAQ from Product", category: "store_assistant", icon: HelpCircle, description: "Auto-generate FAQs from your product details", creditCost: 1, isPro: false, isActive: true, sortOrder: 320, comingSoon: true },
  { id: "seo-landing-page", name: "SEO Landing Page", category: "store_assistant", icon: Search, description: "Generate SEO-optimized landing page for a keyword", creditCost: 3, isPro: true, isActive: true, sortOrder: 330, comingSoon: true },
  { id: "generate-bundles", name: "Generate Bundles & Upsells", category: "store_assistant", icon: Package, description: "AI suggests product bundles and upsell combos", creditCost: 1, isPro: true, isActive: true, sortOrder: 340, comingSoon: true, supportsMultiProduct: true },
];

export const SUBCATEGORY_LABELS: Record<ToolSubcategory, string> = {
  store_growth: "Store Growth",
  social_content: "Social Content",
  media_creation: "Media Creation",
  utility: "Creator Utility",
};

export function getQuickTools() {
  return toolsRegistry
    .filter(t => t.category === "quick_tool" && t.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getStoreAssistantTools() {
  return toolsRegistry
    .filter(t => t.category === "store_assistant" && t.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
