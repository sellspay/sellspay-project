import { Link } from "react-router-dom";
import { Scissors, Mic, Music, Video, FileAudio, AudioWaveform } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const tools = [
  {
    id: "audio-cutter",
    title: "Audio Cutter",
    description: "Cut and trim audio files with precision. Export in multiple formats.",
    icon: Scissors,
    href: "/tools/audio-cutter",
    gradient: "from-primary to-accent",
  },
  {
    id: "audio-recorder",
    title: "Audio Recorder",
    description: "Record high-quality audio directly in your browser.",
    icon: Mic,
    href: "/tools/audio-recorder",
    gradient: "from-accent to-primary",
  },
  {
    id: "audio-joiner",
    title: "Audio Joiner",
    description: "Merge multiple audio files into one seamless track.",
    icon: Music,
    href: "/tools/audio-joiner",
    gradient: "from-primary to-accent",
  },
  {
    id: "video-to-audio",
    title: "Video to Audio",
    description: "Extract audio from video files quickly and easily.",
    icon: Video,
    href: "/tools/video-to-audio",
    gradient: "from-accent to-primary",
  },
  {
    id: "audio-converter",
    title: "Audio Converter",
    description: "Convert audio files between different formats.",
    icon: FileAudio,
    href: "/tools/audio-converter",
    gradient: "from-primary to-accent",
  },
  {
    id: "waveform-generator",
    title: "Waveform Generator",
    description: "Generate visual waveforms from your audio files.",
    icon: AudioWaveform,
    href: "/tools/waveform-generator",
    gradient: "from-accent to-primary",
  },
];

export default function Tools() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Free Audio Tools</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Professional-grade audio tools for creators. No signup required, completely free to use.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link key={tool.id} to={tool.href}>
            <Card className="h-full bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group">
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <tool.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
