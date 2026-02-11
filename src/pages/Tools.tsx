import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap, Layers, Store } from "lucide-react";
import { QuickToolsGrid } from "@/components/tools/QuickToolsGrid";
import { MyAssetsDrawer } from "@/components/tools/MyAssetsDrawer";
import { CampaignsGrid } from "@/components/tools/CampaignsGrid";
import { StoreAssistantGrid } from "@/components/tools/StoreAssistantGrid";
import { ToolActiveView } from "@/components/tools/ToolActiveView";
import { useSubscription } from "@/hooks/useSubscription";
import { toolsRegistry } from "@/components/tools/toolsRegistry";

export default function Tools() {
  const [searchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const { credits: creditBalance, loading: isLoading } = useSubscription();

  useEffect(() => {
    const toolParam = searchParams.get("tool");
    if (toolParam) setActiveTool(toolParam);
  }, [searchParams]);

  const handleLaunch = (toolId: string) => {
    // Find the tool in registry to check for legacy route
    const entry = toolsRegistry.find(t => t.id === toolId);
    if (entry?.legacyRoute) {
      setActiveTool(entry.legacyRoute);
    } else {
      setActiveTool(toolId);
    }
  };

  if (activeTool) {
    return (
      <div className="min-h-screen bg-background">
        <ToolActiveView
          toolId={activeTool}
          onClose={() => setActiveTool(null)}
          creditBalance={creditBalance}
          isLoadingCredits={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">AI Studio</h1>
            <p className="text-sm text-muted-foreground mt-1">Generate, create, and grow — all from one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <MyAssetsDrawer />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card">
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">
                {isLoading ? "…" : creditBalance}
              </span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="quick" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 h-auto gap-1">
            <TabsTrigger value="quick" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-background px-4 py-2">
              <Zap className="h-3.5 w-3.5" /> Quick Tools
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-background px-4 py-2">
              <Layers className="h-3.5 w-3.5" /> Campaigns
            </TabsTrigger>
            <TabsTrigger value="store" className="gap-2 text-xs sm:text-sm data-[state=active]:bg-background px-4 py-2">
              <Store className="h-3.5 w-3.5" /> Store Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <QuickToolsGrid onLaunch={handleLaunch} />
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignsGrid />
          </TabsContent>

          <TabsContent value="store">
            <StoreAssistantGrid onLaunch={handleLaunch} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
