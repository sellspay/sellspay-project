import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Briefcase, Star, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  redirect_url: string | null;
  created_at: string;
  actor_id: string | null;
  actor?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface AdminNotification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  redirect_url: string | null;
  created_at: string;
  applicant_id: string | null;
  application_type: string | null;
}

export function NotificationBell() {
  const { user, isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const userProfileId = profile?.id ?? null;
  const [showAdminView, setShowAdminView] = useState(false);

  useEffect(() => {
    if (!userProfileId) return;

    fetchNotifications();
    
    // Set up realtime subscription for user notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userProfileId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfileId]);

  // Fetch admin notifications if admin
  useEffect(() => {
    if (!isAdmin) return;

    fetchAdminNotifications();

    // Set up realtime subscription for admin notifications
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_notifications",
        },
        () => {
          fetchAdminNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const fetchNotifications = async () => {
    if (!userProfileId) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userProfileId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch actor info for each notification
      // NOTE: actor identity fields are exposed via the public identity view (not the base profiles table)
      const notificationsWithActors = await Promise.all(
        (data || []).map(async (notif) => {
          if (notif.actor_id) {
            const { data: actorData } = await supabase
              .from("safe_public_identities")
              .select("username, full_name, avatar_url")
              .eq("id", notif.actor_id)
              .maybeSingle();
            return { ...notif, actor: actorData };
          }
          return { ...notif, actor: null };
        })
      );

      setNotifications(notificationsWithActors);
      setUnreadCount(notificationsWithActors.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchAdminNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setAdminNotifications(data || []);
      setAdminUnreadCount((data || []).filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userProfileId) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userProfileId)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleMarkAllAdminRead = async () => {
    try {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("is_read", false);

      if (error) throw error;

      setAdminNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setAdminUnreadCount(0);
      toast.success("All admin notifications marked as read");
    } catch (error) {
      console.error("Error marking all admin notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // Check for broken redirect URLs
    const isBrokenUrl = notification.redirect_url?.match(/\/@(user|undefined|null)/) ||
                        notification.redirect_url?.includes('/@undefined') ||
                        notification.redirect_url?.includes('/@null');

    // Navigate based on what's available
    if (notification.redirect_url && !isBrokenUrl) {
      navigate(notification.redirect_url);
      return;
    }

    // Fallback: try actor username for profile navigation
    if (notification.actor?.username) {
      navigate(`/@${notification.actor.username}`);
      return;
    }

    // For product-related notifications, try to extract product link
    if (notification.redirect_url?.includes('/product/')) {
      const productMatch = notification.redirect_url.match(/\/product\/[^/]+/);
      if (productMatch) {
        navigate(productMatch[0]);
      }
    }
    // Otherwise, just mark as read (already done above) - no navigation
  };

  const handleAdminNotificationClick = async (notification: AdminNotification) => {
    // Mark as read
    if (!notification.is_read) {
      await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("id", notification.id);

      setAdminNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      setAdminUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // Navigate with tab context based on notification type
    if (notification.type === "editor_application") {
      navigate("/admin?tab=editor-applications");
    } else if (notification.type === "creator_application") {
      navigate("/admin?tab=creator-applications");
    } else if (notification.redirect_url) {
      navigate(notification.redirect_url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return "👤";
      case "purchase":
        return "💰";
      case "comment":
        return "💬";
      case "product_like":
        return "❤️";
      case "comment_like":
        return "👍";
      case "comment_reply":
        return "↩️";
      case "subscription":
        return "⭐";
      default:
        return "🔔";
    }
  };

  const getAdminNotificationIcon = (type: string) => {
    switch (type) {
      case "editor_application":
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case "creator_application":
        return <Star className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const totalUnread = unreadCount + adminUnreadCount;

  if (!user) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 border-b space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Notifications</span>
            <div className="flex items-center gap-1">
              {!showAdminView && unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-1 px-2 gap-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMarkAllRead();
                  }}
                >
                  <CheckCheck className="h-3 w-3" />
                  Read all
                </Button>
              )}
              {showAdminView && adminUnreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-1 px-2 gap-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMarkAllAdminRead();
                  }}
                >
                  <CheckCheck className="h-3 w-3" />
                  Read all
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-1"
                onClick={() => navigate("/notifications")}
              >
                View all
              </Button>
            </div>
          </div>
          
          {/* Admin toggle - only show if admin */}
          {isAdmin && (
            <div className="flex gap-1">
              <Button
                variant={!showAdminView ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => setShowAdminView(false)}
              >
                User
              </Button>
              <Button
                variant={showAdminView ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs flex-1 relative"
                onClick={() => setShowAdminView(true)}
              >
                Admin
                {adminUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                    {adminUnreadCount > 9 ? "9+" : adminUnreadCount}
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* User Notifications View */}
        {!showAdminView && (
          <>
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <>
                {notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 cursor-pointer ${
                      !notification.is_read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={notification.actor?.avatar_url || undefined} />
                      <AvatarFallback className="text-sm">
                        {getNotificationIcon(notification.type)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm">
                          {notification.actor?.username 
                            ? `@${notification.actor.username}` 
                            : notification.actor?.full_name 
                              ? notification.actor.full_name 
                              : "Someone"}
                        </span>
                        {!notification.is_read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-center text-sm text-primary cursor-pointer justify-center"
                  onClick={() => navigate("/notifications")}
                >
                  See all notifications
                </DropdownMenuItem>
              </>
            )}
          </>
        )}

        {/* Admin Notifications View */}
        {showAdminView && isAdmin && (
          <>
            {adminNotifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No admin notifications</p>
              </div>
            ) : (
              <>
                {adminNotifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 cursor-pointer ${
                      !notification.is_read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleAdminNotificationClick(notification)}
                  >
                    <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
                      {getAdminNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm capitalize">
                          {notification.type.replace("_", " ")}
                        </span>
                        {!notification.is_read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-center text-sm text-primary cursor-pointer justify-center"
                  onClick={() => navigate("/admin")}
                >
                  Go to Admin Dashboard
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}