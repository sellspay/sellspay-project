
# Implementation Plan: Real-Time Transparency & Marketplace Protocol

This plan implements two major features for the Vibecoder AI Builder:

1. **Real-Time Transparency** - Live streaming logs that show the AI's "thought process" step-by-step
2. **Marketplace Protocol** - "Iron Dome" safeguards to prevent sellers from adding external payment gateways

---

## Part 1: Real-Time Transparency (Live Logs)

### Overview
Instead of a blank screen for 10 seconds followed by a result, users will see live "Building..." logs that animate in real-time, then collapse into a summary card when complete.

### 1.1 Backend: Add Logging Protocol to System Prompt

**File:** `supabase/functions/vibecoder-v2/index.ts`

Add a new section to the `SYSTEM_PROMPT` that instructs the AI to emit `[LOG: ...]` tags *before* generating code:

```text
REAL-TIME LOGGING PROTOCOL:
While building, you must "narrate" your actions using specific tags BEFORE writing the code.
Format: [LOG: Action Description]

Example Output Stream:
[LOG: Analyzing user request...]
[LOG: Designing responsive grid layout...]
[LOG: Creating Hero section with gradient overlay...]
[LOG: Adding product cards with glassmorphism effect...]
[LOG: Finalizing layout and animations...]
/// TYPE: CODE ///
export default function App() { ... }

RULES:
- Emit 3-6 LOG tags per generation (not too many, not too few)
- Each LOG should be a short, user-friendly description (5-10 words)
- LOG tags appear BEFORE the "/// TYPE: CODE ///" flag
- Do NOT use LOG tags in CHAT mode (questions/refusals)
```

### 1.2 Frontend: Parse Logs from Stream

**File:** `src/components/ai-builder/useStreamingCode.ts`

Modify the streaming logic to detect and extract `[LOG: ...]` tags:

1. Add a new callback option: `onLogUpdate?: (logs: string[]) => void`
2. During streaming, use regex to detect `[LOG: ...]` patterns
3. Push extracted logs to the callback immediately (before the full stream completes)
4. Strip the LOG tags from the final code output

```typescript
// Regex pattern for log extraction
const LOG_PATTERN = /\[LOG:\s*([^\]]+)\]/g;

// Inside the streaming while loop:
const logMatches = accumulated.matchAll(LOG_PATTERN);
for (const match of logMatches) {
  const logText = match[1].trim();
  if (!seenLogs.has(logText)) {
    seenLogs.add(logText);
    accumulatedLogs.push(logText);
    options.onLogUpdate?.(accumulatedLogs);
  }
}
// Clean buffer before processing as code
cleanedBuffer = accumulated.replace(LOG_PATTERN, '');
```

### 1.3 Canvas: Track Live Steps State

**File:** `src/components/ai-builder/AIBuilderCanvas.tsx`

Add state to track "live steps" during streaming:

1. Add `liveSteps` state: `useState<string[]>([])`
2. Pass `onLogUpdate` callback to `useStreamingCode` that updates `liveSteps`
3. Clear `liveSteps` when streaming completes

### 1.4 Chat UI: Show Live Steps During Build

**File:** `src/components/ai-builder/VibecoderMessageBubble.tsx`

Update the `AssistantCard` component:

1. Accept a new prop: `liveSteps?: string[]`
2. When `isStreaming` is true AND `liveSteps` has items, render them as "in-progress" steps
3. The last step in the list shows a spinning loader; all previous steps show checkmarks
4. When streaming ends, the steps convert to the final "completed" summary

**New Streaming Card UI:**
```text
┌────────────────────────────────────┐
│ 🔮 Building your request...        │
│                                    │
│ ✓ Analyzing user request...        │
│ ✓ Designing responsive grid...     │
│ ⟳ Creating Hero section...         │  ← Spinner on last item
│                                    │
└────────────────────────────────────┘
```

### 1.5 Types Update

**File:** `src/components/ai-builder/types/chat.ts`

Update types to support the live streaming state:

```typescript
export interface LiveBuildState {
  logs: string[];
  startedAt: Date;
}
```

---

## Part 2: Marketplace Protocol ("Iron Dome")

### Overview
SellsPay is a **managed marketplace** (like Roblox/Etsy), not a website builder (like Shopify). Sellers cannot add their own Stripe keys or external payment links. All transactions flow through the platform's unified checkout.

### 2.1 Backend: Add Financial Protocol to System Prompt

**File:** `supabase/functions/vibecoder-v2/index.ts`

Add a new "MARKETPLACE PROTOCOL" section that:

1. **Forbids external payment gateways** - The AI must refuse requests to add personal Stripe keys, PayPal links, CashApp, etc.
2. **Mandates unified checkout** - All "Buy" buttons must use the platform hook
3. **Provides the correct code pattern** - Shows the AI exactly what to generate

```text
STRICT MARKETPLACE PROTOCOL (NON-NEGOTIABLE):
You are the AI Architect for SellsPay, a MANAGED MARKETPLACE.

1. **NO CUSTOM GATEWAYS:** 
   - You are STRICTLY FORBIDDEN from generating code that asks for Stripe Keys, PayPal Client IDs, or API Secrets.
   - You CANNOT generate <a href="paypal.me/..."> or CashApp links.
   - You CANNOT create input fields for "API Key" or "Secret Key" related to payments.

2. **UNIFIED CHECKOUT ONLY:**
   - All purchases MUST use the 'useSellsPayCheckout()' hook.
   - Import: import { useSellsPayCheckout } from "@/hooks/useSellsPayCheckout"
   - When a user clicks "Buy", you do NOT process payment locally.
   - You ONLY trigger the SellsPay Checkout Modal.

3. **HARD REFUSAL PROTOCOL:**
   - IF User asks: "Add my PayPal button" or "Link my Stripe API key" or "Add CashApp link"
   - THEN Output: "/// TYPE: CHAT ///"
   - AND Say: "I cannot add external payment providers. SellsPay is a managed marketplace that handles all transactions securely to ensure your Creator Protection and automated tax compliance. Your earnings are routed automatically to your Payouts Dashboard."

4. **PRODUCT DATA CONTEXT:**
   - Products are stored in the 'products' table (id, name, price_cents, creator_id).
   - When building a Product Card, the actual product data comes from props or a fetch.
   - For mockups, use placeholder IDs like 'prod_preview_1'.

CORRECT BUY BUTTON CODE:
const { buyProduct, isProcessing } = useSellsPayCheckout();

<button 
  onClick={() => buyProduct(product.id)}
  disabled={isProcessing}
  className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-lg font-bold"
>
  {isProcessing ? "Redirecting..." : "Purchase Securely"}
</button>
```

### 2.2 Create the Unified Checkout Hook

**File:** `src/hooks/useSellsPayCheckout.ts` (New File)

Create a simple hook that abstracts the checkout flow. The AI only knows about this hook - it has no knowledge of Stripe internals.

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSellsPayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);

  const buyProduct = async (productId: string) => {
    setIsProcessing(true);
    try {
      // Call the platform's unified checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { product_id: productId }
      });

      if (error) throw error;

      // Redirect to the secure SellsPay checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout unavailable');
      }
    } catch (err) {
      console.error('SellsPay checkout error:', err);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return { buyProduct, isProcessing };
}
```

### 2.3 UI Terminology Updates (Optional Polish)

To reinforce the marketplace model, the system prompt should guide the AI to use "Creator Earnings" instead of "Revenue" and "Wallet" icons instead of "CreditCard" icons when showing payment-related UI.

---

## Technical Summary

| File | Changes |
|------|---------|
| `supabase/functions/vibecoder-v2/index.ts` | Add Real-Time Logging Protocol + Marketplace Protocol to system prompt |
| `src/components/ai-builder/useStreamingCode.ts` | Add log parsing logic, new `onLogUpdate` callback |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Add `liveSteps` state, wire up `onLogUpdate` callback |
| `src/components/ai-builder/VibecoderMessageBubble.tsx` | Add live steps rendering during streaming |
| `src/components/ai-builder/types/chat.ts` | Add `LiveBuildState` interface |
| `src/hooks/useSellsPayCheckout.ts` | New file: unified checkout hook for AI-generated storefronts |

---

## Expected User Experience

### Real-Time Transparency Flow
1. User types: "Make a dark anime store"
2. Immediately: A card appears saying "Building your request..." with pulsing avatar
3. 0.5s: `[✓] Analyzing user request...` appears
4. 1.5s: `[✓] Designing responsive grid...` + `[⟳] Creating Hero section...`
5. 3s: Steps continue animating as logs stream in
6. Done: Card transforms to "I've designed your storefront!" with static step summary

### Marketplace Protocol Flow
1. User asks: "Add my personal Stripe key so I get paid directly"
2. AI detects violation, enters CHAT mode
3. Response: "I cannot add external payment providers. SellsPay handles all transactions securely..."
4. User asks: "Fine, just make a Buy button"
5. AI generates code with `useSellsPayCheckout()` hook - no raw Stripe code
