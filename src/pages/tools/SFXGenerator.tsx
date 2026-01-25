import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
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
import { useCredits } from "@/hooks/useCredits";
import { OutOfCreditsDialog } from "@/components/tools/OutOfCreditsDialog";

export default function SFXGenerator() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState<{ audio_url: string; filename: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOutOfCredits, setShowOutOfCredits] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isGeneratingRef = useRef(false); // Guard against double-clicks
  
  const { deductCredit, creditBalance, canUseTool } = useCredits();

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt first");
      return;
    }

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
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    // CRITICAL: Guard against double-clicks using ref (state updates are async)
    if (isGeneratingRef.current) {
      console.log("Generation already in progress, ignoring duplicate click");
      return;
    }

    // Check if user can use this pro tool - show dialog instead of toast
    if (!canUseTool("sfx-generator")) {
      setShowOutOfCredits(true);
      return;
    }

    // Lock immediately with ref before async operations
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setResult(null);

    try {
      // Deduct credit FIRST before processing
      const deductResult = await deductCredit("sfx-generator");
      if (!deductResult.success) {
        toast.error(deductResult.error || "Failed to deduct credit");
        setIsGenerating(false);
        isGeneratingRef.current = false;
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-sfx", {
        body: { prompt: prompt.trim(), duration },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult({
        audio_url: data.audio_url,
        filename: data.filename,
      });
      toast.success("Sound effect generated!");
    } catch (err) {
      console.error("Generation error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to generate sound effect");
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async () => {
    if (!result) return;

    try {
      const response = await fetch(result.audio_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download audio");
    }
  };

  const handleReset = () => {
    setResult(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
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
    "Add reverb",
    "Make it fade out",
    "More bass",
    "Shorter burst",
    "Echo effect",
    "Underwater",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold">SFX Generator</h2>
          <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
            AI
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Create professional-grade sound effects from text descriptions. Perfect for games, films, and digital content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-6 space-y-6 bg-card/50">
          <div>
            <label className="text-sm font-medium mb-2 block">Prompt</label>
            <div className="relative">
              <Textarea
                placeholder="Describe the sound effect you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none pr-4 pb-14"
                disabled={isGenerating}
              />
              
              {/* AI Enhance Button - Inside textarea */}
              <button
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim() || isGenerating}
                className="absolute bottom-3 right-3 group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white text-xs font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100 overflow-hidden"
              >
                {/* Animated background shimmer */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                
                {/* Pulsing glow effect */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 opacity-0 group-hover:opacity-40 blur-sm transition-opacity duration-300" />
                
                {isEnhancing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin relative z-10" />
                    <span className="relative z-10">Enhancing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="relative z-10">AI Enhance</span>
                    
                    {/* Sparkle particle animation */}
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-75" />
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-yellow-200 rounded-full" />
                  </>
                )}
              </button>
            </div>
            
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {promptSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt((prev) => prev ? `${prev}, ${suggestion.toLowerCase()}` : suggestion)}
                  disabled={isGenerating}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Lightbulb className="w-2.5 h-2.5" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Duration</label>
              <span className="text-sm text-muted-foreground">{duration}s</span>
            </div>
            <Slider
              value={[duration]}
              onValueChange={([val]) => setDuration(val)}
              min={1}
              max={30}
              step={1}
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground mt-1">1-30 seconds</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
            {result && (
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Example Prompts */}
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">
              Example prompts
            </label>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  disabled={isGenerating}
                  className="text-xs px-2 py-1 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {example.slice(0, 40)}...
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Result Section */}
        <Card className="p-6 bg-card/50 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Result</h3>
            {result ? (
              <Badge variant="outline" className="text-primary border-primary/30">
                Ready
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                {isGenerating ? "Generating..." : "Idle"}
              </Badge>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
            {isGenerating ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Generating sound effect...</p>
                  <p className="text-xs text-muted-foreground">This may take 10-30 seconds</p>
                </div>
              </div>
            ) : result ? (
              <div className="w-full space-y-6">
                {/* Waveform Visualization */}
                <SFXWaveform
                  audioUrl={result.audio_url}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  audioRef={audioRef}
                />

                {/* Download Button */}
                <div className="flex justify-center">
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                {/* Hidden Audio Element */}
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
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
                  <Volume2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No sound generated yet</p>
                  <p className="text-xs text-muted-foreground">
                    Enter a prompt and click Generate
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Cost info */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              ~$0.10 per generation
            </p>
          </div>
        </Card>
      </div>

      {/* Out of Credits Dialog */}
      <OutOfCreditsDialog 
        open={showOutOfCredits} 
        onOpenChange={setShowOutOfCredits} 
      />
    </div>
  );
}
