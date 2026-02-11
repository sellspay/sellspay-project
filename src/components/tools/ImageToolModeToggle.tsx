import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Sparkles, RefreshCw } from "lucide-react";

export type ImageToolMode = "enhance" | "regenerate";

interface ImageToolModeToggleProps {
  mode: ImageToolMode;
  onModeChange: (mode: ImageToolMode) => void;
  keepRecognizable: boolean;
  onKeepRecognizableChange: (v: boolean) => void;
  variations: number;
  onVariationsChange: (v: number) => void;
}

export function ImageToolModeToggle({
  mode,
  onModeChange,
  keepRecognizable,
  onKeepRecognizableChange,
  variations,
  onVariationsChange,
}: ImageToolModeToggleProps) {
  return (
    <div className="space-y-3 p-3 rounded-lg border border-border bg-card">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Mode
      </span>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => onModeChange("enhance")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            mode === "enhance"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" /> Enhance
        </button>
        <button
          onClick={() => onModeChange("regenerate")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            mode === "regenerate"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Regenerate
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {mode === "enhance"
          ? "Upscale, sharpen, color correct — make it more premium."
          : "AI describes the image, you edit the description, regenerate with brand kit colors."}
      </p>

      {/* Keep recognizable */}
      <div className="flex items-center justify-between">
        <Label htmlFor="keep-recognizable" className="text-xs cursor-pointer">
          Keep product recognizable
        </Label>
        <Switch
          id="keep-recognizable"
          checked={keepRecognizable}
          onCheckedChange={onKeepRecognizableChange}
        />
      </div>

      {/* Variations slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Variations</Label>
          <span className="text-xs font-medium text-foreground">{variations}</span>
        </div>
        <Slider
          min={1}
          max={4}
          step={1}
          value={[variations]}
          onValueChange={([v]) => onVariationsChange(v)}
        />
      </div>
    </div>
  );
}
