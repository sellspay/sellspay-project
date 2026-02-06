
# VibeCoder Emergency Repair Implementation Plan

## Problem Statement
The VibeCoder AI Builder is experiencing cascading failures where:
1. **Structural Code Hallucination**: The AI generates code with hooks placed inside arrays (e.g., `const MOVIES = [ ... const { buyProduct } = useSellsPayCheckout();`) or missing `export default function App()` wrappers
2. **Build Crashes**: Sandpack compiler hits "Unexpected token" errors, causing white screens
3. **Chat History Not Displaying**: React tree crashes before rendering history components
4. **"Success with No Code"**: AI claims success but delivers broken/empty code

## Solution Architecture

The fix implements a **three-layer defense** to prevent, detect, and heal structural code failures:

```text
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 1: ENHANCED BUILDER PROMPT (vibecoder-builder)           │
│  → Prevent broken code generation with strict structural rules   │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 2: STRUCTURAL CODE GUARD (vibecoder-orchestrator)        │
│  → Validate code structure BEFORE delivery to frontend          │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 3: AUTO-HEAL ON SANDPACK ERROR (AIBuilderCanvas)         │
│  → Automatically trigger healing when Sandpack crashes          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Phase 1: Enhanced Builder Prompt (vibecoder-builder/index.ts)

Replace the existing `BUILDER_SYSTEM_PROMPT` with your comprehensive SellsPay-specific prompt that includes:

**STRUCTURAL INTEGRITY SECTION (NON-NEGOTIABLE)**:
- **COMPONENT WRAPPER**: Always start with `export default function App() {`
- **HOOK PLACEMENT**: All hooks MUST be inside the `App()` function body at the top level
- **DATA DECLARATION**: Data constants MUST be defined OUTSIDE the `App` component and completely closed with `];`

**MARKETPLACE RULES (SELLSPAY SPECIFIC)**:
- Digital-only marketplace context
- Centralized checkout via `useSellsPayCheckout()` hook
- Preview capability for digital goods

**CASCADE FAILURE PREVENTION EXAMPLES**:
```typescript
// ❌ NEVER DO THIS:
const DATA = [
  { id: 1, action: () => { const { buy } = useSellsPayCheckout(); } }
];

// ✅ ALWAYS DO THIS:
const PRODUCTS = [{ id: 'prod_1', name: 'Pro LUT Pack' }];

export default function App() {
  const { buyProduct } = useSellsPayCheckout();
  // ... rest of component
}
```

---

### Phase 2: Structural Code Guard (vibecoder-orchestrator/index.ts)

Add a `validateCodeStructure()` function that runs BEFORE delivering code to the frontend:

```typescript
function validateCodeStructure(code: string): { valid: boolean; error?: string } {
  // Check 1: Must have the component wrapper
  if (!code.includes('export default function App')) {
    return { valid: false, error: 'Missing export default function App wrapper' };
  }
  
  // Check 2: Hooks cannot appear before the component declaration
  const appIndex = code.indexOf('export default function App');
  const hookPatterns = ['useEffect(', 'useState(', 'useCallback(', 'useMemo(', 'useSellsPayCheckout('];
  
  for (const hook of hookPatterns) {
    const hookIndex = code.indexOf(hook);
    if (hookIndex >= 0 && hookIndex < appIndex) {
      return { valid: false, error: `Hook "${hook}" called outside component boundary` };
    }
  }
  
  // Check 3: Basic bracket balance (catches obvious collapses)
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (Math.abs(openBraces - closeBraces) > 3) {
    return { valid: false, error: 'Severely unbalanced braces - likely syntax error' };
  }
  
  return { valid: true };
}
```

If validation fails, the orchestrator will:
1. Log the structural error
2. Automatically retry with healing context (within the existing 3-attempt limit)
3. Only deliver code after validation passes

---

### Phase 3: Auto-Heal on Sandpack Error (AIBuilderCanvas.tsx)

Modify `handlePreviewError` to automatically trigger healing for structural errors:

```typescript
const handlePreviewError = useCallback((errorMsg: string) => {
  // Prevent duplicate healing for the same error
  if (lastPreviewErrorRef.current === errorMsg) return;
  lastPreviewErrorRef.current = errorMsg;
  
  setPreviewError(errorMsg);
  setShowFixToast(true);
  
  // Trigger self-correction state in agent for UI feedback
  triggerSelfCorrection(errorMsg);
  
  // VibeCoder 2.2: AUTO-HEAL on structural errors
  const isStructuralError = 
    errorMsg.includes('Unexpected token') ||
    errorMsg.includes('SyntaxError') ||
    errorMsg.includes('is not defined') ||
    errorMsg.includes('Cannot use import') ||
    errorMsg.includes('export');
  
  // Auto-heal structural errors immediately (no user click needed)
  if (isStructuralError && !isAgentRunning) {
    console.log('[VibeCoder 2.2] Auto-triggering heal for structural error');
    const codeToHeal = lastGeneratedCode || code;
    healCode(errorMsg, codeToHeal);
    setShowFixToast(false); // Hide toast since we're auto-healing
  }
}, [healCode, lastGeneratedCode, code, isAgentRunning, triggerSelfCorrection]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/vibecoder-builder/index.ts` | Replace system prompt with comprehensive SellsPay-specific version including STRUCTURAL INTEGRITY rules |
| `supabase/functions/vibecoder-orchestrator/index.ts` | Add `validateCodeStructure()` function before code delivery |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Implement auto-heal on structural Sandpack errors |

---

## Technical Implementation Sequence

1. **Update vibecoder-builder** with new STRUCTURAL INTEGRITY prompt section
   - Inject the SellsPay marketplace context
   - Add explicit hook placement rules with examples
   - Add cascade failure prevention examples

2. **Update vibecoder-orchestrator** with structural validation
   - Add `validateCodeStructure()` before the code delivery event
   - If validation fails and attempts remain, prepare healing context and retry
   - Only send `code` event after validation passes

3. **Update AIBuilderCanvas** with auto-heal
   - Detect structural errors in `handlePreviewError`
   - Auto-trigger `healCode()` for syntax/structural errors
   - Keep manual "Fix" button for non-structural runtime errors

4. **Deploy edge functions**
   - Deploy `vibecoder-builder` first (prevents bad code generation)
   - Deploy `vibecoder-orchestrator` second (catches remaining issues)

---

## Expected Outcomes

After implementation:

1. **Structurally broken code is rejected** before reaching the frontend
2. **Auto-healing triggers** immediately when Sandpack crashes with structural errors
3. **AI produces valid code** more consistently with improved prompting
4. **Chat history displays correctly** because the React tree no longer crashes
5. **No more "success with no code"** because validation gates the delivery

---

## Testing Verification

After deployment, test with the same prompt that caused the original crash:
- The AI should generate properly structured code
- If a structural error somehow occurs, it should auto-heal
- Chat history should persist and display correctly
- The preview should render without white screens
