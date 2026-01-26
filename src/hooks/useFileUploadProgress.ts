import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  const abortControllerRef = useRef<AbortController | null>(null);
  const bytesUploadedBeforeCurrentFile = useRef(0);

  const uploadFileWithProgress = useCallback(
    async (
      file: File,
      bucket: string,
      path: string,
      accessToken: string
    ): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        abortControllerRef.current = new AbortController();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const now = Date.now();
            const totalUploaded = bytesUploadedBeforeCurrentFile.current + e.loaded;

            setProgress((prev) => {
              const elapsedSeconds = (now - prev.startTime) / 1000;
              const speed = elapsedSeconds > 0 ? totalUploaded / elapsedSeconds : 0;
              const remainingBytes = prev.totalBytes - totalUploaded;
              const estimatedRemaining = speed > 0 ? remainingBytes / speed : 0;
              const percentage = prev.totalBytes > 0 ? (totalUploaded / prev.totalBytes) * 100 : 0;

              return {
                ...prev,
                uploadedBytes: totalUploaded,
                speed,
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

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = pathGenerator(file, i);

        setProgress((prev) => ({
          ...prev,
          currentFileIndex: i,
          currentFileName: file.name,
        }));

        const result = await uploadFileWithProgress(file, bucket, path, accessToken);

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
    [uploadFileWithProgress]
  );

  const resetProgress = useCallback(() => {
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
