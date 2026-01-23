
# AI Audio Tools Implementation Plan

This plan implements three AI-powered audio tools (Voice Isolator, SFX Isolator, Music Splitter) using fal.ai's Demucs API for professional-quality stem separation.

---

## Overview

We will create a backend edge function that calls fal.ai's Demucs API, then build three polished tool interfaces that allow users to:
- **Voice Isolator**: Remove vocals (get karaoke) OR isolate vocals (get acapella)
- **SFX Isolator**: Extract the "other" stem containing sound effects, synths, and miscellaneous sounds
- **Music Splitter**: Split audio into up to 6 stems (vocals, drums, bass, guitar, piano, other)

---

## Architecture

```text
User uploads audio file
        ↓
Frontend uploads to Supabase Storage (temp bucket)
        ↓
Frontend calls Edge Function with file URL
        ↓
Edge Function calls fal.ai Demucs API
        ↓
fal.ai processes audio, returns stem URLs
        ↓
Frontend displays results with download buttons
```

---

## Implementation Steps

### Step 1: Add FAL_KEY Secret

You will need to create a fal.ai account and get an API key:
1. Sign up at https://fal.ai
2. Get your API key from dashboard
3. We will add it as a secret called `FAL_KEY`

### Step 2: Create Edge Function

**File: `supabase/functions/audio-stem-separation/index.ts`**

This edge function will:
- Accept an audio URL and separation mode (voice, sfx, or full)
- Call fal.ai's Demucs API with appropriate parameters
- Return the separated stem URLs

Modes:
- `voice-isolator`: Returns vocals + instrumental (no_vocals)
- `sfx-isolator`: Returns "other" stem + everything else
- `music-splitter`: Returns all 6 stems

### Step 3: Create Storage Bucket

Create a `temp-audio` bucket in Supabase Storage for temporary file uploads during processing.

### Step 4: Build Voice Isolator Component

**File: `src/pages/tools/VoiceIsolator.tsx`**

Features:
- Drag & drop audio upload
- Processing indicator with progress
- Toggle between "Remove Vocals" and "Isolate Vocals"
- Audio player for each output
- Download buttons for both stems
- Waveform visualization

UI Layout:
```text
+--------------------------------------------------+
|  Voice Isolator                        [Popular] |
|  Remove vocals or isolate them from any track    |
+--------------------------------------------------+
|                                                  |
|     [  Drag & drop audio file here  ]            |
|     [  or click to browse          ]             |
|                                                  |
+--------------------------------------------------+
|  Mode:  [Remove Vocals] [Isolate Vocals]         |
+--------------------------------------------------+
|                                                  |
|  [====== Processing... 45% ======]               |
|                                                  |
+--------------------------------------------------+
|  Results:                                        |
|  +-------------------+  +-------------------+    |
|  | Instrumental      |  | Vocals            |    |
|  | [▶ Play] [⬇ DL]  |  | [▶ Play] [⬇ DL]  |    |
|  +-------------------+  +-------------------+    |
+--------------------------------------------------+
```

### Step 5: Build SFX Isolator Component

**File: `src/pages/tools/SFXIsolator.tsx`**

Similar to Voice Isolator but focused on extracting sound effects:
- Extracts the "other" stem (synths, SFX, ambient sounds)
- Returns: SFX/Other track + Music (vocals+drums+bass) track

### Step 6: Build Music Splitter Component

**File: `src/pages/tools/MusicSplitter.tsx`**

Full stem separation interface:
- Shows all 6 stems in a grid
- Individual play/download for each stem
- Option to download all as ZIP
- Stem mixing preview (optional future feature)

UI Layout:
```text
+--------------------------------------------------+
|  Music Splitter                           [New]  |
|  Split any track into individual stems           |
+--------------------------------------------------+
|     [  Upload your audio file  ]                 |
+--------------------------------------------------+
|  Stems:                                          |
|  +----------+ +----------+ +----------+          |
|  | Vocals   | | Drums    | | Bass     |          |
|  | [▶] [⬇] | | [▶] [⬇] | | [▶] [⬇] |          |
|  +----------+ +----------+ +----------+          |
|  +----------+ +----------+ +----------+          |
|  | Guitar   | | Piano    | | Other    |          |
|  | [▶] [⬇] | | [▶] [⬇] | | [▶] [⬇] |          |
|  +----------+ +----------+ +----------+          |
|                                                  |
|  [Download All Stems (ZIP)]                      |
+--------------------------------------------------+
```

### Step 7: Update ToolsSidebar and ToolContent

- Mark Voice Isolator, SFX Isolator, and Music Splitter as `available: true`
- Add the new components to the lazy-loading in ToolContent.tsx

### Step 8: Update supabase/config.toml

Add the new edge function configuration with `verify_jwt = false` for public access.

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/audio-stem-separation/index.ts` | Edge function for fal.ai API |
| `src/pages/tools/VoiceIsolator.tsx` | Voice removal/isolation UI |
| `src/pages/tools/SFXIsolator.tsx` | Sound effects isolation UI |
| `src/pages/tools/MusicSplitter.tsx` | Full 6-stem separation UI |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add audio-stem-separation function |
| `src/components/tools/ToolsSidebar.tsx` | Set available: true for 3 tools |
| `src/components/tools/ToolContent.tsx` | Add lazy imports for new components |

---

## Cost Considerations

fal.ai charges based on GPU time. Estimated costs:
- ~$0.05-0.15 per song processed (depends on length)
- A 3-minute song typically costs ~$0.08

You may want to consider:
1. **Usage limits**: Track usage per user/IP
2. **Rate limiting**: Prevent abuse
3. **Premium tier**: Charge for heavy users

---

## Technical Details

### Edge Function API

**Request:**
```typescript
{
  audio_url: string;     // URL to audio file
  mode: "voice" | "sfx" | "full";
  output_format?: "mp3" | "wav";
}
```

**Response:**
```typescript
{
  success: boolean;
  stems: {
    vocals?: { url: string; filename: string };
    drums?: { url: string; filename: string };
    bass?: { url: string; filename: string };
    guitar?: { url: string; filename: string };
    piano?: { url: string; filename: string };
    other?: { url: string; filename: string };
    instrumental?: { url: string; filename: string };
  };
  processing_time_ms: number;
}
```

### fal.ai Integration

```typescript
const result = await fal.subscribe("fal-ai/demucs", {
  input: {
    audio_url: audioUrl,
    model: "htdemucs_6s",  // Best quality, 6 stems
    stems: ["vocals", "drums", "bass", "other", "guitar", "piano"],
    output_format: "mp3",
    shifts: 1,
    overlap: 0.25
  }
});
```

---

## User Experience Flow

1. User selects Voice Isolator from sidebar
2. Drags audio file onto upload zone
3. File uploads to temp storage, gets public URL
4. Edge function called with URL and mode
5. Loading state shows with "Processing with AI..." message
6. Results appear with waveform visualizations
7. User can play each stem inline
8. Download buttons for each output

---

## Summary

| Component | Status | Complexity |
|-----------|--------|------------|
| Edge Function | New | Medium |
| Voice Isolator UI | New | Medium |
| SFX Isolator UI | New | Low |
| Music Splitter UI | New | Medium |
| Storage Bucket | New | Low |
| FAL_KEY Secret | Required | Setup |

This implementation provides professional-quality AI audio separation matching or exceeding vocalremover.org, with a clean UI that fits your existing Tools page design.
