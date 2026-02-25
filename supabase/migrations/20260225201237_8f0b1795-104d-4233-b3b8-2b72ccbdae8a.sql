
UPDATE vibecoder_projects
SET last_valid_files = jsonb_set(
  last_valid_files::jsonb,
  '{/storefront/components/Hero.tsx}',
  to_jsonb(
    regexp_replace(
      last_valid_files::jsonb->>'/storefront/components/Hero.tsx',
      E'(</motion\\.div>\\s*</motion\\.div>)\\s*</section>',
      E'\\1\n      </div>\n    </section>',
      'g'
    )
  )
)
WHERE id = '53f6dae2-eaa4-46e7-bf80-3947873d1f3f';
