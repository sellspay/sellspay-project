

# Follow-Gated Downloads & Notification System

## Overview

This plan implements two major features:

1. **Follow-Gated Product Downloads** with a 7-day re-follow cooldown to prevent follow/unfollow abuse
2. **Notification Center** with a bell icon in the navbar, supporting various notification types with clickable redirects

---

## Part 1: Follow-Gated Downloads with Cooldown

### Current State
- The system already has a `followers` table with `follower_id`, `following_id`, and `created_at` columns
- ProductDetail.tsx already checks `isFollowingCreator` and shows a follow dialog
- Profile.tsx has a basic `handleFollow` function that allows instant follow/unfollow

### Database Changes

**Add `unfollow_history` table** to track when users unfollow and enforce the 7-day cooldown:

```text
Table: unfollow_history
  - id: uuid (primary key)
  - unfollower_id: uuid (profile who unfollowed)
  - unfollowed_id: uuid (profile who was unfollowed)  
  - unfollowed_at: timestamp (when the unfollow happened)
  - can_refollow_at: timestamp (unfollowed_at + 7 days)
  - created_at: timestamp
```

**Add `notifications` table** for the notification system:

```text
Table: notifications
  - id: uuid (primary key)
  - user_id: uuid (recipient profile_id)
  - type: text ('purchase', 'follow', 'comment', 'subscription', 'product_like', 'comment_like', 'comment_reply')
  - actor_id: uuid (who triggered the notification - profile_id)
  - product_id: uuid (optional - for product-related notifications)
  - comment_id: uuid (optional - for comment-related notifications)
  - message: text
  - is_read: boolean (default false)
  - redirect_url: text (where clicking should navigate)
  - created_at: timestamp
```

### UI/UX Flow Changes

#### Enhanced Follow Dialog (ProductDetail.tsx)

When user clicks "Get Access" (renamed from current button):
1. Check if user follows the seller/creator
2. If NOT following, show enhanced popup with:
   - Creator's avatar (centered, larger)
   - Username below avatar
   - Bio text
   - Stats row: Product count | Follower count | Following count
   - "Follow" button at the bottom
3. On follow success, dialog closes and product unlocks

#### Unfollow Confirmation Dialog

When user attempts to unfollow (from Profile.tsx):
1. Show confirmation dialog with warning:
   - Title: "Are you sure you want to unfollow?"
   - Message: "If you unfollow, you won't be able to follow back for 7 days, locking the store away."
   - Subtext explaining this prevents abuse
   - Two buttons: "Cancel" and "Unfollow Anyway"
2. If confirmed:
   - Delete from `followers` table
   - Insert record into `unfollow_history` with `can_refollow_at = NOW() + 7 days`
3. Toast notification confirms unfollow

#### Re-follow Cooldown Check

When user tries to follow someone again:
1. Query `unfollow_history` for recent unfollow
2. If `can_refollow_at > NOW()`, show error toast with remaining time
3. If cooldown passed or no history, allow follow

---

## Part 2: Notification System

### Notification Bell in Header

Add to Header.tsx:
- Bell icon with unread count badge (red dot or number)
- Click opens dropdown or navigates to `/notifications`
- Positioned between credit wallet and avatar

### Notification Types & Triggers

| Type | Trigger | Message Format | Redirect |
|------|---------|----------------|----------|
| `purchase` | Someone buys your product | "purchased your [product]" | /product/:id |
| `follow` | Someone follows you | "started following you" | /@username |
| `comment` | Comment on your product | "commented on [product]" | /product/:id |
| `product_like` | Like on your product | "liked [product]" | /product/:id |
| `comment_like` | Like on your comment | "liked your comment" | /product/:id |
| `comment_reply` | Reply to your comment | "replied to your comment" | /product/:id |
| `subscription` | Someone subscribes to your plan | "subscribed to [plan]" | /subscription-plans |

### Notification Card Design

```text
+-----------------------------------------------+
| [Avatar] @username                    [time]  |
|          [message: purchased your Preset Pack]|
|          ↳ Click to view                      |
+-----------------------------------------------+
```

### Creating Notifications

Notifications will be created in the following locations:

1. **Purchases**: `create-checkout-session` edge function or `stripe-webhook`
2. **Follows**: `handleFollow` in Profile.tsx and `handleFollowCreator` in ProductDetail.tsx
3. **Comments**: `handleSubmitComment` in ProductDetail.tsx
4. **Product Likes**: `handleLike` in ProductDetail.tsx
5. **Comment Likes**: `handleCommentLike` in ProductDetail.tsx
6. **Subscriptions**: `create-subscription-checkout` or `stripe-webhook`

---

## Implementation Files

### New Files
1. `supabase/migrations/[timestamp]_follow_cooldown_and_notifications.sql` - Database schema
2. `src/components/notifications/NotificationBell.tsx` - Header bell icon component
3. `src/components/notifications/NotificationDropdown.tsx` - Dropdown with recent notifications
4. `src/components/profile/UnfollowConfirmDialog.tsx` - Unfollow warning dialog
5. `src/components/product/CreatorFollowDialog.tsx` - Enhanced follow popup with creator info

### Modified Files
1. `src/components/layout/Header.tsx` - Add notification bell
2. `src/pages/ProductDetail.tsx` - Update follow dialog with enhanced UI, rename button to "Get Access"
3. `src/pages/Profile.tsx` - Add unfollow confirmation with cooldown logic
4. `src/pages/Notifications.tsx` - Replace mock data with real database queries
5. `src/integrations/supabase/types.ts` - Will auto-update with new tables

---

## Technical Details

### Database Migration SQL

```sql
-- Unfollow history for 7-day cooldown
CREATE TABLE unfollow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unfollower_id UUID NOT NULL,
  unfollowed_id UUID NOT NULL,
  unfollowed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  can_refollow_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  actor_id UUID,
  product_id UUID,
  comment_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  redirect_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for unfollow_history
ALTER TABLE unfollow_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unfollow history"
  ON unfollow_history FOR SELECT
  USING (unfollower_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own unfollow records"
  ON unfollow_history FOR INSERT
  WITH CHECK (unfollower_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_unfollow_history_lookup ON unfollow_history(unfollower_id, unfollowed_id);
```

### Follow Cooldown Check Logic

```typescript
const checkFollowCooldown = async (followerProfileId: string, targetProfileId: string) => {
  const { data } = await supabase
    .from('unfollow_history')
    .select('can_refollow_at')
    .eq('unfollower_id', followerProfileId)
    .eq('unfollowed_id', targetProfileId)
    .order('unfollowed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (data && new Date(data.can_refollow_at) > new Date()) {
    const daysLeft = Math.ceil(
      (new Date(data.can_refollow_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return { blocked: true, daysLeft };
  }
  return { blocked: false, daysLeft: 0 };
};
```

### Creating Notifications Helper

```typescript
const createNotification = async ({
  userId,
  type,
  actorId,
  productId,
  commentId,
  message,
  redirectUrl
}: {
  userId: string;
  type: string;
  actorId?: string;
  productId?: string;
  commentId?: string;
  message: string;
  redirectUrl?: string;
}) => {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    actor_id: actorId,
    product_id: productId,
    comment_id: commentId,
    message,
    redirect_url: redirectUrl
  });
};
```

---

## Summary

This implementation will:

1. Gate product downloads behind a follow requirement for all sellers/creators
2. Show an enhanced creator profile popup when users need to follow
3. Warn users about the 7-day cooldown before unfollowing
4. Track unfollow history to enforce the cooldown
5. Add a notification bell to the header with unread count
6. Create real-time notifications for all major user interactions
7. Make notifications clickable with proper redirects to the relevant content

