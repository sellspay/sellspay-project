

# Theme System Migration: Clean Architecture Refactor

## Current State (What Exists)

The theme system has **two parallel pipelines** doing the same job:

1. **Clean layer** (`src/lib/theme/`): `ThemeTokens` contract, `applyTheme()` via batched `rAF`, `TOKEN_TO_CSS_VAR` mapping, schema versioning, diagnostics -- all well-structured.

2. **Legacy bridge layer** (`VibecoderPreview.tsx` lines 446-630): A `ThemeBridge` component that **duplicates** `TOKEN_TO_CSS_VAR` inline, has its own `hexToHSL()`, its own `tokensToCSSString()` with a hardcoded `--radius: 0.5rem`, a kebab-case legacy mapper, and injects theme via `<style>` tag into the Sandpack iframe.

The flow today:
```text
ThemeContext dispatches "vibecoder-theme-apply" CustomEvent
        |
        v
ThemeBridge (inside Sandpack) catches it
        |
        v
buildThemeCSS() -- duplicates TOKEN_TO_CSS_VAR, has hexToHSL fallback
        |
        v
postMessage "VIBECODER_INJECT_THEME" { css } to iframe
        |
        v
Iframe listener creates <style id="vibecoder-theme-override"> tag
```

## What Needs To Change

### 1. ThemeBridge: Use the canonical `themeToCSSString` from `theme-engine.ts`

**Problem**: `ThemeBridge` has its own `TOKEN_TO_CSS_VAR` (20 keys -- missing all the new gradient/glass/typography/density tokens), its own `hexToHSL`, and hardcodes `--radius: 0.5rem`.

**Fix**: Import and use `themeToCSSString` from `@/lib/theme/theme-engine` directly. Delete the inline duplicates (`TOKEN_TO_CSS_VAR`, `tokensToCSSString`, `hexToHSL`, `buildThemeCSS`, `kebabMap`). This is ~70 lines of dead code.

The `handleApply` function becomes:
```typescript
const handleApply = (e: Event) => {
  const tokens = (e as CustomEvent).detail as ThemeTokens;
  if (!tokens) return;
  const css = themeToCSSString(tokens);
  lastAppliedCSS = css;
  sendToIframe('VIBECODER_INJECT_THEME', { css });
  // Persist to Sandpack file system for recompile survival
  try { sandpack.updateFile('/styles/theme-base.css', css); } catch {}
};
```

### 2. Remove hex fallback path

**Problem**: `buildThemeCSS` auto-detects hex vs HSL and converts at runtime. Since all token sources (presets, auto-extraction, import, vibe modifier) now output HSL, this path is dead.

**Fix**: Delete the hex detection branch entirely. The `hexToHSL` in `theme-engine.ts` stays as an exported utility (used by `ThemeEditorDialog` for color picker conversion), but the bridge no longer does format sniffing.

### 3. Fix hardcoded `--radius: 0.5rem` in iframe CSS

**Problem**: The bridge's `tokensToCSSString` appends `--radius: 0.5rem` at the end of every injected CSS block, overriding whatever `radiusScale` the theme engine set.

**Fix**: Removed by using `themeToCSSString` which reads `radiusScale` from the token and maps it to `--radius` through `TOKEN_TO_CSS_VAR`.

### 4. Remove legacy kebab-case mapping

**Problem**: The bridge has a separate `kebabMap` for keys like `'primary-foreground'` and `'chart-1'`. This was needed when `StyleColors` (kebab-case) was the format. Now everything flows through `ThemeTokens` (camelCase).

**Fix**: Deleted along with the rest of the inline bridge code.

### 5. Iframe `<style>` injection stays (intentionally)

The iframe-side listener that creates `<style id="vibecoder-theme-override">` is **correct and necessary**. Sandpack iframes are cross-origin sandboxes -- we cannot set `style` properties on `documentElement` from the parent. `postMessage` + `<style>` tag is the only viable approach. This is **not** the same as injecting `<style>` tags in the main document.

### 6. Ensure all new tokens reach the iframe

With the switch to canonical `themeToCSSString`, the iframe will now receive **all** tokens including gradient, glass, typography, radius, transition speed, section padding, texture, and CTA style -- which the old bridge was silently dropping.

## Files Changed

| File | Change |
|------|--------|
| `src/components/ai-builder/VibecoderPreview.tsx` | Delete ~70 lines (inline `TOKEN_TO_CSS_VAR`, `hexToHSL`, `tokensToCSSString`, `buildThemeCSS`, `kebabMap`). Import `themeToCSSString` from `@/lib/theme`. Simplify `handleApply`. |
| `src/components/ai-builder/stylePresets.ts` | No changes needed -- already a pure bridge adapter. |
| `src/lib/theme/theme-engine.ts` | No changes needed -- `themeToCSSString` is already correct. |

## What Does NOT Change

- The `vibecoder-theme-apply` CustomEvent dispatch pattern (ThemeContext to ThemeBridge) -- this is clean.
- The iframe-side `<style>` tag injection -- required for Sandpack sandboxing.
- The `VIBECODER_REQUEST_THEME` handshake for recompile survival -- correct.
- The `sandpack.updateFile('/styles/theme-base.css', css)` persistence -- correct.
- The `!important` usage in `SANDPACK_HEIGHT_FIX` -- these target Sandpack layout chrome, not theme.
- The `ThemeEditorDialog.tsx` hex-to-HSL conversion -- that's UI-layer conversion for color pickers, appropriate there.

## Risk Assessment

**Low risk.** This is removing duplicated code and routing through the canonical path. The only behavioral change is that the iframe will now receive ~15 additional CSS variables (gradient, glass, typography tokens) that it wasn't getting before. This is additive and harmless -- unused variables don't affect rendering.

