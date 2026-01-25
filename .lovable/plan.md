

## Overview
This plan addresses three requests:
1. Add a dedicated "Manage Users" tab in Admin panel with quick role revocation actions
2. Redesign the "Explore by Type" section to match the premium visual identity
3. Fix Testimonials to show `@deadeye`'s verified badge and "View Profile" button like `@shrimpy`

## Current State Analysis

**Admin Panel:**
- Existing Users tab shows all users with basic actions (view, edit, suspend)
- Role revocation (creator/editor) currently happens only in the Applications tabs
- No quick actions for revoking roles directly from the user table

**Explore by Type Section:**
- Currently using a basic gray background (`bg-muted/30`) with simple cards
- Lacks the glassmorphism, animated orbs, and gradient styling used elsewhere
- Appears disconnected from the premium design language

**Testimonials:**
- Uses hardcoded data with `verified: true` only for `@shrimpy`
- `@deadeye` is a verified creator in the database but not marked in the static data
- `@deadeye` card is missing the checkmark and "View Profile" button

---

## Implementation Plan

### 1. Add "Manage Users" Tab to Admin Panel

**File:** `src/pages/Admin.tsx`

Create a new dedicated tab for quick user role management:

- Add new `TabsTrigger` with "Manage Users" label and `UserCog` icon
- Create `TabsContent` with filterable table showing:
  - User info (avatar, name, username)
  - Current roles (Creator/Editor badges)
  - Quick action buttons for each role type
- Implement inline "Revoke Creator" and "Revoke Editor" buttons
- Creator revocation: Sets `is_creator: false`, `verified: false`
- Editor revocation: Clears all editor fields (`is_editor: false`, `editor_hourly_rate_cents: null`, etc.)
- Only show revoke buttons for users who have that specific role
- Add confirmation dialog before revocation

**Key features:**
- Filter to show only Creators, only Editors, or both
- Search by name/username
- Visual indicators for each role
- Loading states during revocation

### 2. Redesign "Explore by Type" Section

**File:** `src/pages/Home.tsx`

Transform the section to match the "Million Dollar" premium design:

- Replace plain `bg-muted/30` with layered gradient background
- Add floating animated orbs with `animate-float` class
- Apply glassmorphism styling to category cards (backdrop-blur, border gradients)
- Update section header with premium pill badge styling
- Add subtle radial gradients and enhanced visual depth
- Style category icons with gradient backgrounds
- Add hover effects with glow/border transitions

**Visual enhancements:**
- Background: Dark with radial purple gradients
- Floating orbs: 3-4 positioned orbs with blur and animation
- Category cards: Glass effect with `bg-white/5`, `backdrop-blur-xl`, gradient borders
- Typography: Enhanced contrast and spacing

### 3. Fix Testimonials for @deadeye

**File:** `src/components/home/Testimonials.tsx`

Update the hardcoded testimonials data:

- Add `verified: true` to deadeye's testimonial entry
- Add deadeye's actual avatar URL (fetched from database or use placeholder)
- Modify the "others" testimonial card rendering to:
  - Show verified checkmark when `verified: true`
  - Show "View Profile" button (like shrimpy's card)
- Ensure both linked testimonials have consistent styling

**Changes to testimonials array:**
```
{
  id: '2',
  name: 'Deadeye',
  username: 'deadeye',
  role: 'Content Creator',
  rating: 5,
  quote: 'Finally a marketplace that gets it...',
  verified: true,  // ADD THIS
}
```

**Changes to card rendering:**
- Add verified badge display for non-featured cards with `verified: true`
- Add "View Profile" button to cards with valid usernames

---

## Technical Details

### Admin Revocation Logic

**Revoke Creator:**
```typescript
const handleRevokeCreatorFromUser = async (userId: string) => {
  await supabase.from('profiles').update({
    is_creator: false,
    verified: false
  }).eq('id', userId);
  
  // Also delete any creator_applications record
  await supabase.from('creator_applications').delete()
    .eq('user_id', userId);
}
```

**Revoke Editor:**
```typescript
const handleRevokeEditorFromUser = async (userId: string) => {
  await supabase.from('profiles').update({
    is_editor: false,
    editor_hourly_rate_cents: null,
    editor_services: null,
    editor_languages: null,
    editor_country: null,
    editor_city: null,
    editor_about: null
  }).eq('id', userId);
  
  // Also delete any editor_applications record
  await supabase.from('editor_applications').delete()
    .eq('user_id', userId);
}
```

### Explore by Type Premium Styling

```tsx
<section className="relative py-16 lg:py-24 overflow-hidden">
  {/* Background gradients */}
  <div className="absolute inset-0 -z-10">
    <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />
    <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] 
      bg-primary/10 rounded-full blur-[120px] animate-float" />
    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] 
      bg-accent/10 rounded-full blur-[100px] animate-float" 
      style={{ animationDelay: '-3s' }} />
  </div>
  
  {/* Content with glassmorphism cards */}
  <div className="container ...">
    <CategorySection className="bg-white/5 backdrop-blur-xl 
      border border-white/10 rounded-2xl" />
  </div>
</section>
```

### Testimonial Badge Implementation

```tsx
// For non-featured testimonial cards with verified users
<div className="flex items-center gap-3">
  <Avatar>...</Avatar>
  <div>
    <div className="flex items-center gap-1.5">
      <span className="font-medium">@{testimonial.username}</span>
      {testimonial.verified && (
        <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
      )}
    </div>
    <span className="text-xs text-muted-foreground">{testimonial.role}</span>
  </div>
  {testimonial.username && (
    <Button asChild variant="ghost" size="sm" className="ml-auto">
      <Link to={`/@${testimonial.username}`}>View Profile</Link>
    </Button>
  )}
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Admin.tsx` | Add "Manage Users" tab, revocation handlers, new tab content |
| `src/pages/Home.tsx` | Redesign "Explore by Type" section with premium styling |
| `src/components/home/Testimonials.tsx` | Add `verified: true` to deadeye, update card rendering |

---

## Expected Outcome

1. **Admin Panel:** New "Manage Users" tab with quick revoke buttons for Creator and Editor roles, directly in the user table
2. **Explore by Type:** Premium glassmorphism design with animated floating orbs, matching the rest of the site's visual identity
3. **Testimonials:** Both @shrimpy and @deadeye display verified checkmarks and "View Profile" buttons consistently

