

# Login/Signup Page Redesign Plan

## Overview
Redesign the Login and Signup pages with an enhanced visual appearance featuring a larger logo, new purple cosmic background image, professional purple glow button effects, and darker input field styling.

---

## Changes to Implement

### 1. Copy Background Image to Project Assets
Copy the user-provided purple cosmic background image (`ChatGPT_Image_Jan_23_2026_09_44_48_PM.png`) to `src/assets/auth-bg.png` for use as the new background.

### 2. Update Logo Size
**Current State**: Logo uses `h-12` class (~48px height)
**Target**: Make logo approximately 6x larger

**Changes:**
- Update logo container in both Login.tsx and Signup.tsx
- Change from `h-12` to `h-48 md:h-64` (192-256px height)
- Add `w-auto` to maintain aspect ratio
- Center the logo with `mx-auto`

### 3. Replace Background with Cosmic Image
**Current State**: Uses CSS-based gradient "ribbons" with blur effects
**Target**: Use the provided cosmic purple image as the background

**Changes:**
- Import `authBg` from `@/assets/auth-bg.png`
- Replace the gradient ribbon divs with an `<img>` element
- Style as: `absolute inset-0 w-full h-full object-cover`
- Add a subtle dark overlay on top to ensure form readability

### 4. Input Field Styling Updates
**Current State**: Uses `bg-secondary/50` (gray with 50% opacity)
**Target**: Dark dark gray, almost black

**Changes:**
- Change from `bg-secondary/50` to `bg-[#0a0a0a]` or `bg-black/80`
- Keep the border styling as-is
- Apply to all input fields in both Login and Signup pages

### 5. Google OAuth Button Styling
**Current State**: `bg-secondary/50 border border-border hover:bg-secondary/70`
**Target**: Dark almost-black background with purple glow on hover

**Changes:**
```css
className="w-full h-12 flex items-center justify-center gap-3 rounded-lg 
  bg-[#0a0a0a] border border-white/10 
  text-foreground font-medium 
  transition-all duration-300
  hover:bg-[#1a1a1a] hover:border-purple-500/50 
  hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]"
```

### 6. "Forgot your password?" Link Styling
**Current State**: `text-muted-foreground hover:text-foreground`
**Target**: Add purple glow effect on hover

**Changes:**
```css
className="text-sm text-muted-foreground 
  transition-all duration-300
  hover:text-purple-400 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
```

### 7. Primary Submit Button (Log In / Sign Up)
**Current State**: `bg-secondary/80 hover:bg-secondary`
**Target**: Purple glow effect on hover matching the cosmic background

**Changes:**
```css
className="w-full h-12 rounded-lg 
  bg-[#0a0a0a] border border-white/10
  text-foreground font-medium 
  transition-all duration-300
  hover:bg-purple-900/30 hover:border-purple-500/50
  hover:shadow-[0_0_25px_rgba(147,51,234,0.5),0_0_50px_rgba(147,51,234,0.2)]
  disabled:opacity-50"
```

### 8. Reset Password Form Button
Apply the same purple glow hover effect to:
- "Send Reset Link" button
- "Back to login" link

---

## Technical Details

### Files to Modify

1. **Copy operation**: `user-uploads://ChatGPT_Image_Jan_23_2026_09_44_48_PM.png` to `src/assets/auth-bg.png`

2. **src/pages/Login.tsx**
   - Add import for `authBg`
   - Replace gradient background with image element
   - Update logo size from `h-12` to `h-48 md:h-64`
   - Update all input fields to use `bg-[#0a0a0a]`
   - Update Google OAuth button with purple glow hover
   - Update "Forgot your password?" link with purple glow hover
   - Update "Log In" button with purple glow hover
   - Update "Send Reset Link" button in reset flow

3. **src/pages/Signup.tsx**
   - Add import for `authBg`
   - Replace gradient background with image element
   - Update logo size from `h-12` to `h-48 md:h-64`
   - Update all input fields to use `bg-[#0a0a0a]`
   - Update Google OAuth button with purple glow hover
   - Update "Sign Up" button with purple glow hover

### Button Glow Effect Specification

The purple glow effect will use a combination of:
- `box-shadow` for the outer glow: `0 0 20px rgba(147, 51, 234, 0.4)`
- Border color transition to purple: `border-purple-500/50`
- Subtle background shift to purple tint: `bg-purple-900/30`
- Smooth transition: `transition-all duration-300`

This matches the glowing light streaks in the cosmic background image, creating a cohesive visual identity.

### Background Image Implementation

```tsx
{/* Cosmic Background */}
<div className="absolute inset-0">
  <img 
    src={authBg} 
    alt="" 
    className="w-full h-full object-cover"
    loading="eager"
  />
  {/* Dark overlay for readability */}
  <div className="absolute inset-0 bg-black/40" />
</div>
```

---

## Visual Summary

| Element | Before | After |
|---------|--------|-------|
| Logo | 48px height | 192-256px height |
| Background | CSS gradient ribbons | Cosmic purple image |
| Input fields | Gray (`secondary/50`) | Almost black (`#0a0a0a`) |
| Buttons (rest) | Gray background | Dark + purple glow on hover |
| Links (Forgot password) | Simple color change | Purple glow on hover |
| Submit buttons | Gray background | Dark + purple glow on hover |

