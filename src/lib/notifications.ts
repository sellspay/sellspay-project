import { supabase } from "@/integrations/supabase/client";

interface CreateNotificationParams {
  userId: string; // Profile ID of the recipient
  type: "purchase" | "follow" | "comment" | "product_like" | "comment_like" | "comment_reply" | "subscription";
  actorId?: string; // Profile ID of who triggered the notification
  productId?: string;
  commentId?: string;
  message: string;
  redirectUrl?: string;
}

export async function createNotification({
  userId,
  type,
  actorId,
  productId,
  commentId,
  message,
  redirectUrl,
}: CreateNotificationParams) {
  try {
    // Don't notify yourself
    if (actorId && actorId === userId) {
      return { success: true, skipped: true };
    }

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      actor_id: actorId,
      product_id: productId,
      comment_id: commentId,
      message,
      redirect_url: redirectUrl,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
}

// Helper to check follow cooldown
export async function checkFollowCooldown(
  followerProfileId: string,
  targetProfileId: string
): Promise<{ blocked: boolean; daysLeft: number }> {
  try {
    const { data } = await supabase
      .from("unfollow_history")
      .select("can_refollow_at")
      .eq("unfollower_id", followerProfileId)
      .eq("unfollowed_id", targetProfileId)
      .order("unfollowed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && new Date(data.can_refollow_at) > new Date()) {
      const daysLeft = Math.ceil(
        (new Date(data.can_refollow_at).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      return { blocked: true, daysLeft };
    }
    return { blocked: false, daysLeft: 0 };
  } catch (error) {
    console.error("Error checking follow cooldown:", error);
    return { blocked: false, daysLeft: 0 };
  }
}

// Helper to record unfollow
export async function recordUnfollow(
  unfollowerProfileId: string,
  unfollowedProfileId: string
) {
  try {
    const { error } = await supabase.from("unfollow_history").insert({
      unfollower_id: unfollowerProfileId,
      unfollowed_id: unfollowedProfileId,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error recording unfollow:", error);
    return { success: false, error };
  }
}

// Admin notification types
interface CreateAdminNotificationParams {
  type: "editor_application" | "creator_application";
  message: string;
  applicantId?: string;
  applicationType?: "editor" | "creator";
  redirectUrl?: string;
}

// Create admin notification for application submissions
export async function createAdminNotification({
  type,
  message,
  applicantId,
  applicationType,
  redirectUrl,
}: CreateAdminNotificationParams) {
  try {
    const { error } = await supabase.from("admin_notifications").insert({
      type,
      message,
      applicant_id: applicantId,
      application_type: applicationType,
      redirect_url: redirectUrl,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error creating admin notification:", error);
    return { success: false, error };
  }
}
