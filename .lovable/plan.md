

# Add Credit Wallet Display & Low Credit Warning

## Overview
Add visible credit balance displays with top-up functionality to both the AI VibeCoder profile menu and the main navigation bar dropdown. Include a "low credit warning" banner to alert users when they're running low.

---

## Component Changes

### 1. ProfileMenu (VibeCoder Dropdown)
**File:** `src/components/ai-builder/ProfileMenu.tsx`

Add a credit display section between the user info header and navigation links:

```text
┌──────────────────────────────────────┐
│ [Avatar] Username                    │
│         [Creator Badge]              │
├──────────────────────────────────────┤
│ ⚡ Credits    [1,234]    [Top Up →]  │  ← NEW
│ ⚠️ LOW CREDIT WARNING (if < 50)      │  ← NEW (conditional)
├──────────────────────────────────────┤
│ 👤 My Profile                    →   │
│ ⚙️ Settings                      →   │
│ 💳 Billing                       →   │
├──────────────────────────────────────┤
│ 🚪 Sign Out                          │
└──────────────────────────────────────┘
```

- Display current credit balance with lightning bolt icon
- Add "Top Up" button that opens CreditTopUpDialog
- Show amber warning banner when credits < 50
- Use existing `userCredits` prop (already passed in)

---

### 2. Header Dropdown Menu (Main Nav)
**File:** `src/components/layout/Header.tsx`

Add credit section to the authenticated user dropdown menu:

```text
┌──────────────────────────────────────┐
│ [Avatar] Full Name                   │
│         email@example.com            │
├──────────────────────────────────────┤
│ ⚡ 1,234 credits        [Get More]   │  ← NEW
│ ⚠️ Running low on credits            │  ← NEW (conditional)
├──────────────────────────────────────┤
│ 📊 Dashboard                         │
│ ➕ Create Product                    │
│ 👤 Profile                           │
│ ⚙️ Settings                          │
├──────────────────────────────────────┤
│ 🚪 Sign Out                          │
└──────────────────────────────────────┘
```

- Use existing `credits` from `useSubscription` hook
- Add "Get More" button linking to top-up dialog or pricing page
- Show low credit warning when credits < 50

---

### 3. New Low Credit Warning Component
**File:** `src/components/ai-builder/LowCreditWarning.tsx` (new)

A reusable warning banner component:
- Appears when credits fall below threshold (50 by default)
- Amber/orange color scheme for urgency
- Clickable to open top-up dialog
- Can be styled for both contexts (dropdown and inline)

---

### 4. Mobile Menu Credits (Header)
Add credit display to the mobile hamburger menu as well for consistent UX.

---

## Technical Details

### Props & State Flow

**ProfileMenu** already receives:
- `userCredits: number` - Current balance

Will add:
- `onTopUp?: () => void` - Callback to open top-up dialog

**Header** already has:
- `const { credits } = useSubscription()` - Current balance

Will add:
- State for CreditTopUpDialog: `const [topUpOpen, setTopUpOpen] = useState(false)`

### Low Credit Threshold
Define as constant for consistency:
```typescript
const LOW_CREDIT_THRESHOLD = 50;
```

### Styling
- Use existing design tokens (zinc-800, violet-400, amber-500)
- Match current premium dark theme aesthetic
- Compact display that doesn't overwhelm the menu

---

## Files to Create
1. `src/components/ai-builder/LowCreditWarning.tsx` - Reusable warning component

## Files to Modify
1. `src/components/ai-builder/ProfileMenu.tsx` - Add credit display section
2. `src/components/layout/Header.tsx` - Add credit display to dropdown + dialog
3. `src/components/ai-builder/AIBuilderCanvas.tsx` - Pass onTopUp callback to header

---

## Implementation Order
1. Create LowCreditWarning component
2. Update ProfileMenu with credit display + warning
3. Update Header dropdown with credit display + warning
4. Add CreditTopUpDialog integration to both locations
5. Test low credit threshold triggers correctly

