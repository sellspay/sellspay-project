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

/* ── Spotlight Hero ── */

function SpotlightCard({
  title, subtitle, image, onClick,
}: {
  title: string; subtitle: string; image: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-[#1e3a5f]/60 bg-[#0b1220] w-full text-left transition-all duration-300 hover:border-[#3b82f6]/50"
    >
      <div className="relative h-full min-h-[220px]">
        <img src={image} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-black/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end h-full min-h-[220px] p-5">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="mt-1 max-w-md text-sm text-[#94a3b8]">{subtitle}</p>
          <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white border border-white/10 group-hover:bg-white/20 transition-colors">
            Open Tool <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── OpenArt-style compact card: text left, thumbnail right ── */

function ToolCard({
  tool, image, onClick,
}: {
  tool: ToolRegistryEntry; image?: string; onClick: () => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[#1e3a5f]/40 bg-[#0b1220] w-full text-left",
        "transition-all duration-200 hover:border-[#3b82f6]/40",
        tool.comingSoon && "opacity-50 cursor-default"
      )}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Text */}
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-[#58b3ff] leading-tight">{tool.name}</h4>
          <p className="mt-1 text-[11px] text-[#64748b] line-clamp-2 leading-relaxed">{tool.description}</p>
          {tool.comingSoon && (
            <span className="mt-1 inline-block text-[9px] font-bold text-[#475569] uppercase tracking-wider">Coming Soon</span>
          )}
        </div>
        {/* Thumbnail */}
        <div className="shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden bg-[#0a0f1a]">
          {image ? (
            <img src={image} alt={tool.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Icon className="h-6 w-6 text-[#1e3a5f]" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── Section Header ── */

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
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

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="py-6 lg:py-8 space-y-8 max-w-[1400px] mx-auto"
    >
      {/* ── HERO ROW ── */}
      <motion.section variants={fadeUp}>
        <SectionHeader title="Featured" />
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 lg:col-span-7">
            <SpotlightCard
              title="Create Images with AI"
              subtitle="Generate, remix, and upscale visuals with multiple AI models."
              image={heroImageGen}
              onClick={() => launch("image-generator")}
            />
          </div>
          <div className="col-span-12 lg:col-span-5 grid grid-rows-2 gap-3">
            {byId("voice-isolator") && <ToolCard tool={byId("voice-isolator")} image={thumb("voice-isolator")} onClick={() => launch("voice-isolator")} />}
            {byId("music-splitter") && <ToolCard tool={byId("music-splitter")} image={thumb("music-splitter")} onClick={() => launch("music-splitter")} />}
          </div>
        </div>
      </motion.section>

      {/* ── MEDIA CREATION ── */}
      {mediaTools.length > 0 && (
        <motion.section variants={fadeUp}>
          <SectionHeader title="Media Creation" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {mediaTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} image={thumb(tool.id)} onClick={() => launch(tool.id)} />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── STORE & SOCIAL ── */}
      {([...storeTools, ...socialTools].length > 0) && (
        <motion.section variants={fadeUp}>
          <SectionHeader title="Store & Social Tools" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...storeTools, ...socialTools].map(tool => (
              <ToolCard key={tool.id} tool={tool} image={thumb(tool.id)} onClick={() => launch(tool.id)} />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── UTILITY ── */}
      {utilityTools.length > 0 && (
        <motion.section variants={fadeUp}>
          <SectionHeader title="Utility Tools" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {utilityTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} image={thumb(tool.id)} onClick={() => launch(tool.id)} />
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
