

# Vibecoder → Generative Runtime: Full Architecture Pivot

This is a **major architectural pivot** from a "Structured Page Builder" to a "Generative Runtime Environment" like Lovable/v0. The fundamental shift is:

**Current:** AI generates JSON ops → mapped to 10 pre-coded React components → rendered  
**Proposed:** AI generates raw React/TSX code → streamed to browser → executed in Sandpack sandbox

---

## Current System Analysis

| Component | Current Implementation |
|-----------|----------------------|
| **Rendering** | `AiRenderer` with 10 hardcoded blocks (HeroBlock, BentoGridBlock, etc.) |
| **AI Output** | JSON ops: `addSection`, `updateTheme`, `clearAllSections` |
| **Storage** | `ai_storefront_layouts.layout_json` (array of sections) |
| **Edge Function** | `storefront-vibecoder/index.ts` - non-streaming, returns full JSON |
| **Preview** | React components mapped via switch statement |

**Core Limitation:** The AI can ONLY produce what exists in the component library. No custom layouts, no unique designs, no new component types.

---

## Proposed Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                         NEW ARCHITECTURE                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│   User Prompt                                                      │
│        ↓                                                          │
│   Edge Function (storefront-vibecoder-v2)                          │
│   • Streams raw TSX code (not JSON)                               │
│   • Uses ReadableStream + SSE                                      │
│        ↓                                                          │
│   Frontend Parser                                                  │
│   • Accumulates streaming code                                     │
│   • Cleans markdown fences                                        │
│        ↓                                                          │
│   Sandpack Runtime                                                 │
│   • Executes code in isolated iframe                              │
│   • Handles Tailwind via CDN                                      │
│   • Auto-resolves npm imports (lucide, framer-motion)              │
│        ↓                                                          │
│   Live Preview                                                     │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Phase 1: New Edge Function (Streaming TSX Generator)

**New File:** `supabase/functions/vibecoder-v2/index.ts`

This function will:
1. Accept user prompt + context (existing code, products, brand)
2. Call Lovable AI Gateway with streaming enabled
3. Stream raw TSX code back to the client (not JSON)
4. Use a system prompt that outputs React components, not JSON ops

**System Prompt Strategy:**
```
You are an expert Frontend React Engineer.
You are generating a full, runnable React component using Tailwind CSS.

RULES:
1. Output ONLY the code. No markdown backticks, no explanations.
2. Use 'export default function App()'.
3. Use lucide-react for icons.
4. Use standard Tailwind classes.
5. Do not import external libraries besides lucide-react and framer-motion.
```

**Streaming Implementation:**
- Return a `ReadableStream` that forwards Lovable AI tokens as they arrive
- Use `text/event-stream` content type
- Parse the Lovable AI SSE format and forward clean text tokens

---

### Phase 2: Install Sandpack Runtime

**Dependency:** `@codesandbox/sandpack-react`

This package:
- Provides an in-browser code execution sandbox
- Handles npm imports via CDN (esm.sh, skypack)
- Isolates generated code in an iframe
- Includes built-in code editor (optional)

---

### Phase 3: New VFS Storage Schema

**New Table:** `project_files`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary Key |
| `profile_id` | uuid | FK to profiles |
| `file_path` | text | e.g., `/App.tsx`, `/components/Hero.tsx` |
| `content` | text | Raw TSX code |
| `version` | int | For version history |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

This enables:
- Multi-file projects
- Version history / undo
- Component reuse across pages

---

### Phase 4: Frontend Components

**New Component:** `src/components/ai-builder/VibecoderPreview.tsx`

This component will:
1. Accept streaming code via fetch with `response.body.getReader()`
2. Accumulate tokens and clean markdown fences
3. Pass code to Sandpack for live execution
4. Show code writing animation (tokens appearing)

**Integration:**
- Replace `<AIBuilderPreview>` with new `<VibecoderPreview>` component
- Keep existing `<AIBuilderChat>` UI with modifications for streaming state

---

### Phase 5: Mode Toggle (Hybrid Approach)

To preserve existing functionality while adding new capabilities:

| Mode | Description | Storage |
|------|-------------|---------|
| **Block Mode** (existing) | JSON ops → pre-coded components | `layout_json` |
| **Vibecoder Mode** (new) | Streamed TSX → Sandpack | `project_files` |

Users can toggle between modes. Block mode is faster/cheaper, Vibecoder mode is unlimited creative freedom.

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| **Create** | `supabase/functions/vibecoder-v2/index.ts` | Streaming TSX generator |
| **Create** | `src/components/ai-builder/VibecoderPreview.tsx` | Sandpack-based renderer |
| **Create** | `src/components/ai-builder/useStreamingCode.ts` | Hook for streaming code |
| **Modify** | `src/components/ai-builder/AIBuilderCanvas.tsx` | Add mode toggle, integrate new preview |
| **Modify** | `src/components/ai-builder/AIBuilderChat.tsx` | Handle streaming responses |
| **Modify** | `package.json` | Add `@codesandbox/sandpack-react` |

**Database Migration:**
- Create `project_files` table for VFS storage

---

## Technical Implementation Details

### Edge Function Streaming Pattern

```typescript
// In vibecoder-v2/index.ts
const response = await fetch(LOVABLE_AI_URL, {
  method: "POST",
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
  body: JSON.stringify({
    model: "google/gemini-3-flash-preview",
    messages: [...],
    stream: true,
  }),
});

const stream = new ReadableStream({
  async start(controller) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Parse SSE and forward clean text
      const chunk = decoder.decode(value);
      // Extract delta.content from SSE format
      controller.enqueue(new TextEncoder().encode(extractedText));
    }
    controller.close();
  },
});

return new Response(stream, {
  headers: { "Content-Type": "text/event-stream" }
});
```

### Frontend Streaming Consumer

```typescript
// useStreamingCode.ts
async function streamCode(prompt: string, onChunk: (text: string) => void) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/vibecoder-v2`, {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    accumulated += decoder.decode(value);
    const cleanCode = accumulated
      .replace(/^```tsx?\n?/, "")
      .replace(/```$/, "");
    
    onChunk(cleanCode);
  }
}
```

### Sandpack Integration

```typescript
// VibecoderPreview.tsx
import { Sandpack } from "@codesandbox/sandpack-react";

export function VibecoderPreview({ code }: { code: string }) {
  return (
    <Sandpack
      template="react-ts"
      theme="dark"
      files={{
        "/App.tsx": code,
      }}
      options={{
        externalResources: ["https://cdn.tailwindcss.com"],
        showNavigator: false,
      }}
      customSetup={{
        dependencies: {
          "lucide-react": "latest",
          "framer-motion": "latest",
        },
      }}
    />
  );
}
```

---

## Rollout Strategy

**Phase 1 (Week 1): ✅ COMPLETE**
- Created streaming edge function `vibecoder-v2`
- Installed Sandpack runtime
- Built `VibecoderPreview` and `VibecoderChat` components
- Added `useStreamingCode` hook
- Created `project_files` VFS table
- Added mode toggle in `AIBuilderCanvas`

**Phase 2 (Week 2):** VFS storage + version history  
**Phase 3 (Week 3):** Mode toggle + migration tools  
**Phase 4 (Week 4):** Polish, error handling, fallbacks

---

## Trade-offs

| Aspect | Current (Block Mode) | New (Vibecoder Mode) |
|--------|---------------------|---------------------|
| **Creative Freedom** | Limited to 10 blocks | Unlimited |
| **Speed** | Fast (JSON mapping) | Slower (LLM generates full code) |
| **Cost** | Lower (shorter prompts) | Higher (more tokens) |
| **Reliability** | Very stable | Requires error handling |
| **Maintenance** | Update component library | Update prompts |

**Recommendation:** Keep both modes. Block Mode for quick iterations, Vibecoder Mode for custom designs.

---

## Security Considerations

Sandpack runs code in an isolated iframe origin, so:
- No access to parent page DOM
- No access to cookies/localStorage
- Cannot make arbitrary network requests

Additional safeguards:
- Validate generated code for dangerous patterns (eval, document.cookie)
- Rate limit API calls
- Monitor for abuse patterns

