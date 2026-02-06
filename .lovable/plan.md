
# Implementation Plan: Silent Enforcer Prompt + Full Message Display + Sandpack Standard Library

This plan addresses three distinct issues:

1. **Silent Enforcer** - Stop the AI from announcing "Integrating payment gateway" on every build
2. **Full Message Display** - Remove "View More" truncation so messages display fully
3. **Standard Library Injection** - Prevent "Red Screen of Death" crashes from missing checkout hooks

---

## Part 1: Silent Enforcer (System Prompt Refinement)

### Problem
The AI is too eager to show compliance by logging "Integrating secure payment gateway..." even when the user only asked for visual changes like "Change images to anime."

### Solution
Update the system prompt in `supabase/functions/vibecoder-v2/index.ts` to add an "Infrastructure Awareness" section that tells the AI:
- The checkout system is **pre-installed** (not something to "integrate")
- Only log actions that **directly relate to the user's request**
- Never log boilerplate like "Setting up React" or "Integrating payments"

### Changes to System Prompt

Add this new section after the existing REAL-TIME LOGGING PROTOCOL:

```text
INFRASTRUCTURE AWARENESS (CORE ASSUMPTIONS):
1. **SellsPay Checkout is PRE-INSTALLED:** You do NOT need to "integrate," "setup," or "install" the checkout protocol. It is already part of the environment. The 'useSellsPayCheckout' hook is always available.
2. **Implicit Usage:** When you render a product card, just USE the hook silently. Do not list it as a "step" in your build logs unless the user explicitly asked about payments.
3. **Log Relevance:** Your [LOG: ...] outputs must ONLY reflect the specific changes requested.
   - If User asks: "Change images to anime"
   - BAD Log: "[LOG: Integrating secure payment gateway...]" (Redundant)
   - GOOD Log: "[LOG: Updating product asset URLs...]"
4. **No Boilerplate Logs:** Never output logs for "Initializing React," "Setting up Tailwind," "Integrating Payments," or "Configuring checkout" if you are just editing an existing component.
```

Also refine the RULES section of the logging protocol:

```text
RULES:
- Emit 3-6 LOG tags per generation (not too many, not too few)
- Each LOG should be a short, user-friendly description (5-10 words)
- LOG tags appear BEFORE the "/// TYPE: CODE ///" flag
- Do NOT use LOG tags in CHAT mode (questions/refusals)
- **Context-Aware Logging:** Only log actions that directly change the code based on the CURRENT prompt
- **Never log infrastructure that's already present:** payments, React setup, Tailwind, etc.
```

---

## Part 2: Full Message Display (Remove Collapsible Logic)

### Problem
The "View More" button with 400-character truncation is considered annoying. Users want to see the full AI response immediately and scroll naturally within the chat history.

### Solution
Remove the `CollapsibleMessage` wrapper and render the message content directly with the safe CSS classes (to prevent layout breaking from long URLs).

### File: `src/components/ai-builder/VibecoderMessageBubble.tsx`

**Changes:**
1. Remove the `CollapsibleMessage` import
2. In `UserBubble`: Replace `<CollapsibleMessage content={content} isUser={true} />` with a direct `<div>` containing the text
3. In `AssistantCard`: Replace `<CollapsibleMessage content={displayContent} isUser={false} />` with a direct `<div>` containing the text
4. Keep the safety CSS classes: `break-words break-all whitespace-pre-wrap prose prose-sm prose-invert`

**Before:**
```tsx
<CollapsibleMessage content={content} isUser={true} />
```

**After:**
```tsx
<div className="prose prose-sm prose-invert max-w-none leading-relaxed break-words break-all whitespace-pre-wrap">
  {content}
</div>
```

### File: `src/components/ai-builder/CollapsibleMessage.tsx`
- This file can be deleted OR kept for potential future use. We'll keep it for now but remove its usage.

---

## Part 3: Sandpack Standard Library (Crash Prevention)

### Problem
When the AI generates code that imports `useSellsPayCheckout`, the Sandpack preview crashes with "Red Screen of Death" because the file doesn't exist in the virtual file system.

### Solution
Create a "Standard Library" that gets automatically injected into every Sandpack preview. This ensures the marketplace hooks are always available.

### New File: `src/lib/vibecoder-stdlib.ts`

```typescript
/**
 * Standard Library for Vibecoder Sandpack Previews
 * These files are automatically injected into every preview environment
 * to prevent crashes when AI-generated code imports platform hooks.
 */
export const VIBECODER_STDLIB = {
  // The SellsPay Checkout Hook (mocked for preview)
  '/hooks/useSellsPayCheckout.ts': `import { useState } from 'react';

/**
 * SellsPay Unified Checkout Hook
 * This is a preview mock. In production, this triggers the real checkout.
 */
export function useSellsPayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);

  const buyProduct = async (productId: string) => {
    setIsProcessing(true);
    console.log('[SellsPay Preview] Checkout triggered for:', productId);
    
    // Simulate checkout delay
    setTimeout(() => {
      setIsProcessing(false);
      alert('SellsPay Checkout: Redirecting to secure gateway... (Preview Mode)');
    }, 1000);
  };

  return { buyProduct, isProcessing };
}

// Alias for backwards compatibility
export const useMarketplace = useSellsPayCheckout;
`,

  // Common utilities (prevents missing cn() crashes)
  '/lib/utils.ts': `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
};
```

### File: `src/components/ai-builder/VibecoderPreview.tsx`

**Changes:**
1. Import the new `VIBECODER_STDLIB` constant
2. Merge it into the Sandpack `files` object so the hooks are always available
3. Add `clsx` and `tailwind-merge` to the `customSetup.dependencies`

**Updated files object:**
```typescript
import { VIBECODER_STDLIB } from '@/lib/vibecoder-stdlib';

// Inside SandpackRenderer:
const files = useMemo(() => ({
  // Standard library (hooks, utils) - always available
  ...VIBECODER_STDLIB,
  
  // The AI-generated code
  '/App.tsx': {
    code,
    active: true,
  },
  '/index.tsx': {
    code: `...`, // existing entry point
    hidden: true,
  },
}), [code]);
```

**Updated dependencies:**
```typescript
customSetup={{
  dependencies: {
    'lucide-react': 'latest',
    'framer-motion': '^11.0.0',
    'clsx': 'latest',
    'tailwind-merge': 'latest',
  },
}}
```

---

## Technical Summary

| File | Changes |
|------|---------|
| `supabase/functions/vibecoder-v2/index.ts` | Add "Infrastructure Awareness" section + refine logging rules |
| `src/components/ai-builder/VibecoderMessageBubble.tsx` | Remove `CollapsibleMessage` usage, render text directly |
| `src/lib/vibecoder-stdlib.ts` | **New file** - Standard library with checkout hook mock |
| `src/components/ai-builder/VibecoderPreview.tsx` | Inject STDLIB into Sandpack files, add clsx/tailwind-merge deps |

---

## Expected Results

### After Part 1 (Silent Enforcer):
- User: "Change images to anime"
- AI Logs: `[✓] Updating product asset URLs...` `[✓] Applying changes...`
- (No more "Integrating payment gateway" spam)

### After Part 2 (Full Display):
- Long AI responses show completely without "View More" button
- Users scroll the chat panel naturally to read everything
- Long URLs/code still break correctly without widening the layout

### After Part 3 (Standard Library):
- No more "Red Screen of Death" when AI uses `useSellsPayCheckout()`
- The hook is mocked in preview (shows alert with "Preview Mode")
- The `cn()` utility is also available, preventing common crashes
