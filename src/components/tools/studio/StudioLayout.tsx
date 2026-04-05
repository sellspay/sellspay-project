import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/lib/auth";
import { PanelLeftClose, PanelLeft, MessageCircle } from "lucide-react";
import sellspayLogo from "@/assets/sellspay-s-logo-new.png";
import { supabase } from "@/integrations/supabase/client";
import { dispatchAuthGate, AUTH_GATE_EVENT } from "@/utils/authGateEvent";
import { SignUpPromoDialog } from "@/components/tools/SignUpPromoDialog";
import { toolsRegistry } from "@/components/tools/toolsRegistry";
import { ToolActiveView } from "@/components/tools/ToolActiveView";
import { PromoVideoBuilder } from "@/components/tools/PromoVideoBuilder";
import { MyAssetsDrawer } from "@/components/tools/MyAssetsDrawer";
import { StudioSidebar } from "./StudioSidebar";
import { StudioHomeBanner } from "./StudioHomeBanner";
import { StudioCanvas } from "./StudioCanvas";
import { StudioContextPanel } from "./StudioContextPanel";
import { CampaignControlPanel } from "./CampaignControlPanel";
import { CampaignResultsDashboard } from "./CampaignResultsDashboard";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PricingModal } from "@/components/pricing/PricingModal";
import type { CampaignState } from "./CampaignCanvas";

export type StudioSection = "home" | "campaign" | "listings" | "social" | "media" | "assets";

export default function StudioLayout() {
  const { toolId: routeToolId } = useParams<{ toolId?: string }>();
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<string | null>(routeToolId || null);
  const [activeSection, setActiveSection] = useState<StudioSection>("home");
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

  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignResult, setCampaignResult] = useState<any>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [showSignUpPromo, setShowSignUpPromo] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  // Listen for auth gate events from tool components
  useEffect(() => {
    const handler = () => setShowSignUpPromo(true);
    window.addEventListener(AUTH_GATE_EVENT, handler);
    return () => window.removeEventListener(AUTH_GATE_EVENT, handler);
  }, []);

  useEffect(() => {
    if (routeToolId) {
      setActiveTool(routeToolId);
    }
  }, [routeToolId]);

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
    const resolvedId = entry?.legacyRoute || toolId;
    setActiveTool(resolvedId);
    navigate(`/studio/${resolvedId}`, { replace: true });
  };

  const handleGoHome = () => {
    if (hasUnsavedProgress || campaignResult) {
      setPendingSection("home");
      return;
    }
    setActiveSection("home");
    setActiveTool(null);
    setCampaignResult(null);
    navigate("/studio", { replace: true });
  };

  const hasUnsavedProgress = promoOpen || (campaignState?.selectedProduct != null) || (campaignState?.selectedTemplate != null);

  const handleSectionChange = (section: StudioSection) => {
    if (section === "assets") {
      setAssetsOpen(true);
      return;
    }
    if (section === activeSection && !activeTool && !campaignResult) return;

    if (hasUnsavedProgress || campaignResult) {
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
      setCampaignResult(null);
      setPendingSection(null);
    }
  };

  const handleGenerate = async (outputs: string[]) => {
    if (!campaignState?.selectedProduct || !campaignState?.selectedTemplate) return;

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        dispatchAuthGate();
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-campaign-pack`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            product: campaignState.selectedProduct,
            outputs,
            style: campaignState.selectedTemplate,
            goal: campaignState.selectedGoal,
            direction: campaignState.extraDirection,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");

      setCampaignResult(data.result);
      setCreditsUsed(data.credits_used || outputs.length);
      toast.success("Campaign pack generated!");
    } catch (err: any) {
      console.error("Campaign generation error:", err);
      toast.error(err.message || "Failed to generate campaign pack");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackFromResults = () => setCampaignResult(null);

  
  const isHome = activeSection === "home" && !activeTool && !campaignResult;
  const showRightPanel = !isHome && !campaignResult && !activeTool && activeSection === "campaign";

  return (
    <div className="studio-dark h-screen flex flex-col overflow-hidden bg-[hsl(var(--studio-surface))] studio-layout">
      {/* Fixed top header - independent of sidebar */}
      <header className="h-12 shrink-0 flex items-center justify-between px-3 bg-[hsl(var(--studio-surface))]">
        {/* Left: sidebar toggle + logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            className="shrink-0 p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/[0.06] transition-colors"
          >
            {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:opacity-80 transition-opacity"
          >
            <img src={sellspayLogo} alt="SellsPay" className="h-6 w-6 shrink-0" />
            <span className="font-bold text-[#f4f4f5] tracking-tight">SellsPay</span>
          </button>
        </div>

        {/* Right: social icons + auth buttons */}
        <div className="flex items-center gap-1.5">
          {/* Discord */}
          <a
            href="https://discord.gg/sellspay"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/[0.06] transition-colors"
            title="Discord"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
            </svg>
          </a>
          {/* Instagram */}
          <a
            href="https://instagram.com/sellspay.io"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-white/[0.06] transition-colors"
            title="Instagram"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>

          <div className="w-px h-5 bg-white/[0.08] mx-1" />

          {/* Pricing */}
          <button
            onClick={() => setPricingOpen(true)}
            className="relative px-5 py-1.5 text-sm font-bold rounded-full text-[#0a0a0c] bg-gradient-to-b from-white via-[#b0ecff] to-[#38bdf8] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_-1px_2px_rgba(56,189,248,0.5)_inset,0_2px_8px_rgba(37,99,235,0.25)] transition-all duration-300 hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_-1px_2px_rgba(56,189,248,0.5)_inset,0_4px_20px_rgba(34,211,238,0.45),0_0_40px_rgba(37,99,235,0.2)] hover:translate-y-[-1px] active:translate-y-[0.5px] active:shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_1px_4px_rgba(37,99,235,0.2)]"
          >
            Pricing
          </button>

          {profile ? (
            <button
              onClick={() => navigate("/profile")}
              className="px-3 py-1.5 text-sm font-medium text-[#f4f4f5] hover:opacity-80 transition-opacity"
            >
              My Profile
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/auth")}
                className="px-3 py-1.5 text-sm font-medium text-[#f4f4f5] border border-white/[0.12] rounded-full hover:bg-white/[0.06] transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-1.5 text-sm font-semibold text-white btn-premium rounded-full"
              >
                Get Started →
              </button>
            </>
          )}
        </div>
      </header>

      {/* Sidebar + Workspace below header */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div
          className="shrink-0 overflow-hidden"
          style={{ width: sidebarCollapsed ? 56 : 220, transition: 'width 0.15s ease' }}
        >
          <StudioSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(v => !v)}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            creditBalance={creditBalance}
            isLoadingCredits={isLoadingCredits}
            activeTool={activeTool}
            onToolSelect={handleLaunch}
            onGoHome={handleGoHome}
            onOpenPricing={() => setPricingOpen(true)}
          />
        </div>

        {/* Workspace */}
        <div className="flex-1 flex min-w-0 gap-0 bg-[hsl(var(--studio-surface))]">
          <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar bg-[hsl(var(--studio-surface))]">
            {isHome ? (
              <StudioHomeBanner
                creditBalance={creditBalance}
                isLoadingCredits={isLoadingCredits}
                onToolSelect={handleLaunch}
              />
            ) : campaignResult ? (
              <CampaignResultsDashboard
                result={campaignResult}
                creditsUsed={creditsUsed}
                onBack={handleBackFromResults}
              />
            ) : promoOpen ? (
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

          {showRightPanel && (
            <CampaignControlPanel
              creditBalance={creditBalance}
              isLoadingCredits={isLoadingCredits}
              onGenerate={handleGenerate}
              campaignState={campaignState}
              isGenerating={isGenerating}
            />
          )}
        </div>
      </div>

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

      <SignUpPromoDialog open={showSignUpPromo} onOpenChange={setShowSignUpPromo} />
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} darkMode />
    </div>
  );
}
