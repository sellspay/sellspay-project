import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolsRegistry, type ToolRegistryEntry } from "@/components/tools/toolsRegistry";
import { toolThumbnails } from "./toolThumbnails";
import heroImageGen from "@/assets/tools/hero-image-gen.jpg";

interface StudioHomeBannerProps {
  creditBalance: number;
  isLoadingCredits: boolean;
  onToolSelect: (toolId: string) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

/* ── Featured Banner (cinematic top cards) ── */

function FeaturedBanner({
  title, subtitle, image, onClick, className,
}: {
  title: string; subtitle: string; image: string; onClick: () => void; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0b0b0d] w-full text-left transition-all duration-300 hover:border-white/[0.16]",
        className
      )}
    >
      <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="relative z-10 flex flex-col justify-end h-full p-5">
        <h3 className="text-[18px] font-semibold text-white">{title}</h3>
        <p className="mt-1 text-[13px] text-white/50 max-w-md">{subtitle}</p>
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[12px] font-medium text-black backdrop-blur">
          Open Tool <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

/* ── Suite Tool Card (compact horizontal mini-card) ── */

function SuiteToolCard({
  tool, image, onClick,
}: {
  tool: ToolRegistryEntry; image?: string; onClick: () => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex h-[120px] items-center justify-between rounded-[22px] border border-[#0c2d4a] bg-[#05080a] px-4 w-full text-left transition-all duration-300 hover:border-[#3b82f6]/50 hover:shadow-[0_0_20px_-4px_rgba(59,130,246,0.35)]",
        tool.comingSoon && "opacity-50 cursor-default"
      )}
    >
      {/* Blue glow on hover */}
      <div className="absolute inset-0 rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-[#3b82f6]/[0.07] via-transparent to-[#6366f1]/[0.07]" />

      {/* Text */}
      <div className="relative z-10 min-w-0 pr-4 flex-1">
        <h3 className="text-[15px] font-semibold leading-tight bg-gradient-to-r from-[#4da6ff] via-[#3b82f6] to-[#6366f1] bg-clip-text text-transparent">
          {tool.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-[1.35] text-white/45">
          {tool.description}
        </p>
        {tool.comingSoon && (
          <span className="mt-1.5 inline-block text-[9px] font-bold text-white/30 uppercase tracking-wider">Coming Soon</span>
        )}
      </div>
      {/* Thumbnail — larger */}
      <div className="relative z-10 h-[96px] w-[96px] shrink-0 overflow-hidden rounded-[18px]">
        {image ? (
          <img src={image} alt={tool.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-[#0a0f14]">
            <Icon className="h-7 w-7 text-[#1a3a30]" />
          </div>
        )}
      </div>
    </button>
  );
}

/* ── Model Card (large image with title below) ── */

function ModelCard({
  tool, image, onClick,
}: {
  tool: ToolRegistryEntry; image?: string; onClick: () => void;
}) {
  const Icon = tool.icon;
  return (
    <button onClick={onClick} className={cn("group text-left w-full", tool.comingSoon && "opacity-50 cursor-default")}>
      <div className="relative overflow-hidden rounded-[22px] border border-[#143a34] bg-[#08090c] transition-all duration-300 hover:border-[#1ee7b7]/40">
        {image ? (
          <img src={image} alt={tool.name} loading="lazy" className="h-[260px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          <div className="h-[260px] w-full flex items-center justify-center bg-[#0a0f14]">
            <Icon className="h-12 w-12 text-[#1a3a30]" />
          </div>
        )}
      </div>
      <div className="pt-4">
        <h3 className="text-[16px] font-semibold bg-gradient-to-r from-[#4da6ff] via-[#3b82f6] to-[#6366f1] bg-clip-text text-transparent">
          {tool.name}
        </h3>
        <p className="mt-1 text-[14px] text-white/45">
          {tool.description}
        </p>
        {tool.comingSoon && (
          <span className="mt-1 inline-block text-[10px] font-bold text-white/30 uppercase tracking-wider">Coming Soon</span>
        )}
      </div>
    </button>
  );
}

/* ── Section Header ── */

function SectionHeader({ title, showMore }: { title: string; showMore?: boolean }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-white">{title}</h2>
      {showMore && (
        <span className="text-[15px] font-medium text-white/70 hover:text-white cursor-pointer transition-colors">More →</span>
      )}
    </div>
  );
}

/* ── Main ── */

export function StudioHomeBanner({ onToolSelect }: StudioHomeBannerProps) {
  const allTools = toolsRegistry.filter(t => t.category === "quick_tool" && t.isActive);
  const byId = (id: string) => allTools.find(t => t.id === id)!;
  const thumb = (id: string) => toolThumbnails[id] || undefined;
  const launch = (id: string) => {
    const t = byId(id);
    if (t?.comingSoon) return;
    onToolSelect(id);
  };

  const mediaTools = allTools.filter(t => t.subcategory === "media_creation").sort((a, b) => a.sortOrder - b.sortOrder);
  const storeTools = allTools.filter(t => t.subcategory === "store_growth").sort((a, b) => a.sortOrder - b.sortOrder);
  const socialTools = allTools.filter(t => t.subcategory === "social_content").sort((a, b) => a.sortOrder - b.sortOrder);
  const utilityTools = allTools.filter(t => t.subcategory === "utility").sort((a, b) => a.sortOrder - b.sortOrder);

  // Pick first 2 tools for side banners
  const sideBanner1 = byId("voice-isolator");
  const sideBanner2 = byId("music-splitter");

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="px-6 pt-6 pb-12 w-full"
    >
      {/* ── FEATURED BANNERS ── */}
      <motion.section variants={fadeUp} className="mb-14">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 lg:col-span-6">
            <FeaturedBanner
              title="Create Images with AI"
              subtitle="Generate, remix, and upscale visuals with multiple AI models."
              image={heroImageGen}
              onClick={() => launch("image-generator")}
              className="h-[200px]"
            />
          </div>
          {sideBanner1 && (
            <div className="col-span-6 lg:col-span-3">
              <FeaturedBanner
                title={sideBanner1.name}
                subtitle={sideBanner1.description}
                image={thumb("voice-isolator") || heroImageGen}
                onClick={() => launch("voice-isolator")}
                className="h-[200px]"
              />
            </div>
          )}
          {sideBanner2 && (
            <div className="col-span-6 lg:col-span-3">
              <FeaturedBanner
                title={sideBanner2.name}
                subtitle={sideBanner2.description}
                image={thumb("music-splitter") || heroImageGen}
                onClick={() => launch("music-splitter")}
                className="h-[200px]"
              />
            </div>
          )}
        </div>
      </motion.section>

      {/* ── SELLSPAY SUITE (compact mini-cards) ── */}
      {mediaTools.length > 0 && (
        <motion.section variants={fadeUp} className="mb-14">
          <SectionHeader title="SellsPay Suite" showMore />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {mediaTools.map(tool => (
              <SuiteToolCard key={tool.id} tool={tool} image={thumb(tool.id)} onClick={() => launch(tool.id)} />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── STORE & SOCIAL (compact mini-cards) ── */}
      {([...storeTools, ...socialTools].length > 0) && (
        <motion.section variants={fadeUp} className="mb-14">
          <SectionHeader title="Store & Social" showMore />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...storeTools, ...socialTools].map(tool => (
              <SuiteToolCard key={tool.id} tool={tool} image={thumb(tool.id)} onClick={() => launch(tool.id)} />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── UTILITY TOOLS (large image model cards) ── */}
      {utilityTools.length > 0 && (
        <motion.section variants={fadeUp} className="mb-14">
          <SectionHeader title="Utility Tools" showMore />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {utilityTools.map(tool => (
              <ModelCard key={tool.id} tool={tool} image={thumb(tool.id)} onClick={() => launch(tool.id)} />
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
