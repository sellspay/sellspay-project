

# Implementation Plan: Professional Price Badge & Admin Notification System

## Overview
This plan addresses two key improvements:
1. Fixing the overlapping price badge on product cards to be more professional
2. Creating a dedicated admin notification system for application reviews

---

## Part 1: Fix Price Badge Positioning

### Current Issue
The "Free" badge and play indicator are both positioned at `top-2 left-2`, causing them to overlap visually on product cards.

### Solution
- Move the play indicator to the **bottom-left** position
- Redesign the price badge to be more professional with better styling
- Add subtle animations and improved visual hierarchy

### Changes
**File: `src/components/profile/CollectionRow.tsx`**
- Move play indicator from `top-2 left-2` to `bottom-3 left-3`
- Redesign price badge with:
  - Smaller, more refined typography
  - Gradient background for free items (emerald gradient)
  - Semi-transparent glass effect for paid items
  - Rounded pill shape for professional appearance

---

## Part 2: Admin Notification System

### Database Changes
Create a new `admin_notifications` table to store admin-specific notifications:

```text
+------------------------+
|  admin_notifications   |
+------------------------+
| id (uuid, PK)          |
| type (text)            |
| message (text)         |
| is_read (boolean)      |
| redirect_url (text)    |
| applicant_id (uuid)    |
| application_type (text)|
| created_at (timestamp) |
+------------------------+
```

- **type**: 'editor_application', 'creator_application'
- **application_type**: 'editor' or 'creator' 
- **applicant_id**: References the profile who submitted the application

RLS Policy: Only users with admin role can read/update these notifications.

### Component Changes

**File: `src/components/notifications/NotificationBell.tsx`**
- Add admin role check using `checkUserRole('admin')`
- Fetch admin notifications separately from user notifications
- Add toggle button in dropdown header: "User | Admin"
- Maintain separate unread counts for user and admin notifications
- Bell badge shows total combined unread count
- Admin toggle shows its own badge when there are unread admin notifications

### UI Design for Admin Toggle
```text
+----------------------------------+
| Notifications          View all  |
| [User] [Admin (2)]               |
+----------------------------------+
| (notification list based on      |
|  active toggle)                  |
+----------------------------------+
```

- Toggle buttons styled as pills/segments
- Admin button shows red counter badge when unread admin notifications exist
- Smooth transition when switching between views

### Notification Creation on Application Submit

**File: `src/components/editor-application/EditorApplicationDialog.tsx`**
- After successful application submission, create an admin notification:
  - Type: 'editor_application'
  - Message: "New editor application from @{username}"
  - Redirect URL: '/admin' (to the applications tab)

**File: `src/components/creator-application/CreatorApplicationDialog.tsx`**
- After successful application submission, create an admin notification:
  - Type: 'creator_application'  
  - Message: "New creator application from @{username}"
  - Redirect URL: '/admin' (to the creator applications tab)

**File: `src/lib/notifications.ts`**
- Add new function `createAdminNotification()` to insert into the admin_notifications table

---

## Technical Details

### Admin Notifications Table Schema
```sql
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  redirect_url TEXT,
  applicant_id UUID,
  application_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can read admin notifications"
ON admin_notifications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update (mark as read)
CREATE POLICY "Admins can update admin notifications"
ON admin_notifications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can insert (for application submissions)
CREATE POLICY "Authenticated users can create admin notifications"
ON admin_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins can delete
CREATE POLICY "Admins can delete admin notifications"
ON admin_notifications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
```

### NotificationBell Component Updates
1. Add state: `isAdmin`, `showAdminView`, `adminNotifications`, `adminUnreadCount`
2. Check admin role on mount
3. Fetch admin notifications if user is admin
4. Subscribe to realtime changes for admin_notifications table
5. Render toggle buttons conditionally (only if admin)
6. Combined badge count on bell icon

### Notification Icons
- Editor application: Briefcase icon or "📋"
- Creator application: Star icon or "⭐"

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/profile/CollectionRow.tsx` | Modify | Fix badge positioning, improve styling |
| `src/components/notifications/NotificationBell.tsx` | Modify | Add admin toggle, fetch admin notifications |
| `src/lib/notifications.ts` | Modify | Add createAdminNotification function |
| `src/components/editor-application/EditorApplicationDialog.tsx` | Modify | Send admin notification on submit |
| `src/components/creator-application/CreatorApplicationDialog.tsx` | Modify | Send admin notification on submit |
| Database migration | Create | New admin_notifications table |

---

## Summary
1. Price badge moves to avoid overlap, gets professional gradient styling
2. New admin_notifications table stores admin-specific alerts
3. NotificationBell gains an admin toggle for admins only
4. Bell icon always shows total unread count (user + admin)
5. Admin toggle shows its own unread badge
6. Applications auto-notify admins upon submission

