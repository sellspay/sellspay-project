import { 
  Mic2, 
  Scissors, 
  Music, 
  Video, 
  FileAudio, 
  AudioWaveform,
  Volume2,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";

export interface ToolData {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "audio" | "generators";
  badge?: "Popular" | "New" | "Pro" | "Free";
  available: boolean;
  isPro?: boolean;
  features: string[];
  previewExamples: {
    label: string;
    before?: string;
    after?: string;
  }[];
  gradient: string;
  accentColor: string;
}

export const toolsData: ToolData[] = [
  {
    id: "sfx-generator",
    title: "SFX Generator",
    tagline: "Create Any Sound Effect with AI",
    description: "Transform text descriptions into professional-quality sound effects instantly. Perfect for games, videos, podcasts, and more.",
    icon: Volume2,
    category: "audio",
    badge: "Pro",
    available: true,
    isPro: true,
    features: [
      "Text-to-sound AI generation",
      "Unlimited sound variations",
      "High-quality audio output",
      "Instant download"
    ],
    previewExamples: [
      { label: "Explosion", before: "💥", after: "Cinematic explosion with debris" },
      { label: "Footsteps", before: "👣", after: "Footsteps on gravel" },
      { label: "Magic Spell", before: "✨", after: "Magical energy charging" },
    ],
    gradient: "from-orange-500 via-red-500 to-pink-500",
    accentColor: "orange",
  },
  {
    id: "voice-isolator",
    title: "Voice Isolator",
    tagline: "Extract Pure Vocals Instantly",
    description: "Separate vocals from any audio track with studio-quality AI. Remove backgrounds or isolate voices in seconds.",
    icon: Mic2,
    category: "audio",
    badge: "Pro",
    available: true,
    isPro: true,
    features: [
      "AI-powered vocal separation",
      "Remove background music",
      "Isolate specific voices",
      "Studio-quality output"
    ],
    previewExamples: [
      { label: "Full Track", before: "🎵", after: "Clean vocals only" },
      { label: "Interview", before: "🎤", after: "Voice without noise" },
    ],
    gradient: "from-purple-500 via-violet-500 to-indigo-500",
    accentColor: "purple",
  },
  {
    id: "sfx-isolator",
    title: "SFX Isolator",
    tagline: "Isolate Sound Effects from Any Audio",
    description: "Extract specific sound effects from complex audio mixes. Perfect for sound designers and editors.",
    icon: SlidersHorizontal,
    category: "audio",
    badge: "Pro",
    available: true,
    isPro: true,
    features: [
      "Isolate specific sound effects",
      "Remove unwanted elements",
      "Preserve audio quality",
      "Multiple output formats"
    ],
    previewExamples: [
      { label: "Movie Scene", before: "🎬", after: "Isolated foley sounds" },
      { label: "Game Audio", before: "🎮", after: "Clean sound effects" },
    ],
    gradient: "from-cyan-500 via-teal-500 to-emerald-500",
    accentColor: "teal",
  },
  {
    id: "music-splitter",
    title: "Music Splitter",
    tagline: "Split Any Track into Stems",
    description: "Separate vocals, drums, bass, and other instruments from any song. Professional stem separation powered by AI.",
    icon: Music,
    category: "audio",
    badge: "Pro",
    available: true,
    isPro: true,
    features: [
      "6-stem separation",
      "Vocals, drums, bass, guitar, piano, other",
      "High-fidelity output",
      "Batch processing"
    ],
    previewExamples: [
      { label: "Full Song", before: "🎶", after: "Separate stems" },
      { label: "Remix Ready", before: "🎧", after: "Isolated instruments" },
    ],
    gradient: "from-pink-500 via-rose-500 to-red-500",
    accentColor: "pink",
  },
  {
    id: "audio-cutter",
    title: "Audio Cutter",
    tagline: "Precision Audio Trimming",
    description: "Trim and slice audio files with frame-accurate precision. Create loops, remove silences, or extract the perfect clip.",
    icon: Scissors,
    category: "audio",
    badge: "Free",
    available: true,
    features: [
      "Frame-accurate cutting",
      "Visual waveform editing",
      "Fade in/out effects",
      "Multiple format support"
    ],
    previewExamples: [
      { label: "Long Track", before: "📼", after: "Perfect clip" },
    ],
    gradient: "from-emerald-500 via-green-500 to-lime-500",
    accentColor: "green",
  },
  {
    id: "audio-joiner",
    title: "Audio Joiner",
    tagline: "Merge Audio Files Seamlessly",
    description: "Combine multiple audio files into one seamless track with crossfades and transitions.",
    icon: Sparkles,
    category: "audio",
    badge: "Free",
    available: true,
    features: [
      "Unlimited file merging",
      "Crossfade transitions",
      "Gap adjustment",
      "Drag & drop reordering"
    ],
    previewExamples: [
      { label: "Multiple Clips", before: "📁", after: "Single track" },
    ],
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    accentColor: "blue",
  },
  {
    id: "audio-recorder",
    title: "Audio Recorder",
    tagline: "Record High-Quality Audio",
    description: "Record professional audio directly in your browser. Perfect for voiceovers, podcasts, and quick recordings.",
    icon: Mic2,
    category: "audio",
    badge: "Free",
    available: true,
    features: [
      "Browser-based recording",
      "Multiple quality options",
      "Pause & resume",
      "Instant download"
    ],
    previewExamples: [
      { label: "Voice Recording", before: "🎙️", after: "Clean audio file" },
    ],
    gradient: "from-amber-500 via-orange-500 to-red-500",
    accentColor: "amber",
  },
  {
    id: "audio-converter",
    title: "Audio Converter",
    tagline: "Convert to Any Format",
    description: "Convert audio files between any format. MP3, WAV, FLAC, AAC, OGG, and more.",
    icon: FileAudio,
    category: "audio",
    badge: "Free",
    available: true,
    features: [
      "All major formats",
      "Batch conversion",
      "Quality presets",
      "Metadata preservation"
    ],
    previewExamples: [
      { label: "WAV File", before: "📀", after: "MP3, FLAC, AAC" },
    ],
    gradient: "from-slate-500 via-gray-500 to-zinc-500",
    accentColor: "slate",
  },
  {
    id: "video-to-audio",
    title: "Video to Audio",
    tagline: "Extract Audio from Video",
    description: "Pull high-quality audio from any video file. Perfect for music, voiceovers, and sound design.",
    icon: Video,
    category: "audio",
    badge: "Free",
    available: true,
    features: [
      "All video formats",
      "High-quality extraction",
      "Multiple output formats",
      "Fast processing"
    ],
    previewExamples: [
      { label: "Video File", before: "🎬", after: "Audio track" },
    ],
    gradient: "from-fuchsia-500 via-purple-500 to-violet-500",
    accentColor: "fuchsia",
  },
  {
    id: "waveform-generator",
    title: "Waveform Generator",
    tagline: "Visualize Your Audio",
    description: "Generate stunning visual waveforms from any audio file. Perfect for social media and video content.",
    icon: AudioWaveform,
    category: "audio",
    badge: "Free",
    available: true,
    features: [
      "Multiple waveform styles",
      "Custom colors",
      "Animation options",
      "Export as image/video"
    ],
    previewExamples: [
      { label: "Audio File", before: "🎵", after: "Visual waveform" },
    ],
    gradient: "from-sky-500 via-cyan-500 to-teal-500",
    accentColor: "sky",
  },
];

export const getToolById = (id: string): ToolData | undefined => {
  return toolsData.find(tool => tool.id === id);
};
