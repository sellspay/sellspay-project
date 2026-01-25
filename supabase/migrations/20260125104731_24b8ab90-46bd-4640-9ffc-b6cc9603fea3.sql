-- Create editor chat rooms table for 1-on-1 communication between buyer and editor
CREATE TABLE public.editor_chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.editor_bookings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  editor_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(booking_id)
);

-- Create editor chat messages table
CREATE TABLE public.editor_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.editor_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Add queue and status tracking columns to editor_bookings
ALTER TABLE public.editor_bookings 
ADD COLUMN IF NOT EXISTS queue_position INTEGER,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS chat_expires_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on chat tables
ALTER TABLE public.editor_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editor_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat rooms - only participants can access
CREATE POLICY "Participants can view their chat rooms"
ON public.editor_chat_rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND (p.id = buyer_id OR p.id = editor_id)
  )
);

CREATE POLICY "System can insert chat rooms"
ON public.editor_chat_rooms FOR INSERT
WITH CHECK (true);

CREATE POLICY "Participants can update their chat rooms"
ON public.editor_chat_rooms FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND (p.id = buyer_id OR p.id = editor_id)
  )
);

-- RLS policies for chat messages
CREATE POLICY "Participants can view messages in their rooms"
ON public.editor_chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.editor_chat_rooms r
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE r.id = room_id 
    AND (r.buyer_id = p.id OR r.editor_id = p.id)
  )
);

CREATE POLICY "Participants can send messages in active rooms"
ON public.editor_chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.editor_chat_rooms r
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE r.id = room_id 
    AND r.is_active = true
    AND r.expires_at > now()
    AND (r.buyer_id = p.id OR r.editor_id = p.id)
  )
);

CREATE POLICY "Users can mark their received messages as read"
ON public.editor_chat_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.editor_chat_rooms r
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE r.id = room_id 
    AND (r.buyer_id = p.id OR r.editor_id = p.id)
    AND sender_id != p.id
  )
);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.editor_chat_messages;

-- Create index for faster queries
CREATE INDEX idx_chat_messages_room_id ON public.editor_chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON public.editor_chat_messages(created_at);
CREATE INDEX idx_chat_rooms_participants ON public.editor_chat_rooms(buyer_id, editor_id);
CREATE INDEX idx_editor_bookings_editor_status ON public.editor_bookings(editor_id, status);