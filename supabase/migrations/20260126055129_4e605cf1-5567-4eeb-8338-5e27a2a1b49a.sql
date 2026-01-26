
-- Drop the old restrictive constraint
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_product_type_check;

-- Add new constraint with ALL product types from the UI
ALTER TABLE public.products ADD CONSTRAINT products_product_type_check 
CHECK (product_type = ANY (ARRAY[
  'preset'::text, 
  'lut'::text, 
  'sfx'::text, 
  'music'::text, 
  'template'::text, 
  'overlay'::text, 
  'font'::text, 
  'tutorial'::text, 
  'project_file'::text, 
  'transition'::text, 
  'color_grading'::text, 
  'motion_graphics'::text, 
  'other'::text
]));
