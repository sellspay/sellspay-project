

# Plan: Fix Speech-to-Text + Remove Plan Button + Add Style Design Presets

## Overview
This plan addresses four issues in the AI Builder (Magical Doorway):
1. Fix the microphone not working for speech-to-text
2. Remove the Plan button
3. Ensure model selection is accessible (already exists)
4. Add a new Style Design selector with presets

---

## 1. Fix Microphone/Speech-to-Text

### Current Problem
The AI Builder uses the Web Speech API which has known limitations in iframe/preview environments due to browser security policies. The code already handles this gracefully with a toast message, but users testing in the preview won't be able to use it.

### Solution: Implement ElevenLabs Speech-to-Text (Scribe v2 Realtime)
ElevenLabs provides a reliable WebSocket-based transcription service that works in all environments.

### Implementation Steps

#### Step 1A: Create Token Generation Edge Function
Create `supabase/functions/elevenlabs-scribe-token/index.ts`:
- Fetches a single-use token from ElevenLabs API
- Requires `ELEVENLABS_API_KEY` secret (will prompt user)
- Returns the token to the client

#### Step 1B: Update ChatInputBar Component
Modify `src/components/ai-builder/ChatInputBar.tsx`:
- Install `@elevenlabs/react` package for the `useScribe` hook
- Replace the current Web Speech API implementation with ElevenLabs Scribe
- Use the `commitStrategy: 'vad'` for automatic speech segmentation
- Keep the existing UI (WaveformIcon, floating indicator)
- Fallback to Web Speech API if ElevenLabs fails

---

## 2. Remove Plan Button

### Current Location
The Plan button is in `ChatInputBar.tsx` at lines 719-733.

### Implementation Steps

#### Step 2A: Remove Plan Button UI
Modify `src/components/ai-builder/ChatInputBar.tsx`:
- Remove the Plan button from the bottom toolbar
- Remove the `togglePlanMode` function call
- Keep the internal state/props for future use if needed

#### Step 2B: Clean Up VibecoderChat
Modify `src/components/ai-builder/VibecoderChat.tsx`:
- Remove `isPlanMode` and `onPlanModeChange` from the ChatInputBar props
- The plan approval card will still work if plans are returned by AI

---

## 3. Model Selection (Already Exists)

### Current Status
Model selection is already implemented via the "Model" button in the ChatInputBar. It includes:
- **Coding Models:** Gemini 3 Pro, Gemini Flash, GPT-5.2
- **Image Models:** Nano Banana, Flux 1.1 Pro, Recraft V3
- **Video Models:** Luma Ray 2, Kling Video

### No Changes Needed
The model selector is functional. Users click the "Model" chip in the input bar to access it.

---

## 4. Add Style Design Presets

### Concept
Create a "Style" selector (like the Model selector) that lets users pick a visual theme before generating. The selected style will be injected into the AI prompt.

### Style Presets to Include

| Style Name | Description | Colors | Background |
|------------|-------------|--------|------------|
| **Midnight Luxury** | Dark mode with violet accents | `#0a0a0f`, `#8b5cf6`, `#1a1a2e` | Glassmorphism overlays |
| **Neon Cyberpunk** | Bold neon on dark | `#0f0f0f`, `#00ff88`, `#ff00ff` | Gradient meshes |
| **Clean Minimal** | Light, spacious, professional | `#ffffff`, `#f5f5f5`, `#1a1a1a` | Subtle shadows |
| **Warm Earth** | Natural, organic tones | `#faf7f2`, `#8b6f47`, `#3d2914` | Soft textures |
| **Ocean Breeze** | Cool blues and teals | `#f0f9ff`, `#0ea5e9`, `#0369a1` | Gentle gradients |
| **Retro Pop** | Vintage 80s aesthetic | `#fef3c7`, `#f97316`, `#ec4899` | Geometric patterns |

### Implementation Steps

#### Step 4A: Create Style Types and Data
Create `src/components/ai-builder/stylePresets.ts`:
- Define `StylePreset` interface with id, name, description, colors, background style
- Export `STYLE_PRESETS` array with 6+ presets
- Export helper function to generate style prompt injection

#### Step 4B: Add Style Selector to ChatInputBar
Modify `src/components/ai-builder/ChatInputBar.tsx`:
- Add new state for `selectedStyle`
- Add a "Style" button next to the "Model" button (using `Palette` icon)
- Create a portal-based menu similar to the Model menu
- Show color swatches and style names in the dropdown

#### Step 4C: Wire Up Style to Chat Flow
Modify `src/components/ai-builder/VibecoderChat.tsx`:
- Pass `activeStyle` and `onStyleChange` props to ChatInputBar
- Include selected style in the `handleSubmit` options
- Inject style prompt into the AI request

#### Step 4D: Lift Style State to Canvas
Modify `src/components/ai-builder/AIBuilderCanvas.tsx`:
- Add `activeStyle` state at the canvas level (like `activeModel`)
- Pass down to VibecoderChat component
- Include style context when calling `streamCode`

#### Step 4E: Update useStreamingCode Hook
Modify `src/components/ai-builder/useStreamingCode.ts`:
- Accept optional `styleContext` parameter
- Inject style instructions into the system prompt sent to AI
- The AI will use these colors and background styles in generated code

---

## Files to Create
1. `supabase/functions/elevenlabs-scribe-token/index.ts` - Token generator for ElevenLabs
2. `src/components/ai-builder/stylePresets.ts` - Style preset definitions

## Files to Modify
1. `src/components/ai-builder/ChatInputBar.tsx` - Remove Plan, add Style, update speech-to-text
2. `src/components/ai-builder/VibecoderChat.tsx` - Wire up Style props
3. `src/components/ai-builder/AIBuilderCanvas.tsx` - Lift Style state
4. `src/components/ai-builder/useStreamingCode.ts` - Inject style context
5. `package.json` - Add `@elevenlabs/react` dependency

---

## Technical Details

### Style Prompt Injection Example
When a user selects "Midnight Luxury" style:
```
[STYLE_CONTEXT]
Apply this visual design system:
- Primary background: #0a0a0f (near black)
- Accent color: #8b5cf6 (violet)
- Secondary background: #1a1a2e 
- Card style: glassmorphism with backdrop-blur-xl, border border-white/10
- Shadows: large soft shadows with accent glow
- Typography: Clean sans-serif, high contrast
```

### ElevenLabs Integration Flow
1. User clicks mic button
2. Frontend calls edge function to get single-use token
3. Connect to ElevenLabs WebSocket with token
4. Stream transcription in real-time to input field
5. Auto-commit on silence (VAD)

---

## Dependencies
- `@elevenlabs/react` - ElevenLabs React SDK for real-time transcription
- `ELEVENLABS_API_KEY` - Required secret (will prompt user to add)

