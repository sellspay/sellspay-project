import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  Mic2, 
  Scissors, 
  Music, 
  Video, 
  FileAudio, 
  AudioWaveform,
  Sparkles,
  Image,
  Wand2
} from "lucide-react";

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "audio" | "generators";
  badge?: "Popular" | "New";
  available: boolean;
}

export const tools: Tool[] = [
  // Audio tools
  {
    id: "voice-isolator",
    title: "Voice Isolator",
    description: "Remove vocals or background from any track",
    icon: Mic2,
    category: "audio",
    badge: "Popular",
    available: false,
  },
  {
    id: "sfx-isolator",
    title: "SFX Isolator",
    description: "Isolate sound effects from your audio",
    icon: Sparkles,
    category: "audio",
    available: false,
  },
  {
    id: "music-splitter",
    title: "Music Splitter",
    description: "Split stems (vocals, drums, bass, other)",
    icon: Music,
    category: "audio",
    badge: "New",
    available: false,
  },
  {
    id: "audio-cutter",
    title: "Cutter",
    description: "Trim and slice audio with precision",
    icon: Scissors,
    category: "audio",
    available: true,
  },
  {
    id: "audio-joiner",
    title: "Joiner",
    description: "Merge multiple audio files into one",
    icon: Music,
    category: "audio",
    available: true,
  },
  {
    id: "audio-recorder",
    title: "Recorder",
    description: "Record high-quality audio in your browser",
    icon: Mic2,
    category: "audio",
    available: true,
  },
  {
    id: "audio-converter",
    title: "Converter",
    description: "Convert audio between different formats",
    icon: FileAudio,
    category: "audio",
    available: true,
  },
  {
    id: "video-to-audio",
    title: "Video to Audio",
    description: "Extract audio from video files",
    icon: Video,
    category: "audio",
    available: true,
  },
  {
    id: "waveform-generator",
    title: "Waveform Generator",
    description: "Generate visual waveforms from audio",
    icon: AudioWaveform,
    category: "audio",
    available: true,
  },
  // Generators
  {
    id: "manga-generator",
    title: "Manga Generator",
    description: "Create manga-style illustrations with AI",
    icon: Image,
    category: "generators",
    badge: "Popular",
    available: false,
  },
  {
    id: "manhwa-generator",
    title: "Manhwa Generator",
    description: "Generate Korean webtoon-style art",
    icon: Image,
    category: "generators",
    available: false,
  },
  {
    id: "shape-scene-generator",
    title: "Shape Scene Generator",
    description: "Create abstract shape-based scenes",
    icon: Wand2,
    category: "generators",
    available: false,
  },
];

interface ToolsSidebarProps {
  selectedTool: string | null;
  onSelectTool: (toolId: string) => void;
  selectedCategory: "all" | "audio" | "generators";
  onSelectCategory: (category: "all" | "audio" | "generators") => void;
}

export function ToolsSidebar({ 
  selectedTool, 
  onSelectTool, 
  selectedCategory, 
  onSelectCategory 
}: ToolsSidebarProps) {
  const filteredTools = selectedCategory === "all" 
    ? tools 
    : tools.filter(t => t.category === selectedCategory);

  return (
    <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your hub for audio tools and AI generators
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-1">
        {(["all", "audio", "generators"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Tools List */}
      <div className="space-y-1">
        {filteredTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={cn(
              "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
              selectedTool === tool.id
                ? "bg-primary/10 border border-primary/30"
                : "hover:bg-secondary/50 border border-transparent"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              selectedTool === tool.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            )}>
              <tool.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium",
                  selectedTool === tool.id ? "text-primary" : "text-foreground"
                )}>
                  {tool.title}
                </span>
                {tool.badge && (
                  <Badge 
                    variant={tool.badge === "Popular" ? "default" : "secondary"}
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      tool.badge === "Popular" && "bg-primary/80",
                      tool.badge === "New" && "bg-accent text-accent-foreground"
                    )}
                  >
                    {tool.badge}
                  </Badge>
                )}
                {!tool.available && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                    Soon
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {tool.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
