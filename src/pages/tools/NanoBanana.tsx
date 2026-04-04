import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Download,
  Wand2,
  Image as ImageIcon,
  Upload,
  Sparkles,
  SlidersHorizontal,
  Minus,
  Plus,
  CopyPlus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { uiSurfaces } from "@/components/tools/uiSurfaces";

type Mode = "create" | "variations";
type SelectOption = {
  value: string;
  label: string;
  hint?: string;
};

const MODEL_OPTIONS: SelectOption[] = [
  { value: "nano-banana-2", label: "Nano Banana 2", hint: "Fast + high quality" },
  { value: "nano-banana", label: "Nano Banana", hint: "Balanced image model" },
  { value: "nano-banana-pro", label: "Nano Banana Pro", hint: "Highest quality" },
  { value: "flux-pro", label: "Flux Pro", hint: "Polished renders" },
  { value: "recraft-v3", label: "Recraft V3", hint: "Graphic / vector leaning" },
  { value: "sdxl-turbo", label: "SDXL Turbo", hint: "Fast drafts" },
  { value: "juggernaut-flux", label: "Juggernaut Flux", hint: "Stylized realism" },
  { value: "photo-real-v2", label: "Photo Real v2", hint: "Photoreal outputs" },
  { value: "anime-xl", label: "Anime XL", hint: "Illustration / anime" },
  { value: "product-shot-pro", label: "Product Shot Pro", hint: "Ecommerce visuals" },
  { value: "editorial-fashion", label: "Editorial Fashion", hint: "Luxury moodboards" },
  { value: "cinematic-scene", label: "Cinematic Scene", hint: "Film-style compositions" },
];

const OUTPUT_OPTIONS: SelectOption[] = [
  { value: "1:1-1024", label: "1:1 | 1024", hint: "Square" },
  { value: "4:3-1k", label: "4:3 | 1K", hint: "Landscape" },
  { value: "16:9-1k", label: "16:9 | 1K", hint: "Wide" },
  { value: "9:16-1k", label: "9:16 | 1K", hint: "Vertical" },
];

export default function NanoBanana() {
  const [mode, setMode] = useState<Mode>("create");
  const [model, setModel] = useState("nano-banana-2");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("4:3-1k");
  const [count, setCount] = useState(1);
  const [creativity, setCreativity] = useState(70);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { deductCredits, credits: creditBalance } = useSubscription();

  const currentModel = useMemo(
    () => MODEL_OPTIONS.find((option) => option.value === model) ?? MODEL_OPTIONS[0],
    [model]
  );

  const canvasTitle = useMemo(
    () => (mode === "create" ? "Prompt-first image creation" : "Upload-first variation workflow"),
    [mode]
  );

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (creditBalance < 1) {
      toast.error("Insufficient credits. Please top up.");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const deductResult = await deductCredits("vibecoder_gen");
      if (!deductResult.success) {
        toast.error("Failed to deduct credit");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt: prompt.trim(),
          model,
        },
      });

      if (error) throw error;

      if (data?.image_url) {
        setGeneratedImage(data.image_url);
        toast.success(`${currentModel.label} finished generating.`);
      } else {
        throw new Error("No image returned");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-generator-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch {
      toast.error("Failed to download image");
    }
  };

  return (
    <div className="h-full overflow-hidden px-4 py-4">
      <div className="grid h-full min-h-0 grid-cols-[390px_minmax(0,1fr)] gap-4">
        <aside className={`min-h-0 overflow-hidden ${uiSurfaces.toolPanel}`}>
          <div className="flex h-full flex-col">
            <div className="px-6 pb-4 pt-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Image Generator</h1>
                  <p className="text-sm text-slate-500">
                    {mode === "create" ? "Create Image mode" : "Image Variations mode"}
                  </p>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-3">
                <ModeTabs mode={mode} setMode={setMode} />

                <SelectCard
                  label="Model"
                  value={model}
                  options={MODEL_OPTIONS}
                  onChange={setModel}
                />

                {mode === "variations" && (
                  <SectionCard title="Start with an image" subtitle="Upload a reference, then generate new versions.">
                    <UploadDropzone
                      title="Upload or choose an image"
                      subtitle="Click or drag to upload · JPEG / PNG / WEBP"
                    />
                  </SectionCard>
                )}

                <SectionCard
                  title={mode === "create" ? "Describe your image" : "Describe your variation"}
                  rightIcon={<CopyPlus className="h-4 w-4 text-slate-500" />}
                >
                  {mode === "create" && <ReferenceBox />}

                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder={
                      mode === "create"
                        ? 'Example: "Luxury skincare bottle on wet stone, soft studio light, premium ecommerce photo"'
                        : 'Example: "Keep the subject, but make it sunset with cinematic lighting and richer color"'
                    }
                    className={`mt-3 min-h-[150px] w-full resize-none px-4 py-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 ${uiSurfaces.input}`}
                    disabled={isGenerating}
                  />

                  <div className="mt-1.5 text-right text-xs text-slate-400">{prompt.length}/500</div>

                  {mode === "variations" && (
                    <button className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900">
                      <Sparkles className="h-4 w-4" />
                      Prompt from Image
                    </button>
                  )}
                </SectionCard>

                {mode === "variations" && (
                  <SectionCard
                    title="Creativity level"
                    rightIcon={<span className="text-xs text-slate-500">{creativity}%</span>}
                  >
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={creativity}
                      onChange={(event) => setCreativity(Number(event.target.value))}
                      className="mt-3 w-full accent-primary"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Closer to original</span>
                      <span>More different</span>
                    </div>
                  </SectionCard>
                )}

                <SelectCard
                  label="Output"
                  value={output}
                  options={OUTPUT_OPTIONS}
                  onChange={setOutput}
                  icon={<SlidersHorizontal className="h-4 w-4 text-slate-500" />}
                />

                <div className="grid grid-cols-[122px_minmax(0,1fr)] gap-3">
                  <CountStepper count={count} setCount={setCount} />
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-amber-500 to-orange-500 px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(245,158,11,0.24)] transition hover:translate-y-[-1px] hover:shadow-[0_14px_28px_rgba(245,158,11,0.30)] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Generate (1 Credit)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-[#cde0eb] bg-[#dfedf5] px-4 py-3">
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Current model: {currentModel.label}
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 overflow-hidden rounded-[28px] border border-[#d6eaf2] bg-gradient-to-br from-[#e8f6fb] to-[#dff1f7] shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="flex h-full flex-col bg-gradient-to-br from-[#f4fbff] to-[#eaf6fb]">
            <div className="border-b border-[#d8e8f0] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button className="rounded-full border border-[#d7e7ef] bg-white/80 px-4 py-2 text-sm font-medium text-slate-700">
                    Creations
                  </button>
                  <button className="px-3 py-2 text-sm text-slate-500 transition-colors hover:text-slate-700">
                    Collections
                  </button>
                  <button className="px-3 py-2 text-sm text-slate-500 transition-colors hover:text-slate-700">
                    Templates
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="px-6 py-6">
                {generatedImage ? (
                  <div className="space-y-4">
                    <div className={`overflow-hidden p-1 ${uiSurfaces.section}`}>
                      <img src={generatedImage} alt="Generated result" className="h-auto w-full rounded-[16px]" />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleDownload} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`p-6 ${uiSurfaces.toolPanel}`}>
                      <h2 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                        AI Image Generator
                      </h2>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {MODEL_OPTIONS.slice(0, 6).map((option) => (
                          <span
                            key={option.value}
                            className={`px-3 py-1 text-xs font-medium text-slate-700 ${uiSurfaces.chip}`}
                          >
                            {option.label}
                          </span>
                        ))}
                      </div>

                      <p className="mt-4 max-w-3xl text-lg text-slate-600">
                        {canvasTitle}. Use {currentModel.label} to generate polished images inside one dedicated tool instead of hunting for a single model card.
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <CanvasPreviewCard />
                      <CanvasPreviewCard featured />
                      <CanvasPreviewCard />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ModeTabs({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (mode: Mode) => void;
}) {
  return (
    <div className={`grid grid-cols-2 gap-3 p-2 ${uiSurfaces.section}`}>
      {(["create", "variations"] as const).map((entry) => (
        <button
          key={entry}
          onClick={() => setMode(entry)}
          className={`rounded-[16px] px-4 py-4 text-center text-sm font-semibold transition ${
            mode === entry
              ? "bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-[0_10px_24px_rgba(245,158,11,0.25)]"
              : "bg-[#eef6fb] text-slate-700 hover:bg-[#e3eef6]"
          }`}
        >
          {entry === "create" ? "Create Image" : "Image Variations"}
        </button>
      ))}
    </div>
  );
}

function SelectCard({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}) {
  const activeOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className={`p-4 ${uiSurfaces.section}`}>
      <div className="mb-2 text-sm text-slate-500">{label}</div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={`h-auto px-4 py-4 focus:ring-0 focus:ring-offset-0 ${uiSurfaces.input}`}>
          <div className="flex items-center gap-3 text-left">
            {icon ?? <Wand2 className="h-4 w-4 text-slate-500" />}
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900">{activeOption.label}</span>
              {activeOption.hint ? (
                <span className="text-xs text-slate-500">{activeOption.hint}</span>
              ) : null}
            </div>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-80 rounded-xl">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="py-3">
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                {option.hint ? (
                  <span className="text-xs text-muted-foreground">{option.hint}</span>
                ) : null}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  rightIcon,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightIcon?: React.ReactNode;
}) {
  return (
    <div className={`p-4 ${uiSurfaces.section}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {rightIcon}
      </div>
      {children}
    </div>
  );
}

function ReferenceBox() {
  return (
    <div className="mt-3 rounded-[18px] border border-amber-300/60 bg-gradient-to-b from-amber-50/40 to-orange-50/30 p-[1px] shadow-[0_0_0_1px_rgba(245,158,11,0.15)]">
      <div
        className={`rounded-[17px] px-4 py-3 ${uiSurfaces.input.replace("shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]", "")}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[0, 1, 2].map((index) => (
                <div key={index} className="h-9 w-9 rounded-lg border border-[#c6ddea] bg-[#dcecf7]" />
              ))}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Add visual references</div>
              <div className="text-xs text-slate-500">JPEG / PNG / WEBP / GIF, 20 MB max</div>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold text-slate-700 ${uiSurfaces.chip}`}>
            0/14
          </span>
        </div>
      </div>
    </div>
  );
}

function UploadDropzone({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className={`mt-4 flex flex-col items-center justify-center px-6 py-10 text-center ${uiSurfaces.dropzone}`}>
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${uiSurfaces.chip}`}>
        <Upload className="h-6 w-6 text-slate-600" />
      </div>
      <div className="mt-4 text-lg font-semibold text-slate-900">{title}</div>
      <div className="mt-1 max-w-sm text-sm text-slate-500">{subtitle}</div>
    </div>
  );
}

function CountStepper({
  count,
  setCount,
}: {
  count: number;
  setCount: (count: number) => void;
}) {
  return (
    <div className={`flex h-12 items-center justify-between px-4 ${uiSurfaces.input}`}>
      <button onClick={() => setCount(Math.max(1, count - 1))} type="button">
        <Minus className="h-4 w-4 text-slate-700" />
      </button>
      <span className="text-sm font-semibold text-slate-900">{count}/4</span>
      <button onClick={() => setCount(Math.min(4, count + 1))} type="button">
        <Plus className="h-4 w-4 text-slate-700" />
      </button>
    </div>
  );
}

function CanvasPreviewCard({ featured = false }: { featured?: boolean }) {
  return (
    <div className={`h-[320px] overflow-hidden ${uiSurfaces.sectionAlt} ${featured ? "" : "opacity-70"}`}>
      <div
        className={`flex h-full w-full items-center justify-center ${
          featured
            ? "bg-gradient-to-b from-amber-200/60 via-orange-200/40 to-[#eef7fb]"
            : "bg-gradient-to-b from-[#dcecf7] via-[#cfe6f1] to-[#eef7fb]"
        }`}
      >
        <ImageIcon className={`h-12 w-12 ${featured ? "text-amber-400/60" : "text-slate-300"}`} />
      </div>
    </div>
  );
}
