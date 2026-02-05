-- Fix RLS policies for storefront_ai_conversations
-- The current policies incorrectly compare profile_id to auth.uid() 
-- but profile_id is a foreign key to profiles.id, not to auth.users.id

-- Drop existing broken policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.storefront_ai_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.storefront_ai_conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.storefront_ai_conversations;

-- Create corrected policies that check profile ownership via the profiles table
CREATE POLICY "Users can view their own conversations"
ON public.storefront_ai_conversations
FOR SELECT
USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create their own conversations"
ON public.storefront_ai_conversations
FOR INSERT
WITH CHECK (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own conversations"
ON public.storefront_ai_conversations
FOR DELETE
USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);