import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Sparkles, 
  Crown,
  Wallet,
  Play,
  ChevronDown
} from "lucide-react";
import { toolsData, ToolData } from "./toolsData";
import { supabase } from "@/integrations/supabase/client";

interface ToolBanners {
  tool_sfx_banner_url: string | null;
  tool_vocal_banner_url: string | null;
  tool_manga_banner_url: string | null;
  tool_video_banner_url: string | null;
  tool_audio_cutter_banner_url: string | null;
  tool_audio_joiner_banner_url: string | null;
  tool_audio_converter_banner_url: string | null;
  tool_audio_recorder_banner_url: string | null;
  tool_waveform_banner_url: string | null;
  tool_video_to_audio_banner_url: string | null;
}

interface ToolShowcaseProps {
  onSelectTool: (toolId: string) => void;
  creditBalance?: number;
  isLoadingCredits?: boolean;
}

// Map tool IDs to banner column names
const toolBannerMap: Record<string, keyof ToolBanners> = {
  'sfx-generator': 'tool_sfx_banner_url',
  'voice-isolator': 'tool_vocal_banner_url',
  'sfx-isolator': 'tool_manga_banner_url',
  'music-splitter': 'tool_video_banner_url',
  'audio-cutter': 'tool_audio_cutter_banner_url',
  'audio-joiner': 'tool_audio_joiner_banner_url',
  'audio-converter': 'tool_audio_converter_banner_url',
  'audio-recorder': 'tool_audio_recorder_banner_url',
  'waveform-generator': 'tool_waveform_banner_url',
  'video-to-audio': 'tool_video_to_audio_banner_url',
};

export function ToolShowcase({ 
  onSelectTool, 
  creditBalance = 0,
  isLoadingCredits 
}: ToolShowcaseProps) {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [banners, setBanners] = useState<ToolBanners | null>(null);

  // Fetch banners from database
  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from('site_content')
        .select('tool_sfx_banner_url, tool_vocal_banner_url, tool_manga_banner_url, tool_video_banner_url, tool_audio_cutter_banner_url, tool_audio_joiner_banner_url, tool_audio_converter_banner_url, tool_audio_recorder_banner_url, tool_waveform_banner_url, tool_video_to_audio_banner_url')
        .eq('id', 'main')
        .single();
      
      if (data) {
        setBanners(data as ToolBanners);
      }
    };
    fetchBanners();
  }, []);

  const availableTools = toolsData.filter(tool => tool.available);
  const proTools = availableTools.filter(t => t.isPro);
  const freeTools = availableTools.filter(t => !t.isPro);

  const getBannerUrl = (toolId: string): string | null => {
    if (!banners) return null;
    const key = toolBannerMap[toolId];
    return key ? banners[key] : null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cinematic Hero Header */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-60" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge className="mb-8 px-6 py-2 bg-primary/10 text-primary border-primary/20 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Professional Audio Suite
            </Badge>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-normal tracking-tight italic mb-6">
              <span className="text-foreground">AI Studio</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12">
              AI-powered audio processing, sound generation, and editing tools for creators.
            </p>

            {/* Credit Balance */}
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-card/50 border border-border/50 backdrop-blur-sm">
              <Wallet className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Your Credits</span>
              <span className="text-3xl font-bold text-foreground">
                {isLoadingCredits ? "..." : creditBalance}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-muted-foreground/50" />
        </motion.div>
      </section>

      {/* Pro Tools Section */}
      <section className="relative">
        <div className="px-4 py-8">
          <div className="flex items-center gap-4 mb-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <h2 className="text-3xl font-bold">Pro Tools</h2>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              {proTools.length} Tools
            </Badge>
          </div>
          <p className="text-muted-foreground mb-8">Premium AI-powered tools for professional creators</p>
        </div>

        {/* Full-width stacked tool panels */}
        <div className="space-y-0">
          {proTools.map((tool, index) => (
            <ToolPanel
              key={tool.id}
              tool={tool}
              index={index}
              bannerUrl={getBannerUrl(tool.id)}
              isHovered={hoveredTool === tool.id}
              onHover={() => setHoveredTool(tool.id)}
              onLeave={() => setHoveredTool(null)}
              onSelect={() => onSelectTool(tool.id)}
            />
          ))}
        </div>
      </section>

      {/* Free Tools Section */}
      <section className="relative mt-24">
        <div className="px-4 py-8">
          <div className="flex items-center gap-4 mb-2">
            <Sparkles className="w-6 h-6 text-green-500" />
            <h2 className="text-3xl font-bold">Free Tools</h2>
            <Badge className="bg-green-500/90 text-white border-0">
              {freeTools.length} Tools
            </Badge>
          </div>
          <p className="text-muted-foreground mb-8">Essential audio utilities — no credits required</p>
        </div>

        {/* Full-width stacked tool panels */}
        <div className="space-y-0">
          {freeTools.map((tool, index) => (
            <ToolPanel
              key={tool.id}
              tool={tool}
              index={index}
              bannerUrl={getBannerUrl(tool.id)}
              isHovered={hoveredTool === tool.id}
              onHover={() => setHoveredTool(tool.id)}
              onLeave={() => setHoveredTool(null)}
              onSelect={() => onSelectTool(tool.id)}
            />
          ))}
        </div>
      </section>

      {/* Bottom spacing */}
      <div className="h-24" />
    </div>
  );
}

interface ToolPanelProps {
  tool: ToolData;
  index: number;
  bannerUrl: string | null;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
}

function ToolPanel({ tool, index, bannerUrl, isHovered, onHover, onLeave, onSelect }: ToolPanelProps) {
  const Icon = tool.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onSelect}
      className="group relative w-full cursor-pointer"
    >
      {/* Full-width panel with fixed aspect ratio */}
      <div 
        className={cn(
          "relative w-full overflow-hidden border-y border-border/30",
          "transition-all duration-700 ease-out",
          isHovered ? "border-primary/50" : ""
        )}
        style={{ aspectRatio: '21 / 9' }}
      >
        {/* Background - gradient or image */}
        <div className="absolute inset-0">
          {bannerUrl ? (
            <>
              <img 
                src={bannerUrl} 
                alt={tool.title}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-700",
                  isHovered ? "scale-105" : "scale-100"
                )}
              />
              {/* Overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            </>
          ) : (
            <div className={cn(
              "w-full h-full bg-gradient-to-br transition-all duration-700",
              tool.gradient,
              isHovered ? "opacity-100" : "opacity-80"
            )} />
          )}
        </div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full px-8 md:px-16 lg:px-24">
            <div className="max-w-4xl">
              {/* Tool badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-14 h-14 flex items-center justify-center transition-all duration-500",
                  "bg-white/10 backdrop-blur-sm border border-white/20",
                  isHovered && "scale-110 bg-white/20"
                )}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                
                {tool.badge && (
                  <Badge
                    className={cn(
                      "border-0 text-sm px-3 py-1",
                      tool.badge === "Pro" && "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
                      tool.badge === "Free" && "bg-green-500/90 text-white"
                    )}
                  >
                    {tool.badge === "Pro" && <Crown className="w-3.5 h-3.5 mr-1.5" />}
                    {tool.badge}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h3 className={cn(
                "text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 transition-all duration-500",
                isHovered && "translate-x-2"
              )}>
                {tool.title}
              </h3>

              {/* Tagline */}
              <p className={cn(
                "text-xl md:text-2xl text-white/80 mb-6 transition-all duration-500",
                isHovered && "translate-x-2 text-white"
              )}>
                {tool.tagline}
              </p>

              {/* Features */}
              <div className={cn(
                "flex flex-wrap gap-3 mb-8 transition-all duration-500",
                isHovered ? "opacity-100 translate-y-0" : "opacity-70"
              )}>
                {tool.features.slice(0, 4).map((feature, i) => (
                  <span
                    key={i}
                    className="text-sm px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 border border-white/10"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                size="lg"
                className={cn(
                  "group/btn transition-all duration-500 text-lg px-8 py-6",
                  tool.isPro 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    : "bg-white text-background hover:bg-white/90",
                  isHovered ? "translate-x-2" : ""
                )}
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Launch {tool.title}
                <ArrowRight className="w-5 h-5 ml-3 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right side decorative element */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-l from-transparent to-transparent",
            "opacity-0 transition-opacity duration-700",
            isHovered && "opacity-100"
          )}>
            <div className="absolute right-16 top-1/2 -translate-y-1/2">
              <Icon className={cn(
                "w-48 h-48 text-white/5 transition-all duration-700",
                isHovered && "text-white/10 scale-110"
              )} />
            </div>
          </div>
        </div>

        {/* Edge accent lines */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary to-transparent",
          "opacity-0 transition-opacity duration-500",
          isHovered && "opacity-100"
        )} />
      </div>
    </motion.div>
  );
}
