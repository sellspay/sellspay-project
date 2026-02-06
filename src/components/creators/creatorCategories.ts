import {
  Store, TrendingUp, Briefcase, Code2, PenTool, Video,
  Layers, BookOpen, Database, Gamepad2, Music, Camera,
  FileText, Globe, Smile
} from 'lucide-react';

export const CREATOR_CATEGORIES = [
  { id: "all", label: "All Stores", icon: Store },
  { id: "finance", label: "Trading & Finance", icon: TrendingUp },
  { id: "business", label: "E-commerce & Biz", icon: Briefcase },
  { id: "software", label: "Software & SaaS", icon: Code2 },
  { id: "design", label: "Design & Art", icon: PenTool },
  { id: "video", label: "Video & VFX", icon: Video },
  { id: "3d", label: "3D Models", icon: Layers },
  { id: "education", label: "Courses & Coaching", icon: BookOpen },
  { id: "productivity", label: "Notion & Templates", icon: Database },
  { id: "gaming", label: "Gaming & Mods", icon: Gamepad2 },
  { id: "audio", label: "Music & SFX", icon: Music },
  { id: "photography", label: "Photography & Presets", icon: Camera },
  { id: "writing", label: "Writing & KDP", icon: FileText },
  { id: "marketing", label: "Marketing & Ads", icon: Globe },
  { id: "lifestyle", label: "Fitness & Lifestyle", icon: Smile },
];

// Map product types to categories for fallback tag derivation
export const PRODUCT_TYPE_TO_CATEGORY: Record<string, string> = {
  'preset': 'photography',
  'lut': 'video',
  'sfx': 'audio',
  'music': 'audio',
  'template': 'productivity',
  'overlay': 'video',
  'tutorial': 'education',
  'project_file': 'video',
  'digital_art': 'design',
  '3d_model': '3d',
  'plugin': 'software',
  'script': 'software',
  'course': 'education',
  'ebook': 'writing',
};
