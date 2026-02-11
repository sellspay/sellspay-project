import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Image, LayoutTemplate, PackagePlus, MessageSquare, Clapperboard, Hash, GalleryHorizontal } from "lucide-react";
import { ToolActiveView } from "@/components/tools/ToolActiveView";
import { PromoVideoBuilder } from "@/components/tools/PromoVideoBuilder";
import { useSubscription } from "@/hooks/useSubscription";
import { toolsRegistry } from "@/components/tools/toolsRegistry";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

import { StudioHero } from "@/components/tools/studio/StudioHero";
import { FlagshipPromo } from "@/components/tools/studio/FlagshipPromo";
import { CreatorControlStrip } from "@/components/tools/studio/CreatorControlStrip";
import { OutcomeSection, outcomeItemVariant } from "@/components/tools/studio/OutcomeSection";
import { OutcomeCard } from "@/components/tools/studio/OutcomeCard";
import { MediaUtilityGrid } from "@/components/tools/studio/MediaUtilityGrid";
import { RecentCreations } from "@/components/tools/studio/RecentCreations";
import { motion } from "framer-motion";

export default function Tools() {
  const [searchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const { credits: creditBalance, loading: isLoading } = useSubscription();
  const { profile } = useAuth();

  // Stats
  const [productCount, setProductCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);
  const [recentAssets, setRecentAssets] = useState<any[]>([]);

  useEffect(() => {
    const toolParam = searchParams.get("tool");
    if (toolParam) setActiveTool(toolParam);
  }, [searchParams]);

  // Fetch stats
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

  // Utility tools (media creation + utility with legacy routes = active)
  const utilityTools = useMemo(() => {
    return toolsRegistry
      .filter(t => (t.subcategory === "media_creation" || t.subcategory === "utility") && t.isActive && t.legacyRoute)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, []);

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
      {/* 1. Hero */}
      <StudioHero
        creditBalance={creditBalance}
        isLoadingCredits={isLoading}
        productCount={productCount}
        assetCount={assetCount}
        onCreatePromo={() => setPromoOpen(true)}
        onOptimizeStore={() => handleLaunch("product-description")}
      />

      <div className="space-y-16 pb-20">
        {/* 2. Flagship */}
        <FlagshipPromo onLaunchPromo={() => setPromoOpen(true)} />

        {/* 3. Control Strip */}
        <CreatorControlStrip
          productCount={productCount}
          assetCount={assetCount}
          generationCount={generationCount}
          creditBalance={creditBalance}
        />

        {/* 4a. Grow My Store */}
        <OutcomeSection title="Grow My Store" emoji="🚀">
          <motion.div variants={outcomeItemVariant}>
            <OutcomeCard
              title="Product Optimizer"
              description="AI-optimized descriptions that convert browsers into buyers."
              icon={FileText}
              gradient="bg-gradient-to-br from-primary/15 to-primary/5"
              onLaunch={() => handleLaunch("product-description")}
              comingSoon
            />
          </motion.div>
          <motion.div variants={outcomeItemVariant}>
            <OutcomeCard
              title="Sales Page Builder"
              description="Generate hero, features, and testimonial sections instantly."
              icon={LayoutTemplate}
              gradient="bg-gradient-to-br from-primary/12 to-primary/3"
              onLaunch={() => handleLaunch("sales-page-sections")}
              comingSoon
            />
          </motion.div>
          <motion.div variants={outcomeItemVariant}>
            <OutcomeCard
              title="Bundle & Upsell Creator"
              description="Smart bundle recommendations to boost average order value."
              icon={PackagePlus}
              gradient="bg-gradient-to-br from-primary/10 to-primary/2"
              onLaunch={() => handleLaunch("upsell-suggestions")}
              comingSoon
            />
          </motion.div>
        </OutcomeSection>

        {/* 4b. Create Marketing Content */}
        <OutcomeSection title="Create Marketing Content" emoji="🎥">
          <motion.div variants={outcomeItemVariant}>
            <OutcomeCard
              title="Carousel Generator"
              description="Multi-slide carousel posts for Instagram that get saved and shared."
              icon={GalleryHorizontal}
              gradient="bg-gradient-to-br from-primary/12 to-primary/4"
              onLaunch={() => handleLaunch("carousel-generator")}
              comingSoon
            />
          </motion.div>
          <motion.div variants={outcomeItemVariant}>
            <OutcomeCard
              title="Hook & Script Generator"
              description="TikTok, Reels, and Shorts scripts with scroll-stopping hooks."
              icon={Clapperboard}
              gradient="bg-gradient-to-br from-primary/10 to-primary/3"
              onLaunch={() => handleLaunch("short-form-script")}
              comingSoon
            />
          </motion.div>
          <motion.div variants={outcomeItemVariant}>
            <OutcomeCard
              title="Caption Pack"
              description="Engaging captions with optimized hashtag sets for every platform."
              icon={Hash}
              gradient="bg-gradient-to-br from-primary/8 to-primary/2"
              onLaunch={() => handleLaunch("caption-hashtags")}
              comingSoon
            />
          </motion.div>
          <motion.div variants={outcomeItemVariant}>
            <OutcomeCard
              title="10 Posts from Product"
              description="Generate a full week of social posts from a single product listing."
              icon={MessageSquare}
              gradient="bg-gradient-to-br from-primary/10 to-primary/3"
              onLaunch={() => handleLaunch("social-posts-pack")}
              comingSoon
            />
          </motion.div>
        </OutcomeSection>

        {/* 4c. Media Utilities */}
        <MediaUtilityGrid tools={utilityTools} onLaunch={handleLaunch} />

        {/* 5. Recent Creations */}
        <RecentCreations assets={recentAssets} />
      </div>

      {/* Promo Video Builder Dialog */}
      <PromoVideoBuilder open={promoOpen} onOpenChange={setPromoOpen} />
    </div>
  );
}
