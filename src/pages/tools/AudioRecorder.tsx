import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Play, Pause, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

const C = {
  bg: "#0e0e10", panel: "#18181b", panel2: "#1e1e22", inner: "#141416", deepInner: "#0c0c0e",
  border: "rgba(255,255,255,0.06)", borderMid: "rgba(255,255,255,0.10)",
  text: "#f4f4f5", textSoft: "#a1a1aa", textMuted: "#71717a",
  accent: "#06b6d4", accentBg: "rgba(6,182,212,0.12)",
} as const;

interface Recording { id: string; blob: Blob; url: string; duration: number; timestamp: Date; }

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFormat, setAudioFormat] = useState("audio/webm");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(24).fill(5));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      recordings.forEach(rec => URL.revokeObjectURL(rec.url));
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current || !isRecording || isPaused) { setAudioLevels(new Array(24).fill(5)); return; }
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    const bands = 24; const bandSize = Math.floor(dataArray.length / bands);
    const newLevels = [];
    for (let i = 0; i < bands; i++) {
      let sum = 0;
      for (let j = 0; j < bandSize; j++) sum += dataArray[i * bandSize + j];
      newLevels.push(Math.max(5, Math.min(100, (sum / bandSize / 255) * 100)));
    }
    setAudioLevels(newLevels);
    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const mimeType = MediaRecorder.isTypeSupported(audioFormat) ? audioFormat : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const actualDuration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordings(prev => [{ id: crypto.randomUUID(), blob, url, duration: actualDuration, timestamp: new Date() }, ...prev]);
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0); setAudioLevels(new Array(24).fill(5));
        toast.success("Recording saved!");
      };
      mediaRecorder.start(100);
      setIsRecording(true); setIsPaused(false);
      recordingStartTimeRef.current = Date.now();
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
      toast.success("Recording started");
    } catch { toast.error("Failed to access microphone."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false); setIsPaused(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
        setAudioLevels(new Array(24).fill(5));
      }
      setIsPaused(!isPaused);
    }
  };

  const playRecording = (recording: Recording) => {
    let audio = audioElementsRef.current.get(recording.id);
    if (!audio) { audio = new Audio(recording.url); audio.onended = () => setPlayingId(null); audioElementsRef.current.set(recording.id, audio); }
    if (playingId === recording.id) { audio.pause(); audio.currentTime = 0; setPlayingId(null); }
    else {
      if (playingId) { const ca = audioElementsRef.current.get(playingId); if (ca) { ca.pause(); ca.currentTime = 0; } }
      audio.play(); setPlayingId(recording.id);
    }
  };

  const downloadRecording = (recording: Recording) => {
    const ext = audioFormat.split("/")[1] || "webm";
    const a = document.createElement("a");
    a.href = recording.url;
    a.download = `recording_${recording.timestamp.toISOString().slice(0, 19).replace(/[:-]/g, "")}.${ext}`;
    a.click(); toast.success("Download started");
  };

  const deleteRecording = (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (recording) { URL.revokeObjectURL(recording.url); const audio = audioElementsRef.current.get(id); if (audio) { audio.pause(); audioElementsRef.current.delete(id); } if (playingId === id) setPlayingId(null); }
    setRecordings(prev => prev.filter(r => r.id !== id)); toast.success("Recording deleted");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: C.text }}>Audio Recorder</h1>
        <p style={{ color: C.textMuted }}>Record high-quality audio directly in your browser.</p>
      </div>

      {/* Recording controls */}
      <div className="rounded-[16px] py-12 flex flex-col items-center" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
        <div className="text-6xl font-mono font-bold mb-8 tabular-nums" style={{ color: C.text }}>{formatTime(recordingTime)}</div>

        <div className="flex items-end justify-center gap-[3px] mb-8 h-16 w-full max-w-md">
          {audioLevels.map((level, i) => (
            <div key={i} className="w-2 rounded-full transition-all duration-75"
              style={{
                height: `${level}%`,
                background: isRecording && !isPaused
                  ? `linear-gradient(to top, ${C.accent}, #8b5cf6)`
                  : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>

        {isRecording && (
          <p className="text-sm mb-6" style={{ color: C.textMuted }}>
            {isPaused ? "Recording paused" : "🔴 Recording in progress..."}
          </p>
        )}

        <div className="flex items-center gap-4">
          {!isRecording ? (
            <button onClick={startRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center transition hover:brightness-110"
              style={{ background: `linear-gradient(135deg, ${C.accent}, #8b5cf6)` }}
            >
              <Mic className="w-8 h-8 text-white" />
            </button>
          ) : (
            <>
              <button onClick={pauseRecording}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: C.inner, border: `1px solid ${C.borderMid}`, color: C.textSoft }}
              >
                {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
              </button>
              <button onClick={stopRecording}
                className="w-20 h-20 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 transition"
              >
                <Square className="w-8 h-8 text-white" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 mt-8">
          <label className="text-sm" style={{ color: C.textMuted }}>Format:</label>
          <div className="flex gap-1.5">
            {[
              { value: "audio/webm", label: "WebM" },
              { value: "audio/mp4", label: "MP4" },
              { value: "audio/ogg", label: "OGG" },
            ].map(f => (
              <button key={f.value} onClick={() => !isRecording && setAudioFormat(f.value)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                style={{
                  background: audioFormat === f.value ? C.accentBg : "transparent",
                  color: audioFormat === f.value ? C.accent : C.textMuted,
                  border: audioFormat === f.value ? `1px solid rgba(6,182,212,0.3)` : `1px solid transparent`,
                }}
              >{f.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Recordings */}
      {recordings.length > 0 && (
        <div className="rounded-[16px] p-5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
          <h3 className="font-semibold mb-4" style={{ color: C.text }}>Your Recordings ({recordings.length})</h3>
          <div className="space-y-2">
            {recordings.map((recording) => (
              <div key={recording.id} className="flex items-center justify-between p-3 rounded-[12px]" style={{ background: C.inner, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => playRecording(recording)} className="p-2 rounded-lg" style={{ background: C.panel2, color: C.textSoft }}>
                    {playingId === recording.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div>
                    <p className="font-medium text-sm" style={{ color: C.text }}>{recording.timestamp.toLocaleTimeString()}</p>
                    <p className="text-xs" style={{ color: C.textMuted }}>Duration: {formatTime(recording.duration)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => downloadRecording(recording)} className="p-2 rounded-lg hover:bg-white/5 transition" style={{ color: C.textSoft }}>
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteRecording(recording.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
