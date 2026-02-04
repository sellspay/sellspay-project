// Subtle, satisfying click sound using Web Audio API
let globalAudioContext: AudioContext | null = null;

export function playClickSound() {
  try {
    if (!globalAudioContext) {
      globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = globalAudioContext;
    const currentTime = ctx.currentTime;

    // Create a more satisfying "click" using noise burst + filter
    const bufferSize = ctx.sampleRate * 0.015; // 15ms of audio
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate a short burst of filtered noise for a "click" sound
    for (let i = 0; i < bufferSize; i++) {
      // Sharp attack, quick decay
      const envelope = Math.exp(-i / (bufferSize * 0.15));
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // High-pass filter to make it crisp
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 800;

    // Low-pass to remove harshness
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 4000;

    // Gain for volume control
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.12, currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.02);

    // Connect the chain
    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(currentTime);
    source.stop(currentTime + 0.02);
  } catch (e) {
    // Silently fail if audio isn't supported
  }
}
