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
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

/* ── Gradient border constants ── */
const GRADIENT_BORDER = "bg-[linear-gradient(135deg,#2f95ea_0%,#67b8ff_45%,#b7e0ff_100%)]";
const INNER_BG = "bg-[linear-gradient(180deg,#0d1117_0%,#111827_100%)]";
const INNER_BG_HOVER = "group-hover:bg-[linear-gradient(180deg,#101722_0%,#131d2b_100%)]";
const RADIAL_GLOW = "bg-[radial-gradient(circle_at_top_left,rgba(103,184,255,0.16),transparent_45%)]";

/* ── Card Components ── */

function SpotlightCard({
  title, subtitle, image, onClick,
}: {
  title: string; subtitle: string; image: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[24px] p-[1.2px] w-full text-left will-change-transform",
        GRADIENT_BORDER,
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_32px_rgba(59,166,255,0.28)]"
      )}
    >
      <div className="relative overflow-hidden rounded-[23px] bg-[#0d1117] min-h-[260px]">
        <img src={image} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <h3 className="text-2xl sm:text-3xl font-semibold text-white">{title}</h3>
          <p className="mt-2 max-w-lg text-sm text-white/80">{subtitle}</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white border border-white/10 group-hover:bg-white/20 transition-colors">
            Open Tool <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

function ToolCard({
  tool, image, onClick, imageFirst = false, featured = false,
}: {
  tool: ToolRegistryEntry; image?: string; onClick: () => void; imageFirst?: boolean; featured?: boolean;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative rounded-[22px] p-[1.2px] w-full text-left will-change-transform",
        GRADIENT_BORDER,
        "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_0_28px_rgba(59,166,255,0.25)]",
        featured ? "hover:scale-[1.015]" : "hover:scale-[1.01]",
        tool.comingSoon && "opacity-50 cursor-default"
      )}
    >
      <div className={cn(
        "relative overflow-hidden rounded-[21px] transition-all duration-300",
        INNER_BG, INNER_BG_HOVER,
        featured ? "min-h-[176px]" : "min-h-[150px]",
      )}>
        {/* Inner radial glow on hover */}
        <div className={cn("absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none", RADIAL_GLOW)} />

        <div className={cn(
          "relative z-10 grid h-full",
          imageFirst ? "grid-cols-1" : "grid-cols-[1fr_124px]"
        )}>
          {imageFirst ? (
            <>
              <div className="aspect-[16/10] overflow-hidden">
                {image ? (
                  <img src={image} alt={tool.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-b from-[#111827] to-[#0d1117]">
                    <Icon className="h-12 w-12 text-[#27272a]" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="bg-gradient-to-r from-[#58b3ff] to-[#c8e9ff] bg-clip-text text-lg font-semibold text-transparent">{tool.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{tool.description}</p>
                {tool.comingSoon && <div className="mt-3 text-xs font-semibold tracking-wide text-slate-500">COMING SOON</div>}
              </div>
            </>
          ) : (
            <>
              <div className="p-5 flex flex-col justify-center">
                <h3 className="bg-gradient-to-r from-[#58b3ff] to-[#c8e9ff] bg-clip-text text-[18px] font-semibold leading-tight text-transparent">{tool.name}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{tool.description}</p>
                {tool.comingSoon && <div className="mt-4 text-xs font-semibold tracking-wide text-slate-500">COMING SOON</div>}
              </div>
              <div className="relative overflow-hidden">
                {image ? (
                  <>
                    <img src={image} alt={tool.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]" />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#111827]/35" />
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-[#111827]">
                    <Icon className="h-8 w-8 text-[#27272a]" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

function ToolCompactCard({
  tool, onClick,
}: {
  tool: ToolRegistryEntry; onClick: () => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group rounded-[20px] p-[1.2px] w-full text-left will-change-transform",
        GRADIENT_BORDER,
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_24px_rgba(59,166,255,0.22)]",
        tool.comingSoon && "opacity-50 cursor-default"
      )}
    >
      <div className={cn("rounded-[19px] p-4 transition-all duration-300", INNER_BG, INNER_BG_HOVER)}>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#111c2b] text-[#74beff]">
          <Icon className="h-5 w-5" />
        </div>
        <h4 className="bg-gradient-to-r from-[#58b3ff] to-[#c8e9ff] bg-clip-text text-base font-semibold text-transparent">{tool.name}</h4>
        <p className="mt-2 text-sm leading-5 text-slate-400">{tool.description}</p>
      </div>
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-3xl font-semibold text-white tracking-tight">{title}</h2>
    </div>
  );
}

/* ── Main Component ── */

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
      className="py-6 lg:py-8 space-y-12 max-w-[1400px] mx-auto"
    >
      {/* ── HERO ROW: Spotlight + 2 stacked ── */}
      <motion.section variants={fadeUp}>
        <SectionHeader title="Featured" />
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7">
            <SpotlightCard
              title="Create Images with AI"
              subtitle="Generate, remix, and upscale visuals with multiple AI models in a clean workspace."
              image={heroImageGen}
              onClick={() => launch("image-generator")}
            />
          </div>
          <div className="col-span-12 lg:col-span-5 grid gap-4">
            {byId("voice-isolator") && (
              <ToolCard tool={byId("voice-isolator")} image={thumb("voice-isolator")} onClick={() => launch("voice-isolator")} />
            )}
            {byId("music-splitter") && (
              <ToolCard tool={byId("music-splitter")} image={thumb("music-splitter")} onClick={() => launch("music-splitter")} />
            )}
          </div>
        </div>
      </motion.section>

      {/* ── MEDIA CREATION — mixed text-first + image-first ── */}
      <motion.section variants={fadeUp}>
        <SectionHeader title="Media Creation" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mediaTools.map((tool, i) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              image={thumb(tool.id)}
              onClick={() => launch(tool.id)}
              imageFirst={i % 3 === 0}
              featured={i === 0}
            />
          ))}
        </div>
      </motion.section>

      {/* ── STORE & SOCIAL — image-first portrait style ── */}
      {([...storeTools, ...socialTools].length > 0) && (
        <motion.section variants={fadeUp}>
          <SectionHeader title="Store & Social Tools" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...storeTools, ...socialTools].map((tool, i) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                image={thumb(tool.id)}
                onClick={() => launch(tool.id)}
                imageFirst
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── UTILITY — compact cards ── */}
      {utilityTools.length > 0 && (
        <motion.section variants={fadeUp}>
          <SectionHeader title="Utility Tools" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {utilityTools.map(tool => (
              <ToolCompactCard key={tool.id} tool={tool} onClick={() => launch(tool.id)} />
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
