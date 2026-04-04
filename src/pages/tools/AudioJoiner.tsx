import { useState, useRef } from "react";
import { Upload, Plus, Trash2, GripVertical, Music, Download } from "lucide-react";
import { toast } from "sonner";

const C = {
  bg: "#0e0e10", panel: "#18181b", panel2: "#1e1e22", inner: "#141416", deepInner: "#0c0c0e",
  border: "rgba(255,255,255,0.06)", borderMid: "rgba(255,255,255,0.10)",
  text: "#f4f4f5", textSoft: "#a1a1aa", textMuted: "#71717a",
  accent: "#06b6d4", accentBg: "rgba(6,182,212,0.12)",
} as const;

interface AudioFile {
  id: string; file: File; name: string; duration: number; url: string;
}

export default function AudioJoiner() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: AudioFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("audio/")) {
        const url = URL.createObjectURL(file);
        const duration = await getAudioDuration(url);
        newFiles.push({ id: crypto.randomUUID(), file, name: file.name, duration, url });
      }
    }
    if (newFiles.length > 0) { setAudioFiles(prev => [...prev, ...newFiles]); toast.success(`Added ${newFiles.length} file(s)`); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getAudioDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => resolve(0);
    });
  };

  const removeFile = (id: string) => {
    const file = audioFiles.find(f => f.id === id);
    if (file) URL.revokeObjectURL(file.url);
    setAudioFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= audioFiles.length) return;
    const newFiles = [...audioFiles];
    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
    setAudioFiles(newFiles);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalDuration = () => audioFiles.reduce((sum, f) => sum + f.duration, 0);

  const joinAudio = async () => {
    if (audioFiles.length < 2) { toast.error("Please add at least 2 audio files to join"); return; }
    setIsProcessing(true);
    try {
      const audioContext = new AudioContext();
      const buffers: AudioBuffer[] = [];
      for (const audioFile of audioFiles) {
        const arrayBuffer = await audioFile.file.arrayBuffer();
        buffers.push(await audioContext.decodeAudioData(arrayBuffer));
      }
      const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
      const sampleRate = buffers[0].sampleRate;
      const numberOfChannels = Math.max(...buffers.map(b => b.numberOfChannels));
      const outputBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);
      let offset = 0;
      for (const buffer of buffers) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const outputData = outputBuffer.getChannelData(channel);
          const inputData = buffer.numberOfChannels > channel ? buffer.getChannelData(channel) : buffer.getChannelData(0);
          outputData.set(inputData, offset);
        }
        offset += buffer.length;
      }
      const wavBlob = bufferToWave(outputBuffer, totalLength);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url; a.download = "joined_audio.wav"; a.click();
      URL.revokeObjectURL(url);
      audioContext.close();
      toast.success("Audio files joined successfully!");
    } catch { toast.error("Failed to join audio files"); }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: C.text }}>Audio Joiner</h1>
        <p style={{ color: C.textMuted }}>Merge multiple audio files into one seamless track.</p>
      </div>

      {/* Upload */}
      <div
        className="rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center py-12 cursor-pointer transition-colors hover:border-cyan-500/30"
        style={{ background: C.panel2, borderColor: C.borderMid }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept="audio/*" multiple onChange={handleFileUpload} className="hidden" />
        <Upload className="w-12 h-12 mb-4" style={{ color: C.textMuted }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: C.text }}>Add Audio Files</h3>
        <p className="text-sm mb-4" style={{ color: C.textMuted }}>Select multiple files to join together</p>
        <button className="rounded-[12px] px-5 py-2 text-sm font-semibold text-white inline-flex items-center gap-2" style={{ background: C.accent }}>
          <Plus className="w-4 h-4" /> Add Files
        </button>
      </div>

      {/* Files list */}
      {audioFiles.length > 0 && (
        <div className="rounded-[16px] p-5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: C.text }}>Audio Files ({audioFiles.length})</h3>
            <p className="text-sm" style={{ color: C.textMuted }}>Total: {formatTime(getTotalDuration())}</p>
          </div>
          <div className="space-y-2">
            {audioFiles.map((audioFile, index) => (
              <div key={audioFile.id} className="flex items-center gap-3 p-3 rounded-[12px]" style={{ background: C.inner, border: `1px solid ${C.border}` }}>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveFile(index, "up")} disabled={index === 0} className="p-0.5 disabled:opacity-20">
                    <GripVertical className="w-3 h-3 rotate-90" style={{ color: C.textMuted }} />
                  </button>
                  <button onClick={() => moveFile(index, "down")} disabled={index === audioFiles.length - 1} className="p-0.5 disabled:opacity-20">
                    <GripVertical className="w-3 h-3 rotate-90" style={{ color: C.textMuted }} />
                  </button>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.accentBg }}>
                  <Music className="w-4 h-4" style={{ color: C.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm" style={{ color: C.text }}>{audioFile.name}</p>
                  <p className="text-xs" style={{ color: C.textMuted }}>{formatTime(audioFile.duration)}</p>
                </div>
                <span className="text-xs font-medium shrink-0" style={{ color: C.textMuted }}>#{index + 1}</span>
                <button onClick={() => removeFile(audioFile.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-[12px] px-4 py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2 transition"
              style={{ background: C.inner, border: `1px solid ${C.borderMid}`, color: C.textSoft }}
            >
              <Plus className="w-4 h-4" /> Add More
            </button>
            <button onClick={joinAudio} disabled={audioFiles.length < 2 || isProcessing}
              className="flex-1 rounded-[12px] px-4 py-2.5 text-sm font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-40 transition hover:brightness-110"
              style={{ background: C.accent, boxShadow: `0 4px 16px rgba(6,182,212,0.3)` }}
            >
              <Download className="w-4 h-4" /> {isProcessing ? "Processing..." : "Join & Download"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
