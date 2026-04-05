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

const GRAD = "bg-gradient-to-br from-[#4da6ff] via-[#7cc8ff] to-[#bfe6ff]";

/* ── 3-Layer Neon Wrapper ── */

function NeonWrap({
  children, onClick, disabled, className, featured,
}: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; className?: string; featured?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative rounded-[22px] w-full text-left will-change-transform",
        "transition-all duration-300 ease-out hover:-translate-y-1",
        featured ? "hover:scale-[1.015]" : "hover:scale-[1.01]",
        disabled && "opacity-50 cursor-default hover:translate-y-0 hover:scale-100",
        className,
      )}
    >
      {/* Layer 1: SOFT GLOW (blurred, hover only) */}
      <div className={cn(
        "absolute -inset-[1px] rounded-[22px] opacity-0 blur-md transition-opacity duration-300",
        "group-hover:opacity-60",
        GRAD,
      )} />

      {/* Layer 2: CRISP EDGE (1px gradient) */}
      <div className={cn("relative rounded-[22px] p-[1px]", GRAD)}>

        {/* Layer 3: INNER CARD */}
        <div className="rounded-[21px] bg-[#0b1220] transition-colors duration-300 group-hover:bg-[#0e1628] overflow-hidden">
          {/* Glass highlight */}
          <div className="absolute inset-0 rounded-[21px] bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
          {children}
        </div>
      </div>
    </button>
  );
}

/* ── Card Components ── */

function SpotlightCard({
  title, subtitle, image, onClick,
}: {
  title: string; subtitle: string; image: string; onClick: () => void;
}) {
  return (
    <NeonWrap onClick={onClick} featured className="rounded-[24px]">
      <div className="relative min-h-[260px]">
        <img src={image} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end min-h-[260px] p-6">
          <h3 className="text-2xl sm:text-3xl font-semibold text-white">{title}</h3>
          <p className="mt-2 max-w-lg text-sm text-white/80">{subtitle}</p>
          <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white border border-white/10 group-hover:bg-white/20 transition-colors">
            Open Tool <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </NeonWrap>
  );
}

function ToolCard({
  tool, image, onClick, imageFirst = false, featured = false,
}: {
  tool: ToolRegistryEntry; image?: string; onClick: () => void; imageFirst?: boolean; featured?: boolean;
}) {
  const Icon = tool.icon;
  return (
    <NeonWrap onClick={onClick} disabled={tool.comingSoon} featured={featured}>
      <div className={cn(
        "relative z-10 grid h-full",
        imageFirst ? "grid-cols-1" : "grid-cols-[1fr_124px]",
        featured ? "min-h-[176px]" : "min-h-[150px]",
      )}>
        {imageFirst ? (
          <>
            <div className="aspect-[16/10] overflow-hidden">
              {image ? (
                <img src={image} alt={tool.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-[#0a0f1a]">
                  <Icon className="h-12 w-12 text-[#1e293b]" />
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
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#0b1220]/40" />
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-[#0a0f1a]">
                  <Icon className="h-8 w-8 text-[#1e293b]" />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </NeonWrap>
  );
}

function ToolCompactCard({
  tool, onClick,
}: {
  tool: ToolRegistryEntry; onClick: () => void;
}) {
  const Icon = tool.icon;
  return (
    <NeonWrap onClick={onClick} disabled={tool.comingSoon} className="rounded-[20px]">
      <div className="relative z-10 p-4">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e1a2e] text-[#74beff]">
          <Icon className="h-5 w-5" />
        </div>
        <h4 className="bg-gradient-to-r from-[#58b3ff] to-[#c8e9ff] bg-clip-text text-base font-semibold text-transparent">{tool.name}</h4>
        <p className="mt-2 text-sm leading-5 text-slate-400">{tool.description}</p>
      </div>
    </NeonWrap>
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
      {/* ── HERO ROW ── */}
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
            {byId("voice-isolator") && <ToolCard tool={byId("voice-isolator")} image={thumb("voice-isolator")} onClick={() => launch("voice-isolator")} />}
            {byId("music-splitter") && <ToolCard tool={byId("music-splitter")} image={thumb("music-splitter")} onClick={() => launch("music-splitter")} />}
          </div>
        </div>
      </motion.section>

      {/* ── MEDIA CREATION ── */}
      <motion.section variants={fadeUp}>
        <SectionHeader title="Media Creation" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mediaTools.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} image={thumb(tool.id)} onClick={() => launch(tool.id)} imageFirst={i % 3 === 0} featured={i === 0} />
          ))}
        </div>
      </motion.section>

      {/* ── STORE & SOCIAL ── */}
      {([...storeTools, ...socialTools].length > 0) && (
        <motion.section variants={fadeUp}>
          <SectionHeader title="Store & Social Tools" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...storeTools, ...socialTools].map(tool => (
              <ToolCard key={tool.id} tool={tool} image={thumb(tool.id)} onClick={() => launch(tool.id)} imageFirst />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── UTILITY ── */}
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
