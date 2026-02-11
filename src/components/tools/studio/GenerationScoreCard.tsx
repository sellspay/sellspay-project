import { motion } from "framer-motion";
import { TrendingUp, Zap, Target, Download, Copy, Layers, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GenerationScoreCardProps {
  engagement?: "High" | "Medium" | "Low";
  hookScore?: number;
  ctaStrength?: "Strong" | "Medium" | "Weak";
  onDownload?: () => void;
  onCopyCaption?: () => void;
  onSetAsPromo?: () => void;
  onCreateVariations?: () => void;
  onGeneratePosts?: () => void;
}

const ENGAGEMENT_COLORS = {
  High: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Low: "text-red-400 bg-red-400/10 border-red-400/20",
};

const CTA_COLORS = {
  Strong: "text-emerald-400",
  Medium: "text-amber-400",
  Weak: "text-red-400",
};

export function GenerationScoreCard({
  engagement = "High",
  hookScore = 8.4,
  ctaStrength = "Strong",
  onDownload, onCopyCaption, onSetAsPromo, onCreateVariations, onGeneratePosts,
}: GenerationScoreCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-border/20 bg-card/30 backdrop-blur-xl p-5 space-y-4"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        Performance Projection
      </h3>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-3">
        <div className={cn("rounded-lg border p-3 text-center", ENGAGEMENT_COLORS[engagement])}>
          <Zap className="h-4 w-4 mx-auto mb-1" />
          <p className="text-lg font-bold">{engagement}</p>
          <p className="text-[10px] opacity-70">Engagement</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-center">
          <Target className="h-4 w-4 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold text-primary">{hookScore}</p>
          <p className="text-[10px] text-primary/70">Hook Score</p>
        </div>
        <div className="rounded-lg border border-border/20 bg-card/40 p-3 text-center">
          <TrendingUp className={cn("h-4 w-4 mx-auto mb-1", CTA_COLORS[ctaStrength])} />
          <p className={cn("text-lg font-bold", CTA_COLORS[ctaStrength])}>{ctaStrength}</p>
          <p className="text-[10px] text-muted-foreground">CTA Strength</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {onDownload && (
          <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-full" onClick={onDownload}>
            <Download className="h-3 w-3" /> Download
          </Button>
        )}
        {onCopyCaption && (
          <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-full" onClick={onCopyCaption}>
            <Copy className="h-3 w-3" /> Copy Caption
          </Button>
        )}
        {onSetAsPromo && (
          <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-full" onClick={onSetAsPromo}>
            <Layers className="h-3 w-3" /> Set as Promo
          </Button>
        )}
        {onCreateVariations && (
          <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-full" onClick={onCreateVariations}>
            <RefreshCw className="h-3 w-3" /> 5 Variations
          </Button>
        )}
        {onGeneratePosts && (
          <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-full" onClick={onGeneratePosts}>
            <Zap className="h-3 w-3" /> 10 Posts
          </Button>
        )}
      </div>
    </motion.div>
  );
}
