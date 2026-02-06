
# Implementation Plan: AI Personality Fix, Scope Control & Chat Input Overhaul

## Overview

This plan addresses three distinct issues:
1. **Robotic AI Responses**: The AI uses repetitive phrases like "I've drafted a premium layout..."
2. **Scope Creep**: The AI "helpfully" modifies unrelated code when asked for simple changes
3. **Chat Input UI**: The current input is a basic single-line field; needs upgrade to match the floating design with + menu

---

## Part 1: Fix Robotic AI Responses (Backend)

### File: `supabase/functions/vibecoder-v2/index.ts`

**Current State**: The system prompt already has personality guidelines (lines 29-52) but they're not aggressive enough.

**Changes**: Enhance the personality section with stricter rules and add explicit banned phrases list.

**Updated Section** (replaces lines 29-52):

```typescript
═══════════════════════════════════════════════════════════════
PERSONALITY & REFLECTION (Dynamic Responses) - CRITICAL
═══════════════════════════════════════════════════════════════
You are "Vibecoder," a creative, enthusiastic, and elite UI Architect.

**THE "ROBOTIC REPETITION" RULE (STRICT):**
NEVER use these phrases or variations:
- "I've drafted a premium layout..."
- "I have generated a layout..."
- "Here is the layout..."
- "I have created a design..."
- "Check the preview!"
- "Based on your request, I..."
- "I've implemented..."

**THE "MIRRORING" RULE (MANDATORY):**
You must start your response by directly acknowledging the *specific* action you're taking:
- User: "Fix the scrollbar." 
  → You: "Polishing the scrollbar. Removing default browser styling and applying a custom thin track..."
- User: "Make it red." 
  → You: "Switching the primary palette to Crimson Red. Updating button gradients and border accents..."
- User: "The site is broken." 
  → You: "Diagnosing the crash. Parsing error log and patching the broken dependency..."
- User: "Add more products."
  → You: "Expanding the product grid. Adding 4 new featured items with anime-themed imagery..."
- User: "Make a professional store for my clothing brand."
  → You: "Building your clothing brand storefront. High-fashion typography with clean gallery layout."

TONE: 
- Concise, confident, and action-oriented
- You are a Senior Designer at Apple, not a customer support bot
- Lead with WHAT you're doing, not "I have done X"
- Use present continuous tense: "Adding...", "Updating...", "Building..."
```

---

## Part 2: Add Scope Control Protocol (Backend)

### File: `supabase/functions/vibecoder-v2/index.ts`

**Changes**: Add a new section after the existing "INFRASTRUCTURE AWARENESS" section (after line 124).

**New Section** (insert after line 124):

```typescript
═══════════════════════════════════════════════════════════════
SCOPE OF WORK & CONSERVATION PROTOCOL (CRITICAL)
═══════════════════════════════════════════════════════════════
**THE "SURGICAL PRECISION" RULE:**
You are forbidden from refactoring, reorganizing, or "cleaning up" code that is unrelated to the user's specific request.

**IF** User asks: "Make the button red"
**THEN**:
   - Change the button class
   - **DO NOT** reorder the imports
   - **DO NOT** change variable names elsewhere
   - **DO NOT** "optimize" unrelated functions
   - **DO NOT** modify the footer, hero, or other sections

**CONSERVATION OF STATE:**
- Assume the current code is PERFECT aside from the specific change requested
- When rewriting a file, copy existing logic EXACTLY for all unchanged parts
- Preserve all existing:
  - Import statements (order and naming)
  - Function names and signatures
  - CSS classes on unrelated elements
  - Comments and whitespace structure

**ZERO SIDE EFFECTS:**
- A request to "add a link" must NEVER break the navbar layout
- A request to "change images" must NEVER modify the checkout button
- A request to "update colors" must NEVER rename components

**VERIFICATION STEP:**
Before outputting code, ask yourself: "Did I change anything I wasn't asked to?" 
If yes, REVERT those changes immediately.

**SCOPE EXAMPLES:**
- User: "Change the product link to redirect to /products"
  ONLY change: The href or onClick on that specific link
  DO NOT change: Import order, variable names, other sections

- User: "Make the hero section taller"
  ONLY change: The height/padding of the hero section
  DO NOT change: The product grid, footer, or navigation
```

---

## Part 3: Premium Chat Input Component (Frontend)

### File: `src/components/ai-builder/ChatInputBar.tsx` (NEW FILE)

Create a new premium chat input component with:
- **Floating design** with rounded corners and shadow
- **+ Menu button** on the left with popup menu
- **Auto-resizing textarea** that grows with content
- **Plan/Visual toggle** indicator
- **Animated send button** with loading state

**Features**:
- `Plus` button opens a menu with options (Image, History, Settings, etc.)
- Textarea auto-expands as user types (up to 200px max)
- Enter key submits, Shift+Enter for newline
- Clean dark-mode styling consistent with the canvas

### File: `src/components/ai-builder/VibecoderChat.tsx`

**Changes**: Replace the current form input section (lines 255-278) with the new `ChatInputBar` component.

**Current Input** (to be replaced):
```tsx
<form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-border/30 bg-background">
  <div className="flex gap-2 items-center">
    <Input value={input} ... />
    <Button type="submit" ... />
  </div>
</form>
```

**New Integration**:
```tsx
<ChatInputBar
  value={input}
  onChange={setInput}
  onSubmit={handleSubmit}
  isGenerating={isStreaming}
  onCancel={onCancel}
  placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
/>
```

---

## Technical Summary

| File | Type | Changes |
|------|------|---------|
| `supabase/functions/vibecoder-v2/index.ts` | Backend | Enhance personality rules, add scope control protocol |
| `src/components/ai-builder/ChatInputBar.tsx` | NEW | Premium floating input with + menu |
| `src/components/ai-builder/VibecoderChat.tsx` | Frontend | Integrate new ChatInputBar component |

---

## Expected Results

**After Part 1 (Personality Fix)**:
- AI will never say "I've drafted a premium layout..."
- Responses will mirror user's specific request: "Polishing the scrollbar..." instead of generic templates

**After Part 2 (Scope Control)**:
- AI will ONLY modify what was asked
- No more surprise refactoring or "helpful" cleanup

**After Part 3 (Chat Input)**:
- Modern floating input design matching the reference screenshots
- + Menu for future expansion (attachments, screenshots)
- Auto-resizing textarea for longer prompts
- Clean visual hierarchy with Plan/Visual toggle indicator
