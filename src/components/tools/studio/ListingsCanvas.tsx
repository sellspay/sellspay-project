import { useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolsRegistry } from "@/components/tools/toolsRegistry";

interface ListingsCanvasProps {
  onLaunchTool: (id: string) => void;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const SCORES = [
  { label: "Clarity", from: 72, to: 91, color: "bg-emerald-400" },
  { label: "Trust", from: 64, to: 85, color: "bg-teal-400" },
  { label: "SEO", from: 48, to: 78, color: "bg-cyan-400" },
  { label: "CTA", from: 55, to: 88, color: "bg-green-400" },
];

const QUICK_ACTIONS = [
  "Improve Headline", "Add FAQ", "Strengthen CTA",
  "Add Urgency", "Add Social Proof", "Optimize for SEO",
];

const LISTING_TOOL_IDS = [
  "product-description", "sales-page-sections", "upsell-suggestions",
  "generate-hero", "rewrite-brand-voice", "create-faq", "seo-landing-page",
];

export function ListingsCanvas({ onLaunchTool }: ListingsCanvasProps) {
  const tools = useMemo(() =>
    toolsRegistry.filter(t => LISTING_TOOL_IDS.includes(t.id) && t.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  []);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-4 lg:p-5 space-y-5">
      {/* Teal glow */}
      <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-emerald-500/[0.03] blur-[140px]" />

      {/* Score Header — no container */}
      <motion.div variants={fadeUp}>
        <p className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider mb-4">Performance</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {SCORES.map(s => (
            <div key={s.label} className="space-y-2">
              <span className="text-xs font-medium text-foreground/70">{s.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] text-muted-foreground/40 line-through">{s.from}</span>
                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/30" />
                <span className="text-xl font-bold text-foreground">{s.to}</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", s.color)}
                  initial={{ width: `${s.from}%` }}
                  animate={{ width: `${s.to}%` }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Before/After Split — gap instead of divider */}
      <motion.div variants={fadeUp}>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-6 space-y-3">
            <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">Current Listing</span>
            <div className="space-y-2">
              <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
              <div className="h-3 w-full rounded bg-white/[0.04]" />
              <div className="h-3 w-5/6 rounded bg-white/[0.04]" />
              <div className="h-3 w-2/3 rounded bg-white/[0.04] mt-4" />
              <div className="h-3 w-full rounded bg-white/[0.04]" />
              <div className="h-8 w-24 rounded-lg bg-white/[0.04] mt-4" />
            </div>
            <p className="text-[11px] text-muted-foreground/30 italic mt-2">Weak headline · No FAQ · Missing CTA</p>
          </div>
          <div className="p-6 space-y-3 bg-emerald-500/[0.02]">
            <span className="text-[10px] font-semibold text-emerald-400/60 uppercase tracking-wider">AI Optimized</span>
            <div className="space-y-2">
              <motion.div initial={{ width: 0 }} animate={{ width: "85%" }} transition={{ duration: 0.8, delay: 0.5 }}
                className="h-3.5 rounded bg-emerald-500/15" />
              <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8, delay: 0.6 }}
                className="h-3 rounded bg-emerald-500/8" />
              <motion.div initial={{ width: 0 }} animate={{ width: "90%" }} transition={{ duration: 0.8, delay: 0.7 }}
                className="h-3 rounded bg-emerald-500/8" />
              <motion.div initial={{ width: 0 }} animate={{ width: "75%" }} transition={{ duration: 0.8, delay: 0.9 }}
                className="h-3 rounded bg-emerald-500/8 mt-4" />
              <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8, delay: 1.0 }}
                className="h-3 rounded bg-emerald-500/8" />
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 1.2 }}
                className="h-9 w-28 rounded-lg bg-emerald-500/10 mt-4 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-emerald-400/70">Strong CTA</span>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions — softer pills */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(a => (
            <button
              key={a}
              className="px-4 py-2 rounded-full text-xs font-medium text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04] transition-colors"
            >
              {a}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tools Grid — no icons */}
      <motion.div variants={fadeUp} className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider">Listing Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onLaunchTool(tool.id)}
              className="group p-5 rounded-xl text-left hover:bg-white/[0.03] transition-colors"
            >
              <p className="text-sm font-semibold text-foreground">{tool.name}</p>
              <p className="text-[11px] text-muted-foreground/50 mt-1 line-clamp-2">{tool.description}</p>
              {tool.creditCost > 0 && (
                <span className="text-[10px] text-muted-foreground/40 mt-2 block">{tool.creditCost} credits</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
