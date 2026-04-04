import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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

  // Listen for auth gate events from tool components
  useEffect(() => {
    const handler = () => setShowSignUpPromo(true);
    window.addEventListener(AUTH_GATE_EVENT, handler);
    return () => window.removeEventListener(AUTH_GATE_EVENT, handler);
  }, []);

  useEffect(() => {
    if (routeToolId) {
      setActiveTool(routeToolId);
      if (activeSection === "home") setActiveSection("campaign");
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
    if (activeSection === "home") {
      setActiveSection("campaign");
    }
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

  const hasUnsavedProgress = activeTool || promoOpen || (campaignState?.selectedProduct != null) || (campaignState?.selectedTemplate != null);

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
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Fixed top header - independent of sidebar */}
      <header className="h-12 shrink-0 flex items-center justify-between px-3 bg-background">
        {/* Left: sidebar toggle + logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:opacity-80 transition-opacity"
          >
            <img src={sellspayLogo} alt="SellsPay" className="h-6 w-6 shrink-0" />
            <span className="font-bold text-foreground tracking-tight">SellsPay</span>
          </button>
        </div>

        {/* Right: social icons + auth buttons */}
        <div className="flex items-center gap-1.5">
          {/* Discord */}
          <a
            href="https://discord.gg/lovable-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Discord"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          {/* Instagram */}
          <a
            href="https://instagram.com/sellspay"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Instagram"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
          {/* YouTube */}
          <a
            href="https://youtube.com/@sellspay"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="YouTube"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
              <path d="m10 15 5-3-5-3z" />
            </svg>
          </a>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Pricing */}
          <button
            onClick={() => navigate("/pricing")}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </button>

          {profile ? (
            <button
              onClick={() => navigate("/profile")}
              className="px-3 py-1.5 text-sm font-medium text-foreground hover:opacity-80 transition-opacity"
            >
              My Profile
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/auth")}
                className="px-3 py-1.5 text-sm font-medium text-foreground border border-border rounded-full hover:bg-muted/50 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-1.5 text-sm font-semibold text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors"
              >
                Get Started →
              </button>
            </>
          )}
        </div>
      </header>

      {/* Sidebar + Workspace below header */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <motion.div
          className="shrink-0 overflow-hidden"
          animate={{ width: sidebarCollapsed ? 56 : 220 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
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
          />
        </motion.div>

        {/* Workspace */}
        <div className="flex-1 flex min-w-0 p-2 gap-0" style={{ backgroundColor: 'hsl(210 40% 97%)' }}>
          <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar rounded-[22px] border border-[hsl(200_30%_88%)] bg-gradient-to-br from-[hsl(200_50%_97%)] to-[hsl(200_40%_95%)] shadow-[0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-[hsl(200_35%_92%)]">
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
    </div>
  );
}
