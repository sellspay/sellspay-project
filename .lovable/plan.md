
# Plan: Fix Speech-to-Text + Remove Plan Button + Add Style Design Presets

## Status: ✅ COMPLETED

## Summary of Changes

### 1. ✅ Speech-to-Text (Web Speech API)
- Kept the Web Speech API (works in production, not in preview iframe due to browser security)
- Improved error messaging to clarify it works in the published app
- The microphone button shows a clear "listening" indicator when active

### 2. ✅ Removed Plan Button
- Removed the "Plan" button from the bottom toolbar in ChatInputBar
- Plan mode is now internal only (not user-facing)
- Plan approval cards still work if AI returns a plan

### 3. ✅ Model Selection (Already Existed)
- Confirmed the Model selector is functional via the "Model" chip in the input bar
- Includes: Gemini 3 Pro, Gemini Flash, GPT-5.2, Nano Banana, Flux 1.1 Pro, etc.

### 4. ✅ Added Style Design Presets
- Created 6 visual theme presets:
  - **Midnight Luxury** - Dark mode with violet accents, glassmorphism
  - **Neon Cyberpunk** - Bold neon on dark, gradient meshes
  - **Clean Minimal** - Light, spacious, professional
  - **Warm Earth** - Natural, organic tones
  - **Ocean Breeze** - Cool blues and teals
  - **Retro Pop** - Vintage 80s aesthetic, geometric patterns
- Style selector appears next to the Send button (shows color swatch + name)
- Selected style is injected into AI prompts to ensure generated code follows the visual design system

## Files Created
- `src/components/ai-builder/stylePresets.ts` - Style preset definitions with colors, backgrounds, typography

## Files Modified
- `src/components/ai-builder/ChatInputBar.tsx` - Removed Plan button, added Style selector
- `src/components/ai-builder/VibecoderChat.tsx` - Updated props, added style prompt injection
- `src/components/ai-builder/AIBuilderCanvas.tsx` - Removed isPlanMode props
