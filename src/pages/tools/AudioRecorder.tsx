import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Recording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
}

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFormat, setAudioFormat] = useState("audio/webm");
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    return () => {
      recordings.forEach(rec => URL.revokeObjectURL(rec.url));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported(audioFormat) ? audioFormat : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const recording: Recording = {
          id: crypto.randomUUID(),
          blob,
          url,
          duration: recordingTime,
          timestamp: new Date(),
        };
        setRecordings(prev => [recording, ...prev]);
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
        toast.success("Recording saved!");
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      toast.error("Failed to access microphone. Please grant permission.");
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const playRecording = (recording: Recording) => {
    let audio = audioElementsRef.current.get(recording.id);
    
    if (!audio) {
      audio = new Audio(recording.url);
      audio.onended = () => setPlayingId(null);
      audioElementsRef.current.set(recording.id, audio);
    }

    if (playingId === recording.id) {
      audio.pause();
      audio.currentTime = 0;
      setPlayingId(null);
    } else {
      // Stop any currently playing audio
      if (playingId) {
        const currentAudio = audioElementsRef.current.get(playingId);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }
      audio.play();
      setPlayingId(recording.id);
    }
  };

  const downloadRecording = (recording: Recording) => {
    const extension = audioFormat.split("/")[1] || "webm";
    const a = document.createElement("a");
    a.href = recording.url;
    a.download = `recording_${recording.timestamp.toISOString().slice(0, 19).replace(/[:-]/g, "")}.${extension}`;
    a.click();
    toast.success("Download started");
  };

  const deleteRecording = (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (recording) {
      URL.revokeObjectURL(recording.url);
      const audio = audioElementsRef.current.get(id);
      if (audio) {
        audio.pause();
        audioElementsRef.current.delete(id);
      }
      if (playingId === id) {
        setPlayingId(null);
      }
    }
    setRecordings(prev => prev.filter(r => r.id !== id));
    toast.success("Recording deleted");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Audio Recorder</h1>
        <p className="text-muted-foreground">
          Record high-quality audio directly in your browser. Free, no signup required.
        </p>
      </div>

      {/* Recording Controls */}
      <Card className="bg-card/50 mb-8">
        <CardContent className="py-12">
          <div className="flex flex-col items-center">
            {/* Timer */}
            <div className="text-6xl font-mono font-bold mb-8 tabular-nums">
              {formatTime(recordingTime)}
            </div>

            {/* Waveform indicator */}
            {isRecording && !isPaused && (
              <div className="flex items-center gap-1 mb-8 h-12">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
              {!isRecording ? (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent"
                >
                  <Mic className="w-8 h-8" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={pauseRecording}
                    className="w-16 h-16 rounded-full"
                  >
                    {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={stopRecording}
                    className="w-20 h-20 rounded-full"
                  >
                    <Square className="w-8 h-8" />
                  </Button>
                </>
              )}
            </div>

            {/* Format selector */}
            <div className="flex items-center gap-4 mt-8">
              <label className="text-sm text-muted-foreground">Format:</label>
              <Select value={audioFormat} onValueChange={setAudioFormat} disabled={isRecording}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audio/webm">WebM</SelectItem>
                  <SelectItem value="audio/mp4">MP4</SelectItem>
                  <SelectItem value="audio/ogg">OGG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isRecording && (
              <p className="text-sm text-muted-foreground mt-4">
                {isPaused ? "Recording paused" : "Recording in progress..."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recordings List */}
      {recordings.length > 0 && (
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Your Recordings ({recordings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => playRecording(recording)}
                      className="shrink-0"
                    >
                      {playingId === recording.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <div>
                      <p className="font-medium">
                        {recording.timestamp.toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Duration: {formatTime(recording.duration)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => downloadRecording(recording)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRecording(recording.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
