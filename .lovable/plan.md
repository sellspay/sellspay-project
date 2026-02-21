
# Modular Multi-File Builder Architecture

## Problem

Every generation regenerates the entire storefront as a single `App.tsx` (8,000-20,000+ chars). Even "fix click handler" rewrites the Navbar, Hero, Footer, Products, About, and routing. This causes:

- Truncation failures (output too large)
- Massive token waste per edit
- False-positive safe-limit rejections
- Slow generation for trivial changes

## Architecture Change

Switch from single-file monolith to multi-file project structure where the AI only regenerates the file that changed.

```text
Current:                          Target:
/App.tsx (3000+ lines)    -->     /App.tsx (~30 lines, routing only)
                                  /components/Navbar.tsx
                                  /pages/Home.tsx
                                  /pages/Products.tsx
                                  /pages/About.tsx
                                  /pages/Contact.tsx
                                  /components/Footer.tsx
```

## Constraints to Work Within

- **Static UI mandate**: No `useState`/`useEffect` in generated code (except `useSellsPayCheckout`)
- **Sandpack environment**: Must inject all files into Sandpack provider
- **Existing data model**: `vibecoder_messages.code_snapshot` is a single text column; `project_versions.files_snapshot` is already jsonb
- The system currently passes a single `currentCode` string to the edge function

---

## Phase 1: Multi-File Storage Layer

### 1A. Update `vibecoder_projects` schema

Add a `files` column (jsonb) to store the full file map:

```sql
ALTER TABLE vibecoder_projects 
  ADD COLUMN IF NOT EXISTS files jsonb DEFAULT '{}';
```

The edge function already writes to this column (line 1661: `{ "App.tsx": codeResult }`), but the column doesn't exist in the schema yet. This migration makes it real.

### 1B. Update `vibecoder_messages` to support multi-file snapshots

Add a `files_snapshot` jsonb column alongside the existing `code_snapshot` text column (backward compatible):

```sql
ALTER TABLE vibecoder_messages 
  ADD COLUMN IF NOT EXISTS files_snapshot jsonb;
```

When populated, `files_snapshot` takes precedence. When null, fall back to `code_snapshot` (legacy single-file).

---

## Phase 2: Sandpack Multi-File Rendering

### 2A. Update `VibecoderPreview.tsx`

Change the props from `code: string` to `files: Record<string, string>`.

The `SandpackRenderer` `files` memo changes from:

```typescript
'/App.tsx': { code, active: true }
```

To:

```typescript
// Spread all project files into Sandpack
...Object.fromEntries(
  Object.entries(projectFiles).map(([path, content]) => [
    path.startsWith('/') ? path : `/${path}`,
    { code: content, active: path.includes('App') }
  ])
)
```

### 2B. Update `AIBuilderCanvas.tsx`

Replace the single `code` string state with a `files: Record<string, string>` state. The `useStreamingCode` hook returns a files map instead of a single string. The canvas passes the full map to `VibecoderPreview`.

---

## Phase 3: Targeted File Generation (Edge Function)

### 3A. Add `edit_target` to the generation pipeline

The intent classifier already returns `resolved_target`. Extend it to also return `edit_target_file`:

```json
{
  "intent": "MODIFY",
  "resolved_target": "Products section",
  "edit_target_file": "pages/Products.tsx"
}
```

### 3B. File-Scoped Code Generation

When `edit_target_file` is set:

- Send ONLY that file's content as `currentCode` (not the entire project)
- Instruct the model: "Return ONLY the updated file. File path: /pages/Products.tsx"
- Response is smaller, faster, and never hits truncation

When `edit_target_file` is null (full build or ambiguous):

- Send App.tsx + all files as context
- Model returns the full file map

### 3C. Update the system prompt for multi-file output

For full builds (BUILD intent, no existing code), the model outputs:

```
/// TYPE: CODE ///
<summary>
/// BEGIN_FILES ///
/// FILE: /App.tsx ///
<routing code>
/// FILE: /pages/Home.tsx ///
<home page code>
/// FILE: /pages/Products.tsx ///
<products page code>
/// FILE: /components/Navbar.tsx ///
<navbar code>
/// END_FILES ///
// --- VIBECODER_COMPLETE ---
```

For targeted edits (MODIFY/FIX with `edit_target_file`), the model outputs the normal single-file format but only for that one file.

### 3D. Update the code extraction logic

In the edge function (lines 1554-1566), add a `BEGIN_FILES` parser that splits the output into a file map:

```typescript
if (fullContent.includes("/// BEGIN_FILES ///")) {
  const fileMap = parseMultiFileOutput(fullContent);
  // Merge with existing project files (only overwrite changed files)
  const mergedFiles = { ...existingFiles, ...fileMap };
  // Save to vibecoder_projects.files
}
```

---

## Phase 4: Transitional Migration

### 4A. Legacy single-file backward compatibility

- If `vibecoder_projects.files` is empty/null, fall back to reading from `code_snapshot` in messages (current behavior)
- When loading a legacy project, auto-migrate: wrap existing single-file code as `{ "App.tsx": code }`
- All new generations write to the `files` jsonb column

### 4B. Routing in Sandpack

Even though the static UI mandate bans `useState`/`useEffect`, routing via `react-router-dom` is declarative and stateless. The generated `App.tsx` uses:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom"
// ... page imports

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
```

This requires adding `react-router-dom` to Sandpack's `customSetup.dependencies`.

### 4C. Update `useVibecoderProjects` hook

- `getLastCodeSnapshot()` returns the files map (from `files_snapshot` jsonb, falling back to wrapping `code_snapshot`)
- `addMessage()` accepts an optional `filesSnapshot` parameter
- Undo/restore operates on the files map

---

## Phase 5: Frontend Hook Changes

### 5A. `useStreamingCode.ts`

- Parse `BEGIN_FILES` format from SSE stream
- Maintain a `files` state map instead of single `code` string
- For targeted edits, merge the returned file into the existing map
- Expose `files`, `setFiles`, `setFileContent(path, code)` instead of `code`, `setCode`

### 5B. `useGhostFixer.ts`

- When healing, send only the broken file (identified by the validation error), not the whole project
- Healer prompt changes to: "Produce a COMPLETE file for: /pages/Products.tsx"

### 5C. Page Navigator

The existing `parseRoutesFromCode` in `routeParser.ts` works on App.tsx to detect routes. This continues working since App.tsx still contains the Route definitions.

---

## Technical Summary

| Layer | Current | After |
|-------|---------|-------|
| Storage | `code_snapshot` (text, single file) | `files_snapshot` (jsonb, file map) + backward compat |
| Edge Function Input | `currentCode` (full monolith) | `currentFiles` + `editTargetFile` |
| Edge Function Output | Single code block | `BEGIN_FILES` multi-file or single targeted file |
| Sandpack | `{ '/App.tsx': code }` | `{ '/App.tsx': routing, '/pages/Home.tsx': home, ... }` |
| Generation scope | Always full file | Targeted file when possible |
| Token usage per edit | 8,000-20,000+ | 500-3,000 (single file) |

## Impact

- **Truncation**: Virtually eliminated for edits (target file is 200-800 lines, not 3000+)
- **Token cost**: 5-10x reduction for modifications
- **Speed**: Faster generation (smaller output)
- **Reliability**: Validation gates rarely trigger on small files
- **User experience**: Edits feel instant instead of rebuilding everything
