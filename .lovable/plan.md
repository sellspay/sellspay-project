

## Fix vibecoder-v2 Boot Crash + CORS Hardening

### Root Cause: Boot Failure

The edge function logs show:
```
worker boot error: Uncaught SyntaxError: Unexpected reserved word
    at vibecoder-v2/index.ts:1736:46
```

The bug is in the `processContent` function (source line 1850). It's declared as a **non-async arrow function**:
```ts
const processContent = () => {
```

But inside it (around lines 1938 and 1955), it uses `await`:
```ts
const repairResponse = await fetch(GEMINI_API_URL, { ... });
// ...
const repairData = await repairResponse.json();
```

`await` is a reserved word that can only appear inside `async` functions. Deno's TypeScript compiler rejects this at boot time, preventing the entire function from loading.

### Fix 1: Make `processContent` async (line 1850)

Change:
```ts
const processContent = () => {
```
To:
```ts
const processContent = async () => {
```

And update the two call sites (lines 2045 and 2063) from:
```ts
processContent();
```
To:
```ts
await processContent();
```

### Fix 2: Bulletproof CORS headers across all edge functions

Standardize the `corsHeaders` object in these functions that are currently missing headers:

**Functions to update:**
- `generate-image/index.ts` -- missing `Access-Control-Allow-Methods` and `x-supabase-client-*` headers
- `deduct-ai-credits/index.ts` -- same issue
- `audio-stem-separation/index.ts` -- same issue
- `create-pro-tools-checkout/index.ts` -- same issue

Replace their `corsHeaders` with:
```ts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

Also ensure their OPTIONS handlers return explicit `status: 200` and body `"ok"` (some currently return `null` body).

### Fix 3: Safe JSON body parsing in vibecoder-v2

Wrap `await req.json()` (line 1470) in a try/catch so malformed or empty POST bodies return a proper 400 with CORS headers instead of crashing:

```ts
let body: any = {};
try {
  body = await req.json();
} catch {
  return new Response(
    JSON.stringify({ error: "Invalid or missing JSON body" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Summary of Changes

| File | Change |
|------|--------|
| `vibecoder-v2/index.ts` | Make `processContent` async, await its calls, safe body parsing |
| `generate-image/index.ts` | Standardize corsHeaders |
| `deduct-ai-credits/index.ts` | Standardize corsHeaders |
| `audio-stem-separation/index.ts` | Standardize corsHeaders |
| `create-pro-tools-checkout/index.ts` | Standardize corsHeaders |

After these changes, all functions will be deployed automatically. The boot crash will be resolved and CORS will be consistent everywhere.

