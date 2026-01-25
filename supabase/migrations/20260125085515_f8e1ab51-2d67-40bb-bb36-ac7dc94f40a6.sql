
-- Drop the created_by column from products table as it contains email addresses (PII)
-- The creator_id column already stores the proper UUID reference
ALTER TABLE public.products DROP COLUMN IF EXISTS created_by;
