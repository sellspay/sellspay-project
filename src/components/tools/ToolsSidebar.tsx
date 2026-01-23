import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Mic2, 
  Scissors, 
  Music, 
  Video, 
  FileAudio, 
  AudioWaveform,
  Image,
  Wand2,
  Volume2,
  Search,
  X,
  Layers,
  Zap,
  SlidersHorizontal
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
  // SFX Generator - Top Pick
  {
    id: "sfx-generator",
    title: "SFX Generator",
    description: "Create sound effects from text with AI",
    icon: Volume2,
    category: "audio",
    badge: "Popular",
    available: true,
  },
  // Audio tools
  {
    id: "voice-isolator",
    title: "Voice Isolator",
    description: "Remove vocals or background from any track",
    icon: Mic2,
    category: "audio",
    available: true,
  },
  {
    id: "sfx-isolator",
    title: "SFX Isolator",
    description: "Isolate sound effects from your audio",
    icon: SlidersHorizontal,
    category: "audio",
    available: true,
  },
  {
    id: "music-splitter",
    title: "Music Splitter",
    description: "Split stems (vocals, drums, bass, other)",
    icon: Music,
    category: "audio",
    badge: "New",
    available: true,
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
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const categoryIcons = {
  all: Layers,
  audio: AudioWaveform,
  generators: Zap,
};

export function ToolsSidebar({ 
  selectedTool, 
  onSelectTool, 
  selectedCategory, 
  onSelectCategory,
  searchQuery,
  onSearchChange
}: ToolsSidebarProps) {
  // Count tools per category
  const audioCount = tools.filter(t => t.category === "audio").length;
  const generatorsCount = tools.filter(t => t.category === "generators").length;
  const allCount = tools.length;

  const counts = {
    all: allCount,
    audio: audioCount,
    generators: generatorsCount,
  };

  // Filter by category and search
  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full lg:w-80 flex-shrink-0 space-y-5">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-11 bg-secondary/30 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "audio", "generators"] as const).map((cat) => {
          const Icon = categoryIcons[cat];
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                selectedCategory === cat
                  ? "bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border border-primary/30 shadow-lg shadow-primary/10"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent"
              )}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-md",
                selectedCategory === cat
                  ? "bg-primary/30 text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground"
              )}>
                {counts[cat]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tools List */}
      <div className="space-y-1.5">
        {filteredTools.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tools found</p>
          </div>
        ) : (
          filteredTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => tool.available && onSelectTool(tool.id)}
              disabled={!tool.available}
              className={cn(
                "w-full flex items-center gap-3.5 p-3.5 rounded-xl text-left transition-all group",
                selectedTool === tool.id
                  ? "bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/40 shadow-lg shadow-primary/5"
                  : tool.available 
                    ? "hover:bg-secondary/40 border border-transparent hover:border-border/50 hover:shadow-md" 
                    : "opacity-60 cursor-not-allowed border border-transparent"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                selectedTool === tool.id
                  ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30"
                  : tool.available
                    ? "bg-secondary/60 text-muted-foreground group-hover:bg-secondary group-hover:text-foreground"
                    : "bg-secondary/40 text-muted-foreground/60"
              )}>
                <tool.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-semibold transition-colors leading-tight",
                    selectedTool === tool.id ? "text-foreground" : "text-foreground/90"
                  )}>
                    {tool.title}
                  </span>
                  {tool.badge && (
                    <Badge 
                      className={cn(
                        "text-[10px] px-1.5 py-0 font-medium border-0 h-4 leading-none",
                        tool.badge === "Popular" && "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-sm",
                        tool.badge === "New" && "bg-accent/20 text-accent-foreground"
                      )}
                    >
                      {tool.badge}
                    </Badge>
                  )}
                  {!tool.available && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-muted-foreground/30 h-4 leading-none">
                      Soon
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {tool.description}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
