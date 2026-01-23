import { useState } from "react";
import { ToolsSidebar } from "@/components/tools/ToolsSidebar";
import { ToolContent } from "@/components/tools/ToolContent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AudioWaveform, Wand2 } from "lucide-react";

export default function Tools() {
  const [selectedTool, setSelectedTool] = useState<string | null>("sfx-generator");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "audio" | "generators">("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden border-b border-border/30">
        {/* Decorative gradient blurs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-glow-pulse" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: "2s" }} />
        </div>
        
        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <AudioWaveform className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Professional Audio Suite</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Audio Tools &{" "}
              </span>
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                AI Generators
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional audio processing and AI-powered creative tools. 
              Edit, generate, and transform your audio with ease.
            </p>
            
            {/* Floating icons */}
            <div className="hidden md:flex justify-center gap-8 mt-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center animate-float">
                <AudioWaveform className="w-6 h-6 text-primary" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center animate-float" style={{ animationDelay: "1s" }}>
                <Wand2 className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-20rem)]">
          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ScrollArea className="lg:h-[calc(100vh-10rem)]">
              <ToolsSidebar
                selectedTool={selectedTool}
                onSelectTool={setSelectedTool}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </ScrollArea>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-border/50 to-transparent" />

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="relative rounded-2xl border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm min-h-[500px] overflow-hidden">
              {/* Glass effect border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
              <div className="absolute inset-[1px] rounded-2xl bg-card/80 pointer-events-none" />
              
              {/* Content */}
              <div className="relative z-10">
                <ToolContent toolId={selectedTool} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
