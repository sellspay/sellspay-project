import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clapperboard, Film } from "lucide-react";

export type VideoToolMode = "product-to-promo" | "reference";
export type VideoStyle = "cinematic" | "ugc" | "tutorial" | "hype" | "minimal";

interface VideoToolModeToggleProps {
  mode: VideoToolMode;
  onModeChange: (mode: VideoToolMode) => void;
  duration: number;
  onDurationChange: (d: number) => void;
  aspectRatio: string;
  onAspectRatioChange: (ar: string) => void;
  style: VideoStyle;
  onStyleChange: (s: VideoStyle) => void;
  voiceoverEnabled: boolean;
  onVoiceoverChange: (v: boolean) => void;
}

const DURATIONS = [6, 10, 15, 30, 60];
const ASPECT_RATIOS = ["9:16", "16:9", "1:1", "4:5"];
const STYLES: { value: VideoStyle; label: string }[] = [
  { value: "cinematic", label: "Cinematic" },
  { value: "ugc", label: "UGC" },
  { value: "tutorial", label: "Tutorial" },
  { value: "hype", label: "Hype" },
  { value: "minimal", label: "Minimal" },
];

export function VideoToolModeToggle({
  mode,
  onModeChange,
  duration,
  onDurationChange,
  aspectRatio,
  onAspectRatioChange,
  style,
  onStyleChange,
  voiceoverEnabled,
  onVoiceoverChange,
}: VideoToolModeToggleProps) {
  return (
    <div className="space-y-3 p-3 rounded-lg border border-border bg-card">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Video Mode
      </span>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => onModeChange("product-to-promo")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            mode === "product-to-promo"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clapperboard className="h-3.5 w-3.5" /> Product-to-Promo
        </button>
        <button
          onClick={() => onModeChange("reference")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            mode === "reference"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Film className="h-3.5 w-3.5" /> Reference
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {mode === "product-to-promo"
          ? "Auto-generates script, captions & hashtags from your product data."
          : "Uses product context as creative reference without forcing promo format."}
      </p>

      {/* Promo-specific controls */}
      {mode === "product-to-promo" && (
        <div className="space-y-3 pt-1">
          {/* Duration */}
          <div className="space-y-1">
            <Label className="text-xs">Duration</Label>
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map((d) => (
                <Badge
                  key={d}
                  variant={duration === d ? "default" : "outline"}
                  className="cursor-pointer text-[11px] px-2 py-0.5"
                  onClick={() => onDurationChange(d)}
                >
                  {d}s
                </Badge>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1">
            <Label className="text-xs">Aspect Ratio</Label>
            <div className="flex flex-wrap gap-1.5">
              {ASPECT_RATIOS.map((ar) => (
                <Badge
                  key={ar}
                  variant={aspectRatio === ar ? "default" : "outline"}
                  className="cursor-pointer text-[11px] px-2 py-0.5"
                  onClick={() => onAspectRatioChange(ar)}
                >
                  {ar}
                </Badge>
              ))}
            </div>
          </div>

          {/* Style preset */}
          <div className="space-y-1">
            <Label className="text-xs">Style</Label>
            <Select value={style} onValueChange={(v) => onStyleChange(v as VideoStyle)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voiceover */}
          <div className="flex items-center justify-between">
            <Label htmlFor="voiceover" className="text-xs cursor-pointer">
              AI Voiceover
            </Label>
            <Switch
              id="voiceover"
              checked={voiceoverEnabled}
              onCheckedChange={onVoiceoverChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
