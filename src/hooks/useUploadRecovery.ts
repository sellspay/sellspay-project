import { useState, useEffect, useCallback } from 'react';

export interface PendingUpload {
  id: string;
  fileName: string;
  fileSize: number;
  bucket: string;
  path: string;
  uploadedBytes: number;
  totalBytes: number;
  createdAt: number;
  lastUpdatedAt: number;
}

const STORAGE_KEY = 'pending_uploads';
const UPLOAD_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useUploadRecovery() {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);

  // Load pending uploads from localStorage
  const loadPendingUploads = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const uploads: PendingUpload[] = JSON.parse(stored);
        // Filter out expired uploads
        const now = Date.now();
        const validUploads = uploads.filter(
          (u) => now - u.lastUpdatedAt < UPLOAD_EXPIRY_MS
        );
        setPendingUploads(validUploads);
        // Clean up expired ones
        if (validUploads.length !== uploads.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validUploads));
        }
        return validUploads;
      }
    } catch (e) {
      console.error('Failed to load pending uploads:', e);
    }
    return [];
  }, []);

  // Save a pending upload
  const savePendingUpload = useCallback((upload: Omit<PendingUpload, 'id' | 'createdAt' | 'lastUpdatedAt'>) => {
    const id = `${upload.bucket}/${upload.path}`;
    const now = Date.now();
    
    const newUpload: PendingUpload = {
      ...upload,
      id,
      createdAt: now,
      lastUpdatedAt: now,
    };

    setPendingUploads((prev) => {
      const existing = prev.findIndex((u) => u.id === id);
      let updated: PendingUpload[];
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = { ...newUpload, createdAt: prev[existing].createdAt };
      } else {
        updated = [...prev, newUpload];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return id;
  }, []);

  // Update upload progress
  const updateUploadProgress = useCallback((id: string, uploadedBytes: number) => {
    setPendingUploads((prev) => {
      const updated = prev.map((u) =>
        u.id === id
          ? { ...u, uploadedBytes, lastUpdatedAt: Date.now() }
          : u
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Remove a completed or cancelled upload
  const removePendingUpload = useCallback((id: string) => {
    setPendingUploads((prev) => {
      const updated = prev.filter((u) => u.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear all pending uploads
  const clearAllPendingUploads = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPendingUploads([]);
  }, []);

  // Check if there are any resumable uploads
  const hasResumableUploads = pendingUploads.length > 0;

  // Load on mount
  useEffect(() => {
    loadPendingUploads();
  }, [loadPendingUploads]);

  return {
    pendingUploads,
    hasResumableUploads,
    savePendingUpload,
    updateUploadProgress,
    removePendingUpload,
    clearAllPendingUploads,
    loadPendingUploads,
  };
}
