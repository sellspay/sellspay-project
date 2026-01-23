import { useState, useRef } from "react";
import { Upload, Plus, Trash2, GripVertical, Music, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface AudioFile {
  id: string;
  file: File;
  name: string;
  duration: number;
  url: string;
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
        newFiles.push({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          duration,
          url,
        });
      }
    }

    if (newFiles.length > 0) {
      setAudioFiles(prev => [...prev, ...newFiles]);
      toast.success(`Added ${newFiles.length} file(s)`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getAudioDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => {
        resolve(0);
      };
    });
  };

  const removeFile = (id: string) => {
    const file = audioFiles.find(f => f.id === id);
    if (file) {
      URL.revokeObjectURL(file.url);
    }
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

  const getTotalDuration = () => {
    return audioFiles.reduce((sum, f) => sum + f.duration, 0);
  };

  const joinAudio = async () => {
    if (audioFiles.length < 2) {
      toast.error("Please add at least 2 audio files to join");
      return;
    }

    setIsProcessing(true);
    toast.info("Processing audio files... This may take a moment.");

    try {
      const audioContext = new AudioContext();
      const buffers: AudioBuffer[] = [];

      // Decode all audio files
      for (const audioFile of audioFiles) {
        const arrayBuffer = await audioFile.file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        buffers.push(audioBuffer);
      }

      // Calculate total length
      const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
      const sampleRate = buffers[0].sampleRate;
      const numberOfChannels = Math.max(...buffers.map(b => b.numberOfChannels));

      // Create output buffer
      const outputBuffer = audioContext.createBuffer(
        numberOfChannels,
        totalLength,
        sampleRate
      );

      // Copy all audio data
      let offset = 0;
      for (const buffer of buffers) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const outputData = outputBuffer.getChannelData(channel);
          const inputData = buffer.numberOfChannels > channel
            ? buffer.getChannelData(channel)
            : buffer.getChannelData(0); // Fallback to mono
          outputData.set(inputData, offset);
        }
        offset += buffer.length;
      }

      // Convert to WAV and download
      const wavBlob = bufferToWave(outputBuffer, totalLength);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "joined_audio.wav";
      a.click();
      URL.revokeObjectURL(url);

      audioContext.close();
      toast.success("Audio files joined successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to join audio files");
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

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Audio Joiner</h1>
        <p className="text-muted-foreground">
          Merge multiple audio files into one seamless track. Free, no signup required.
        </p>
      </div>

      {/* Upload Area */}
      <Card className="bg-card/50 border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors mb-8">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Add Audio Files</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Select multiple files to join together
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Files
          </Button>
        </CardContent>
      </Card>

      {/* Files List */}
      {audioFiles.length > 0 && (
        <Card className="bg-card/50 mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Audio Files ({audioFiles.length})</CardTitle>
            <p className="text-sm text-muted-foreground">
              Total Duration: {formatTime(getTotalDuration())}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {audioFiles.map((audioFile, index) => (
                <div
                  key={audioFile.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/20 border border-border/50"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveFile(index, "up")}
                      disabled={index === 0}
                    >
                      <GripVertical className="w-4 h-4 rotate-90" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveFile(index, "down")}
                      disabled={index === audioFiles.length - 1}
                    >
                      <GripVertical className="w-4 h-4 rotate-90" />
                    </Button>
                  </div>
                  
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{audioFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Duration: {formatTime(audioFile.duration)}
                    </p>
                  </div>
                  
                  <span className="text-sm font-medium text-muted-foreground shrink-0">
                    #{index + 1}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(audioFile.id)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add More Files
              </Button>
              <Button
                onClick={joinAudio}
                disabled={audioFiles.length < 2 || isProcessing}
                className="flex-1 bg-gradient-to-r from-primary to-accent"
              >
                <Download className="w-4 h-4 mr-2" />
                {isProcessing ? "Processing..." : "Join & Download"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Click "Add Files" to select audio files you want to join</li>
            <li>Reorder files by clicking the arrows to set the playback sequence</li>
            <li>Click "Join & Download" to merge all files into one</li>
            <li>Your joined audio file will download automatically</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
