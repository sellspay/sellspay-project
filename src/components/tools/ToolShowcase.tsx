import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Crown,
  Wallet
} from "lucide-react";
import { toolsData, ToolData } from "./toolsData";

interface ToolShowcaseProps {
  onSelectTool: (toolId: string) => void;
  creditBalance?: number;
  isLoadingCredits?: boolean;
}

export function ToolShowcase({ 
  onSelectTool, 
  creditBalance = 0,
  isLoadingCredits 
}: ToolShowcaseProps) {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "pro" | "free">("all");

  const filteredTools = toolsData.filter(tool => {
    if (!tool.available) return false;
    if (selectedCategory === "all") return true;
    if (selectedCategory === "pro") return tool.isPro;
    if (selectedCategory === "free") return !tool.isPro;
    return true;
  });

  const proTools = toolsData.filter(t => t.isPro && t.available);
  const freeTools = toolsData.filter(t => !t.isPro && t.available);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Professional Audio Suite
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
                <span className="text-foreground">Audio Tools for</span>
                <br />
                <span className="bg-gradient-to-r from-primary via-orange-400 to-red-500 bg-clip-text text-transparent">
                  Creators & Professionals
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                AI-powered audio processing, sound generation, and editing tools. 
                From stem separation to SFX creation—everything you need in one place.
              </p>

              {/* Credit Balance Display */}
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Your Credits:</span>
                <span className="text-xl font-bold text-foreground">
                  {isLoadingCredits ? "..." : creditBalance}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="sticky top-16 z-30 py-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2">
            {[
              { id: "all", label: "All Tools", count: toolsData.filter(t => t.available).length, icon: Zap },
              { id: "pro", label: "Pro Tools", count: proTools.length, icon: Crown },
              { id: "free", label: "Free Tools", count: freeTools.length, icon: Sparkles },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-xs",
                  selectedCategory === cat.id
                    ? "bg-primary-foreground/20"
                    : "bg-background/50"
                )}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool, index) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                index={index}
                isHovered={hoveredTool === tool.id}
                onHover={() => setHoveredTool(tool.id)}
                onLeave={() => setHoveredTool(null)}
                onSelect={() => onSelectTool(tool.id)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

interface ToolCardProps {
  tool: ToolData;
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
}

function ToolCard({ tool, index, isHovered, onHover, onLeave, onSelect }: ToolCardProps) {
  const Icon = tool.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="group relative"
    >
      <div
        className={cn(
          "relative h-full rounded-2xl overflow-hidden",
          "bg-card border border-border/50",
          "transition-all duration-500",
          isHovered && "border-primary/30 shadow-2xl shadow-primary/10 scale-[1.02]"
        )}
      >
        {/* Gradient banner */}
        <div className={cn(
          "h-32 relative overflow-hidden",
          `bg-gradient-to-br ${tool.gradient}`
        )}>
          {/* Animated pattern overlay */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%)] bg-[length:60px_60px]" />
          </div>
          
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center",
              "shadow-xl transition-transform duration-500",
              isHovered && "scale-110 rotate-3"
            )}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Badge */}
          {tool.badge && (
            <Badge
              className={cn(
                "absolute top-4 right-4 border-0 shadow-lg",
                tool.badge === "Pro" && "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
                tool.badge === "Free" && "bg-green-500/90 text-white"
              )}
            >
              {tool.badge === "Pro" && <Crown className="w-3 h-3 mr-1" />}
              {tool.badge}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-1">{tool.title}</h3>
          <p className="text-sm text-primary font-medium mb-3">{tool.tagline}</p>
          <p className="text-sm text-muted-foreground mb-5 line-clamp-2">
            {tool.description}
          </p>

          {/* Features preview */}
          <div className="flex flex-wrap gap-2 mb-5">
            {tool.features.slice(0, 2).map((feature, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-lg bg-muted/50 text-muted-foreground"
              >
                {feature}
              </span>
            ))}
            {tool.features.length > 2 && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-muted/50 text-muted-foreground">
                +{tool.features.length - 2} more
              </span>
            )}
          </div>

          {/* CTA Button */}
          <Button
            onClick={onSelect}
            className={cn(
              "w-full group/btn",
              tool.isPro 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25"
                : ""
            )}
            variant={tool.isPro ? "default" : "secondary"}
          >
            <span>Launch Tool</span>
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
