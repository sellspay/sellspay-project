import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { ToolData } from "./toolsData";
import { cn } from "@/lib/utils";
import Footer from "@/components/layout/Footer";

interface ToolDetailViewProps {
  tool: ToolData;
  bannerUrl: string | null;
  onLaunch: () => void;
}

export function ToolDetailView({ tool, bannerUrl, onLaunch }: ToolDetailViewProps) {
  const Icon = tool.icon;
  
  return (
    <div className="min-h-full">
      {/* Hero Section - Full viewport height, massive banner */}
      <section className="relative w-full min-h-[85vh] flex items-center">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0">
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
          
          {/* Gradient overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 px-8 sm:px-12 md:px-16 lg:px-20 max-w-3xl">
          {/* Pro Badge */}
          {tool.isPro && (
            <Badge className="mb-6 bg-primary text-primary-foreground border-0 px-4 py-1.5 text-sm font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Pro
            </Badge>
          )}
          
          {/* Main Headline - Large and bold */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.05] tracking-tight">
            {tool.tagline}
          </h1>
          
          {/* Description */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl">
            {tool.description}
          </p>
          
          {/* CTA Button */}
          <Button 
            onClick={onLaunch}
            size="lg"
            className="h-14 px-10 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-lg"
          >
            Use Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
      
      {/* Content Sections - No cards, just flowing text + images */}
      <div className="bg-background">
        
        {/* What is this tool? */}
        <section className="px-8 sm:px-12 md:px-16 lg:px-20 py-20 border-t border-border/30">
          <div className="max-w-5xl">
            <div className="flex items-center gap-4 mb-8">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                "bg-gradient-to-br",
                tool.gradient
              )}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{tool.title}</h2>
                <p className="text-muted-foreground">AI-powered audio tool</p>
              </div>
            </div>
            
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mb-12">
              {tool.description} Whether you're a content creator, game developer, or audio professional, 
              this tool streamlines your workflow and delivers studio-quality results in seconds.
            </p>
            
            {/* Features as simple list - no cards */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground mb-6">Key Features</h3>
              <ul className="space-y-4">
                {tool.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                      "bg-primary/20"
                    )}>
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-foreground text-lg">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        
        {/* How to Use */}
        <section className="px-8 sm:px-12 md:px-16 lg:px-20 py-20 bg-secondary/20 border-t border-border/30">
          <div className="max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">How It Works</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-12 max-w-3xl">
              Getting started is simple. No downloads, no complex setups—just upload your file or enter your prompt 
              and let our AI handle the rest.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                <div className="text-5xl font-bold text-primary/30 mb-4">01</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Upload or Describe</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {tool.isPro 
                    ? "Enter a text description of the sound you want to create, or upload an audio file to process."
                    : "Drag and drop your audio file or record directly in the browser."}
                </p>
              </div>
              
              <div>
                <div className="text-5xl font-bold text-primary/30 mb-4">02</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Process with AI</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our advanced AI analyzes your input and processes it using state-of-the-art audio algorithms.
                </p>
              </div>
              
              <div>
                <div className="text-5xl font-bold text-primary/30 mb-4">03</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Download & Use</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Preview your result and download in high-quality format. Ready for your project instantly.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Who is this for? */}
        <section className="px-8 sm:px-12 md:px-16 lg:px-20 py-20 border-t border-border/30">
          <div className="max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Who Is This For?</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-12 max-w-3xl">
              {tool.title} is built for creators who need professional audio without the complexity of traditional software.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <span className="text-2xl">🎬</span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Video Creators</h3>
                  <p className="text-muted-foreground">YouTubers, filmmakers, and content producers who need quick audio solutions.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <span className="text-2xl">🎮</span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Game Developers</h3>
                  <p className="text-muted-foreground">Indie devs and studios looking for custom audio assets without hiring a sound designer.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <span className="text-2xl">🎙️</span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Podcasters</h3>
                  <p className="text-muted-foreground">Create intros, transitions, and sound effects that make your show stand out.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <span className="text-2xl">🎵</span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Music Producers</h3>
                  <p className="text-muted-foreground">Extract stems, isolate vocals, or add unique sound design to your tracks.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Bottom CTA */}
        <section className="px-8 sm:px-12 md:px-16 lg:px-20 py-20 bg-secondary/20 border-t border-border/30">
          <div className="max-w-3xl text-center mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Try {tool.title} now—no downloads required.
            </p>
            <Button 
              onClick={onLaunch}
              size="lg"
              className="h-14 px-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-lg"
            >
              Use Now
              <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          </div>
        </section>
        
        {/* Footer inside right content area */}
        <Footer />
      </div>
    </div>
  );
}
