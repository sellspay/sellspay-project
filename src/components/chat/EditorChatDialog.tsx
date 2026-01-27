import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Clock, Sparkles, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatRoom {
  id: string;
  booking_id: string;
  buyer_id: string;
  editor_id: string;
  expires_at: string;
  is_active: boolean;
}

interface Booking {
  id: string;
  status: string;
  completed_at: string | null;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface EditorChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatRoom: ChatRoom;
  onMessagesRead: () => void;
}

export default function EditorChatDialog({ open, onOpenChange, chatRoom, onMessagesRead }: EditorChatDialogProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isExpired = new Date(chatRoom.expires_at) < new Date();
  const isSessionEnded = booking?.status === 'completed';
  const canSendMessages = !isExpired && !isSessionEnded;
  const isBuyer = profile?.id === chatRoom.buyer_id;

  useEffect(() => {
    if (open && chatRoom) {
      fetchMessages();
      fetchOtherUser();
      fetchBooking();
      markMessagesAsRead();

      // Subscribe to new messages
      const channel = supabase
        .channel(`chat-${chatRoom.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'editor_chat_messages',
            filter: `room_id=eq.${chatRoom.id}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages(prev => [...prev, newMsg]);
            if (newMsg.sender_id !== profile?.id) {
              markMessagesAsRead();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, chatRoom?.id]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('editor_chat_messages')
      .select('*')
      .eq('room_id', chatRoom.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const fetchOtherUser = async () => {
    const otherId = isBuyer ? chatRoom.editor_id : chatRoom.buyer_id;
    
    const { data } = await supabase
      .from('public_profiles')
      .select('id, full_name, username, avatar_url')
      .eq('id', otherId)
      .single();

    if (data) {
      setOtherUser(data);
    }
  };

  const fetchBooking = async () => {
    const { data } = await supabase
      .from('editor_bookings')
      .select('id, status, completed_at')
      .eq('id', chatRoom.booking_id)
      .single();

    if (data) {
      setBooking(data);
    }
  };

  const markMessagesAsRead = async () => {
    if (!profile?.id) return;

    await supabase
      .from('editor_chat_messages')
      .update({ is_read: true })
      .eq('room_id', chatRoom.id)
      .neq('sender_id', profile.id)
      .eq('is_read', false);

    onMessagesRead();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !canSendMessages || !profile?.id) return;

    setSending(true);
    const { error } = await supabase
      .from('editor_chat_messages')
      .insert({
        room_id: chatRoom.id,
        sender_id: profile.id,
        content: newMessage.trim(),
      });

    if (!error) {
      setNewMessage('');
      inputRef.current?.focus();
    }
    setSending(false);
  };

  const timeRemaining = formatDistanceToNow(new Date(chatRoom.expires_at), { addSuffix: true });

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[600px] p-0 overflow-hidden bg-gradient-to-b from-background via-background to-background/95 border-primary/20">
        {/* Premium Header */}
        <div className="relative">
          {/* Gradient accent */}
          <div className="absolute inset-0 h-20 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-violet-500/20" />
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          
          <DialogHeader className="relative p-4 pb-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-primary/30 shadow-lg">
                  <AvatarImage src={otherUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                {canSendMessages && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                  {otherUser?.full_name || otherUser?.username || 'Editor'}
                  <Sparkles className="h-4 w-4 text-primary" />
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {isBuyer ? 'Your Editor' : 'Your Client'}
                </p>
              </div>
              <Badge 
                variant="outline" 
                className={`flex items-center gap-1 text-xs ${
                  isExpired 
                    ? 'border-destructive/50 text-destructive' 
                    : isSessionEnded 
                      ? 'border-muted-foreground/50 text-muted-foreground' 
                      : 'border-primary/30 text-primary'
                }`}
              >
                <Clock className="h-3 w-3" />
                {isExpired ? 'Expired' : isSessionEnded ? 'Read Only' : `Active`}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 h-[420px] px-4" ref={scrollRef}>
          <div className="py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Start the conversation</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Say hello and discuss your project details with {isBuyer ? 'your editor' : 'your client'}.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((message, index) => {
                  const isOwn = message.sender_id === profile?.id;
                  const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {showAvatar ? (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage 
                            src={isOwn ? profile?.avatar_url || undefined : otherUser?.avatar_url || undefined} 
                          />
                          <AvatarFallback className={isOwn ? 'bg-primary/20' : 'bg-secondary'}>
                            {(isOwn ? profile?.username : otherUser?.username)?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8" />
                      )}
                      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl ${
                            isOwn
                              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-br-md'
                              : 'bg-secondary/80 text-foreground rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
                        </div>
                        <p className={`text-[10px] text-muted-foreground mt-1 ${isOwn ? 'text-right' : ''}`}>
                          {format(new Date(message.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
          {isExpired ? (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                This chat has expired. The 7-day history window has ended.
              </p>
            </div>
          ) : isSessionEnded ? (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                Session complete. Chat history available for {formatDistanceToNow(new Date(chatRoom.expires_at), { addSuffix: false })} more.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-secondary/50 border-border/50 rounded-full px-4 focus-visible:ring-primary/30"
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim() || sending}
                className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-lg shadow-primary/25"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
