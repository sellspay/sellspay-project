import { useCallback, useRef } from 'react';

// Subtle click sound using Web Audio API
export function useClickSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playClick = useCallback(() => {
    try {
      // Lazily create AudioContext (required for browsers)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const currentTime = ctx.currentTime;

      // Create oscillator for a subtle "tick" sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Subtle high-frequency tick
      oscillator.frequency.setValueAtTime(1800, currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, currentTime + 0.03);
      oscillator.type = 'sine';

      // Very quiet and short
      gainNode.gain.setValueAtTime(0.08, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);

      // Play for 50ms
      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.05);
    } catch (e) {
      // Silently fail if audio isn't supported
    }
  }, []);

  return { playClick };
}

// Global click sound for easy access
let globalAudioContext: AudioContext | null = null;

export function playClickSound() {
  try {
    if (!globalAudioContext) {
      globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = globalAudioContext;
    const currentTime = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Subtle tick sound
    oscillator.frequency.setValueAtTime(1800, currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, currentTime + 0.03);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.06, currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.04);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.04);
  } catch (e) {
    // Silently fail
  }
}
