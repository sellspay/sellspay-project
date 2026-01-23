import { useState } from 'react';
import { Bell, Check, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Placeholder notifications - will be replaced with real data
const mockNotifications = [
  {
    id: 1,
    type: 'sale',
    title: 'New Sale!',
    message: 'Someone purchased your "Cinematic LUT Pack"',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 2,
    type: 'follow',
    title: 'New Follower',
    message: '@creativeeditor started following you',
    time: '5 hours ago',
    read: false,
  },
  {
    id: 3,
    type: 'update',
    title: 'Product Approved',
    message: 'Your product "Motion Graphics Pack" has been approved',
    time: '1 day ago',
    read: true,
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

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
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
            <Button variant="ghost" size="icon">
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
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-3">
            {notifications.filter((n) => !n.read).length === 0 ? (
              <EmptyState message="No unread notifications" />
            ) : (
              notifications
                .filter((n) => !n.read)
                .map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))
            )}
          </TabsContent>

          <TabsContent value="sales" className="space-y-3">
            {notifications.filter((n) => n.type === 'sale').length === 0 ? (
              <EmptyState message="No sales notifications" />
            ) : (
              notifications
                .filter((n) => n.type === 'sale')
                .map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
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
}: {
  notification: (typeof mockNotifications)[0];
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Card
      className={`${
        notification.read ? 'bg-card/30' : 'bg-card/50 border-primary/20'
      } border-border/50 transition-colors`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              )}
              <h3 className="font-medium text-foreground truncate">
                {notification.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {notification.time}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            {!notification.read && (
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
