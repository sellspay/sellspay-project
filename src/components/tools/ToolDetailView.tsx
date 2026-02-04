import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";
import { ToolData } from "./toolsData";
import { cn } from "@/lib/utils";

interface ToolDetailViewProps {
  tool: ToolData;
  bannerUrl: string | null;
  onLaunch: () => void;
}

export function ToolDetailView({ tool, bannerUrl, onLaunch }: ToolDetailViewProps) {
  const Icon = tool.icon;
  
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero Banner */}
      <div className="relative w-full aspect-[21/9] overflow-hidden">
        {bannerUrl ? (
          <img 
            src={bannerUrl} 
            alt={tool.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn(
            "w-full h-full bg-gradient-to-br",
            tool.gradient
          )} />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br shadow-lg",
              tool.gradient
            )}>
              <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            {tool.badge && (
              <Badge 
                className={cn(
                  "text-xs px-2.5 py-1 font-semibold border-0",
                  tool.badge === "Pro" && "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
                  tool.badge === "Free" && "bg-green-500/20 text-green-400 border border-green-500/30"
                )}
              >
                {tool.badge === "Pro" && <Sparkles className="w-3 h-3 mr-1" />}
                {tool.badge}
              </Badge>
            )}
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
            {tool.title}
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-6">
            {tool.tagline}
          </p>
          
          <Button 
            onClick={onLaunch}
            size="lg"
            className="w-fit gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
          >
            Use Now
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Tool Details */}
      <div className="p-6 sm:p-8 md:p-12 space-y-8">
        {/* Description */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">About this tool</h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            {tool.description}
          </p>
        </div>
        
        {/* Features */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            {tool.features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                <div className={cn(
                  "w-2 h-2 rounded-full bg-gradient-to-r",
                  tool.gradient
                )} />
                <span className="text-sm text-foreground/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Examples */}
        {tool.previewExamples.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Examples</h2>
            <div className="flex flex-wrap gap-3">
              {tool.previewExamples.map((example, index) => (
                <div 
                  key={index}
                  className="px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm text-muted-foreground"
                >
                  <span className="mr-2">{example.before}</span>
                  <span>{example.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
