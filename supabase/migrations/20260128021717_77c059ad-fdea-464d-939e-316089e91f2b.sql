
-- Drop the existing constraint and recreate with new product types
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_product_type_check;

ALTER TABLE public.products ADD CONSTRAINT products_product_type_check 
CHECK (product_type IN (
  'preset', 'lut', 'sfx', 'music', 'template', 'overlay', 'font', 
  'tutorial', 'project_file', 'transition', 'color_grading', 
  'motion_graphics', 'other', 'digital_art', 'art', '3d_artist'
));
