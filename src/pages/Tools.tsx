import { useState } from "react";
import { ToolsSidebar } from "@/components/tools/ToolsSidebar";
import { ToolContent } from "@/components/tools/ToolContent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCredits } from "@/hooks/useCredits";

export default function Tools() {
  const [selectedTool, setSelectedTool] = useState<string | null>("sfx-generator");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "audio" | "generators">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { creditBalance, isLoading } = useCredits();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-hidden">
      <div className="container mx-auto px-3 sm:px-4 h-full py-3 sm:py-4">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full">
          {/* Sidebar - Compact on mobile, full on desktop */}
          <div className="lg:w-80 flex-shrink-0 lg:h-full lg:overflow-hidden">
            <ScrollArea className="h-auto lg:h-full">
              <div className="lg:pr-4 pb-2 lg:pb-4">
                <ToolsSidebar
                  selectedTool={selectedTool}
                  onSelectTool={setSelectedTool}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  creditBalance={creditBalance}
                  isLoadingCredits={isLoading}
                />
              </div>
            </ScrollArea>
          </div>

          {/* Divider - Desktop only */}
          <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-border/50 to-transparent flex-shrink-0" />

          {/* Content Area */}
          <div className="flex-1 min-w-0 min-h-[60vh] sm:min-h-0 sm:h-full overflow-hidden">
            <div className="relative rounded-xl sm:rounded-2xl border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm h-full overflow-hidden">
              {/* Glass effect border */}
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
              <div className="absolute inset-[1px] rounded-xl sm:rounded-2xl bg-card/80 pointer-events-none" />
              
              {/* Content */}
              <div className="relative z-10 h-full overflow-auto">
                <ToolContent toolId={selectedTool} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
