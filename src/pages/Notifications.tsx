import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

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

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      setUserProfileId(data?.id || null);
    };

    fetchUserProfile();
  }, [user, navigate]);

  useEffect(() => {
    if (userProfileId) {
      fetchNotifications();
    }
  }, [userProfileId]);

  const fetchNotifications = async () => {
    if (!userProfileId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch actor info for each notification
      const notificationsWithActors = await Promise.all(
        (data || []).map(async (notif) => {
          if (notif.actor_id) {
            const { data: actorData } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', notif.actor_id)
              .maybeSingle();
            return { ...notif, actor: actorData };
          }
          return { ...notif, actor: null };
        })
      );

      setNotifications(notificationsWithActors);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!userProfileId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userProfileId)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(notifications.filter((n) => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.redirect_url) {
      navigate(notification.redirect_url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return '👤';
      case 'purchase':
        return '💰';
      case 'comment':
        return '💬';
      case 'product_like':
        return '❤️';
      case 'comment_like':
        return '👍';
      case 'comment_reply':
        return '↩️';
      case 'subscription':
        return '⭐';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const salesNotifications = notifications.filter(
    (n) => n.type === 'purchase' || n.type === 'subscription'
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {notifications.length === 0 ? (
              <EmptyState />
            ) : (
              notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                  getIcon={getNotificationIcon}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-3">
            {notifications.filter((n) => !n.is_read).length === 0 ? (
              <EmptyState message="No unread notifications" />
            ) : (
              notifications
                .filter((n) => !n.is_read)
                .map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                    onClick={handleNotificationClick}
                    getIcon={getNotificationIcon}
                  />
                ))
            )}
          </TabsContent>

          <TabsContent value="sales" className="space-y-3">
            {salesNotifications.length === 0 ? (
              <EmptyState message="No sales notifications" />
            ) : (
              salesNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                  getIcon={getNotificationIcon}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  onClick,
  getIcon,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
  getIcon: (type: string) => string;
}) {
  return (
    <Card
      className={`${
        notification.is_read ? 'bg-card/30' : 'bg-card/50 border-primary/20'
      } border-border/50 transition-colors cursor-pointer hover:bg-card/60`}
      onClick={() => onClick(notification)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={notification.actor?.avatar_url || undefined} />
            <AvatarFallback className="text-lg">
              {getIcon(notification.type)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {notification.actor?.username && (
                <span className="font-medium text-foreground">
                  @{notification.actor.username}
                </span>
              )}
              {!notification.is_read && (
                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>

          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onMarkRead(notification.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(notification.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message = 'No notifications yet' }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
