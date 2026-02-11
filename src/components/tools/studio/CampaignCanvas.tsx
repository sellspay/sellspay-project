import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, GalleryHorizontal, MessageSquare, Hash, FileText, Mail, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RecentCreations } from "./RecentCreations";
import { SourceSelector, type SourceMode, type ProductContext } from "@/components/tools/SourceSelector";
import type { StudioSection } from "./StudioLayout";

interface CampaignCanvasProps {
  productCount: number;
  assetCount: number;
  generationCount: number;
  creditBalance: number;
  isLoadingCredits: boolean;
  recentAssets: any[];
  onLaunchPromo: () => void;
  onLaunchTool: (id: string) => void;
  onSectionChange?: (section: StudioSection) => void;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

const GOALS = [
  { id: "sales", label: "Get more sales" },
  { id: "traffic", label: "Get more traffic" },
  { id: "trust", label: "Build trust" },
  { id: "launch", label: "Launch new product" },
  { id: "discount", label: "Promote discount" },
];

const CAMPAIGN_TEMPLATES = [
  { id: "viral-tiktok", name: "Viral TikTok Launch", desc: "Fast cuts, bold hooks, trending audio", goal: "sales", direction: "Bold, aggressive, viral energy" },
  { id: "premium-brand", name: "Premium Brand Launch", desc: "Cinematic, elegant, trust-building", goal: "launch", direction: "Premium, elegant, aspirational" },
  { id: "discount-push", name: "Discount Push", desc: "Urgency-driven, countdown, scarcity", goal: "discount", direction: "Urgent, limited-time, scarcity" },
  { id: "trust-builder", name: "Trust Builder", desc: "Testimonial-style, proof-focused", goal: "trust", direction: "Authentic, proof-heavy, relatable" },
  { id: "new-release", name: "New Release", desc: "Teaser-reveal format, anticipation", goal: "launch", direction: "Teaser, anticipation, reveal" },
];

const OUTPUT_PILLS = [
  { label: "Promo Video", icon: Video },
  { label: "Carousel", icon: GalleryHorizontal },
  { label: "10 Hooks", icon: MessageSquare },
  { label: "Captions + Hashtags", icon: Hash },
  { label: "Listing Rewrite", icon: FileText },
  { label: "Email Blast", icon: Mail },
];

const HOOKS_PREVIEW = [
  "Stop scrolling — this changes everything.",
  "You're losing money if you skip this.",
  "This hack doubled my sales overnight.",
];

export function CampaignCanvas({
  productCount, assetCount, generationCount,
  creditBalance, isLoadingCredits, recentAssets,
  onLaunchPromo, onLaunchTool, onSectionChange,
}: CampaignCanvasProps) {
  const [sourceMode, setSourceMode] = useState<SourceMode>("blank");
  const [selectedProduct, setSelectedProduct] = useState<ProductContext | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [extraDirection, setExtraDirection] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [hookIdx, setHookIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHookIdx(i => (i + 1) % HOOKS_PREVIEW.length), 2500);
    return () => clearInterval(t);
  }, []);

  const applyTemplate = (tpl: typeof CAMPAIGN_TEMPLATES[0]) => {
    setSelectedTemplate(tpl.id);
    setSelectedGoal(tpl.goal);
    setExtraDirection(tpl.direction);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-4 lg:p-6 space-y-8">
      {/* Warm glow */}
      <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-orange-500/[0.03] blur-[140px]" />

      {/* A1: Hero */}
      <motion.div variants={fadeUp} className="space-y-4 min-h-[200px] flex flex-col justify-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tighter leading-[1.05]">
          Launch a Campaign
        </h2>
        <p className="text-sm text-muted-foreground/70 max-w-lg">
          Generate a complete marketing pack from your product — ready to post.
        </p>

        {/* Output pills row */}
        <div className="flex flex-wrap gap-2 pt-1">
          {OUTPUT_PILLS.map(pill => (
            <div
              key={pill.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <pill.icon className="h-3 w-3 text-muted-foreground/40" strokeWidth={1.5} />
              <span className="text-[11px] text-foreground/70">{pill.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* A2: Quick Launch — Product + Template + Goal + Direction */}
      <motion.div variants={fadeUp} className="space-y-5">
        {/* Row 1: Product + Template */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-2">Product</p>
            <SourceSelector
              mode={sourceMode}
              onModeChange={setSourceMode}
              selectedProduct={selectedProduct}
              onProductSelect={setSelectedProduct}
            />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-2">Template</p>
            <div className="flex flex-wrap gap-2">
              {CAMPAIGN_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-150",
                    selectedTemplate === tpl.id
                      ? "bg-gradient-to-r from-[#FF7A1A] to-[#E85C00] text-white shadow-sm"
                      : "bg-white/[0.04] text-muted-foreground/60 hover:bg-white/[0.08] hover:text-foreground"
                  )}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Goal + Direction */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-2">Goal</p>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelectedGoal(g.id === selectedGoal ? null : g.id);
                    setSelectedTemplate(null);
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150",
                    selectedGoal === g.id
                      ? "bg-white/[0.10] text-foreground ring-1 ring-white/[0.12]"
                      : "bg-white/[0.04] text-muted-foreground/60 hover:bg-white/[0.08] hover:text-foreground"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-2">Extra Direction</p>
            <Input
              value={extraDirection}
              onChange={e => setExtraDirection(e.target.value)}
              placeholder="Optional: 'Make it bold and aggressive'"
              className="bg-white/[0.03] border-border/20 text-sm"
            />
          </div>
        </div>

        {/* A3: Action buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onLaunchPromo}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-[10px] shadow-sm transition-all hover:shadow-md"
            style={{ background: "linear-gradient(180deg, #FF7A1A 0%, #E85C00 100%)" }}
          >
            Generate Campaign Pack
          </button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground/60" onClick={onLaunchPromo}>
            Plan First (Advanced)
          </Button>
        </div>
      </motion.div>

      {/* A4: Preview Showcase — "What you'll get" */}
      <motion.div variants={fadeUp}>
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-3">What you'll get</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Promo Video — phone mockup */}
          <div className="bg-white/[0.02] rounded-xl p-4 min-h-[180px] flex flex-col group hover:bg-white/[0.04] transition-colors">
            <p className="text-xs font-semibold text-foreground/80 mb-3">Promo Video</p>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-[64px] h-[114px] rounded-lg bg-gradient-to-b from-white/[0.04] to-transparent overflow-hidden">
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/[0.06]" />
                <div className="absolute inset-x-2 bottom-3 space-y-1">
                  <div className="h-1 w-8 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-1 w-5 rounded-full bg-white/5" />
                </div>
                <div className="absolute top-2 right-2">
                  <Play className="h-3 w-3 text-white/20" />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-2">9:16 vertical video</p>
          </div>

          {/* Carousel — stacked slides */}
          <div className="bg-white/[0.02] rounded-xl p-4 min-h-[180px] flex flex-col group hover:bg-white/[0.04] transition-colors">
            <p className="text-xs font-semibold text-foreground/80 mb-3">Carousel Post</p>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-[72px] h-[72px]">
                {[2, 1, 0].map(i => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-md bg-white/[0.04] ring-1 ring-inset ring-white/[0.06]"
                    style={{ transform: `rotate(${(i - 1) * 4}deg) translateX(${(i - 1) * 4}px)` }}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-2">5-slide swipeable</p>
          </div>

          {/* Viral Hooks — animated text */}
          <div className="bg-white/[0.02] rounded-xl p-4 min-h-[180px] flex flex-col group hover:bg-white/[0.04] transition-colors">
            <p className="text-xs font-semibold text-foreground/80 mb-3">Viral Hooks</p>
            <div className="flex-1 flex items-center">
              <div className="space-y-2 w-full overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={hookIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-[11px] text-foreground/60 leading-snug"
                  >
                    {HOOKS_PREVIEW[hookIdx]}
                  </motion.p>
                </AnimatePresence>
                <div className="h-px w-8 bg-white/[0.06]" />
                <p className="text-[10px] text-muted-foreground/30">+ 9 more</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-2">Scroll-stopping openers</p>
          </div>

          {/* Captions Pack */}
          <div className="bg-white/[0.02] rounded-xl p-4 min-h-[120px] flex flex-col group hover:bg-white/[0.04] transition-colors">
            <p className="text-xs font-semibold text-foreground/80 mb-2">Captions Pack</p>
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-white/[0.04]" />
              <div className="h-1.5 w-3/4 rounded-full bg-white/[0.03]" />
              <div className="flex gap-1 mt-2">
                {["#viral", "#sale", "#new"].map(t => (
                  <span key={t} className="text-[8px] text-muted-foreground/30 bg-white/[0.03] px-1.5 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Listing Rewrite */}
          <div className="bg-white/[0.02] rounded-xl p-4 min-h-[120px] flex flex-col group hover:bg-white/[0.04] transition-colors">
            <p className="text-xs font-semibold text-foreground/80 mb-2">Listing Rewrite</p>
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-white/[0.04]" />
              <div className="h-1.5 w-5/6 rounded-full bg-white/[0.03]" />
              <div className="h-1.5 w-2/3 rounded-full bg-white/[0.03]" />
            </div>
          </div>

          {/* Email Draft */}
          <div className="bg-white/[0.02] rounded-xl p-4 min-h-[120px] flex flex-col group hover:bg-white/[0.04] transition-colors">
            <p className="text-xs font-semibold text-foreground/80 mb-2">Email Draft</p>
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 w-1/2 rounded-full bg-white/[0.04]" />
              <div className="h-px w-full bg-white/[0.03] my-1" />
              <div className="h-1.5 w-full rounded-full bg-white/[0.03]" />
              <div className="h-1.5 w-4/5 rounded-full bg-white/[0.03]" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* A5: Campaign Templates Shelf */}
      <motion.div variants={fadeUp}>
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-3">Trending Campaign Templates</p>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {CAMPAIGN_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => applyTemplate(tpl)}
              className={cn(
                "shrink-0 w-[240px] p-4 rounded-xl text-left transition-all duration-150 group",
                selectedTemplate === tpl.id
                  ? "bg-white/[0.06] ring-1 ring-white/[0.08]"
                  : "bg-white/[0.02] hover:bg-white/[0.05]"
              )}
            >
              {/* Preview placeholder */}
              <div className="w-full h-[100px] rounded-lg bg-gradient-to-br from-white/[0.03] to-transparent mb-3 flex items-center justify-center">
                <Play className="h-5 w-5 text-white/10" />
              </div>
              <p className="text-sm font-semibold text-foreground/90">{tpl.name}</p>
              <p className="text-[11px] text-muted-foreground/50 mt-1 leading-snug">{tpl.desc}</p>
              <p className="text-[10px] text-orange-400/60 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Use template
              </p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent Creations */}
      <motion.div variants={fadeUp}>
        <RecentCreations assets={recentAssets} />
      </motion.div>
    </motion.div>
  );
}
