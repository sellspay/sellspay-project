import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolsRegistry, type ToolRegistryEntry } from "@/components/tools/toolsRegistry";
import { toolThumbnails } from "./toolThumbnails";
import bannerHero1 from "@/assets/tools/banner-hero-1.jpg";
import bannerHero2 from "@/assets/tools/banner-hero-2.jpg";
import bannerHero3 from "@/assets/tools/banner-hero-3.jpg";

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
        "group relative overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#0b0b0d] w-full text-left transition-all duration-500 hover:border-white/[0.12]",
        className
      )}
    >
      <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative z-10 flex flex-col justify-end h-full p-5">
        <h3 className="text-[17px] font-bold text-white leading-snug drop-shadow-lg">{title}</h3>
        <p className="mt-1 text-[12px] text-white/50 max-w-[260px] leading-relaxed">{subtitle}</p>
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-black/50 border border-white/[0.12] px-3 py-1 text-[11px] font-medium text-white/90">
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
        "group relative w-full overflow-hidden rounded-[22px] bg-[#0b0b0d] text-left transition-all duration-300",
        tool.comingSoon ? "opacity-55 cursor-default" : "hover:translate-y-[-1px]"
      )}
    >
      {/* Ultra-subtle outer border — glows blue on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-[22px] border border-white/[0.04] transition-all duration-500 group-hover:border-[#3b82f6]/[0.35] group-hover:shadow-[0_0_24px_-4px_rgba(59,130,246,0.3),inset_0_0_12px_-2px_rgba(59,130,246,0.08)]" />
      {/* Top-left corner glow */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#2f6bff]/[0.08] blur-2xl transition-all duration-500 group-hover:bg-[#2f6bff]/[0.25]" />
      {/* Bottom-right corner glow */}
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-[#6366f1]/[0.06] blur-2xl transition-all duration-500 group-hover:bg-[#6366f1]/[0.20]" />
      {/* Faint surface gradient */}
      <div className="pointer-events-none absolute inset-[1px] rounded-[21px] bg-[linear-gradient(180deg,rgba(11,11,13,0.95),rgba(8,8,10,0.98))]" />
      {/* Inner highlight line */}
      <div className="pointer-events-none absolute inset-[1px] rounded-[21px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-shadow duration-300 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />

      <div className="relative z-10 flex h-[108px] items-center justify-between gap-4 px-5">
        {/* Text */}
        <div className="min-w-0 flex-1 pr-2">
          <h3 className="text-[16px] font-bold leading-tight bg-gradient-to-r from-white/90 via-[#93b4f5] to-[#3b82f6] bg-clip-text text-transparent">
            {tool.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-[13px] leading-[1.45] text-[#8b8fa3]">
            {tool.description}
          </p>
          {tool.comingSoon && (
            <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20">Coming Soon</span>
          )}
        </div>
        {/* Thumbnail */}
        <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[20px] ring-1 ring-white/[0.05]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
          {image ? (
            <img src={image} alt={tool.name} loading="lazy" className="relative z-10 h-full w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110" />
          ) : (
            <div className="relative z-10 h-full w-full flex items-center justify-center bg-[#111318]">
              <Icon className="h-7 w-7 text-[#1a3a30]" />
            </div>
          )}
        </div>
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
      <div className="relative overflow-hidden rounded-[22px] border border-white/[0.04] bg-[#0b0b0d] transition-all duration-500 hover:border-[#3b82f6]/[0.35] hover:shadow-[0_0_24px_-4px_rgba(59,130,246,0.3)]">
        {image ? (
          <img src={image} alt={tool.name} loading="lazy" className="h-[260px] w-full object-cover transition-all duration-500 group-hover:scale-[1.04] group-hover:brightness-110" />
        ) : (
          <div className="h-[260px] w-full flex items-center justify-center bg-[#111318]">
            <Icon className="h-12 w-12 text-[#1a3a30]" />
          </div>
        )}
      </div>
      <div className="pt-4">
        <h3 className="text-[16px] font-bold bg-gradient-to-r from-white via-white to-[#3b82f6] bg-clip-text text-transparent">
          {tool.name}
        </h3>
        <p className="mt-1 text-[14px] text-[#8b8fa3]">
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
      {/* ── FEATURED BANNERS — 3 cinematic cards ── */}
      <motion.section variants={fadeUp} className="mb-14">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 lg:col-span-6">
            <FeaturedBanner
              title="AI-Powered SFX Generation"
              subtitle="Create cinematic sound effects from text prompts instantly."
              image={bannerHero1}
              onClick={() => launch("sfx-generator")}
              className="h-[220px]"
            />
          </div>
          <div className="col-span-6 lg:col-span-3">
            <FeaturedBanner
              title="Create Your Own AI World"
              subtitle="Generate stunning visuals and variations."
              image={bannerHero2}
              onClick={() => launch("image-generator")}
              className="h-[220px]"
            />
          </div>
          <div className="col-span-6 lg:col-span-3">
            <FeaturedBanner
              title="AI Avatar Studio"
              subtitle="Create stylized AI characters and portraits."
              image={bannerHero3}
              onClick={() => launch("image-generator")}
              className="h-[220px]"
            />
          </div>
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
