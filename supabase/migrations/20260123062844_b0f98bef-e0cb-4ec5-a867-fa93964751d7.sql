-- Create product_likes table to track likes on products
CREATE TABLE public.product_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Enable RLS
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_likes
CREATE POLICY "Anyone can view product likes"
  ON public.product_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like products"
  ON public.product_likes FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can unlike products"
  ON public.product_likes FOR DELETE
  USING (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create comments table for product comments
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for comments
CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Add trigger for updated_at on comments
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();