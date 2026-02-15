import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, GalleryHorizontal, MessageSquare, Hash, FileText, Mail, Play, ChevronRight, Check, Package, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RecentCreations } from "./RecentCreations";
import { type SourceMode, type ProductContext } from "@/components/tools/SourceSelector";
import { ProductShowcaseCard } from "./ProductShowcaseCard";
import { ProductDetailModal } from "./ProductDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { StudioSection } from "./StudioLayout";

export interface CampaignCanvasProps {
  productCount: number;
  assetCount: number;
  generationCount: number;
  creditBalance: number;
  isLoadingCredits: boolean;
  recentAssets: any[];
  onLaunchPromo: () => void;
  onLaunchTool: (id: string) => void;
  onSectionChange?: (section: StudioSection) => void;
  /** Expose state for right panel */
  onCampaignStateChange?: (state: CampaignState) => void;
}

export interface CampaignState {
  selectedProduct: ProductContext | null;
  selectedTemplate: typeof CAMPAIGN_TEMPLATES[number] | null;
  selectedGoal: string | null;
  extraDirection: string;
  currentStep: 1 | 2 | 3;
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

export const CAMPAIGN_TEMPLATES = [
  { id: "viral-tiktok", name: "Viral TikTok Launch", desc: "Fast cuts, bold hooks, trending audio", goal: "sales", direction: "Bold, aggressive, viral energy" },
  { id: "premium-brand", name: "Premium Brand Launch", desc: "Cinematic, elegant, trust-building", goal: "launch", direction: "Premium, elegant, aspirational" },
  { id: "discount-push", name: "Discount Push", desc: "Urgency-driven, countdown, scarcity", goal: "discount", direction: "Urgent, limited-time, scarcity" },
  { id: "trust-builder", name: "Trust Builder", desc: "Testimonial-style, proof-focused", goal: "trust", direction: "Authentic, proof-heavy, relatable" },
  { id: "new-release", name: "New Release", desc: "Teaser-reveal format, anticipation", goal: "launch", direction: "Teaser, anticipation, reveal" },
];

const STEPS = [
  { num: 1, label: "Product" },
  { num: 2, label: "Style" },
  { num: 3, label: "Generate" },
] as const;

function generateProductHooks(product: ProductContext): string[] {
  const name = product.name;
  return [
    `Stop scrolling — ${name} changes everything.`,
    `You need ${name} in your life. Here's why.`,
    `Everyone's talking about ${name}. Have you tried it yet?`,
  ];
}

function generateProductCaption(product: ProductContext): string {
  const desc = product.description || product.excerpt || product.name;
  const truncated = desc.length > 120 ? desc.slice(0, 120) + "…" : desc;
  return truncated;
}

export function CampaignCanvas({
  productCount, assetCount, generationCount,
  creditBalance, isLoadingCredits, recentAssets,
  onLaunchPromo, onLaunchTool, onSectionChange,
  onCampaignStateChange,
}: CampaignCanvasProps) {
  const { profile } = useAuth();
  const [sourceMode, setSourceMode] = useState<SourceMode>("blank");
  const [selectedProduct, setSelectedProduct] = useState<ProductContext | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [extraDirection, setExtraDirection] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  // Inline product picker state
  const [products, setProducts] = useState<ProductContext[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productsFetched, setProductsFetched] = useState(false);

  // Blank mode manual fields
  const [blankName, setBlankName] = useState("");
  const [blankDescription, setBlankDescription] = useState("");
  const [blankAudience, setBlankAudience] = useState("");
  const [blankTags, setBlankTags] = useState("");
  const [blankSellingPoints, setBlankSellingPoints] = useState("");

  const hasBlankInput = blankName.trim().length >= 2;

  // Build a virtual product from blank inputs
  const parsedTags = blankTags.trim() ? blankTags.split(",").map(t => t.trim()).filter(Boolean) : null;
  const blankProduct: ProductContext | null = hasBlankInput
    ? { id: "blank", name: blankName.trim(), description: blankDescription.trim() || null, excerpt: blankSellingPoints.trim() || null, cover_image_url: null, tags: parsedTags, price_cents: null, currency: null }
    : null;

  // The effective product used downstream
  const effectiveProduct = sourceMode === "product" ? selectedProduct : blankProduct;

  const currentStep: 1 | 2 | 3 = !effectiveProduct ? 1 : !selectedTemplate ? 2 : 3;

  const selectedTpl = useMemo(
    () => CAMPAIGN_TEMPLATES.find(t => t.id === selectedTemplate) || null,
    [selectedTemplate]
  );

  // Notify parent of state changes for the right panel
  useEffect(() => {
    onCampaignStateChange?.({
      selectedProduct: effectiveProduct,
      selectedTemplate: selectedTpl,
      selectedGoal,
      extraDirection,
      currentStep,
    });
  }, [effectiveProduct, selectedTpl, selectedGoal, extraDirection, currentStep]);

  // Auto-scroll to templates when product is selected
  useEffect(() => {
    if (effectiveProduct && !selectedTemplate && templateRef.current) {
      setTimeout(() => {
        templateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [effectiveProduct, selectedTemplate]);

  const applyTemplate = (tpl: typeof CAMPAIGN_TEMPLATES[0]) => {
    setSelectedTemplate(tpl.id);
    setSelectedGoal(tpl.goal);
    setExtraDirection(tpl.direction);
  };

  const fetchProducts = async () => {
    if (productsFetched) return;
    setProductsLoading(true);
    let creatorId = profile?.id;
    if (!creatorId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles").select("id").eq("user_id", user.id).single();
        creatorId = profileData?.id;
      }
    }
    if (creatorId) {
      const { data } = await supabase
        .from("products")
        .select("id, name, description, excerpt, cover_image_url, tags, price_cents, currency")
        .eq("creator_id", creatorId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(50);
      setProducts((data as ProductContext[]) || []);
    }
    setProductsFetched(true);
    setProductsLoading(false);
  };

  const handleProductSelect = (product: ProductContext | null) => {
    setSelectedProduct(product);
    if (product) setSourceMode("product");
  };

  const handleModeChange = (mode: SourceMode) => {
    setSourceMode(mode);
    if (mode === "blank") {
      setSelectedProduct(null);
    }
    if (mode === "product") {
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const productHooks = effectiveProduct ? generateProductHooks(effectiveProduct) : [];
  const productCaption = effectiveProduct ? generateProductCaption(effectiveProduct) : "";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-4 lg:p-6 space-y-8">
      {/* Warm glow */}
      <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-orange-500/[0.03] blur-[140px]" />

      {/* Step Indicator */}
      <motion.div variants={fadeUp} className="flex items-center gap-1.5">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center gap-1.5">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200",
              currentStep >= step.num
                ? "bg-gradient-to-r from-[#FF7A1A]/20 to-[#E85C00]/10 text-foreground"
                : "bg-white/[0.03] text-muted-foreground/30"
            )}>
              <span className={cn(
                "h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold",
                currentStep > step.num
                  ? "bg-gradient-to-b from-[#FF7A1A] to-[#E85C00] text-white"
                  : currentStep === step.num
                    ? "ring-1 ring-[#FF7A1A]/50 text-[#FF7A1A]"
                    : "ring-1 ring-white/[0.08] text-muted-foreground/30"
              )}>
                {currentStep > step.num ? <Check className="h-2.5 w-2.5" /> : step.num}
              </span>
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className={cn(
                "h-3 w-3 transition-colors",
                currentStep > step.num ? "text-[#FF7A1A]/40" : "text-white/[0.08]"
              )} />
            )}
          </div>
        ))}
      </motion.div>

      {/* Hero */}
      <motion.div variants={fadeUp} className="space-y-2">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tighter leading-[1.05]">
          {currentStep === 1 ? "Select a Product" : currentStep === 2 ? "Choose a Style" : "Ready to Generate"}
        </h2>
        <p className="text-sm text-muted-foreground/70 max-w-lg">
          {currentStep === 1
            ? "Pick the product you want to promote. We'll build a complete marketing pack from it."
            : currentStep === 2
              ? "Choose a campaign style to set the tone, energy, and format of your marketing pack."
              : "Fine-tune your settings and hit generate to create your marketing pack."}
        </p>
      </motion.div>

      {/* Step 1: Product Selection */}
      <motion.div variants={fadeUp} className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={cn(
            "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold",
            effectiveProduct
              ? "bg-gradient-to-b from-[#FF7A1A] to-[#E85C00] text-white"
              : "ring-1 ring-[#FF7A1A]/50 text-[#FF7A1A]"
          )}>
            {effectiveProduct ? <Check className="h-3 w-3" /> : "1"}
          </span>
          <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Select Option</p>
        </div>

        {/* Source toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</span>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => handleModeChange("blank")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                sourceMode === "blank"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              Manual
            </button>
            <button
              onClick={() => {
                handleModeChange("product");
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                sourceMode === "product"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              Use Product
            </button>
          </div>
        </div>

        {/* Blank / Manual Input Form */}
        <AnimatePresence mode="wait">
          {sourceMode === "blank" ? (
            <motion.div
              key="blank-form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl ring-1 ring-white/[0.06] bg-white/[0.02] p-5 space-y-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-muted-foreground/40" />
                <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Manual Entry</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Product / Campaign Name *</label>
                  <Input
                    value={blankName}
                    onChange={e => setBlankName(e.target.value)}
                    placeholder="e.g. Summer Beat Pack"
                    className="bg-white/[0.03] border-white/[0.08] text-sm placeholder:text-muted-foreground/25"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Target Audience</label>
                  <Input
                    value={blankAudience}
                    onChange={e => setBlankAudience(e.target.value)}
                    placeholder="e.g. Music producers, beatmakers"
                    className="bg-white/[0.03] border-white/[0.08] text-sm placeholder:text-muted-foreground/25"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Description</label>
                <textarea
                  value={blankDescription}
                  onChange={e => setBlankDescription(e.target.value)}
                  placeholder="Describe your product or campaign idea — the AI will use this to generate hooks, captions, and scripts."
                  rows={3}
                  className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-foreground placeholder:text-muted-foreground/25 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#FF7A1A]/30"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Key Selling Points</label>
                  <textarea
                    value={blankSellingPoints}
                    onChange={e => setBlankSellingPoints(e.target.value)}
                    placeholder="What makes this special? List the top benefits or features."
                    rows={2}
                    className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-foreground placeholder:text-muted-foreground/25 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#FF7A1A]/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Tags / Keywords</label>
                  <Input
                    value={blankTags}
                    onChange={e => setBlankTags(e.target.value)}
                    placeholder="e.g. beats, hip-hop, trap (comma separated)"
                    className="bg-white/[0.03] border-white/[0.08] text-sm placeholder:text-muted-foreground/25"
                  />
                  {parsedTags && parsedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parsedTags.map(tag => (
                        <span key={tag} className="text-[9px] text-muted-foreground/50 bg-white/[0.04] px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {hasBlankInput && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 pt-1"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
                  <p className="text-[10px] text-emerald-400/60 font-medium">Ready — scroll down to choose a style</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="product-picker"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {selectedProduct ? (
                <ProductShowcaseCard
                  product={selectedProduct}
                  onChangeProduct={() => setSelectedProduct(null)}
                  onViewDetails={() => setDetailModalOpen(true)}
                  onSelectProduct={() => setSelectedProduct(null)}
                />
              ) : (
                <div className="rounded-2xl ring-1 ring-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-muted-foreground/40" />
                    <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Your Products</p>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input
                      placeholder="Search products…"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9 bg-white/[0.03] border-white/[0.08] text-sm placeholder:text-muted-foreground/25"
                    />
                  </div>

                  {/* Product Grid */}
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground/50">
                        {products.length === 0 ? "No published products found" : "No products match your search"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
                      {filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleProductSelect(p)}
                          className="group text-left rounded-xl ring-1 ring-white/[0.06] bg-white/[0.02] hover:ring-[#FF7A1A]/30 hover:bg-white/[0.04] transition-all duration-200 overflow-hidden"
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden bg-white/[0.02]">
                            {p.cover_image_url ? (
                              <img src={p.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground/15" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-xs font-semibold text-foreground/80 truncate">{p.name}</p>
                            {p.price_cents != null && (
                              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                                ${(p.price_cents / 100).toFixed(2)} {p.currency?.toUpperCase()}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onConfirm={() => {}}
      />

      {/* Live Preview — shows after product selection */}
      <AnimatePresence>
        {effectiveProduct && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-3">Live Preview</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Hooks preview — real product data */}
              <div className="bg-white/[0.02] rounded-xl p-4 min-h-[140px] flex flex-col">
                <p className="text-xs font-semibold text-foreground/80 mb-3">Sample Hooks</p>
                <div className="flex-1 space-y-2">
                  {productHooks.map((hook, i) => (
                    <p key={i} className="text-[11px] text-foreground/60 leading-snug">
                      {hook}
                    </p>
                  ))}
                </div>
              </div>

              {/* Caption preview */}
              <div className="bg-white/[0.02] rounded-xl p-4 min-h-[140px] flex flex-col">
                <p className="text-xs font-semibold text-foreground/80 mb-3">Sample Caption</p>
                <p className="text-[11px] text-foreground/60 leading-snug flex-1">{productCaption}</p>
                <div className="flex gap-1 mt-2">
                  {["#viral", "#launch", "#new"].map(t => (
                    <span key={t} className="text-[8px] text-muted-foreground/30 bg-white/[0.03] px-1.5 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>

              {/* Carousel outline */}
              <div className="bg-white/[0.02] rounded-xl p-4 min-h-[140px] flex flex-col">
                <p className="text-xs font-semibold text-foreground/80 mb-3">Carousel Outline</p>
                <div className="flex-1 space-y-1.5 text-[11px] text-foreground/50">
                  <p>Slide 1: Hook — "{productHooks[0]?.slice(0, 40)}…"</p>
                  <p>Slide 2: Problem statement</p>
                  <p>Slide 3: Product intro — {effectiveProduct.name}</p>
                  <p>Slide 4: Key benefits</p>
                  <p>Slide 5: CTA + pricing</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 2: Campaign Style (Templates) — only visible after product selection */}
      <AnimatePresence>
        {effectiveProduct && (
          <motion.div
            ref={templateRef}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                selectedTemplate
                  ? "bg-gradient-to-b from-[#FF7A1A] to-[#E85C00] text-white"
                  : "ring-1 ring-[#FF7A1A]/50 text-[#FF7A1A]"
              )}>
                {selectedTemplate ? <Check className="h-3 w-3" /> : "2"}
              </span>
              <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Choose a Style</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CAMPAIGN_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className={cn(
                    "p-5 rounded-xl text-left transition-all duration-200 group relative overflow-hidden",
                    selectedTemplate === tpl.id
                      ? "bg-white/[0.06] ring-1 ring-[#FF7A1A]/30 shadow-lg shadow-orange-500/5"
                      : "bg-white/[0.02] hover:bg-white/[0.05] ring-1 ring-transparent hover:ring-white/[0.06]"
                  )}
                >
                  {/* Preview area */}
                  <div className="w-full h-[120px] rounded-lg bg-gradient-to-br from-white/[0.04] to-transparent mb-4 flex items-center justify-center relative overflow-hidden">
                    <Play className={cn(
                      "h-6 w-6 transition-colors",
                      selectedTemplate === tpl.id ? "text-[#FF7A1A]/40" : "text-white/10"
                    )} />
                    {selectedTemplate === tpl.id && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-gradient-to-b from-[#FF7A1A] to-[#E85C00] flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground/90">{tpl.name}</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-1 leading-snug">{tpl.desc}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 3: Goal + Direction — only after template */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-1 ring-[#FF7A1A]/50 text-[#FF7A1A]">3</span>
              <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Fine-tune & Generate</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-2">Goal</p>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGoal(g.id === selectedGoal ? null : g.id)}
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

            {/* Generate CTA is in the right panel (CampaignControlPanel) */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Creations */}
      <motion.div variants={fadeUp}>
        <RecentCreations assets={recentAssets} />
      </motion.div>
    </motion.div>
  );
}
