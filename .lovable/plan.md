

## Fix: Theme Live Preview - CSS Variable Override

### Problem
The `VIBECODER_APPLY_THEME` handler inside the Sandpack iframe is structurally correct (runs in the right document), but has two issues causing 80% of color changes to not take effect:

1. **CSS Specificity** -- The override targets `:root`, but if any generated code or Tailwind CDN applies variables under `.dark` or `html.dark`, those selectors win. The override needs to target `html, html.dark` to guarantee it wins regardless of dark mode class.

2. **Unnecessary `!important`** -- The `!important` flags create unpredictable cascade behavior. Since the style element is appended last in `<head>`, it already wins by source order. Removing `!important` makes the system cleaner.

### Changes

**File: `src/components/ai-builder/VibecoderPreview.tsx`**

Two-line change in the `VIBECODER_APPLY_THEME` handler (around line 1036-1040):

1. Change the CSS selector from `:root` to `html, html.dark` (line 1036)
2. Remove `!important` from variable assignments (line 1040)

Before:
```javascript
let css = ':root {\\n';
// ...
css += '  ' + varName + ': ' + hexToHSL(hex) + ' !important;\\n';
```

After:
```javascript
let css = 'html, html.dark {\\n';
// ...
css += '  ' + varName + ': ' + hexToHSL(hex) + ';\\n';
```

That's the entire fix. No system rewrite needed.

