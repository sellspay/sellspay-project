import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Sparkles, 
  Download, 
  RotateCcw, 
  Volume2, 
  Wand2,
  Lightbulb
} from "lucide-react";
import { SFXWaveform } from "@/components/tools/SFXWaveform";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { useAuth } from "@/lib/auth";
import { dispatchAuthGate } from "@/utils/authGateEvent";
import { saveToolAsset } from "@/utils/saveToolAsset";

const C = {
  bg: "#0e0e10",
  panel: "#18181b",
  panel2: "#1e1e22",
  inner: "#141416",
  deepInner: "#0c0c0e",
  border: "rgba(255,255,255,0.06)",
  borderMid: "rgba(255,255,255,0.10)",
  text: "#f4f4f5",
  textSoft: "#a1a1aa",
  textMuted: "#71717a",
  accent: "#06b6d4",
  accentBg: "rgba(6,182,212,0.12)",
} as const;

export default function SFXGenerator() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState<{ audio_url: string; filename: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOutOfCredits, setShowOutOfCredits] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isGeneratingRef = useRef(false);
  
  const { deductCredits, credits: creditBalance, canUseFeature } = useSubscription();
  const { user } = useAuth();

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt first"); return; }
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-sfx-prompt", {
        body: { prompt: prompt.trim() },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setPrompt(data.enhanced_prompt);
      toast.success("Prompt enhanced with AI!");
    } catch (err) {
      console.error("Enhancement error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to enhance prompt");
    } finally { setIsEnhancing(false); }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (isGeneratingRef.current) return;
    if (!user) { dispatchAuthGate(); return; }
    if (!canUseFeature("sfx-generator")) { setShowOutOfCredits(true); return; }
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-sfx", {
        body: { prompt: prompt.trim(), duration },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      const deductResult = await deductCredits("sfx_gen");
      if (!deductResult.success) console.warn("Credit deduction failed:", deductResult.error);
      setResult({ audio_url: data.audio_url, filename: data.filename });
      toast.success("Sound effect generated!");
      saveToolAsset({ userId: user!.id, type: "audio", storageUrl: data.audio_url, filename: data.filename || `sfx-${Date.now()}.wav`, metadata: { prompt: prompt.trim(), duration } as any });
    } catch (err) {
      console.error("Generation error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to generate sound effect");
    } finally { setIsGenerating(false); isGeneratingRef.current = false; }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const response = await fetch(result.audio_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = result.filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch { toast.error("Failed to download audio"); }
  };

  const handleReset = () => {
    setResult(null);
    setIsPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  };

  const examplePrompts = [
    "Powerful helicopter takeoff: rapidly building rotor blades whirring and chopping",
    "Magical spell casting with sparkles and whooshing energy",
    "Retro 8-bit video game jump sound with coin collect",
    "Thunder rumbling in the distance with light rain",
    "Sci-fi laser gun firing with electronic charge-up",
    "Creaky wooden door opening slowly in a haunted house",
  ];

  const promptSuggestions = [
    "Add reverb", "Make it fade out", "More bass",
    "Shorter burst", "Echo effect", "Underwater",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold" style={{ color: C.text }}>SFX Generator</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">AI</span>
        </div>
        <p style={{ color: C.textMuted }}>
          Create professional-grade sound effects from text descriptions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Section */}
        <div className="rounded-[16px] p-5 space-y-5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: C.text }}>Prompt</label>
            <div className="relative">
              <Textarea
                placeholder="Describe the sound effect you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none pr-4 pb-14 rounded-[12px] bg-[#0c0c0e] border-white/[0.08] text-white placeholder:text-zinc-500 focus:border-cyan-500/40"
                disabled={isGenerating}
              />
              
              <button
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim() || isGenerating}
                className="absolute bottom-3 right-3 group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white text-xs font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                {isEnhancing ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enhancing...</>
                ) : (
                  <><Wand2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" /> AI Enhance</>
                )}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mt-2">
              {promptSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt((prev) => prev ? `${prev}, ${suggestion.toLowerCase()}` : suggestion)}
                  disabled={isGenerating}
                  className="text-[10px] px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 flex items-center gap-1"
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textSoft }}
                >
                  <Lightbulb className="w-2.5 h-2.5" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: C.text }}>Duration</label>
              <span className="text-sm" style={{ color: C.textMuted }}>{duration}s</span>
            </div>
            <Slider
              value={[duration]}
              onValueChange={([val]) => setDuration(val)}
              min={1} max={30} step={1}
              disabled={isGenerating}
            />
            <p className="text-xs mt-1" style={{ color: C.textMuted }}>1-30 seconds</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 transition hover:brightness-110"
              style={{ background: C.accent, boxShadow: `0 4px 16px rgba(6,182,212,0.3)` }}
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate</>
              )}
            </button>
            {result && (
              <button
                onClick={handleReset}
                className="rounded-[12px] px-3 py-2.5 transition hover:brightness-110"
                style={{ background: C.inner, border: `1px solid ${C.borderMid}`, color: C.textSoft }}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Example Prompts */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: C.textMuted }}>Example prompts</label>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  disabled={isGenerating}
                  className="text-xs px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textMuted }}
                >
                  {example.slice(0, 40)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="rounded-[16px] p-5 flex flex-col" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: C.text }}>Result</h3>
            <span className="text-xs px-2 py-0.5 rounded-full border" style={{
              color: result ? C.accent : C.textMuted,
              border: `1px solid ${result ? 'rgba(6,182,212,0.3)' : C.border}`,
              background: result ? C.accentBg : 'transparent',
            }}>
              {result ? "Ready" : isGenerating ? "Generating..." : "Idle"}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
            {isGenerating ? (
              <div className="text-center space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                  <span className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
                  <span className="absolute inset-2 rounded-full border-2 border-cyan-500/40 animate-ping [animation-delay:0.2s]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${C.accent}, #8b5cf6)` }}>
                      <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-base font-semibold" style={{ color: C.accent }}>Generating sound effect...</p>
                  <p className="text-sm" style={{ color: C.textMuted }}>This may take 10-30 seconds</p>
                </div>
              </div>
            ) : result ? (
              <div className="w-full space-y-6">
                <SFXWaveform
                  audioUrl={result.audio_url}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  audioRef={audioRef}
                />
                <div className="flex justify-center">
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 rounded-[12px] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                    style={{ background: C.accent }}
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
                <audio
                  ref={audioRef}
                  src={result.audio_url}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                />
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: C.inner, border: `1px solid ${C.border}` }}>
                  <Volume2 className="w-8 h-8" style={{ color: C.textMuted }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: C.textSoft }}>No sound generated yet</p>
                  <p className="text-xs" style={{ color: C.textMuted }}>Enter a prompt and click Generate</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-xs text-center" style={{ color: C.textMuted }}>~$0.10 per generation</p>
          </div>
        </div>
      </div>

      <UpgradeModal open={showOutOfCredits} onOpenChange={setShowOutOfCredits} />
    </div>
  );
}
