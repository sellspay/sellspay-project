import { useState, useCallback, useRef } from 'react';

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  filename: string;
}

export function useFileDownloadProgress() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const speedHistoryRef = useRef<number[]>([]);
  const lastUpdateRef = useRef<{ time: number; loaded: number }>({ time: 0, loaded: 0 });

  const calculateSpeed = useCallback((loaded: number, currentTime: number) => {
    const { time: lastTime, loaded: lastLoaded } = lastUpdateRef.current;
    
    if (lastTime === 0) {
      lastUpdateRef.current = { time: currentTime, loaded };
      return 0;
    }

    const timeDiff = (currentTime - lastTime) / 1000; // seconds
    if (timeDiff < 0.1) return speedHistoryRef.current[speedHistoryRef.current.length - 1] || 0;

    const bytesDiff = loaded - lastLoaded;
    const instantSpeed = bytesDiff / timeDiff;

    // Keep last 10 speed measurements for smoothing
    speedHistoryRef.current.push(instantSpeed);
    if (speedHistoryRef.current.length > 10) {
      speedHistoryRef.current.shift();
    }

    // Calculate smoothed average
    const avgSpeed = speedHistoryRef.current.reduce((a, b) => a + b, 0) / speedHistoryRef.current.length;

    lastUpdateRef.current = { time: currentTime, loaded };
    return avgSpeed;
  }, []);

  const downloadWithProgress = useCallback(async (
    url: string,
    filename: string
  ): Promise<Blob | null> => {
    // Reset state
    speedHistoryRef.current = [];
    lastUpdateRef.current = { time: 0, loaded: 0 };
    
    abortControllerRef.current = new AbortController();
    setIsDownloading(true);
    setProgress({
      loaded: 0,
      total: 0,
      percentage: 0,
      speed: 0,
      timeRemaining: 0,
      filename
    });

    try {
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        const currentTime = performance.now();
        const speed = calculateSpeed(loaded, currentTime);
        const remaining = total > 0 ? total - loaded : 0;
        const timeRemaining = speed > 0 ? remaining / speed : 0;

        setProgress({
          loaded,
          total,
          percentage: total > 0 ? Math.round((loaded / total) * 100) : 0,
          speed,
          timeRemaining,
          filename
        });
      }

      // Combine chunks into single blob
      const blob = new Blob(chunks as BlobPart[]);
      
      setProgress(prev => prev ? { ...prev, percentage: 100 } : null);
      
      return blob;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Download was cancelled');
        return null;
      }
      throw error;
    } finally {
      setIsDownloading(false);
      abortControllerRef.current = null;
    }
  }, [calculateSpeed]);

  const cancelDownload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsDownloading(false);
    setProgress(null);
  }, []);

  const clearProgress = useCallback(() => {
    setProgress(null);
  }, []);

  return {
    isDownloading,
    progress,
    downloadWithProgress,
    cancelDownload,
    clearProgress
  };
}
