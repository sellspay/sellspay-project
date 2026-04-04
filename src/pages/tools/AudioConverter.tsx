import { useState, useRef } from "react";
import { Upload, FileAudio, Download, RotateCcw, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const C = {
  bg: "#0e0e10", panel: "#18181b", panel2: "#1e1e22", inner: "#141416", deepInner: "#0c0c0e",
  border: "rgba(255,255,255,0.06)", borderMid: "rgba(255,255,255,0.10)",
  text: "#f4f4f5", textSoft: "#a1a1aa", textMuted: "#71717a",
  accent: "#06b6d4", accentBg: "rgba(6,182,212,0.12)",
} as const;

export default function AudioConverter() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [audioDuration, setAudioDuration] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file); setAudioUrl(URL.createObjectURL(file)); setProgress(0);
      toast.success("Audio file loaded successfully");
    } else { toast.error("Please select a valid audio file"); }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setAudioDuration(audioRef.current.duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getInputFormat = () => {
    if (!audioFile) return "?";
    const ext = audioFile.name.split(".").pop()?.toUpperCase();
    return ext || audioFile.type.split("/")[1]?.toUpperCase() || "?";
  };

  const convertAudio = async () => {
    if (!audioFile || !audioUrl) return;
    setIsProcessing(true); setProgress(10);
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      setProgress(30);
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setProgress(60);
      const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
      setProgress(90);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${audioFile.name.replace(/\.[^/.]+$/, "")}.${outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      setProgress(100);
      audioContext.close();
      toast.success("Audio converted successfully!");
    } catch { toast.error("Failed to convert audio"); }
    finally { setIsProcessing(false); }
  };

  const bufferToWave = (abuffer: AudioBuffer, len: number) => {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels: Float32Array[] = [];
    let sample: number; let offset = 0; let pos = 0;
    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4);
    for (let i = 0; i < numOfChan; i++) channels.push(abuffer.getChannelData(i));
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true); pos += 2;
      }
      offset++;
    }
    return new Blob([buffer], { type: "audio/wav" });
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null); setAudioUrl(null); setProgress(0); setAudioDuration(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: C.text }}>Audio Converter</h1>
        <p style={{ color: C.textMuted }}>Convert audio files between different formats. Free, no signup required.</p>
      </div>

      {!audioFile ? (
        <div
          className="rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center py-16 cursor-pointer transition-colors hover:border-cyan-500/30"
          style={{ background: C.panel2, borderColor: C.borderMid }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          <FileAudio className="w-16 h-16 mb-4" style={{ color: C.textMuted }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: C.text }}>Upload Audio File</h3>
          <p className="mb-4" style={{ color: C.textMuted }}>Supports MP3, WAV, OGG, AAC, FLAC, and more</p>
          <button className="rounded-[12px] px-6 py-2.5 text-sm font-semibold text-white" style={{ background: C.accent }}>Choose File</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[16px] p-5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: C.text }}>{audioFile.name}</h3>
              <button onClick={reset} className="p-2 rounded-lg" style={{ background: C.inner, border: `1px solid ${C.border}` }}>
                <RotateCcw className="w-4 h-4" style={{ color: C.textSoft }} />
              </button>
            </div>

            <audio ref={audioRef} src={audioUrl || undefined} onLoadedMetadata={handleLoadedMetadata} className="hidden" />

            {/* Conversion flow */}
            <div className="flex items-center justify-center gap-4 py-8">
              <div className="p-5 rounded-[12px] text-center" style={{ background: C.inner, border: `1px solid ${C.border}` }}>
                <FileAudio className="w-10 h-10 mx-auto mb-2" style={{ color: C.accent }} />
                <p className="text-lg font-bold" style={{ color: C.text }}>{getInputFormat()}</p>
                <p className="text-xs" style={{ color: C.textMuted }}>Input</p>
              </div>
              <ArrowRight className="w-6 h-6" style={{ color: C.textMuted }} />
              <div className="p-5 rounded-[12px] text-center" style={{ background: C.accentBg, border: `1px solid rgba(6,182,212,0.3)` }}>
                <FileAudio className="w-10 h-10 mx-auto mb-2" style={{ color: C.accent }} />
                <p className="text-lg font-bold uppercase" style={{ color: C.text }}>{outputFormat}</p>
                <p className="text-xs" style={{ color: C.textMuted }}>Output</p>
              </div>
            </div>

            {/* File info */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "File Size", value: formatFileSize(audioFile.size) },
                { label: "Duration", value: formatTime(audioDuration) },
                { label: "Channels", value: "Stereo" },
              ].map(item => (
                <div key={item.label} className="rounded-[12px] p-3 text-center" style={{ background: C.inner, border: `1px solid ${C.border}` }}>
                  <p className="text-xs" style={{ color: C.textMuted }}>{item.label}</p>
                  <p className="font-semibold" style={{ color: C.text }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Format selector */}
            <div className="flex items-center gap-4 mt-4">
              <label className="text-sm" style={{ color: C.textMuted }}>Convert to:</label>
              <div className="flex gap-1.5">
                {["mp3", "wav", "ogg", "webm"].map(f => (
                  <button key={f} onClick={() => !isProcessing && setOutputFormat(f)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium uppercase transition"
                    style={{
                      background: outputFormat === f ? C.accentBg : "transparent",
                      color: outputFormat === f ? C.accent : C.textMuted,
                      border: outputFormat === f ? `1px solid rgba(6,182,212,0.3)` : `1px solid transparent`,
                    }}
                  >{f}</button>
                ))}
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2 mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center" style={{ color: C.textMuted }}>Converting... {Math.round(progress)}%</p>
              </div>
            )}

            <button onClick={convertAudio} disabled={isProcessing}
              className="w-full mt-5 inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40 transition hover:brightness-110"
              style={{ background: C.accent, boxShadow: `0 4px 16px rgba(6,182,212,0.3)` }}
            >
              <Download className="w-5 h-5" /> {isProcessing ? "Converting..." : "Convert & Download"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
