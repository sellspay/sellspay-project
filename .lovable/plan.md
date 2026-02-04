

# AI Toolkit Showcase Redesign - Tool-Specific Views

## Overview
Redesign the AI Toolkit section to display **unique, tool-appropriate layouts** for each toggle button. Each tool will have a completely different visual representation that matches its actual functionality, instead of the generic bento grid currently used for all tools.

---

## Tool-Specific View Designs

### 1. SFX Generator View
**Layout**: Full-width animated waveform visualization with prompt input

```text
+---------------------------------------------------------------+
|                                                               |
|   ▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁       |
|   ▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁       |
|                     (Animated waveform bars)                   |
|                                                               |
+---------------------------------------------------------------+
|  [Image] [Video]  "Cinematic explosion with debris...|"  [>]  |
+---------------------------------------------------------------+
```

**Elements**:
- Animated waveform bars spanning full width (80-120 bars)
- Bars animate with subtle randomized heights using CSS keyframes
- Amber/orange gradient background
- Bottom: Typewriter prompt input bar with generate button

---

### 2. Voice Isolator View
**Layout**: 2-panel split showing original vs separated audio

```text
+-----------------------------+-----------------------------+
|                             |                             |
|    ORIGINAL AUDIO           |      SEPARATED STEMS        |
|                             |                             |
|    [Waveform display]       |    [Vocals waveform]        |
|    ▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█        |    ▁▂▅█▇▂▁▃▅█▇▅▃           |
|                             |                             |
|    song.mp3                 |    [Instrumental waveform]  |
|                             |    ▃▅▇█▇▅▃▂▁▂▃▅▇           |
|                             |                             |
+-----------------------------+-----------------------------+
|         [+ Upload File]  Drag & drop or click to add      |
+-----------------------------------------------------------+
```

**Elements**:
- Left panel: Original audio with single waveform
- Right panel: Two split waveforms (Vocals + Instrumental)
- Purple gradient theme
- Bottom: File upload dropzone (no text input)

---

### 3. Manga Generator View
**Layout**: Before/After image grid with generate button

```text
+---------------+---------------+---------------+---------------+
|               |               |               |               |
|   [BEFORE]    |   [AFTER]     |   [BEFORE]    |   [AFTER]     |
|   Photo/      |   Manga       |   Photo/      |   Manga       |
|   Sketch      |   Style       |   Sketch      |   Style       |
|               |               |               |               |
+---------------+---------------+---------------+---------------+
|               |               |               |               |
|   [BEFORE]    |   [AFTER]     |   [BEFORE]    |   [AFTER]     |
|               |               |               |               |
+---------------+---------------+---------------+---------------+
|                    [Generate Result]                          |
+---------------------------------------------------------------+
```

**Elements**:
- 4x2 grid of before/after pairs
- Each pair has "Before" and "After" labels
- Pink/rose gradient theme
- Bottom: Large "Generate Result" button (no text input)

---

### 4. Video Generator View
**Layout**: One large video with thumbnail slider

```text
+---------------------------------------------------------------+
|                                                               |
|                    [LARGE VIDEO PREVIEW]                       |
|                                                               |
|                         ▶ Play                                 |
|                                                               |
+---------------------------------------------------------------+
|   [thumb 1]   |   [thumb 2]   |   [thumb 3]   |   [thumb 4]   |
+---------------------------------------------------------------+
|  [Image] [Video]  "Drone shot over mountains...|"  [Generate] |
+---------------------------------------------------------------+
```

**Elements**:
- Large main video display area (16:9 aspect)
- Horizontal thumbnail slider with 4 video previews
- Cyan/teal gradient theme
- Bottom: Typewriter prompt input bar (text-to-video)

---

## Technical Implementation

### Component Structure

```tsx
// Render different content based on activeTool
{activeTool === 'sfx' && <SFXView config={activeConfig} displayedText={displayedText} />}
{activeTool === 'vocal' && <VocalView config={activeConfig} />}
{activeTool === 'manga' && <MangaView config={activeConfig} />}
{activeTool === 'video' && <VideoView config={activeConfig} displayedText={displayedText} />}
```

### Animated Waveform (SFX)

```tsx
// Generate animated bars
const [waveformBars] = useState(() => 
  Array.from({ length: 100 }, () => Math.random() * 0.6 + 0.2)
);

// CSS animation with staggered delays
{waveformBars.map((height, i) => (
  <div
    key={i}
    className="w-1 bg-amber-500/60 rounded-full animate-pulse"
    style={{
      height: `${height * 100}%`,
      animationDelay: `${i * 0.02}s`,
      animationDuration: `${0.8 + Math.random() * 0.4}s`
    }}
  />
))}
```

### Split Panel Waveforms (Voice Isolator)

```tsx
// Two-column layout with separate waveform visualizations
<div className="grid grid-cols-2 gap-4 h-full">
  {/* Original side */}
  <div className="border border-foreground/10 p-6 flex flex-col">
    <span className="text-xs text-muted-foreground mb-4">ORIGINAL</span>
    <WaveformDisplay color="purple" />
    <span className="text-sm mt-auto">song.mp3</span>
  </div>
  
  {/* Separated side */}
  <div className="border border-foreground/10 p-6 space-y-4">
    <span className="text-xs text-muted-foreground">SEPARATED</span>
    <WaveformDisplay color="violet" label="Vocals" />
    <WaveformDisplay color="green" label="Instrumental" />
  </div>
</div>
```

### Before/After Grid (Manga)

```tsx
// 4 pairs of before/after gradient cards
const pairs = [
  { before: 'from-pink-800/40', after: 'from-rose-600/50' },
  { before: 'from-pink-700/30', after: 'from-fuchsia-500/40' },
  // ...
];

<div className="grid grid-cols-4 gap-2">
  {pairs.map((pair, i) => (
    <>
      <div className={`aspect-[3/4] bg-gradient-to-br ${pair.before} relative`}>
        <span className="absolute top-2 left-2 text-[10px] text-foreground/50">BEFORE</span>
      </div>
      <div className={`aspect-[3/4] bg-gradient-to-br ${pair.after} relative`}>
        <span className="absolute top-2 left-2 text-[10px] text-foreground/50">AFTER</span>
      </div>
    </>
  ))}
</div>
```

### Video Thumbnail Slider

```tsx
// Large video + horizontal thumbnails
<div className="flex flex-col h-full">
  {/* Main video */}
  <div className="flex-1 bg-gradient-to-br from-cyan-800/50 relative">
    <PlayButton />
  </div>
  
  {/* Thumbnail row */}
  <div className="flex gap-2 mt-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex-1 aspect-video bg-gradient-to-br from-teal-700/40" />
    ))}
  </div>
</div>
```

---

## Bottom Action Bar Logic

Each tool gets a different action bar:

| Tool | Action Bar Type |
|------|----------------|
| SFX Generator | Typewriter prompt + Generate button |
| Voice Isolator | File upload dropzone |
| Manga Generator | "Generate Result" button only |
| Video Generator | Typewriter prompt + Generate button |

```tsx
// Conditional bottom bar
{(activeTool === 'sfx' || activeTool === 'video') && (
  <PromptInputBar displayedText={displayedText} accentColor={activeConfig.accentColor} />
)}

{activeTool === 'vocal' && (
  <FileUploadBar />
)}

{activeTool === 'manga' && (
  <GenerateButton />
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/home/ToolsShowcase.tsx` | Complete redesign with 4 unique view components |

---

## Visual Theming Per Tool

| Tool | Primary Colors | Accent |
|------|---------------|--------|
| SFX Generator | Amber/Orange/Stone | `text-amber-400` |
| Voice Isolator | Purple/Violet/Fuchsia | `text-purple-400` |
| Manga Generator | Pink/Rose/Red | `text-pink-400` |
| Video Generator | Cyan/Teal/Sky | `text-cyan-400` |

