import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toolsRegistry } from "@/components/tools/toolsRegistry";
import { ToolActiveView } from "@/components/tools/ToolActiveView";
import { PromoVideoBuilder } from "@/components/tools/PromoVideoBuilder";
import { MyAssetsDrawer } from "@/components/tools/MyAssetsDrawer";
import { StudioSidebar } from "./StudioSidebar";
import { StudioCanvas } from "./StudioCanvas";
import { StudioContextPanel } from "./StudioContextPanel";
import { CampaignControlPanel } from "./CampaignControlPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CampaignState } from "./CampaignCanvas";

export type StudioSection = "campaign" | "listings" | "social" | "media" | "assets";

export default function StudioLayout() {
  const [searchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<StudioSection>("campaign");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("studio-sidebar-collapsed") === "true"; } catch { return false; }
  });
  const [promoOpen, setPromoOpen] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const { credits: creditBalance, loading: isLoadingCredits } = useSubscription();
  const { profile } = useAuth();

  const [productCount, setProductCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);
  const [recentAssets, setRecentAssets] = useState<any[]>([]);
  const [campaignState, setCampaignState] = useState<CampaignState | undefined>();
  const [pendingSection, setPendingSection] = useState<StudioSection | null>(null);
  useEffect(() => {
    const toolParam = searchParams.get("tool");
    if (toolParam) setActiveTool(toolParam);
  }, [searchParams]);

  useEffect(() => {
    try { localStorage.setItem("studio-sidebar-collapsed", String(sidebarCollapsed)); } catch {}
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchStats = async () => {
      const [{ count: pCount }, { count: aCount }, { count: gCount }, { data: assets }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).eq("creator_id", profile.id),
        supabase.from("tool_assets").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
        supabase.from("ai_usage_logs").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
        supabase.from("tool_assets").select("id, asset_type, asset_url, tool_id, created_at").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(12),
      ]);
      setProductCount(pCount || 0);
      setAssetCount(aCount || 0);
      setGenerationCount(gCount || 0);
      setRecentAssets(assets || []);
    };
    fetchStats();
  }, [profile?.id]);

  const handleLaunch = (toolId: string) => {
    const entry = toolsRegistry.find(t => t.id === toolId);
    if (entry?.legacyRoute) {
      setActiveTool(entry.legacyRoute);
    } else {
      setActiveTool(toolId);
    }
  };

  const hasUnsavedProgress = activeTool || promoOpen || (campaignState?.selectedProduct != null) || (campaignState?.selectedTemplate != null);

  const handleSectionChange = (section: StudioSection) => {
    if (section === "assets") {
      setAssetsOpen(true);
      return;
    }
    if (section === activeSection && !activeTool) return;

    if (hasUnsavedProgress) {
      setPendingSection(section);
      return;
    }
    setActiveSection(section);
    setActiveTool(null);
  };

  const confirmSectionChange = () => {
    if (pendingSection) {
      setActiveSection(pendingSection);
      setActiveTool(null);
      setPromoOpen(false);
      setCampaignState(undefined);
      setPendingSection(null);
    }
  };

  const sidebarWidth = sidebarCollapsed ? 56 : 200;
  const showRightPanel = activeTool || (!activeTool && activeSection === "campaign");

  return (
    <div className="h-screen grid overflow-hidden" style={{
      gridTemplateColumns: showRightPanel
        ? `${sidebarWidth}px 1fr 320px`
        : `${sidebarWidth}px 1fr`,
    }}>
      <StudioSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        creditBalance={creditBalance}
        isLoadingCredits={isLoadingCredits}
        activeTool={activeTool}
      />

      {/* Center Canvas */}
      <main className="relative overflow-y-auto custom-scrollbar bg-background">
        {promoOpen ? (
          <PromoVideoBuilder open={promoOpen} onOpenChange={setPromoOpen} inline initialProduct={campaignState?.selectedProduct || null} />
        ) : activeTool ? (
          <ToolActiveView
            toolId={activeTool}
            onClose={() => setActiveTool(null)}
            creditBalance={creditBalance}
            isLoadingCredits={isLoadingCredits}
            embedded
          />
        ) : (
          <StudioCanvas
            activeSection={activeSection}
            productCount={productCount}
            assetCount={assetCount}
            generationCount={generationCount}
            creditBalance={creditBalance}
            isLoadingCredits={isLoadingCredits}
            recentAssets={recentAssets}
            onLaunchPromo={() => setPromoOpen(true)}
            onLaunchTool={handleLaunch}
            onSectionChange={handleSectionChange}
            onCampaignStateChange={setCampaignState}
          />
        )}
      </main>

      {/* Right Panel */}
      {showRightPanel && (
        <AnimatePresence>
          {activeTool ? (
            <StudioContextPanel
              toolId={activeTool}
              activeSection={activeSection}
              creditBalance={creditBalance}
              isLoadingCredits={isLoadingCredits}
            />
          ) : activeSection === "campaign" ? (
            <CampaignControlPanel
              creditBalance={creditBalance}
              isLoadingCredits={isLoadingCredits}
              onGenerate={() => setPromoOpen(true)}
              campaignState={campaignState}
            />
          ) : null}
        </AnimatePresence>
      )}

      {/* PromoVideoBuilder rendered inline in canvas above */}
      <MyAssetsDrawer
        trigger={<span className="hidden" />}
        open={assetsOpen}
        onOpenChange={setAssetsOpen}
      />

      <AlertDialog open={!!pendingSection} onOpenChange={(open) => !open && setPendingSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this screen?</AlertDialogTitle>
            <AlertDialogDescription>
              Leaving this screen will cancel your current progress. Any unsaved work will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSectionChange} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
