import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolsRegistry, type ToolRegistryEntry } from "@/components/tools/toolsRegistry";
import { toolThumbnails } from "./toolThumbnails";
import heroImageGen from "@/assets/tools/hero-image-gen.jpg";
import heroAudioSuite from "@/assets/tools/hero-audio-suite.jpg";

interface StudioHomeBannerProps {
  creditBalance: number;
  isLoadingCredits: boolean;
  onToolSelect: (toolId: string) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

/* ── Card Components ── */

function HeroCard({
  title, subtitle, image, onClick, badge,
}: {
  title: string; subtitle: string; image: string; onClick: () => void; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#16181d] min-h-[240px] w-full text-left"
    >
      <img src={image} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-end p-6 min-h-[240px]">
        {badge && (
          <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-cyan-500/20 px-3 py-1 text-[11px] font-bold text-cyan-400 uppercase tracking-wider backdrop-blur-sm border border-cyan-500/20">
            <Sparkles className="h-3 w-3" /> {badge}
          </span>
        )}
        <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-white/70 leading-relaxed">{subtitle}</p>
        <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white border border-white/10 group-hover:bg-white/20 transition-colors">
          Open Tool <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

function ToolCardWide({
  tool, image, onClick,
}: {
  tool: ToolRegistryEntry; image?: string; onClick: () => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group rounded-[20px] p-[1.2px] bg-gradient-to-br from-[#4da6ff]/40 via-[#7cc8ff]/20 to-[#bfe6ff]/10 transition-all duration-300 w-full text-left",
        "hover:from-[#4da6ff]/80 hover:via-[#7cc8ff]/50 hover:to-[#bfe6ff]/30 hover:shadow-[0_0_25px_rgba(77,166,255,0.2)]",
        tool.comingSoon && "opacity-50 cursor-default"
      )}
    >
      <div className="relative rounded-[18px] bg-[#0f172a] overflow-hidden transition-colors duration-300 group-hover:bg-[#111827]">
        {/* Inner hover glow */}
        <div className="absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#4da6ff]/[0.07] to-transparent pointer-events-none" />
        <div className="relative grid grid-cols-[1fr_100px] min-h-[120px]">
          <div className="p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1.5">
              <h4 className="text-sm font-semibold text-[#f4f4f5] leading-tight">{tool.name}</h4>
              {tool.isPro && <Sparkles className="h-3 w-3 text-[#4da6ff]/60 shrink-0" />}
            </div>
            <p className="text-[12px] text-[#71717a] leading-relaxed line-clamp-2">{tool.description}</p>
            {tool.comingSoon && (
              <span className="mt-2 text-[10px] font-bold text-[#52525b] uppercase tracking-wider">Coming Soon</span>
            )}
          </div>
          <div className="overflow-hidden">
            {image ? (
              <img src={image} alt={tool.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-[#111827]">
                <Icon className="h-8 w-8 text-[#27272a]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function ToolCardTall({
  tool, image, onClick,
}: {
  tool: ToolRegistryEntry; image?: string; onClick: () => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group rounded-[20px] p-[1.2px] bg-gradient-to-br from-[#4da6ff]/40 via-[#7cc8ff]/20 to-[#bfe6ff]/10 transition-all duration-300 w-full text-left",
        "hover:from-[#4da6ff]/80 hover:via-[#7cc8ff]/50 hover:to-[#bfe6ff]/30 hover:shadow-[0_0_25px_rgba(77,166,255,0.2)]",
        tool.comingSoon && "opacity-50 cursor-default"
      )}
    >
      <div className="relative rounded-[18px] bg-[#0f172a] overflow-hidden transition-colors duration-300 group-hover:bg-[#111827]">
        <div className="absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#4da6ff]/[0.07] to-transparent pointer-events-none" />
        <div className="aspect-[4/5] overflow-hidden">
          {image ? (
            <img src={image} alt={tool.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-b from-[#111827] to-[#0f172a]">
              <Icon className="h-12 w-12 text-[#27272a]" />
            </div>
          )}
        </div>
        <div className="relative p-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[#f4f4f5]">{tool.name}</h4>
            {tool.isPro && <Sparkles className="h-3 w-3 text-[#4da6ff]/60" />}
          </div>
          <p className="mt-1 text-[12px] text-[#71717a] line-clamp-2">{tool.description}</p>
          {tool.comingSoon && (
            <span className="mt-1.5 inline-block text-[10px] font-bold text-[#52525b] uppercase tracking-wider">Coming Soon</span>
          )}
        </div>
      </div>
    </button>
  );
}

function ToolCardCompact({
  tool, onClick,
}: {
  tool: ToolRegistryEntry; onClick: () => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group rounded-[18px] p-[1px] bg-gradient-to-br from-[#4da6ff]/30 via-[#7cc8ff]/15 to-transparent transition-all duration-300 w-full text-left",
        "hover:from-[#4da6ff]/60 hover:via-[#7cc8ff]/35 hover:to-[#bfe6ff]/15 hover:shadow-[0_0_20px_rgba(77,166,255,0.15)]",
        tool.comingSoon && "opacity-50 cursor-default"
      )}
    >
      <div className="relative rounded-[17px] bg-[#0f172a] p-4 transition-colors duration-300 group-hover:bg-[#111827]">
        <div className="absolute inset-0 rounded-[17px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#4da6ff]/[0.05] to-transparent pointer-events-none" />
        <div className="relative flex items-start gap-3">
          <div className="shrink-0 h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
            <Icon className="h-4 w-4 text-[#52525b] group-hover:text-[#4da6ff]/70 transition-colors" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[13px] font-semibold text-[#f4f4f5]">{tool.name}</h4>
            <p className="mt-0.5 text-[11px] text-[#52525b] line-clamp-1">{tool.description}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-xl font-bold text-[#f4f4f5] tracking-tight">{title}</h2>
    </div>
  );
}

/* ── Main Component ── */

export function StudioHomeBanner({ creditBalance, isLoadingCredits, onToolSelect }: StudioHomeBannerProps) {
  const allTools = toolsRegistry.filter(t => t.category === "quick_tool" && t.isActive);
  const byId = (id: string) => allTools.find(t => t.id === id)!;
  const thumb = (id: string) => toolThumbnails[id] || undefined;
  const launch = (id: string) => {
    const t = byId(id);
    if (t?.comingSoon) return;
    onToolSelect(id);
  };

  // Group by subcategory for the creator suite section
  const mediaTools = allTools.filter(t => t.subcategory === "media_creation").sort((a, b) => a.sortOrder - b.sortOrder);
  const storeTools = allTools.filter(t => t.subcategory === "store_growth").sort((a, b) => a.sortOrder - b.sortOrder);
  const socialTools = allTools.filter(t => t.subcategory === "social_content").sort((a, b) => a.sortOrder - b.sortOrder);
  const utilityTools = allTools.filter(t => t.subcategory === "utility").sort((a, b) => a.sortOrder - b.sortOrder);

  // Split utility into "main" (has thumbnails or creditCost > 0) vs "compact"
  const utilityMain = utilityTools.filter(t => t.creditCost > 0 || toolThumbnails[t.id]);
  const utilityCompact = utilityTools.filter(t => t.creditCost === 0 && !toolThumbnails[t.id]);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="py-6 lg:py-8 space-y-10 max-w-[1400px] mx-auto"
    >
      {/* ── HERO ROW: 7/5 split ── */}
      <motion.section variants={fadeUp}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7">
            <HeroCard
              title="Create Images with AI"
              subtitle="Generate, remix, and upscale visuals with multiple AI models in a clean workspace."
              image={heroImageGen}
              onClick={() => launch("image-generator")}
              badge="Featured"
            />
          </div>
          <div className="col-span-12 lg:col-span-5 grid gap-4">
            <ToolCardWide tool={byId("voice-isolator")} image={thumb("voice-isolator")} onClick={() => launch("voice-isolator")} />
            <ToolCardWide tool={byId("music-splitter")} image={thumb("music-splitter")} onClick={() => launch("music-splitter")} />
          </div>
        </div>
      </motion.section>

      {/* ── MEDIA CREATION SUITE ── */}
      <motion.section variants={fadeUp}>
        <SectionHeader title="Media Creation" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaTools.map(tool => (
            <ToolCardWide key={tool.id} tool={tool} image={thumb(tool.id)} onClick={() => launch(tool.id)} />
          ))}
        </div>
      </motion.section>

      {/* ── STORE GROWTH & SOCIAL — Portrait cards ── */}
      <motion.section variants={fadeUp}>
        <SectionHeader title="Store & Social Tools" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...storeTools, ...socialTools].map(tool => (
            <ToolCardTall key={tool.id} tool={tool} image={thumb(tool.id)} onClick={() => launch(tool.id)} />
          ))}
        </div>
      </motion.section>

      {/* ── UTILITY: mixed 3 wide + compact row ── */}
      <motion.section variants={fadeUp}>
        <SectionHeader title="Utility Tools" />
        <div className="space-y-4">
          {/* Main utility tools */}
          {utilityMain.length > 0 && (
            <div className="grid grid-cols-12 gap-4">
              {utilityMain.map(tool => (
                <div key={tool.id} className="col-span-6 lg:col-span-4">
                  <ToolCardWide tool={tool} image={thumb(tool.id)} onClick={() => launch(tool.id)} />
                </div>
              ))}
            </div>
          )}
          {/* Compact utility cards */}
          {utilityCompact.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {utilityCompact.map(tool => (
                <ToolCardCompact key={tool.id} tool={tool} onClick={() => launch(tool.id)} />
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
