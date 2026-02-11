import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, FileText, LayoutTemplate, PackagePlus,
  Search, HelpCircle, PenLine, Wand2, Zap, ArrowRight,
  BarChart3, ShieldCheck, Eye, MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toolsRegistry } from "@/components/tools/toolsRegistry";

interface ListingsCanvasProps {
  onLaunchTool: (id: string) => void;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const SCORES = [
  { label: "Clarity", from: 72, to: 91, icon: Eye, color: "text-emerald-400" },
  { label: "Trust", from: 64, to: 85, icon: ShieldCheck, color: "text-teal-400" },
  { label: "SEO", from: 48, to: 78, icon: Search, color: "text-cyan-400" },
  { label: "CTA Strength", from: 55, to: 88, icon: MousePointerClick, color: "text-green-400" },
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
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-6 lg:p-8 space-y-8 max-w-[1200px] mx-auto">
      {/* Teal glow */}
      <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-[140px]" />

      {/* Score Header */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border/20 bg-card/30 backdrop-blur-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-foreground">Listing Performance</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SCORES.map(s => (
            <div key={s.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <s.icon className={cn("h-4 w-4", s.color)} />
                <span className="text-xs font-semibold text-foreground">{s.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] text-muted-foreground line-through">{s.from}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className={cn("text-xl font-bold", s.color)}>{s.to}</span>
              </div>
              <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", s.color.replace("text-", "bg-"))}
                  initial={{ width: `${s.from}%` }}
                  animate={{ width: `${s.to}%` }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Before/After Split Preview */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-xl overflow-hidden">
        <div className="grid lg:grid-cols-2 divide-x divide-border/10">
          {/* Current */}
          <div className="p-6 space-y-3">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Current Listing</span>
            <div className="space-y-2">
              <div className="h-3 w-3/4 rounded bg-muted-foreground/10" />
              <div className="h-3 w-full rounded bg-muted-foreground/10" />
              <div className="h-3 w-5/6 rounded bg-muted-foreground/10" />
              <div className="h-3 w-2/3 rounded bg-muted-foreground/10 mt-4" />
              <div className="h-3 w-full rounded bg-muted-foreground/10" />
              <div className="h-8 w-24 rounded-lg bg-muted-foreground/10 mt-4" />
            </div>
            <p className="text-[11px] text-muted-foreground/60 italic mt-2">Weak headline • No FAQ • Missing CTA</p>
          </div>
          {/* Optimized */}
          <div className="p-6 space-y-3 bg-emerald-500/[0.02]">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">AI Optimized</span>
            <div className="space-y-2">
              <motion.div initial={{ width: 0 }} animate={{ width: "85%" }} transition={{ duration: 0.8, delay: 0.5 }}
                className="h-3.5 rounded bg-emerald-500/20 border border-emerald-500/20" />
              <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8, delay: 0.6 }}
                className="h-3 rounded bg-emerald-500/10" />
              <motion.div initial={{ width: 0 }} animate={{ width: "90%" }} transition={{ duration: 0.8, delay: 0.7 }}
                className="h-3 rounded bg-emerald-500/10" />
              <motion.div initial={{ width: 0 }} animate={{ width: "75%" }} transition={{ duration: 0.8, delay: 0.9 }}
                className="h-3 rounded bg-emerald-500/10 mt-4" />
              <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8, delay: 1.0 }}
                className="h-3 rounded bg-emerald-500/10" />
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 1.2 }}
                className="h-9 w-28 rounded-lg bg-emerald-500/20 border border-emerald-500/30 mt-4 flex items-center justify-center">
                <span className="text-[10px] font-bold text-emerald-400">Strong CTA ✓</span>
              </motion.div>
            </div>
            <p className="text-[11px] text-emerald-400/60 italic mt-2">Optimized headline • FAQ added • CTA improved</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp}>
        <h3 className="text-lg font-bold text-foreground mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(a => (
            <button
              key={a}
              className="px-4 py-2 rounded-full text-xs font-semibold border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 hover:bg-emerald-500/[0.12] hover:border-emerald-500/30 transition-colors"
            >
              {a}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tools Grid */}
      <motion.div variants={fadeUp} className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">Listing Tools</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onLaunchTool(tool.id)}
              className={cn(
                "group p-5 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm text-left",
                "hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/20",
                "transition-all duration-200"
              )}
            >
              <tool.icon className="h-5 w-5 text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-foreground">{tool.name}</p>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
              {tool.creditCost > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Zap className="h-3 w-3 text-primary" />
                  <span className="text-[10px] text-muted-foreground">{tool.creditCost} credits</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
