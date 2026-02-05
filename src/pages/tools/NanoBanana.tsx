import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Download, Sparkles, Wand2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import nanoBananaImage from "@/assets/logos/nano-banana.png";

export default function NanoBanana() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { deductCredits, credits: creditBalance } = useSubscription();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (creditBalance < 1) {
      toast.error("Insufficient credits. Please top up to continue.");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Deduct credit first
      const deductResult = await deductCredits("vibecoder_gen");
      if (!deductResult.success) {
        toast.error("Failed to deduct credit");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: prompt.trim() },
      });

      if (error) throw error;

      if (data?.image_url) {
        setGeneratedImage(data.image_url);
        toast.success("Image generated successfully!");
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
      a.download = `nano-banana-${Date.now()}.png`;
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50">
        <img 
          src={nanoBananaImage} 
          alt="Nano Banana" 
          className="w-full h-48 sm:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Nano Banana</h1>
              <p className="text-muted-foreground">Generate anything with AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-4">
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create..."
            className="min-h-[120px] resize-none bg-secondary/30 border-border/50 focus:border-primary/50 pr-4 text-base"
            disabled={isGenerating}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {prompt.length}/500
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Powered by Gemini 2.5 Flash Image
          </p>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate (1 Credit)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Result */}
      {generatedImage ? (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-secondary/20">
            <img 
              src={generatedImage} 
              alt="Generated" 
              className="w-full h-auto"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleDownload} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Image
            </Button>
          </div>
        </div>
      ) : !isGenerating && (
        <div className="border border-dashed border-border/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-secondary/10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ready to create</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Enter a detailed description above and click Generate to create stunning AI-powered images.
          </p>
        </div>
      )}
    </div>
  );
}
