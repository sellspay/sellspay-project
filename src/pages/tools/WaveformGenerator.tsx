import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Download, RotateCcw, Palette } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

type WaveformStyle = "bars" | "line" | "mirror";

const C = {
  bg: "#0e0e10", panel: "#18181b", panel2: "#1e1e22", inner: "#141416", deepInner: "#0c0c0e",
  border: "rgba(255,255,255,0.06)", borderMid: "rgba(255,255,255,0.10)",
  text: "#f4f4f5", textSoft: "#a1a1aa", textMuted: "#71717a",
  accent: "#06b6d4", accentBg: "rgba(6,182,212,0.12)",
} as const;

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
      setAudioFile(file); setAudioUrl(URL.createObjectURL(file));
      await processAudioFile(file);
      toast.success("Audio file loaded successfully");
    } else { toast.error("Please select a valid audio file"); }
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
        for (let j = 0; j < blockSize; j++) sum += Math.abs(rawData[i * blockSize + j]);
        filteredData.push(sum / blockSize);
      }
      const maxValue = Math.max(...filteredData);
      setAudioData(filteredData.map(v => v / maxValue));
      audioContext.close();
    } catch { toast.error("Failed to process audio file"); }
  };

  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || audioData.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const preset = colorPresets[colorPreset];
    const canvasWidth = 800; const canvasHeight = height[0];
    canvas.width = canvasWidth; canvas.height = canvasHeight;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
    gradient.addColorStop(0, preset.start); gradient.addColorStop(1, preset.end);

    if (waveformStyle === "bars") {
      const totalBarWidth = barWidth[0] + barGap[0];
      const numBars = Math.floor(canvasWidth / totalBarWidth);
      const samplesPerBar = Math.floor(audioData.length / numBars);
      for (let i = 0; i < numBars; i++) {
        let sum = 0;
        for (let j = 0; j < samplesPerBar; j++) { const idx = i * samplesPerBar + j; if (idx < audioData.length) sum += audioData[idx]; }
        const avg = sum / samplesPerBar;
        const bh = avg * canvasHeight * 0.9;
        ctx.fillStyle = gradient;
        ctx.fillRect(i * totalBarWidth, (canvasHeight - bh) / 2, barWidth[0], bh);
      }
    } else if (waveformStyle === "line") {
      ctx.beginPath(); ctx.strokeStyle = gradient; ctx.lineWidth = 2;
      const step = canvasWidth / audioData.length;
      const midY = canvasHeight / 2;
      for (let i = 0; i < audioData.length; i++) {
        const x = i * step;
        const y = midY + (audioData[i] * midY * 0.9 * (i % 2 === 0 ? 1 : -1));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (waveformStyle === "mirror") {
      const totalBarWidth = barWidth[0] + barGap[0];
      const numBars = Math.floor(canvasWidth / totalBarWidth);
      const samplesPerBar = Math.floor(audioData.length / numBars);
      const midY = canvasHeight / 2;
      for (let i = 0; i < numBars; i++) {
        let sum = 0;
        for (let j = 0; j < samplesPerBar; j++) { const idx = i * samplesPerBar + j; if (idx < audioData.length) sum += audioData[idx]; }
        const avg = sum / samplesPerBar;
        const bh = avg * midY * 0.9;
        ctx.fillStyle = gradient;
        ctx.fillRect(i * totalBarWidth, midY - bh, barWidth[0], bh);
        ctx.fillRect(i * totalBarWidth, midY, barWidth[0], bh);
      }
    }
  }, [audioData, waveformStyle, colorPreset, barWidth, barGap, height]);

  useEffect(() => { drawWaveform(); }, [drawWaveform]);

  const downloadWaveform = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `waveform_${audioFile?.name || "audio"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("Waveform downloaded!");
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null); setAudioUrl(null); setAudioData([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: C.text }}>Waveform Generator</h1>
        <p style={{ color: C.textMuted }}>Generate beautiful visual waveforms from your audio files.</p>
      </div>

      {!audioFile ? (
        <div
          className="rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center py-16 cursor-pointer transition-colors hover:border-cyan-500/30"
          style={{ background: C.panel2, borderColor: C.borderMid }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          <Upload className="w-16 h-16 mb-4" style={{ color: C.textMuted }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: C.text }}>Upload Audio File</h3>
          <p className="mb-4" style={{ color: C.textMuted }}>Supports MP3, WAV, OGG, and more</p>
          <button className="rounded-[12px] px-6 py-2.5 text-sm font-semibold text-white" style={{ background: C.accent }}>Choose File</button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="rounded-[16px] p-5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: C.text }}>{audioFile.name}</h3>
              <button onClick={reset} className="p-2 rounded-lg" style={{ background: C.inner, border: `1px solid ${C.border}` }}>
                <RotateCcw className="w-4 h-4" style={{ color: C.textSoft }} />
              </button>
            </div>
            <div className="rounded-[12px] p-4 overflow-hidden" style={{ background: C.deepInner }}>
              <canvas ref={canvasRef} className="w-full" style={{ height: `${height[0]}px` }} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Style */}
            <div className="rounded-[16px] p-5 space-y-5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
              <h3 className="font-semibold" style={{ color: C.text }}>Style</h3>
              <div>
                <label className="text-sm mb-2 block" style={{ color: C.textMuted }}>Waveform Style</label>
                <div className="flex gap-1.5">
                  {(["bars", "line", "mirror"] as const).map(s => (
                    <button key={s} onClick={() => setWaveformStyle(s)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition"
                      style={{
                        background: waveformStyle === s ? C.accentBg : "transparent",
                        color: waveformStyle === s ? C.accent : C.textMuted,
                        border: waveformStyle === s ? `1px solid rgba(6,182,212,0.3)` : `1px solid transparent`,
                      }}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm mb-3 block" style={{ color: C.textMuted }}>Color Preset</label>
                <div className="grid grid-cols-3 gap-2">
                  {colorPresets.map((preset, idx) => (
                    <button key={preset.name} onClick={() => setColorPreset(idx)}
                      className="p-2 rounded-lg transition-all"
                      style={{ border: colorPreset === idx ? `2px solid ${C.accent}` : `2px solid transparent`, background: C.inner }}
                    >
                      <div className="h-5 rounded" style={{ background: `linear-gradient(90deg, ${preset.start}, ${preset.end})` }} />
                      <p className="text-[10px] mt-1" style={{ color: C.textMuted }}>{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="rounded-[16px] p-5 space-y-5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
              <h3 className="font-semibold" style={{ color: C.text }}>Dimensions</h3>
              {[
                { label: "Bar Width", value: barWidth, setter: setBarWidth, min: 1, max: 10 },
                { label: "Bar Gap", value: barGap, setter: setBarGap, min: 0, max: 10 },
                { label: "Height", value: height, setter: setHeight, min: 100, max: 400, step: 10 },
              ].map(item => (
                <div key={item.label}>
                  <label className="text-sm mb-2 block" style={{ color: C.textMuted }}>{item.label}: {item.value[0]}px</label>
                  <Slider value={item.value} onValueChange={item.setter} min={item.min} max={item.max} step={item.step || 1} />
                </div>
              ))}
            </div>
          </div>

          <button onClick={downloadWaveform}
            className="w-full inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            style={{ background: C.accent, boxShadow: `0 4px 16px rgba(6,182,212,0.3)` }}
          >
            <Download className="w-5 h-5" /> Download Waveform Image
          </button>
        </div>
      )}
    </div>
  );
}
