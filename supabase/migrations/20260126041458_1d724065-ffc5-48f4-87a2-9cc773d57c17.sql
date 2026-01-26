-- Increase file size limit for product-files bucket to 5GB
UPDATE storage.buckets
SET file_size_limit = 5368709120  -- 5GB in bytes
WHERE name = 'product-files';