-- Create a table to store custom profile sections
CREATE TABLE public.profile_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profile_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for profile sections
CREATE POLICY "Anyone can view visible profile sections" 
ON public.profile_sections 
FOR SELECT 
USING (is_visible = true OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = profile_sections.profile_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can manage their own profile sections" 
ON public.profile_sections 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = profile_sections.profile_id 
  AND profiles.user_id = auth.uid()
));

-- Add index for faster lookups
CREATE INDEX idx_profile_sections_profile_id ON public.profile_sections(profile_id);
CREATE INDEX idx_profile_sections_order ON public.profile_sections(profile_id, display_order);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profile_sections_updated_at
BEFORE UPDATE ON public.profile_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();