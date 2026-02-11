

# Migrate All AI Functions from Lovable Gateway to Direct Google Gemini API

## Summary

Replace the Lovable AI gateway (`ai.gateway.lovable.dev`) with direct Google Gemini API calls across all 5 edge functions. This removes the dependency on Lovable Cloud AI balance entirely -- your VibeCoder and all AI tools will run on your own Google API key.

---

## What Changes

| Component | Before | After |
|-----------|--------|-------|
| API endpoint | `https://ai.gateway.lovable.dev/v1/chat/completions` | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` |
| Auth key | `LOVABLE_API_KEY` (managed by Lovable) | `GOOGLE_GEMINI_API_KEY` (your own key) |
| Model names | `google/gemini-3-flash-preview`, `google/gemini-2.5-flash-lite`, `openai/gpt-5.2` | `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-pro` |
| Billing | Lovable Cloud balance | Your Google AI billing account |

---

## Pre-Requisite: API Key

You will need a **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey). I will securely store it as a backend secret called `GOOGLE_GEMINI_API_KEY`.

---

## Edge Functions to Update (5 total)

### 1. `vibecoder-v2/index.ts` (Main VibeCoder)
- Replace `LOVABLE_AI_URL` constant with Google endpoint
- Replace `LOVABLE_API_KEY` env var with `GOOGLE_GEMINI_API_KEY`
- Update `MODEL_CONFIG` mapping:
  - `vibecoder-pro` -> `gemini-2.5-flash` (fast, capable)
  - `vibecoder-flash` -> `gemini-2.5-flash-lite` (free-tier small edits)
  - `reasoning-o1` -> `gemini-2.5-pro` (deep reasoning)
- Update intent classifier model reference
- Both `classifyIntent()` and `executePrompt()` fetch calls updated

### 2. `enhance-sfx-prompt/index.ts`
- Replace gateway URL and API key references

### 3. `generate-image/index.ts`
- Replace gateway URL and API key
- Note: Image generation model reference may need updating depending on what model is used

### 4. `storefront-generate-asset/index.ts`
- Replace gateway URL and API key references

### 5. `storefront-vibecoder/index.ts`
- Replace gateway URL and API key across all function calls (`extractIntent`, `createPlan`, `generateOps`, `repairOps`)

---

## Model Name Mapping

Google's OpenAI-compatible endpoint uses different model names than the Lovable gateway prefix:

```text
Lovable Gateway Name         ->  Direct Google API Name
google/gemini-3-flash-preview -> gemini-2.5-flash
google/gemini-2.5-flash-lite  -> gemini-2.5-flash-lite
openai/gpt-5.2               -> gemini-2.5-pro
google/gemini-2.5-flash-image -> gemini-2.0-flash-exp (image gen)
```

---

## Implementation Steps

1. **Add Secret** - Request `GOOGLE_GEMINI_API_KEY` from you
2. **Update all 5 edge functions** - Swap endpoint, key, and model names
3. **Deploy all functions** - Redeploy to pick up the new config
4. **Test** - Verify VibeCoder generates correctly with the new API

---

## Technical Details

### API Call Format (stays OpenAI-compatible)

Google's Gemini API supports the OpenAI chat completions format, so the request/response shape stays identical. Only the URL, key header, and model string change:

```typescript
// BEFORE
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const apiKey = Deno.env.get("LOVABLE_API_KEY");

// AFTER
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const apiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
```

The `Authorization: Bearer ${apiKey}` header format remains the same -- Google's OpenAI-compatible endpoint accepts it.

### No Frontend Changes Required

The frontend calls the edge functions via Supabase -- it never touches the AI gateway directly. So zero client-side changes are needed.

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Google rate limits differ from Lovable | Monitor 429 errors; adjust retry logic if needed |
| Model output differences | Same underlying Gemini models, just called directly |
| Image generation model availability | Verify `gemini-2.0-flash-exp` supports image output on direct API |

