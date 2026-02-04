import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Check } from "lucide-react";
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
      {/* Hero Banner - Full width cinematic style like Artlist */}
      <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
        {/* Background Image/Gradient */}
        {bannerUrl ? (
          <img 
            src={bannerUrl} 
            alt={tool.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className={cn(
            "absolute inset-0 w-full h-full bg-gradient-to-br",
            tool.gradient
          )} />
        )}
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        
        {/* Content overlay - positioned like Artlist */}
        <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20">
          <div className="max-w-2xl">
            {/* Badge */}
            {tool.badge && (
              <Badge 
                className={cn(
                  "mb-6 text-sm px-4 py-1.5 font-semibold border-0",
                  tool.badge === "Pro" && "bg-primary text-primary-foreground",
                  tool.badge === "Free" && "bg-secondary text-secondary-foreground"
                )}
              >
                {tool.badge === "Pro" && <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                {tool.badge}
              </Badge>
            )}
            
            {/* Main Headline - Large like Artlist */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1]">
              {tool.tagline}
            </h1>
            
            {/* Description */}
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
              {tool.description}
            </p>
            
            {/* CTA Button - Styled like Artlist */}
            <Button 
              onClick={onLaunch}
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-full"
            >
              Use Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Features Section - Clean grid like reference */}
      <div className="px-8 sm:px-12 md:px-16 lg:px-20 py-16 bg-background">
        <div className="max-w-4xl">
          {/* Tool icon and title */}
          <div className="flex items-center gap-4 mb-8">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              "bg-gradient-to-br shadow-lg",
              tool.gradient
            )}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{tool.title}</h2>
              <p className="text-muted-foreground">AI-powered audio tool</p>
            </div>
          </div>
          
          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {tool.features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50"
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  "bg-gradient-to-br",
                  tool.gradient
                )}>
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>
          
          {/* Examples Section */}
          {tool.previewExamples.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">What you can create</h3>
              <div className="flex flex-wrap gap-3">
                {tool.previewExamples.map((example, index) => (
                  <div 
                    key={index}
                    className="px-4 py-2.5 rounded-full bg-secondary/50 border border-border/50 text-sm"
                  >
                    <span className="mr-2">{example.before}</span>
                    <span className="text-muted-foreground">{example.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
