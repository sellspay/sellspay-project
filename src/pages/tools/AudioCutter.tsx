import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Play, Pause, Scissors, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setStartTime(0);
      setEndTime(0);
      toast.success("Audio file loaded successfully");
    } else {
      toast.error("Please select a valid audio file");
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      setDuration(dur);
      setEndTime(dur);
      drawWaveform();
    }
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
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[i * blockSize + j]);
      }
      filteredData.push(sum / blockSize);
    }
    
    const maxValue = Math.max(...filteredData);
    const normalizedData = filteredData.map(v => v / maxValue);
    
    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / samples;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "hsl(270 70% 60% / 0.3)";
    
    normalizedData.forEach((value, index) => {
      const barHeight = value * height * 0.8;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
    
    audioContext.close();
  }, [audioFile]);

  useEffect(() => {
    if (audioFile) {
      drawWaveform();
    }
  }, [audioFile, drawWaveform]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.currentTime = startTime;
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.currentTime >= endTime) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
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
    toast.info("Processing audio... This may take a moment.");
    
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const newLength = endSample - startSample;
      
      const newBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        newLength,
        sampleRate
      );
      
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const oldData = audioBuffer.getChannelData(channel);
        const newData = newBuffer.getChannelData(channel);
        for (let i = 0; i < newLength; i++) {
          newData[i] = oldData[startSample + i];
        }
      }
      
      // Convert to WAV and trigger download
      const wavBlob = bufferToWave(newBuffer, newLength);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cut_audio.${outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      
      audioContext.close();
      toast.success("Audio cut successfully!");
    } catch (error) {
      toast.error("Failed to process audio");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const bufferToWave = (abuffer: AudioBuffer, len: number) => {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels: Float32Array[] = [];
    let sample: number;
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF identifier
    setUint32(0x46464952);
    // RIFF chunk length
    setUint32(length - 8);
    // RIFF type
    setUint32(0x45564157);
    // format chunk identifier
    setUint32(0x20746d66);
    // format chunk length
    setUint32(16);
    // sample format (raw)
    setUint16(1);
    // channel count
    setUint16(numOfChan);
    // sample rate
    setUint32(abuffer.sampleRate);
    // byte rate (sample rate * block align)
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    // block align (channel count * bytes per sample)
    setUint16(numOfChan * 2);
    // bits per sample
    setUint16(16);
    // data chunk identifier
    setUint32(0x61746164);
    // data chunk length
    setUint32(length - pos - 4);

    for (let i = 0; i < numOfChan; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([buffer], { type: "audio/wav" });
  };

  const reset = () => {
    setAudioFile(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setStartTime(0);
    setEndTime(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Audio Cutter</h1>
        <p className="text-muted-foreground">
          Cut and trim audio files with precision. Free, no signup required.
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
          <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{audioFile.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={reset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <audio
                ref={audioRef}
                src={audioUrl || undefined}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />

              {/* Waveform */}
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={120}
                  className="w-full h-[120px] bg-secondary/20 rounded-lg"
                />
                {/* Selection overlay */}
                <div
                  className="absolute top-0 h-full bg-primary/20 border-x-2 border-primary pointer-events-none"
                  style={{
                    left: `${(startTime / duration) * 100}%`,
                    width: `${((endTime - startTime) / duration) * 100}%`,
                  }}
                />
              </div>

              {/* Playback controls */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <span className="text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Time selection */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Start Time: {formatTime(startTime)}
                  </label>
                  <Slider
                    value={[startTime]}
                    onValueChange={([v]) => setStartTime(Math.min(v, endTime - 0.1))}
                    max={duration}
                    step={0.01}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    End Time: {formatTime(endTime)}
                  </label>
                  <Slider
                    value={[endTime]}
                    onValueChange={([v]) => setEndTime(Math.max(v, startTime + 0.1))}
                    max={duration}
                    step={0.01}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Output format */}
              <div className="flex items-center gap-4">
                <label className="text-sm text-muted-foreground">Output Format:</label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp3">MP3</SelectItem>
                    <SelectItem value="wav">WAV</SelectItem>
                    <SelectItem value="ogg">OGG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={handleCut}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-primary to-accent"
                >
                  <Scissors className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Cut & Download"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Selection Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{formatTime(startTime)}</p>
                <p className="text-sm text-muted-foreground">Start</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{formatTime(endTime - startTime)}</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{formatTime(endTime)}</p>
                <p className="text-sm text-muted-foreground">End</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
