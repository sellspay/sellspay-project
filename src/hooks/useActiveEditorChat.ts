import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface ChatRoom {
  id: string;
  booking_id: string;
  buyer_id: string;
  editor_id: string;
  expires_at: string;
  is_active: boolean;
}

export function useActiveEditorChat() {
  const { profile } = useAuth();
  const [activeChatRoom, setActiveChatRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    fetchActiveChat();

    // Subscribe to chat room changes
    const channel = supabase
      .channel('chat-room-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'editor_chat_rooms',
        },
        () => {
          fetchActiveChat();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchActiveChat = async () => {
    if (!profile?.id) return;

    setLoading(true);
    // Fetch chat rooms that haven't expired yet (includes read-only history after session ends)
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
    } else {
      setActiveChatRoom(null);
    }
    setLoading(false);
  };

  return {
    activeChatRoom,
    hasActiveChat: !!activeChatRoom,
    loading,
    refetch: fetchActiveChat,
  };
}
