import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Download, RotateCcw, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

type WaveformStyle = "bars" | "line" | "mirror";

const colorPresets = [
  { name: "Purple Gradient", start: "#8B5CF6", end: "#D946EF" },
  { name: "Blue Ocean", start: "#3B82F6", end: "#06B6D4" },
  { name: "Sunset", start: "#F97316", end: "#EC4899" },
  { name: "Forest", start: "#22C55E", end: "#14B8A6" },
  { name: "Monochrome", start: "#FFFFFF", end: "#FFFFFF" },
  { name: "Fire", start: "#EF4444", end: "#F59E0B" },
];

export default function WaveformGenerator() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformStyle, setWaveformStyle] = useState<WaveformStyle>("bars");
  const [colorPreset, setColorPreset] = useState(0);
  const [barWidth, setBarWidth] = useState([3]);
  const [barGap, setBarGap] = useState([2]);
  const [height, setHeight] = useState([200]);
  const [audioData, setAudioData] = useState<number[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      
      // Process audio data
      await processAudioFile(file);
      toast.success("Audio file loaded successfully");
    } else {
      toast.error("Please select a valid audio file");
    }
  };

  const processAudioFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const rawData = audioBuffer.getChannelData(0);
      const samples = 200;
      const blockSize = Math.floor(rawData.length / samples);
      const filteredData: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[i * blockSize + j]);
        }
        filteredData.push(sum / blockSize);
      }
      
      const maxValue = Math.max(...filteredData);
      const normalizedData = filteredData.map(v => v / maxValue);
      setAudioData(normalizedData);
      
      audioContext.close();
    } catch (error) {
      console.error(error);
      toast.error("Failed to process audio file");
    }
  };

  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || audioData.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const preset = colorPresets[colorPreset];
    const canvasWidth = 800;
    const canvasHeight = height[0];
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
    gradient.addColorStop(0, preset.start);
    gradient.addColorStop(1, preset.end);

    if (waveformStyle === "bars") {
      const totalBarWidth = barWidth[0] + barGap[0];
      const numBars = Math.floor(canvasWidth / totalBarWidth);
      const samplesPerBar = Math.floor(audioData.length / numBars);

      for (let i = 0; i < numBars; i++) {
        let sum = 0;
        for (let j = 0; j < samplesPerBar; j++) {
          const idx = i * samplesPerBar + j;
          if (idx < audioData.length) {
            sum += audioData[idx];
          }
        }
        const avg = sum / samplesPerBar;
        const barHeight = avg * canvasHeight * 0.9;
        const x = i * totalBarWidth;
        const y = (canvasHeight - barHeight) / 2;

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth[0], barHeight);
      }
    } else if (waveformStyle === "line") {
      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;

      const step = canvasWidth / audioData.length;
      const midY = canvasHeight / 2;

      for (let i = 0; i < audioData.length; i++) {
        const x = i * step;
        const y = midY + (audioData[i] * midY * 0.9 * (i % 2 === 0 ? 1 : -1));
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    } else if (waveformStyle === "mirror") {
      const totalBarWidth = barWidth[0] + barGap[0];
      const numBars = Math.floor(canvasWidth / totalBarWidth);
      const samplesPerBar = Math.floor(audioData.length / numBars);
      const midY = canvasHeight / 2;

      for (let i = 0; i < numBars; i++) {
        let sum = 0;
        for (let j = 0; j < samplesPerBar; j++) {
          const idx = i * samplesPerBar + j;
          if (idx < audioData.length) {
            sum += audioData[idx];
          }
        }
        const avg = sum / samplesPerBar;
        const barHeight = avg * midY * 0.9;
        const x = i * totalBarWidth;

        ctx.fillStyle = gradient;
        // Top bar
        ctx.fillRect(x, midY - barHeight, barWidth[0], barHeight);
        // Bottom bar (mirror)
        ctx.fillRect(x, midY, barWidth[0], barHeight);
      }
    }
  }, [audioData, waveformStyle, colorPreset, barWidth, barGap, height]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  const downloadWaveform = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement("a");
    link.download = `waveform_${audioFile?.name || "audio"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("Waveform downloaded!");
  };

  const reset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFile(null);
    setAudioUrl(null);
    setAudioData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Waveform Generator</h1>
        <p className="text-muted-foreground">
          Generate beautiful visual waveforms from your audio files. Free, no signup required.
        </p>
      </div>

      {!audioFile ? (
        <Card className="bg-card/50 border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Audio File</h3>
            <p className="text-muted-foreground mb-4">
              Supports MP3, WAV, OGG, and more
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Waveform Preview */}
          <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{audioFile.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={reset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-black/50 rounded-lg p-4 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full"
                  style={{ height: `${height[0]}px` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Style Controls */}
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Waveform Style
                  </label>
                  <Select value={waveformStyle} onValueChange={(v) => setWaveformStyle(v as WaveformStyle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bars">Bars</SelectItem>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="mirror">Mirror</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-3 block">
                    Color Preset
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {colorPresets.map((preset, idx) => (
                      <button
                        key={preset.name}
                        onClick={() => setColorPreset(idx)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          colorPreset === idx ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <div
                          className="h-6 rounded"
                          style={{
                            background: `linear-gradient(90deg, ${preset.start}, ${preset.end})`,
                          }}
                        />
                        <p className="text-xs mt-1 text-muted-foreground">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dimension Controls */}
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Bar Width: {barWidth[0]}px
                  </label>
                  <Slider
                    value={barWidth}
                    onValueChange={setBarWidth}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Bar Gap: {barGap[0]}px
                  </label>
                  <Slider
                    value={barGap}
                    onValueChange={setBarGap}
                    min={0}
                    max={10}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Height: {height[0]}px
                  </label>
                  <Slider
                    value={height}
                    onValueChange={setHeight}
                    min={100}
                    max={400}
                    step={10}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Download Button */}
          <Button
            onClick={downloadWaveform}
            className="w-full bg-gradient-to-r from-primary to-accent"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Waveform Image
          </Button>
        </div>
      )}
    </div>
  );
}
