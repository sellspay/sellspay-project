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

/* ── OpenArt-style corner-glow card ──
   The card background matches the page (#0e0e10).
   Two small radial gradients sit in top-left and bottom-right corners,
   creating the signature subtle glow border effect on hover.
*/

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
        "group relative rounded-[14px] w-full text-left overflow-hidden",
        "bg-[#0e0e10] border border-[#1a2332]",
        "transition-all duration-300",
        "hover:border-[#22d3ee]/40",
        tool.comingSoon && "opacity-50 cursor-default"
      )}
    >
      {/* Corner glow effects — visible on hover */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.18),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_100%_100%,rgba(34,211,238,0.18),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3 p-3.5">
        {/* Text side */}
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-[#22d3ee] leading-tight">{tool.name}</h4>
          <p className="mt-1.5 text-[11px] text-[#64748b] line-clamp-2 leading-relaxed">{tool.description}</p>
          {tool.comingSoon && (
            <span className="mt-1.5 inline-block text-[9px] font-bold text-[#475569] uppercase tracking-wider">Coming Soon</span>
          )}
        </div>
        {/* Thumbnail */}
        <div className="shrink-0 w-[76px] h-[76px] rounded-xl overflow-hidden">
          {image ? (
            <img src={image} alt={tool.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-[#141820]">
              <Icon className="h-7 w-7 text-[#1e3a5f]" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── Hero Spotlight (featured banner) ── */

function SpotlightCard({
  title, subtitle, image, onClick,
}: {
  title: string; subtitle: string; image: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-[14px] bg-[#0e0e10] border border-[#1a2332] w-full text-left transition-all duration-300 hover:border-[#22d3ee]/40"
    >
      {/* Corner glows */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.15),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_100%_100%,rgba(34,211,238,0.15),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />

      <div className="relative h-full min-h-[220px]">
        <img src={image} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-black/50 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end h-full min-h-[220px] p-5">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="mt-1 max-w-md text-sm text-[#94a3b8]">{subtitle}</p>
          <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg bg-[#141820] px-3 py-1.5 text-xs font-medium text-white border border-[#1a2332] group-hover:border-[#22d3ee]/30 transition-colors">
            Open Tool <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Section Header ── */

function SectionHeader({ title, showMore }: { title: string; showMore?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      {showMore && (
        <span className="text-sm font-medium text-[#64748b] hover:text-white cursor-pointer transition-colors">More →</span>
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

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="py-6 lg:py-8 space-y-10 max-w-[1400px] mx-auto"
    >
      {/* ── HERO ROW ── */}
      <motion.section variants={fadeUp}>
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

      {/* ── SELLSPAY SUITE (like OpenArt Suite) ── */}
      {mediaTools.length > 0 && (
        <motion.section variants={fadeUp}>
          <SectionHeader title="SellsPay Suite" showMore />
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
          <SectionHeader title="Store & Social" showMore />
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
          <SectionHeader title="Utility Tools" showMore />
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
