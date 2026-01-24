import { useState, useCallback, useEffect } from 'react';

export function useHistory<T>(initialState: T, maxHistory = 50) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const current = history[index];

  const push = useCallback((newState: T) => {
    setHistory(prev => {
      // Remove any "future" states if we branched
      const newHistory = prev.slice(0, index + 1);
      // Add new state
      newHistory.push(newState);
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [index, maxHistory]);

  const undo = useCallback(() => {
    setIndex(prev => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setIndex(prev => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const reset = useCallback((newInitialState: T) => {
    setHistory([newInitialState]);
    setIndex(0);
  }, []);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  return { current, push, undo, redo, canUndo, canRedo, reset };
}

// Hook for keyboard shortcuts
export function useHistoryKeyboard(
  undo: () => void,
  redo: () => void,
  canUndo: boolean,
  canRedo: boolean,
  enabled = true,
  saveNow?: () => void
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey && canRedo) {
          redo();
        } else if (!e.shiftKey && canUndo) {
          undo();
        }
      }
      // Also support Cmd/Ctrl + Y for redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'y' && canRedo) {
        e.preventDefault();
        redo();
      }
      // Cmd/Ctrl + S for manual save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveNow?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, enabled, saveNow]);
}
