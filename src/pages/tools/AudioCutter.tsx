import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Play, Pause, Scissors, Download, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const C = {
  bg: "#0e0e10", panel: "#18181b", panel2: "#1e1e22", inner: "#141416", deepInner: "#0c0c0e",
  border: "rgba(255,255,255,0.06)", borderMid: "rgba(255,255,255,0.10)",
  text: "#f4f4f5", textSoft: "#a1a1aa", textMuted: "#71717a",
  accent: "#06b6d4", accentBg: "rgba(6,182,212,0.12)",
} as const;

export default function AudioCutter() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file); setAudioUrl(URL.createObjectURL(file));
      setStartTime(0); setEndTime(0);
      toast.success("Audio file loaded successfully");
    } else { toast.error("Please select a valid audio file"); }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) { const dur = audioRef.current.duration; setDuration(dur); setEndTime(dur); drawWaveform(); }
  };

  const drawWaveform = useCallback(async () => {
    if (!audioFile || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const arrayBuffer = await audioFile.arrayBuffer();
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
    const normalizedData = filteredData.map(v => v / maxValue);
    const width = canvas.width; const height = canvas.height;
    const barWidth = width / samples;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(6,182,212,0.4)";
    normalizedData.forEach((value, index) => {
      const barHeight = value * height * 0.8;
      ctx.fillRect(index * barWidth, (height - barHeight) / 2, barWidth - 1, barHeight);
    });
    audioContext.close();
  }, [audioFile]);

  useEffect(() => { if (audioFile) drawWaveform(); }, [audioFile, drawWaveform]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.currentTime = startTime; audioRef.current.play(); }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.currentTime >= endTime) { audioRef.current.pause(); setIsPlaying(false); }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const handleCut = async () => {
    if (!audioFile) return;
    setIsProcessing(true);
    toast.info("Processing audio...");
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const newLength = endSample - startSample;
      const newBuffer = audioContext.createBuffer(audioBuffer.numberOfChannels, newLength, sampleRate);
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const oldData = audioBuffer.getChannelData(channel);
        const newData = newBuffer.getChannelData(channel);
        for (let i = 0; i < newLength; i++) newData[i] = oldData[startSample + i];
      }
      const wavBlob = bufferToWave(newBuffer, newLength);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url; a.download = `cut_audio.${outputFormat}`; a.click();
      URL.revokeObjectURL(url);
      audioContext.close();
      toast.success("Audio cut successfully!");
    } catch (error) { toast.error("Failed to process audio"); console.error(error); }
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
    setAudioFile(null); setAudioUrl(null); setIsPlaying(false);
    setDuration(0); setCurrentTime(0); setStartTime(0); setEndTime(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: C.text }}>Audio Cutter</h1>
        <p style={{ color: C.textMuted }}>Cut and trim audio files with precision. Free, no signup required.</p>
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
          <div className="rounded-[16px] p-5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: C.text }}>{audioFile.name}</h3>
              <button onClick={reset} className="p-2 rounded-lg transition hover:brightness-110" style={{ background: C.inner, border: `1px solid ${C.border}` }}>
                <RotateCcw className="w-4 h-4" style={{ color: C.textSoft }} />
              </button>
            </div>

            <audio ref={audioRef} src={audioUrl || undefined} onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />

            <div className="relative rounded-[12px] overflow-hidden" style={{ background: C.deepInner }}>
              <canvas ref={canvasRef} width={800} height={120} className="w-full h-[120px]" />
              <div className="absolute top-0 h-full pointer-events-none" style={{
                left: `${(startTime / duration) * 100}%`,
                width: `${((endTime - startTime) / duration) * 100}%`,
                background: "rgba(6,182,212,0.15)",
                borderLeft: "2px solid #06b6d4",
                borderRight: "2px solid #06b6d4",
              }} />
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button onClick={togglePlayPause} className="p-2 rounded-lg" style={{ background: C.inner, border: `1px solid ${C.borderMid}`, color: C.textSoft }}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <span className="text-sm font-mono" style={{ color: C.textMuted }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <label className="text-sm mb-2 block" style={{ color: C.textMuted }}>Start: {formatTime(startTime)}</label>
                <Slider value={[startTime]} onValueChange={([v]) => setStartTime(Math.min(v, endTime - 0.1))} max={duration} step={0.01} />
              </div>
              <div>
                <label className="text-sm mb-2 block" style={{ color: C.textMuted }}>End: {formatTime(endTime)}</label>
                <Slider value={[endTime]} onValueChange={([v]) => setEndTime(Math.max(v, startTime + 0.1))} max={duration} step={0.01} />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <label className="text-sm" style={{ color: C.textMuted }}>Format:</label>
              <div className="flex gap-1.5">
                {["mp3", "wav", "ogg"].map(f => (
                  <button key={f} onClick={() => setOutputFormat(f)}
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

            <button onClick={handleCut} disabled={isProcessing}
              className="w-full mt-5 inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40 transition hover:brightness-110"
              style={{ background: C.accent, boxShadow: `0 4px 16px rgba(6,182,212,0.3)` }}
            >
              <Scissors className="w-4 h-4" />
              {isProcessing ? "Processing..." : "Cut & Download"}
            </button>
          </div>

          {/* Selection Info */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Start", value: formatTime(startTime) },
              { label: "Duration", value: formatTime(endTime - startTime) },
              { label: "End", value: formatTime(endTime) },
            ].map(item => (
              <div key={item.label} className="rounded-[12px] p-4 text-center" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
                <p className="text-xl font-bold" style={{ color: C.accent }}>{item.value}</p>
                <p className="text-xs mt-1" style={{ color: C.textMuted }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
