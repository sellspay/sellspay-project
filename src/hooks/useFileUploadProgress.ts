import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as tus from 'tus-js-client';

export interface UploadProgress {
  totalBytes: number;
  uploadedBytes: number;
  currentFileIndex: number;
  totalFiles: number;
  currentFileName: string;
  startTime: number;
  speed: number; // bytes per second
  estimatedRemaining: number; // seconds
  percentage: number;
  phase: 'idle' | 'uploading' | 'processing' | 'done';
}

export const MAX_PRODUCT_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5GB

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return 'Calculating...';
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
};

export const validateTotalFileSize = (files: File[]): { valid: boolean; totalSize: number; message: string } => {
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  if (totalSize > MAX_PRODUCT_SIZE_BYTES) {
    return {
      valid: false,
      totalSize,
      message: `Total file size (${formatBytes(totalSize)}) exceeds 5GB limit. Please reduce file size.`,
    };
  }
  return { valid: true, totalSize, message: '' };
};

export function useFileUploadProgress() {
  const [progress, setProgress] = useState<UploadProgress>({
    totalBytes: 0,
    uploadedBytes: 0,
    currentFileIndex: 0,
    totalFiles: 0,
    currentFileName: '',
    startTime: 0,
    speed: 0,
    estimatedRemaining: 0,
    percentage: 0,
    phase: 'idle',
  });

  const abortRef = useRef<boolean>(false);
  const bytesUploadedBeforeCurrentFile = useRef(0);
  const speedSamples = useRef<number[]>([]);
  const lastProgressTime = useRef(0);
  const lastProgressBytes = useRef(0);

  // Calculate smoothed speed using moving average
  const calculateSmoothedSpeed = (instantSpeed: number): number => {
    speedSamples.current.push(instantSpeed);
    // Keep last 10 samples for smoothing
    if (speedSamples.current.length > 10) {
      speedSamples.current.shift();
    }
    const sum = speedSamples.current.reduce((a, b) => a + b, 0);
    return sum / speedSamples.current.length;
  };

  // TUS-based resumable upload for large files
  const uploadFileWithTus = useCallback(
    async (
      file: File,
      bucket: string,
      path: string,
      accessToken: string
    ): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        
        if (!projectId) {
          console.error('Missing VITE_SUPABASE_PROJECT_ID');
          resolve({ success: false, error: 'Configuration error' });
          return;
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        const upload = new tus.Upload(file, {
          // Correct storage endpoint for resumable uploads
          endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
          retryDelays: [0, 1000, 3000, 5000, 10000], // Retry on failure
          headers: {
            authorization: `Bearer ${accessToken}`,
            apikey: anonKey, // Required for TUS uploads
            'x-upsert': 'false',
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: bucket,
            objectName: path,
            contentType: file.type || 'application/octet-stream',
            cacheControl: '3600',
          },
          // 6MB chunks - optimal for Supabase
          chunkSize: 6 * 1024 * 1024,
          
          onError: (error) => {
            console.error('TUS upload error:', error);
            resolve({ success: false, error: error.message || 'Upload failed' });
          },
          
          onProgress: (bytesUploaded, bytesTotal) => {
            const now = Date.now();
            const totalUploaded = bytesUploadedBeforeCurrentFile.current + bytesUploaded;

            // Calculate instant speed (bytes since last update)
            let instantSpeed = 0;
            if (lastProgressTime.current > 0) {
              const timeDelta = (now - lastProgressTime.current) / 1000;
              const bytesDelta = totalUploaded - lastProgressBytes.current;
              if (timeDelta > 0) {
                instantSpeed = bytesDelta / timeDelta;
              }
            }
            lastProgressTime.current = now;
            lastProgressBytes.current = totalUploaded;

            setProgress((prev) => {
              // Use smoothed speed for better UX
              const smoothedSpeed = instantSpeed > 0 
                ? calculateSmoothedSpeed(instantSpeed) 
                : prev.speed;
              
              const remainingBytes = prev.totalBytes - totalUploaded;
              const estimatedRemaining = smoothedSpeed > 0 ? remainingBytes / smoothedSpeed : 0;
              const percentage = prev.totalBytes > 0 ? (totalUploaded / prev.totalBytes) * 100 : 0;

              return {
                ...prev,
                uploadedBytes: totalUploaded,
                speed: smoothedSpeed,
                estimatedRemaining,
                percentage,
              };
            });
          },
          
          onSuccess: () => {
            bytesUploadedBeforeCurrentFile.current += file.size;
            resolve({ success: true });
          },
        });

        // Check for previous uploads to resume
        upload.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length) {
            console.log('Resuming previous upload...');
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        });
      });
    },
    []
  );

  // Fallback XHR upload for smaller files (< 50MB)
  const uploadFileWithXhr = useCallback(
    async (
      file: File,
      bucket: string,
      path: string,
      accessToken: string
    ): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const now = Date.now();
            const totalUploaded = bytesUploadedBeforeCurrentFile.current + e.loaded;

            let instantSpeed = 0;
            if (lastProgressTime.current > 0) {
              const timeDelta = (now - lastProgressTime.current) / 1000;
              const bytesDelta = totalUploaded - lastProgressBytes.current;
              if (timeDelta > 0.1) { // Only update if enough time has passed
                instantSpeed = bytesDelta / timeDelta;
                lastProgressTime.current = now;
                lastProgressBytes.current = totalUploaded;
              }
            } else {
              lastProgressTime.current = now;
              lastProgressBytes.current = totalUploaded;
            }

            setProgress((prev) => {
              const smoothedSpeed = instantSpeed > 0 
                ? calculateSmoothedSpeed(instantSpeed) 
                : prev.speed;
              
              const remainingBytes = prev.totalBytes - totalUploaded;
              const estimatedRemaining = smoothedSpeed > 0 ? remainingBytes / smoothedSpeed : 0;
              const percentage = prev.totalBytes > 0 ? (totalUploaded / prev.totalBytes) * 100 : 0;

              return {
                ...prev,
                uploadedBytes: totalUploaded,
                speed: smoothedSpeed,
                estimatedRemaining,
                percentage,
              };
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            bytesUploadedBeforeCurrentFile.current += file.size;
            resolve({ success: true });
          } else {
            let errorMessage = 'Upload failed';
            try {
              const response = JSON.parse(xhr.responseText);
              errorMessage = response.message || response.error || errorMessage;
            } catch {
              errorMessage = xhr.statusText || errorMessage;
            }
            resolve({ success: false, error: errorMessage });
          }
        };

        xhr.onerror = () => {
          resolve({ success: false, error: 'Network error during upload' });
        };

        xhr.ontimeout = () => {
          resolve({ success: false, error: 'Upload timed out' });
        };

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        xhr.open('POST', `${supabaseUrl}/storage/v1/object/${bucket}/${path}`);
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.setRequestHeader('x-upsert', 'false');
        xhr.timeout = 0; // No timeout for large files

        xhr.send(file);
      });
    },
    []
  );

  const uploadFiles = useCallback(
    async (
      files: File[],
      bucket: string,
      pathGenerator: (file: File, index: number) => string
    ): Promise<{ success: boolean; paths: string[]; error?: string }> => {
      if (files.length === 0) {
        return { success: true, paths: [] };
      }

      // Get fresh session
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        return { success: false, paths: [], error: 'Not authenticated' };
      }

      const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
      bytesUploadedBeforeCurrentFile.current = 0;
      speedSamples.current = [];
      lastProgressTime.current = 0;
      lastProgressBytes.current = 0;
      abortRef.current = false;

      setProgress({
        totalBytes,
        uploadedBytes: 0,
        currentFileIndex: 0,
        totalFiles: files.length,
        currentFileName: files[0].name,
        startTime: Date.now(),
        speed: 0,
        estimatedRemaining: 0,
        percentage: 0,
        phase: 'uploading',
      });

      const paths: string[] = [];

      // Use TUS for files > 50MB, XHR for smaller files
      const TUS_THRESHOLD = 50 * 1024 * 1024; // 50MB

      for (let i = 0; i < files.length; i++) {
        if (abortRef.current) {
          return { success: false, paths, error: 'Upload cancelled' };
        }

        const file = files[i];
        const path = pathGenerator(file, i);

        setProgress((prev) => ({
          ...prev,
          currentFileIndex: i,
          currentFileName: file.name,
        }));

        // Choose upload method based on file size
        const useTus = file.size > TUS_THRESHOLD;
        console.log(`Uploading ${file.name} (${formatBytes(file.size)}) using ${useTus ? 'TUS' : 'XHR'}`);
        
        const result = useTus
          ? await uploadFileWithTus(file, bucket, path, accessToken)
          : await uploadFileWithXhr(file, bucket, path, accessToken);

        if (!result.success) {
          setProgress((prev) => ({ ...prev, phase: 'idle' }));
          return { success: false, paths, error: result.error };
        }

        paths.push(path);
      }

      setProgress((prev) => ({
        ...prev,
        uploadedBytes: prev.totalBytes,
        percentage: 100,
        phase: 'processing',
      }));

      return { success: true, paths };
    },
    [uploadFileWithTus, uploadFileWithXhr]
  );

  const resetProgress = useCallback(() => {
    abortRef.current = true;
    setProgress({
      totalBytes: 0,
      uploadedBytes: 0,
      currentFileIndex: 0,
      totalFiles: 0,
      currentFileName: '',
      startTime: 0,
      speed: 0,
      estimatedRemaining: 0,
      percentage: 0,
      phase: 'idle',
    });
    bytesUploadedBeforeCurrentFile.current = 0;
    speedSamples.current = [];
    lastProgressTime.current = 0;
    lastProgressBytes.current = 0;
  }, []);

  const setPhase = useCallback((phase: UploadProgress['phase']) => {
    setProgress((prev) => ({ ...prev, phase }));
  }, []);

  return {
    progress,
    uploadFiles,
    resetProgress,
    setPhase,
    validateTotalFileSize,
    formatBytes,
    formatTime,
  };
}
