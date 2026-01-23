-- Create collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection_items junction table
CREATE TABLE public.collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, product_id)
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Anyone can view collections"
ON public.collections FOR SELECT
USING (true);

CREATE POLICY "Creators can insert their own collections"
ON public.collections FOR INSERT
WITH CHECK (creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Creators can update their own collections"
ON public.collections FOR UPDATE
USING (creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Creators can delete their own collections"
ON public.collections FOR DELETE
USING (creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Collection items policies
CREATE POLICY "Anyone can view collection items"
ON public.collection_items FOR SELECT
USING (true);

CREATE POLICY "Creators can insert items to their collections"
ON public.collection_items FOR INSERT
WITH CHECK (collection_id IN (
  SELECT c.id FROM collections c
  JOIN profiles p ON c.creator_id = p.id
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Creators can delete items from their collections"
ON public.collection_items FOR DELETE
USING (collection_id IN (
  SELECT c.id FROM collections c
  JOIN profiles p ON c.creator_id = p.id
  WHERE p.user_id = auth.uid()
));

-- Add updated_at trigger for collections
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();