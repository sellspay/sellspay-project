
# Update Product Original Filename

## Summary
Update the existing "Dandelions - Arcane AMV" product to set its `original_filename` to "Arcane edit (converted).aep" so the attachment displays the correct name.

## Current State
- **Product ID**: `d397a8c0-abd8-40a2-8f65-2e6e10e9db50`
- **Product Name**: Dandelions - Arcane AMV
- **Current original_filename**: NULL (empty)
- **Storage URL**: Shows timestamp-based filename `1769168307747.aep`

## Change Required
Execute a simple database UPDATE to set the `original_filename` column:

```sql
UPDATE products 
SET original_filename = 'Arcane edit (converted).aep' 
WHERE id = 'd397a8c0-abd8-40a2-8f65-2e6e10e9db50';
```

## Result
After this update:
- The Attachments section on the product page will display "Arcane edit (converted).aep"
- Downloads will use this filename instead of the storage ID
- No file re-upload needed
