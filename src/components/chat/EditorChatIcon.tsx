import { useState, useEffect, forwardRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import EditorChatDialog from './EditorChatDialog';

interface ChatRoom {
  id: string;
  booking_id: string;
  buyer_id: string;
  editor_id: string;
  expires_at: string;
  is_active: boolean;
}

const EditorChatIcon = forwardRef<HTMLDivElement>((_, ref) => {
  const { profile } = useAuth();
  const [activeChatRoom, setActiveChatRoom] = useState<ChatRoom | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;

    fetchActiveChat();

    const channel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'editor_chat_messages',
        },
        (payload) => {
          if (activeChatRoom && payload.new.room_id === activeChatRoom.id && payload.new.sender_id !== profile.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, activeChatRoom?.id]);

  const fetchActiveChat = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('editor_chat_rooms')
      .select('*')
      .or(`buyer_id.eq.${profile.id},editor_id.eq.${profile.id}`)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setActiveChatRoom(data);
      fetchUnreadCount(data.id);
    } else {
      setActiveChatRoom(null);
    }
  };

  const fetchUnreadCount = async (roomId: string) => {
    if (!profile?.id) return;

    const { count } = await supabase
      .from('editor_chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('is_read', false)
      .neq('sender_id', profile.id);

    setUnreadCount(count || 0);
  };

  if (!activeChatRoom) return null;

  return (
    <div ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-full hover:bg-secondary/80"
        onClick={() => {
          setChatOpen(true);
          setUnreadCount(0);
        }}
      >
        <div className="relative">
          <MessageCircle className="h-5 w-5 text-primary" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[10px] font-bold border-0 animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </Button>

      <EditorChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        chatRoom={activeChatRoom}
        onMessagesRead={() => setUnreadCount(0)}
      />
    </div>
  );
});

EditorChatIcon.displayName = 'EditorChatIcon';

export default EditorChatIcon;
