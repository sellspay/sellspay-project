
# Vibecoder Complete Rebuild Plan

## Overview
Delete the entire existing Vibecoder system and rebuild from scratch with a **stable, simplified architecture** that avoids all the issues that have been causing crashes:

- **No Sandpack** - Replace with a simple iframe-based preview that loads static HTML+CSS+JS
- **No lovable.js mutation observer conflicts** - Simple DOM structure with minimal churn
- **No scorched earth/nuke logic** - Soft reset only (remount, no cache clearing)
- **Full data wipe** - Delete all existing projects and messages to start clean

---

## Phase 1: Database Cleanup

### Delete existing Vibecoder data
Run SQL migration to wipe all existing Vibecoder projects and messages:
```sql
DELETE FROM vibecoder_messages;
DELETE FROM vibecoder_projects;
```

This gives you a clean slate with no "zombie" projects or corrupted state.

---

## Phase 2: Delete Old Files

### Files to DELETE (ai-builder components)
All of these files will be removed:
- `AIBuilderCanvas.tsx` - The 1,400+ line monster causing crashes
- `VibecoderPreview.tsx` - Sandpack-based, causes MutationRecord errors
- `VibecoderChat.tsx` - Overly complex, tied to broken state
- `VibecoderHeader.tsx` - Had nuke button logic
- `VibecoderMessageBubble.tsx` - forwardRef issues
- `LiveThought.tsx` - forwardRef issues
- `DeleteConfirmationModal.tsx` - forwardRef issues
- `WorkspaceErrorBoundary.tsx` - Recovery for crashes we won't have
- `PreviewErrorBoundary.tsx` - Same
- `FixErrorToast.tsx` - Won't need error toast with stable preview
- `useStreamingCode.ts` - Complex streaming logic
- `useOrchestratorStream.ts` - Tied to old architecture
- `ProjectSidebar.tsx` - Will rebuild simpler
- `AgentProgress.tsx`, `StepList.tsx`, `CollapsibleMessage.tsx` - UI cruft
- All files in `hooks/` and `types/` folders

### Files to KEEP (reusable)
- `ChatInputBar.tsx` - The input bar works fine
- `ProfileMenu.tsx` - User dropdown works
- `PremiumGate.tsx` - Access control
- `InsufficientCreditsCard.tsx` - Credit errors
- `index.ts` - Will update exports

---

## Phase 3: New Architecture

### Core Principle: **Simplicity Over Features**
The new Vibecoder will be ~300 lines instead of 1,400+.

### New File Structure
```
src/components/ai-builder/
├── SimpleVibecoderPage.tsx    # Main page (~200 lines)
├── SimplePreview.tsx          # Iframe preview (no Sandpack)
├── SimpleChat.tsx             # Chat interface
├── SimpleSidebar.tsx          # Project list
├── ChatInputBar.tsx           # (existing, kept)
├── ProfileMenu.tsx            # (existing, kept)
├── PremiumGate.tsx            # (existing, kept)
└── InsufficientCreditsCard.tsx # (existing, kept)
```

### SimplePreview.tsx - The Key Change
Instead of Sandpack (which uses service workers, mutation observers, and complex bundling), we'll use a **simple iframe** that renders the generated code:

```tsx
// Simplified concept - no Sandpack, no service workers
function SimplePreview({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (!iframeRef.current) return;
    
    // Create a self-contained HTML document with Tailwind CDN
    const html = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`;

    // Write to iframe - simple, no mutation observers
    iframeRef.current.srcdoc = html;
  }, [code]);
  
  return <iframe ref={iframeRef} className="w-full h-full border-0" />;
}
```

**Why this is better:**
- No service workers (__csb_sw crashes = gone)
- No mutation observers inside preview
- No DataCloneError bridging issues
- Simple DOM update (one srcdoc change per generation)

### SimpleChat.tsx - Minimal Chat UI
```tsx
// Stripped down chat - just messages + input
function SimpleChat({ messages, isStreaming, onSend }) {
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        {messages.map(msg => (
          <div key={msg.id} className={msg.role === 'user' ? 'text-right' : ''}>
            <div className="p-3 rounded-lg bg-zinc-800">{msg.content}</div>
          </div>
        ))}
        {isStreaming && <Loader2 className="animate-spin" />}
      </ScrollArea>
      <ChatInputBar onSubmit={onSend} isGenerating={isStreaming} />
    </div>
  );
}
```

### SimpleVibecoderPage.tsx - The Main Page
Single file orchestrating everything:
```tsx
function SimpleVibecoderPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const handleSend = async (prompt: string) => {
    setIsStreaming(true);
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    
    // Call orchestrator (keeps existing edge function)
    const response = await callOrchestrator(prompt, code);
    
    // Update code and add assistant message
    setCode(response.code);
    setMessages(prev => [...prev, { role: 'assistant', content: response.summary }]);
    setIsStreaming(false);
  };
  
  return (
    <div className="flex h-screen">
      <SimpleSidebar />
      <SimplePreview code={code} />
      <SimpleChat messages={messages} onSend={handleSend} />
    </div>
  );
}
```

---

## Phase 4: Keep Backend As-Is

The edge functions (`vibecoder-orchestrator`, `vibecoder-builder`, `vibecoder-architect`, `vibecoder-linter`, `vibecoder-heal`) work fine - the crashes are all frontend. We keep them unchanged.

The only backend change is the database wipe in Phase 1.

---

## Phase 5: Update AIBuilder.tsx Page

Update `src/pages/AIBuilder.tsx` to use the new `SimpleVibecoderPage` component instead of the old `AIBuilderCanvas`.

---

## What You Lose (Temporarily)
- Image/Video generation tabs (can add back later)
- Device preview toggle (desktop/mobile)
- Page navigator dropdown
- Tweak/Regenerate modal
- Code view tab (only preview)
- Real-time streaming logs display

## What You Gain
- **Stability** - No more MutationRecord crashes
- **Speed** - Simpler DOM = faster renders
- **Reliability** - Code actually appears when AI says "Applied changes"
- **Sanity** - ~300 lines vs 1,400+ lines

---

## Timeline Estimate
- Phase 1 (DB wipe): 1 message
- Phase 2 (Delete files): 1 message
- Phase 3 (Build new): 2-3 messages
- Phase 4: No work needed
- Phase 5: Part of Phase 3

**Total: 4-5 messages to complete rebuild**

---

## Technical Notes

### Why iframe `srcdoc` is stable:
1. Writes a complete HTML document in one operation
2. No incremental DOM mutations for lovable.js to track
3. Sandboxed - errors in user code don't crash parent
4. No service workers = no __csb_sw crashes
5. No BroadcastChannel = no DataCloneError

### Soft reset behavior:
When user wants to "reset", we simply:
1. Clear local React state
2. Refetch from database
3. No cache clearing, no IndexedDB nukes, no service worker unregisters

This avoids the `Cannot set property attributeName of #<MutationRecord>` crash entirely.
