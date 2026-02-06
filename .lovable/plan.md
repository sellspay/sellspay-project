

# Profile Menu & Dynamic Paywall Button Implementation

## Overview

This plan implements two key UX enhancements for the AI Builder:

1. **Profile Menu** - A polished avatar dropdown in the header next to Publish, showing credit balance, profile links, and settings
2. **Dynamic Paywall Button** - Transform the send button into an "Upgrade/Top Up" CTA when users can't afford the selected model

---

## Part 1: ProfileMenu Component (NEW)

### File: `src/components/ai-builder/ProfileMenu.tsx`

Create a new dropdown component with:

**Trigger Element:**
- 36x36 rounded avatar (image or initials fallback)
- Ring effect on hover/focus
- Active state with violet ring

**Dropdown Content (Portal-based for z-index safety):**
```text
┌─────────────────────────────────────┐
│  [Avatar] Username                  │
│           Pro Member (tier badge)   │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │ ✨  Balance                     ││
│  │     2,450 Credits    [Top Up]  ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  👤 My Profile          →          │
│  ⚙️ Settings            →          │
│  💳 Billing             →          │
├─────────────────────────────────────┤
│  🚪 Sign Out                        │
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface ProfileMenuProps {
  avatarUrl?: string | null;
  username?: string | null;
  userCredits: number;
  onSignOut: () => void;
}
```

**Technical Details:**
- Use React Portal to escape parent z-index/overflow constraints
- Click-outside handler to close menu
- Navigate using `useNavigate()` for profile/settings/billing links

---

## Part 2: Header Integration

### File: `src/components/ai-builder/VibecoderHeader.tsx`

**Changes:**
1. Add new prop: `avatarUrl?: string | null`
2. Add new prop: `userCredits: number`
3. Add new prop: `onSignOut: () => void`
4. Import `ProfileMenu` component
5. Add vertical divider after Publish button
6. Place `<ProfileMenu />` at the end of RIGHT section

**Updated RIGHT section:**
```tsx
{/* RIGHT: Actions */}
<div className="flex items-center gap-3">
  {/* Address Bar */}
  ...
  
  {/* View Live Button */}
  ...

  {/* Publish Button */}
  <Button ...>Publish</Button>

  {/* VISUAL DIVIDER */}
  <div className="w-px h-6 bg-zinc-800" />

  {/* PROFILE MENU */}
  <ProfileMenu 
    avatarUrl={avatarUrl}
    username={username}
    userCredits={userCredits}
    onSignOut={onSignOut}
  />
</div>
```

---

## Part 3: AIBuilderCanvas State Integration

### File: `src/components/ai-builder/AIBuilderCanvas.tsx`

**Changes:**
1. Import `useUserCredits` hook (already imported in VibecoderChat)
2. Fetch user profile data for avatar URL
3. Pass credits and avatar to `VibecoderHeader`
4. Add sign-out handler

**New State:**
```typescript
const { credits: userCredits } = useUserCredits();
const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

// In loadData effect, also fetch avatar
const profileResp = await supabase
  .from('profiles')
  .select('username, avatar_url')
  .eq('id', profileId)
  .maybeSingle();

if (profileResp.data?.avatar_url) {
  setUserAvatarUrl(profileResp.data.avatar_url);
}
```

**Sign-out Handler:**
```typescript
const handleSignOut = async () => {
  await supabase.auth.signOut();
  navigate('/login');
};
```

---

## Part 4: Dynamic Paywall Button

### File: `src/components/ai-builder/ChatInputBar.tsx`

**Changes to Send Button Logic:**

1. Add new prop: `onOpenBilling?: () => void`
2. Modify `handleSubmit` to intercept when `!canAfford`
3. Transform button appearance when user can't afford selected model

**New Button Behavior:**

| State | Appearance | Action |
|-------|------------|--------|
| Empty input | Gray arrow (disabled) | None |
| Has input + can afford | Colored arrow (violet/amber/pink) | Submit |
| Has input + cannot afford | Orange "Top Up" with Lock icon | Opens billing modal |
| Generating | Red square (stop) | Cancel |

**Updated Button Code:**
```tsx
{!canAfford(selectedModel) && (value.trim() || attachments.length > 0) ? (
  // PAYWALL GATE - Transform to upgrade CTA
  <button
    onClick={() => onOpenBilling?.()}
    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 
               text-white shadow-lg shadow-orange-900/30 flex items-center gap-2 
               font-bold text-xs animate-pulse"
  >
    <Lock size={14} />
    <span>Top Up</span>
  </button>
) : (
  // Normal send/stop button
  <button ... current logic ... />
)}
```

**Visual Warning:**
- Add red border glow to input container when `!canAfford`
- Show small warning text below input: "Insufficient credits for {model} ({cost}c)"

---

## Part 5: Billing Flow Connection

### File: `src/components/ai-builder/VibecoderChat.tsx`

**Changes:**
1. Add state: `const [showBillingModal, setShowBillingModal] = useState(false)`
2. Pass `onOpenBilling` prop to ChatInputBar
3. Import/use existing `UpgradeModal` component (if exists) or navigate to `/pricing`

**Alternative:** Navigate directly to `/pricing` page:
```typescript
const handleOpenBilling = () => {
  window.open('/pricing', '_blank');
};
```

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/ai-builder/ProfileMenu.tsx` | CREATE | New dropdown component with avatar, credits, and navigation |
| `src/components/ai-builder/VibecoderHeader.tsx` | MODIFY | Add ProfileMenu after Publish button with divider |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | MODIFY | Pass avatar and credits to header, add sign-out handler |
| `src/components/ai-builder/ChatInputBar.tsx` | MODIFY | Add paywall logic to send button, warning states |
| `src/components/ai-builder/VibecoderChat.tsx` | MODIFY | Add onOpenBilling handler and pass to ChatInputBar |
| `src/components/ai-builder/index.ts` | MODIFY | Export ProfileMenu |

---

## User Flow Examples

### Profile Menu Flow:
1. User clicks avatar in top-right corner
2. Dropdown appears with glassmorphism styling
3. Shows "Balance: 2,450 Credits" with Top Up button
4. Links to Profile, Settings, Billing
5. Sign Out at bottom

### Paywall Gate Flow:
1. User has 5 credits, selects "Flux 1.1 Pro" (costs 10c)
2. Input border glows red
3. Send button transforms: Gray Arrow → Orange "🔒 Top Up"
4. Small red text appears: "Insufficient credits for Flux 1.1 Pro (10c)"
5. Clicking "Top Up" opens pricing page in new tab (or billing modal)

---

## Technical Considerations

### Portal Usage (ProfileMenu)
- Menu rendered via `createPortal(menu, document.body)` to escape header overflow
- Position calculated using `getBoundingClientRect()` 
- Click-outside listener to close

### Credits Display
- Show balance formatted with `toLocaleString()` (e.g., "2,450")
- Red color when credits < 100
- "Low Balance" badge when credits < selected model cost

### Avatar Fallback
- If no `avatar_url`, show initials (first 2 chars of username)
- Gradient background for initials

