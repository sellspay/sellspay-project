
# Plan: Restore Google Sign In / Sign Up

## Overview
Re-add Google OAuth authentication across the login, signup, and settings connections pages using the Lovable Cloud managed OAuth flow.

## Changes Required

### 1. Login Page (`src/pages/Login.tsx`)
- Import `signInWithGoogle` from the `useAuth` hook
- Add `googleLoading` state for button loading state
- Add `handleGoogleSignIn` function that calls `signInWithGoogle()`
- Add Google OAuth button in the OAuth buttons section (before or after Discord)
- Include the Google logo SVG icon

### 2. Signup Page (`src/pages/Signup.tsx`)
- Import `signInWithGoogle` from the `useAuth` hook
- Add `googleLoading` state for button loading state
- Add `handleGoogleSignUp` function that calls `signInWithGoogle()`
- Add Google OAuth button before the form
- Add a divider ("or") between OAuth buttons and the form
- Include the Google logo SVG icon

### 3. Settings Connections Tab (`src/components/settings/ConnectionsTab.tsx`)
- Add Google to the `PROVIDERS` array with icon and styling
- Update `loadIdentities` to check for Google identity from Supabase auth identities
- Update `handleConnectProvider` to handle Google linking (with note about limitation)
- Update `handleDisconnectProvider` to handle Google unlinking
- Update connected count logic to include Google

## Technical Details

### Google OAuth Button Styling
```tsx
<button className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-card/40 border border-border/50 text-white font-medium transition-all duration-300 hover:bg-white hover:text-black hover:border-white/60 hover:shadow-[0_0_30px_rgba(255,255,255,0.6)]">
  <GoogleIcon />
  <span>Continue with Google</span>
</button>
```

### Google SVG Icon
```tsx
<svg className="w-5 h-5" viewBox="0 0 24 24">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>
```

### Connection Limitation Note
For the Connections tab, Google linking via `linkIdentity()` is restricted in Lovable Cloud (no access to "manual linking" toggle). Users will be informed of this when attempting to link Google if they didn't sign up with it.

## Files Modified
1. `src/pages/Login.tsx` - Add Google sign-in button
2. `src/pages/Signup.tsx` - Add Google sign-up button with divider
3. `src/components/settings/ConnectionsTab.tsx` - Add Google to connections list
