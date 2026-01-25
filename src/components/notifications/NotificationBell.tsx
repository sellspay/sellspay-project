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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!user) return;

    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(data === true);
    };

    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchUserProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setUserProfileId(data?.id || null);
    };

    fetchUserProfile();
  }, [user]);

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
      const notificationsWithActors = await Promise.all(
        (data || []).map(async (notif) => {
          if (notif.actor_id) {
            const { data: actorData } = await supabase
              .from("profiles")
              .select("username, avatar_url")
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

    // Navigate if there's a valid redirect URL (skip broken patterns like /@user)
    if (notification.redirect_url && !notification.redirect_url.match(/^\/@(user|undefined|null)$/)) {
      navigate(notification.redirect_url);
    }
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

    // Navigate if there's a redirect URL
    if (notification.redirect_url) {
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
    <DropdownMenu>
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
                          {notification.actor?.username ? `@${notification.actor.username}` : "Someone"}
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