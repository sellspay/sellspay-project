-- Add banner_position_y column to profiles table for storing banner vertical position
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_position_y INTEGER DEFAULT 50;