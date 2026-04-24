UPDATE public.vibecoder_projects
SET files = jsonb_set(
  files,
  '{/storefront/routes/Shop.tsx}',
  to_jsonb(
    replace(
      files->>'/storefront/routes/Shop.tsx',
      '</ProductCard></motion.div>',
      '</motion.div>'
    )
  )
)
WHERE id = 'c3bd831c-746e-4c8e-ad09-79809831599f'
  AND files->>'/storefront/routes/Shop.tsx' LIKE '%</ProductCard></motion.div>%';