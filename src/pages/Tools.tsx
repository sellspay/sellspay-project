import { useState } from "react";
import { ToolsSidebar } from "@/components/tools/ToolsSidebar";
import { ToolContent } from "@/components/tools/ToolContent";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Tools() {
  const [selectedTool, setSelectedTool] = useState<string | null>("audio-cutter");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "audio" | "generators">("all");

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-12rem)]">
        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ScrollArea className="lg:h-[calc(100vh-8rem)]">
            <ToolsSidebar
              selectedTool={selectedTool}
              onSelectTool={setSelectedTool}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </ScrollArea>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-border/50" />

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-card/30 rounded-xl border border-border/50 min-h-[500px]">
            <ToolContent toolId={selectedTool} />
          </div>
        </div>
      </div>
    </div>
  );
}
