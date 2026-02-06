

# Orange Glow + Animated Waveform Microphone

## Overview
This plan adds the signature orange glow outline back to the chat input and transforms the microphone into a smaller, more elegant animated waveform that pulses when active.

## Changes

### 1. Add Orange Glow to Chat Container
**File**: `src/components/ai-builder/ChatInputBar.tsx` (line 580)

Current:
```tsx
<div className="bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 rounded-2xl overflow-hidden">
```

Updated:
```tsx
<div className="bg-zinc-800/90 backdrop-blur-sm border border-orange-500/30 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.15)] hover:shadow-[0_0_30px_rgba(249,115,22,0.25)] transition-shadow duration-300">
```

This adds:
- Orange-tinted border (`border-orange-500/30`)
- Soft ambient glow via box-shadow
- Subtle hover intensification

---

### 2. Redesign WaveformIcon Component
**File**: `src/components/ai-builder/ChatInputBar.tsx` (lines 196-218)

Replace the current WaveformIcon with a smaller, more refined waveform visualization:
- Reduce overall size from `h-4` to `h-3` (12px)
- Use 5 bars instead of 7 for compactness
- Add proper CSS keyframe animation when active
- Staggered animation delays for natural wave effect
- Smooth transition between idle and active states

```tsx
function WaveformIcon({ isActive, className }: { isActive: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-[1.5px] h-3 w-4", className)}>
      {[0.4, 0.7, 1, 0.7, 0.4].map((scale, i) => (
        <div 
          key={i}
          className={cn(
            "w-[1.5px] rounded-full transition-all",
            isActive 
              ? "bg-red-400" 
              : "bg-current"
          )}
          style={{ 
            height: isActive ? '100%' : '3px',
            transform: isActive ? `scaleY(${scale})` : 'scaleY(1)',
            animation: isActive 
              ? `waveform 0.6s ease-in-out ${i * 0.08}s infinite alternate` 
              : 'none',
          }}
        />
      ))}
    </div>
  );
}
```

---

### 3. Add Waveform Keyframe Animation
**File**: `src/components/ai-builder/ChatInputBar.tsx`

Add CSS keyframes at the top of the component or inject via style tag:

```tsx
// Add near the top of the file (after imports)
const waveformStyles = `
@keyframes waveform {
  0% { transform: scaleY(0.3); }
  100% { transform: scaleY(1); }
}
`;
```

Then inject with a style tag in the component:
```tsx
<style>{waveformStyles}</style>
```

---

### 4. Make Mic Button Smaller
**File**: `src/components/ai-builder/ChatInputBar.tsx` (lines 648-664)

Reduce padding from `p-1.5` to `p-1` for a more compact button:

```tsx
<button 
  type="button" 
  onClick={toggleSpeechRecognition}
  className={cn(
    "p-1 transition-colors rounded-md",
    isListening 
      ? "text-red-400 bg-red-500/10" 
      : "text-zinc-500 hover:text-white hover:bg-zinc-700/50"
  )}
>
```

---

## Visual Result
- **Idle State**: Tiny 5-bar waveform icon (3px tall), zinc color, very subtle
- **Active State**: Bars animate in a smooth wave pattern with staggered timing, red color, subtle red background glow on button
- **Container**: Warm orange ambient glow that intensifies slightly on hover

## Files Modified
| File | Changes |
|------|---------|
| `src/components/ai-builder/ChatInputBar.tsx` | Add orange glow to container, redesign WaveformIcon, add keyframe animation, reduce mic button size |

