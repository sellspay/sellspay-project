
# Fix Plan: Seller Button and Logo

## Overview
Two issues to fix:
1. The "Seller?" button on the profile page is not working - clicking "Yes, become a seller" shows "Failed to switch account"
2. The navbar is using the old logo (`navbar-logo.png`) instead of the new logo (`hero-logo.png`)

---

## Issue 1: Seller Button Not Working

### Root Cause
The `SellerConfirmDialog` component uses `AlertDialogAction` from Radix UI. When clicked, `AlertDialogAction` **automatically closes the dialog immediately** before the async operation completes. This causes the dialog to close and potentially interrupt the state updates.

The fix requires preventing the automatic close behavior and handling the async operation properly.

### Solution
Modify `SellerConfirmDialog.tsx` to:
1. Wrap the `AlertDialogAction` click handler to prevent default closing
2. Let the parent's `onConfirm` callback control when the dialog closes (after success or on error)

### File Changes

**`src/components/profile/SellerConfirmDialog.tsx`**
- Update the `AlertDialogAction` to use a click handler that calls `e.preventDefault()` before invoking `onConfirm`
- This prevents Radix from auto-closing the dialog
- The dialog will only close when `onOpenChange(false)` is called after successful update

```tsx
<AlertDialogAction 
  onClick={(e) => {
    e.preventDefault(); // Prevent auto-close
    onConfirm();
  }} 
  disabled={loading}
  className="bg-primary hover:bg-primary/90"
>
  {loading ? "Switching..." : "Yes, become a seller"}
</AlertDialogAction>
```

---

## Issue 2: Navbar Using Old Logo

### Root Cause
The Header component is importing and using `navbar-logo.png` instead of the new logo file `hero-logo.png`.

### Solution
1. Update `Header.tsx` to import and use `hero-logo.png` instead
2. Delete the old `navbar-logo.png` file
3. Also update `UpdateCard.tsx` which references the same old logo

### File Changes

**`src/components/layout/Header.tsx`**
- Change import from `navbar-logo.png` to `hero-logo.png`
- Rename the import variable for clarity

**`src/components/community/UpdateCard.tsx`**
- Also uses `navbar-logo.png` - update to use the new logo

**Delete file**
- `src/assets/navbar-logo.png` - remove the old logo file

---

## Technical Summary

| File | Action |
|------|--------|
| `src/components/profile/SellerConfirmDialog.tsx` | Add `e.preventDefault()` to AlertDialogAction onClick |
| `src/components/layout/Header.tsx` | Change logo import from `navbar-logo.png` to `hero-logo.png` |
| `src/components/community/UpdateCard.tsx` | Change logo import from `navbar-logo.png` to `hero-logo.png` |
| `src/assets/navbar-logo.png` | Delete old logo file |

---

## Expected Outcome
1. Clicking "Yes, become a seller" will properly update the user's profile and show success toast
2. The navbar will display the new logo across all pages
3. The community UpdateCard bot avatar will also use the new logo
