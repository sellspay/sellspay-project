import { useCallback, useRef, useEffect, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave<T>(
  data: T,
  saveFn: () => Promise<void>,
  debounceMs = 1500,
  enabled = true
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDataRef = useRef<string>(JSON.stringify(data));
  const isMountedRef = useRef(true);
  const saveFnRef = useRef(saveFn);

  // Keep saveFn ref up to date
  saveFnRef.current = saveFn;

  const save = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setSaveStatus('saving');
    try {
      await saveFnRef.current();
      if (!isMountedRef.current) return;
      
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      // Reset to idle after 2s
      setTimeout(() => {
        if (isMountedRef.current) {
          setSaveStatus('idle');
        }
      }, 2000);
    } catch (error) {
      if (!isMountedRef.current) return;
      setSaveStatus('error');
      console.error('Autosave failed:', error);
    }
  }, []);

  // Trigger autosave when data changes
  useEffect(() => {
    if (!enabled) return;
    
    const currentData = JSON.stringify(data);
    
    // Only trigger if data actually changed
    if (currentData !== previousDataRef.current) {
      previousDataRef.current = currentData;
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new debounced save
      timeoutRef.current = setTimeout(save, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, save, debounceMs, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Manual save trigger
  const saveNow = useCallback(async () => {
    // Clear any pending autosave
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await save();
  }, [save]);

  // Reset the reference point (e.g., after fetching fresh data)
  const resetDataRef = useCallback((newData: T) => {
    previousDataRef.current = JSON.stringify(newData);
  }, []);

  return { saveStatus, lastSaved, saveNow, resetDataRef };
}
