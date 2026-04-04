import { Suspense, lazy, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Loader2, Crown, Sparkles,
} from "lucide-react";
import { getToolById, ToolData } from "./toolsData";
import { toolsRegistry } from "./toolsRegistry";
import { toolThumbnails } from "./studio/toolThumbnails";
import { ProToolsGate } from "./ProToolsGate";
import { useSubscription } from "@/hooks/useSubscription";
import { SourceSelector, type SourceMode, type ProductContext } from "./SourceSelector";
import { BrandKitToggle, type BrandKitData } from "./BrandKitToggle";
import { CreditEstimator } from "./CreditEstimator";
import { AssetOutputPanel } from "./AssetOutputPanel";
import { ProductContextCard } from "./ProductContextCard";
import { ImageToolModeToggle, type ImageToolMode } from "./ImageToolModeToggle";
import { VideoToolModeToggle, type VideoToolMode, type VideoStyle } from "./VideoToolModeToggle";
import { ContentModerationBanner } from "./ContentModerationBanner";
import { useContentModeration } from "@/hooks/useContentModeration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AudioCutter = lazy(() => import("@/pages/tools/AudioCutter"));
const AudioRecorder = lazy(() => import("@/pages/tools/AudioRecorder"));
const AudioJoiner = lazy(() => import("@/pages/tools/AudioJoiner"));
const VideoToAudio = lazy(() => import("@/pages/tools/VideoToAudio"));
const AudioConverter = lazy(() => import("@/pages/tools/AudioConverter"));
const WaveformGenerator = lazy(() => import("@/pages/tools/WaveformGenerator"));
const VoiceIsolator = lazy(() => import("@/pages/tools/VoiceIsolator"));
const SFXIsolator = lazy(() => import("@/pages/tools/SFXIsolator"));
const MusicSplitter = lazy(() => import("@/pages/tools/MusicSplitter"));
const SFXGenerator = lazy(() => import("@/pages/tools/SFXGenerator"));
const NanoBanana = lazy(() => import("@/pages/tools/NanoBanana"));

interface ToolActiveViewProps {
  toolId: string;
  onClose: () => void;
  creditBalance?: number;
  isLoadingCredits?: boolean;
  embedded?: boolean;
}

export function ToolActiveView({ 
  toolId, onClose, creditBalance = 0, isLoadingCredits, embedded = false,
}: ToolActiveViewProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const { isProTool, goToPricing } = useSubscription();
  const { moderationResult, validatePrompt, clearModeration } = useContentModeration();
  
  const tool = getToolById(toolId);
  const registryEntry = toolsRegistry.find((t) => t.id === toolId);

  const [sourceMode, setSourceMode] = useState<SourceMode>("blank");
  const [selectedProduct, setSelectedProduct] = useState<ProductContext | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<ProductContext[]>([]);
  const isMultiSelect = registryEntry?.supportsMultiProduct ?? false;

  const [brandKitEnabled, setBrandKitEnabled] = useState(false);
  const [brandKitData, setBrandKitData] = useState<BrandKitData | null>(null);

  const [imageMode, setImageMode] = useState<ImageToolMode>("enhance");
  const [keepRecognizable, setKeepRecognizable] = useState(true);
  const [variations, setVariations] = useState(1);
  const [videoMode, setVideoMode] = useState<VideoToolMode>("product-to-promo");
  const [videoDuration, setVideoDuration] = useState(15);
  const [videoAspect, setVideoAspect] = useState("9:16");
  const [videoStyle, setVideoStyle] = useState<VideoStyle>("cinematic");
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(false);

  const [generatedAsset, setGeneratedAsset] = useState<{
    type: "image" | "audio" | "video" | "text" | "file";
    storageUrl: string;
    filename: string;
  } | null>(null);

  const activeProducts = isMultiSelect ? selectedProducts : selectedProduct ? [selectedProduct] : [];

  const handleRemoveProduct = useCallback((productId: string) => {
    if (isMultiSelect) {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
    } else {
      setSelectedProduct(null);
      setSourceMode("blank");
    }
  }, [isMultiSelect]);

  const handleSetAsThumbnail = useCallback(async () => {
    const product = activeProducts[0];
    if (!product || !generatedAsset?.storageUrl) return;
    const { error } = await supabase
      .from("products")
      .update({ cover_image_url: generatedAsset.storageUrl })
      .eq("id", product.id);
    if (error) { toast.error("Failed to set thumbnail"); }
    else { toast.success("Thumbnail updated!"); }
  }, [activeProducts, generatedAsset]);

  const handleAddToGallery = useCallback(async () => {
    const product = activeProducts[0];
    if (!product || !generatedAsset?.storageUrl) return;
    await supabase
      .from("tool_assets" as any)
      .update({ used_on_page: "gallery" })
      .eq("output_url", generatedAsset.storageUrl);
    toast.success("Added to gallery!");
  }, [activeProducts, generatedAsset]);

  const handleGenerateMore = useCallback(() => {
    setGeneratedAsset(null);
  }, []);

  useEffect(() => {
    if (embedded) {
      setShowIntro(false);
      setIsReady(true);
      return;
    }
    const timer = setTimeout(() => {
      setShowIntro(false);
      setTimeout(() => setIsReady(true), 500);
    }, 1500);
    return () => clearTimeout(timer);
  }, [toolId, embedded]);

  if (!tool) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400">Tool not found</p>
      </div>
    );
  }

  const Icon = tool.icon;
  const creditCost = registryEntry?.creditCost ?? 0;

  if (toolId === "image-generator") {
    return (
      <div className="h-full">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
          <NanoBanana />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#f7fbff]">
      <AnimatePresence>
        {showIntro && !embedded && (
          <ToolIntroOverlay tool={tool} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: (embedded || isReady) ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        {embedded ? (
          <div className="relative overflow-hidden bg-white border-b border-[#e3edf5]">
            <div className="relative h-48 overflow-hidden">
              {toolThumbnails[toolId] ? (
                <>
                  <img 
                    src={toolThumbnails[toolId]} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/40" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                </>
              ) : (
                <>
                  <div className={cn("absolute inset-0", `bg-gradient-to-br ${tool.gradient}`)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />
                </>
              )}
              
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#e3edf5]">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-slate-800 tabular-nums">
                  {isLoadingCredits ? "…" : creditBalance} credits
                </span>
              </div>

              <div className="absolute bottom-4 left-4 z-10 flex items-end gap-3">
                <div className={cn(
                  "w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-xl border-2 border-white",
                  !toolThumbnails[toolId] && `bg-gradient-to-br ${tool.gradient}`
                )}>
                  {toolThumbnails[toolId] ? (
                    <img src={toolThumbnails[toolId]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="pb-0.5">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight drop-shadow-sm">{tool.title}</h1>
                    {tool.badge && (
                      <Badge className={cn(
                        "border-0 text-[10px]",
                        tool.badge === "Pro" && "bg-blue-50 text-blue-500",
                        tool.badge === "Free" && "bg-emerald-50 text-emerald-600"
                      )}>
                        {tool.badge === "Pro" && <Crown className="w-2.5 h-2.5 mr-0.5" />}
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{tool.tagline}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ToolHeroBanner
            tool={tool}
            onClose={onClose}
            creditBalance={creditBalance}
            isLoadingCredits={isLoadingCredits}
          />
        )}

        <div className={cn("mx-auto py-6 space-y-4", embedded ? "px-6" : "container px-6")}>
          {!embedded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {isMultiSelect ? (
                <SourceSelector
                  mode={sourceMode}
                  onModeChange={setSourceMode}
                  multiSelect
                  selectedProducts={selectedProducts}
                  onProductsChange={setSelectedProducts}
                />
              ) : (
                <SourceSelector
                  mode={sourceMode}
                  onModeChange={setSourceMode}
                  selectedProduct={selectedProduct}
                  onProductSelect={setSelectedProduct}
                />
              )}

              {sourceMode === "product" && activeProducts.length > 0 && (
                <ProductContextCard
                  products={activeProducts}
                  onRemove={handleRemoveProduct}
                  multiSelect={isMultiSelect}
                  onAddAnother={isMultiSelect ? () => {
                    setSourceMode("product");
                  } : undefined}
                />
              )}

              {registryEntry?.supportsModes === "image" && (
                <ImageToolModeToggle
                  mode={imageMode}
                  onModeChange={setImageMode}
                  keepRecognizable={keepRecognizable}
                  onKeepRecognizableChange={setKeepRecognizable}
                  variations={variations}
                  onVariationsChange={setVariations}
                />
              )}
              {registryEntry?.supportsModes === "video" && (
                <VideoToolModeToggle
                  mode={videoMode}
                  onModeChange={setVideoMode}
                  duration={videoDuration}
                  onDurationChange={setVideoDuration}
                  aspectRatio={videoAspect}
                  onAspectRatioChange={setVideoAspect}
                  style={videoStyle}
                  onStyleChange={setVideoStyle}
                  voiceoverEnabled={voiceoverEnabled}
                  onVoiceoverChange={setVoiceoverEnabled}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <BrandKitToggle
                  enabled={brandKitEnabled}
                  onToggle={setBrandKitEnabled}
                  onBrandKitLoaded={setBrandKitData}
                />
                <CreditEstimator
                  baseCost={creditCost}
                  creditBalance={creditBalance}
                  isLoading={isLoadingCredits}
              />
            </div>
          </motion.div>
          )}

          <ContentModerationBanner result={moderationResult} onDismiss={clearModeration} />

          <Suspense fallback={<ToolLoadingState tool={tool} />}>
            <ProToolsGate
              isProTool={isProTool(toolId)}
              creditBalance={creditBalance}
              onTopUp={goToPricing}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <ToolComponent toolId={toolId} />
              </motion.div>
            </ProToolsGate>
          </Suspense>

          {generatedAsset && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AssetOutputPanel
                assetType={generatedAsset.type}
                storageUrl={generatedAsset.storageUrl}
                filename={generatedAsset.filename}
                onSetAsThumbnail={activeProducts.length > 0 ? handleSetAsThumbnail : undefined}
                onAddToGallery={activeProducts.length > 0 ? handleAddToGallery : undefined}
                onGenerateMore={handleGenerateMore}
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ToolIntroOverlay({ tool }: { tool: ToolData }) {
  const Icon = tool.icon;
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#f7fbff]"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.1, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={cn(
            "w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center",
            `bg-gradient-to-br ${tool.gradient}`,
            "shadow-2xl"
          )}
        >
          <Icon className="w-12 h-12 text-white" />
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-3xl font-bold mb-2 text-slate-900"
        >
          {tool.title}
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-slate-400"
        >
          Activating premium experience...
        </motion.p>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className={cn(
            "h-1 mt-8 mx-auto max-w-[200px] rounded-full",
            `bg-gradient-to-r ${tool.gradient}`
          )}
        />
      </motion.div>
    </motion.div>
  );
}

function ToolHeroBanner({
  tool, onClose, creditBalance, isLoadingCredits,
}: {
  tool: ToolData;
  onClose: () => void;
  creditBalance: number;
  isLoadingCredits?: boolean;
}) {
  const Icon = tool.icon;
  return (
    <div className={cn(
      "relative h-48 md:h-64 overflow-hidden",
      `bg-gradient-to-br ${tool.gradient}`
    )}>
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
      </div>
      <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-end pb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 left-4 text-white/80 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-1.5 absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-semibold text-white tabular-nums">
            {isLoadingCredits ? "…" : creditBalance} credits
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/20")}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{tool.title}</h1>
            <p className="text-white/80 text-sm">{tool.tagline}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolLoadingState({ tool }: { tool: ToolData }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-slate-500">Loading {tool.title}...</p>
    </div>
  );
}

function ToolComponent({ toolId }: { toolId: string }) {
  switch (toolId) {
    case "audio-cutter": return <AudioCutter />;
    case "audio-recorder": return <AudioRecorder />;
    case "audio-joiner": return <AudioJoiner />;
    case "video-to-audio": return <VideoToAudio />;
    case "audio-converter": return <AudioConverter />;
    case "waveform-generator": return <WaveformGenerator />;
    case "voice-isolator": return <VoiceIsolator />;
    case "sfx-isolator": return <SFXIsolator />;
    case "music-splitter": return <MusicSplitter />;
    case "sfx-generator": return <SFXGenerator />;
    case "image-generator": return <NanoBanana />;
    default: return (
      <div className="rounded-2xl bg-white border border-[#e3edf5] p-12 text-center shadow-sm">
        <p className="text-slate-500">This tool is coming soon!</p>
      </div>
    );
  }
}
