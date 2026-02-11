import { useMemo } from "react";
import { motion } from "framer-motion";
import { toolsRegistry } from "@/components/tools/toolsRegistry";
import { StudioHomeView } from "./StudioHomeView";
import type { StudioSection } from "./StudioLayout";

interface StudioCanvasProps {
  activeSection: StudioSection;
  productCount: number;
  assetCount: number;
  generationCount: number;
  creditBalance: number;
  isLoadingCredits: boolean;
  recentAssets: any[];
  onLaunchPromo: () => void;
  onLaunchTool: (id: string) => void;
}

export function StudioCanvas(props: StudioCanvasProps) {
  const { activeSection, onLaunchTool, onLaunchPromo } = props;

  // Section-specific tools
  const sectionTools = useMemo(() => {
    const subcatMap: Record<string, string[]> = {
      campaign: [], // flagship promo only
      listings: ["store_growth"],
      social: ["social_content"],
      media: ["media_creation", "utility"],
      assets: [],
    };
    const subs = subcatMap[activeSection] || [];
    if (!subs.length) return [];
    return toolsRegistry
      .filter(t => subs.includes(t.subcategory || "") && t.isActive && !t.comingSoon)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [activeSection]);

  return (
    <div className="min-h-full">
      {/* Subtle radial glow behind content */}
      <div className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-primary/[0.04] blur-[120px]" />

      <StudioHomeView
        {...props}
        sectionTools={sectionTools}
      />
    </div>
  );
}
