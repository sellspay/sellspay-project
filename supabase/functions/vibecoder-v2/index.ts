import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════════
// DATA AVAILABILITY CHECK: Detect if user needs to set up data
// ═══════════════════════════════════════════════════════════════

interface DataAvailabilityResult {
  needsSubscriptionPlans: boolean;
  needsProducts: boolean;
  subscriptionCount: number;
  productCount: number;
  requestedSubscriptionCount: number;
  requestedProductCount: number;
}

// Keywords that indicate the user is building a pricing/subscription page
const PRICING_KEYWORDS = [
  "pricing",
  "price",
  "subscription",
  "plan",
  "tier",
  "membership",
  "monthly",
  "yearly",
  "annual",
  "premium",
  "pro plan",
  "basic plan",
  "enterprise",
  "billing",
  "payment plan",
  "recurring",
];

// Keywords that indicate the user is building a products page
const PRODUCT_KEYWORDS = [
  "product",
  "shop",
  "store",
  "catalog",
  "merchandise",
  "item",
  "buy",
  "purchase",
  "cart",
  "checkout",
  "listing",
  "collection",
];

/**
 * Detects if the prompt is about pricing/subscriptions or products
 * and returns what count of items the user mentioned (if any)
 */
function detectDataIntent(prompt: string): {
  needsPricing: boolean;
  needsProducts: boolean;
  requestedPricingCount: number;
  requestedProductCount: number;
} {
  const lower = prompt.toLowerCase();

  const needsPricing = PRICING_KEYWORDS.some((kw) => lower.includes(kw));
  const needsProducts = PRODUCT_KEYWORDS.some((kw) => lower.includes(kw));

  // Try to detect how many items they're requesting
  let requestedPricingCount = 0;
  let requestedProductCount = 0;

  // Common patterns: "three subscriptions", "3 plans", "ten products"
  const numberMap: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
  };

  // Check for numbers near pricing keywords
  if (needsPricing) {
    const pricingMatch = lower.match(
      /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:subscription|plan|tier|pricing|price)/,
    );
    if (pricingMatch) {
      const num = pricingMatch[1];
      requestedPricingCount = numberMap[num] ?? (parseInt(num) || 0);
    }
  }

  // Check for numbers near product keywords
  if (needsProducts) {
    const productMatch = lower.match(
      /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:product|item|listing)/,
    );
    if (productMatch) {
      const num = productMatch[1];
      requestedProductCount = numberMap[num] ?? (parseInt(num) || 0);
    }
  }

  return { needsPricing, needsProducts, requestedPricingCount, requestedProductCount };
}

/**
 * Check the database for the user's actual subscription plans and products
 */
async function checkDataAvailability(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  prompt: string,
): Promise<DataAvailabilityResult | null> {
  const intent = detectDataIntent(prompt);

  // If prompt doesn't mention pricing or products, skip the check
  if (!intent.needsPricing && !intent.needsProducts) {
    return null;
  }

  // Get the user's profile ID first
  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", userId).single();

  if (!profile) return null;

  let subscriptionCount = 0;
  let productCount = 0;

  // Check subscription plans if needed
  if (intent.needsPricing) {
    const { count } = await supabase
      .from("creator_subscription_plans")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", profile.id)
      .eq("is_active", true);

    subscriptionCount = count ?? 0;
  }

  // Check products if needed
  if (intent.needsProducts) {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", profile.id)
      .eq("status", "published");

    productCount = count ?? 0;
  }

  return {
    needsSubscriptionPlans: intent.needsPricing && subscriptionCount === 0,
    needsProducts:
      intent.needsProducts &&
      (productCount === 0 || (intent.requestedProductCount > 0 && productCount < intent.requestedProductCount)),
    subscriptionCount,
    productCount,
    requestedSubscriptionCount: intent.requestedPricingCount,
    requestedProductCount: intent.requestedProductCount,
  };
}

/**
 * Generate a helpful "Next Steps" message for missing data
 */
function generateDataGuidance(result: DataAvailabilityResult): string {
  const parts: string[] = [];

  if (result.needsSubscriptionPlans) {
    parts.push(
      `\n\n---\n\n⚠️ **Heads up:** You don't have any subscription plans set up yet. ` +
        `The pricing cards I created are placeholders. To make them functional:\n\n` +
        `1. Go to your **Settings → Subscriptions** or use the **Subscriptions tab** above\n` +
        `2. Create your subscription plans with your actual pricing\n` +
        `3. Come back and tell me to "link my subscriptions to the pricing cards"\n`,
    );
  }

  if (result.needsProducts) {
    if (result.productCount === 0) {
      parts.push(
        `\n\n---\n\n⚠️ **Heads up:** You don't have any products yet. ` +
          `The product cards I created are using placeholder data. To make them real:\n\n` +
          `1. Use the **Products tab** above to create your products\n` +
          `2. Once you have products, tell me to "use my real products" and I'll update the page\n`,
      );
    } else if (result.requestedProductCount > 0 && result.productCount < result.requestedProductCount) {
      const missing = result.requestedProductCount - result.productCount;
      parts.push(
        `\n\n---\n\n⚠️ **Heads up:** You asked for ${result.requestedProductCount} products, but you only have ${result.productCount}. ` +
          `I've filled the extra ${missing} slot${missing > 1 ? "s" : ""} with placeholder${missing > 1 ? "s" : ""}.\n\n` +
          `Create ${missing} more product${missing > 1 ? "s" : ""} in the **Products tab**, then tell me to refresh the products!\n`,
      );
    }
  }

  return parts.join("");
}

// ═══════════════════════════════════════════════════════════════
// HEALER PROTOCOL: OUTPUT INTEGRITY VALIDATION
// ═══════════════════════════════════════════════════════════════
// Validates AI output BEFORE saving to database to prevent broken code.
// Checks for: completion sentinel, unterminated strings, unbalanced braces.

const VIBECODER_COMPLETE_SENTINEL = "// --- VIBECODER_COMPLETE ---";

// ═══════════════════════════════════════════════════════════════
// TRUNCATION DETECTION: Hard fail, no patching
// ═══════════════════════════════════════════════════════════════

/**
 * Detailed truncation check that returns a specific error code.
 * For FIX intent, skips sentinel check (model often omits it for small edits).
 */
function getValidationError(code: string, _intent?: string): { type: string; message: string } | null {
  if (!code || code.trim().length < 50) {
    return { type: "MODEL_EMPTY_RESPONSE", message: "AI returned no usable code. Please retry." };
  }

  if (!/export\s+default\s/.test(code)) {
    return { type: "MISSING_EXPORT_DEFAULT", message: "Generated code was incomplete (missing component export). Please retry." };
  }

  const opens = (code.match(/[({[]/g) ?? []).length;
  const closes = (code.match(/[)\]}]/g) ?? []).length;
  if (closes < opens - 2) {
    return { type: "MODEL_TRUNCATED", message: "Generated code appears truncated (unbalanced brackets). Retrying..." };
  }

  if (code.length < 300) {
    return { type: "CODE_TOO_SHORT", message: "Generated code was too short to be a valid component. Please retry." };
  }

  // Sentinel check REMOVED — structural checks above are sufficient
  // The sentinel was brittle and caused false MISSING_SENTINEL failures
  return null;
}

// Legacy wrapper for backwards compat
function looksTruncated(code: string, intent?: string): boolean {
  return getValidationError(code, intent) !== null;
}

// ═══════════════════════════════════════════════════════════════
// SERVER-SIDE TRANSPILE VALIDATOR (Ported from frontend)
// Catches syntax errors BEFORE committing to DB
// ═══════════════════════════════════════════════════════════════

function validateFileSyntaxServer(content: string, filePath: string): string | null {
  if (!content || content.trim().length === 0) return 'Empty file';
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
    return null; // Skip non-code files
  }

  // 1. Brace/paren/bracket balance (string & comment aware)
  let braces = 0, parens = 0, brackets = 0;
  let inSingle = false, inDouble = false, inTemplate = false;
  let inLineComment = false, inBlockComment = false, escaped = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const n = content[i + 1];
    if (inLineComment) { if (c === '\n') inLineComment = false; continue; }
    if (inBlockComment) { if (c === '*' && n === '/') { inBlockComment = false; i++; } continue; }
    if (inSingle || inDouble || inTemplate) {
      if (escaped) { escaped = false; continue; }
      if (c === '\\') { escaped = true; continue; }
      if (inSingle && c === "'") inSingle = false;
      else if (inDouble && c === '"') inDouble = false;
      else if (inTemplate && c === '`') inTemplate = false;
      continue;
    }
    if (c === '/' && n === '/') { inLineComment = true; i++; continue; }
    if (c === '/' && n === '*') { inBlockComment = true; i++; continue; }
    if (c === "'") { inSingle = true; continue; }
    if (c === '"') { inDouble = true; continue; }
    if (c === '`') { inTemplate = true; continue; }
    if (c === '{') braces++; else if (c === '}') braces--;
    if (c === '(') parens++; else if (c === ')') parens--;
    if (c === '[') brackets++; else if (c === ']') brackets--;
    if (braces < 0) return 'Extra closing brace }';
    if (parens < 0) return 'Extra closing parenthesis )';
    if (brackets < 0) return 'Extra closing bracket ]';
  }

  if (inSingle || inDouble || inTemplate) return 'Unterminated string literal';
  if (inBlockComment) return 'Unterminated block comment';
  if (braces !== 0) return `Unbalanced braces: ${braces > 0 ? braces + ' unclosed' : Math.abs(braces) + ' extra closing'}`;
  if (parens !== 0) return `Unbalanced parentheses: ${parens > 0 ? parens + ' unclosed' : Math.abs(parens) + ' extra closing'}`;
  if (brackets !== 0) return `Unbalanced brackets: ${brackets > 0 ? brackets + ' unclosed' : Math.abs(brackets) + ' extra closing'}`;

  // 2. Truncation detection
  const trimmed = content.trim();
  const lastChar = trimmed.slice(-1);
  if (['{', '(', '[', ',', ':', '=', '.', '+', '-', '*', '/'].includes(lastChar)) {
    return `Code appears truncated — ends with "${lastChar}"`;
  }

  // 3. Malformed CSS url() (common AI error)
  if (/url\([^)]*\([^)]*\)/.test(content)) {
    return 'Malformed CSS url() — contains nested parentheses';
  }

  return null;
}

function validateAllFilesServer(files: Record<string, string>): { valid: boolean; errors: Array<{ file: string; error: string }> } {
  const errors: Array<{ file: string; error: string }> = [];
  for (const [path, content] of Object.entries(files)) {
    if (typeof content !== 'string') continue;
    const error = validateFileSyntaxServer(content, path);
    if (error) errors.push({ file: path, error });
  }
  return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════
// SERVER-SIDE PATH ISOLATION GUARD (Layer 7)
// Prevents AI from writing to restricted folders
// ═══════════════════════════════════════════════════════════════

const RESTRICTED_PATH_PREFIXES = [
  '/core/', '/checkout/', '/auth/', '/payments/',
  '/settings/', '/admin/', '/api/'
];

function validatePathIsolationServer(
  files: Record<string, string>,
  legacyMode: boolean = false
): { valid: boolean; errors: Array<{ file: string; error: string }> } {
  const errors: Array<{ file: string; error: string }> = [];
  for (const path of Object.keys(files)) {
    if (path.includes('..')) {
      errors.push({ file: path, error: 'Path traversal detected' });
      continue;
    }
    if (RESTRICTED_PATH_PREFIXES.some(p => path.startsWith(p))) {
      errors.push({ file: path, error: 'Targets restricted folder' });
      continue;
    }
    if (!legacyMode && !path.startsWith('/storefront/') && path !== '/App.tsx') {
      errors.push({ file: path, error: 'File must be under /storefront/' });
    }
  }
  return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════
// COMPILE-FIX REPAIR: Model-aware — uses same model that generated
// Premium models repair with premium. Flash stays in its tier.
// ═══════════════════════════════════════════════════════════════

async function repairBrokenFile(
  filePath: string,
  brokenContent: string,
  syntaxError: string,
  generatorConfig: ModelConfig,
): Promise<string | null> {
  try {
    console.log(`[CompileFix] Attempting repair of ${filePath} using ${generatorConfig.provider}/${generatorConfig.modelId}: ${syntaxError}`);
    
    const repairMessages = [
      {
        role: "system" as const,
        content: `You are a syntax repair tool. You receive a React/TypeScript file with a specific syntax error. Your ONLY job is to fix that exact error and return the corrected file.

RULES:
1. Return ONLY the corrected file content — no markdown fences, no explanation, no commentary
2. Fix ONLY the syntax error described — do NOT change logic, styling, or structure
3. If the error is "Unbalanced braces", find and close the missing brace
4. If the error is "Unterminated string literal", find and close the string
5. If the error is "Malformed CSS url()", fix the url() syntax
6. If the error is "Code appears truncated", complete the truncated expression
7. Preserve ALL existing code exactly as-is except for the fix`,
      },
      {
        role: "user" as const,
        content: `File: ${filePath}\nSyntax Error: ${syntaxError}\n\nBroken content:\n${brokenContent}`,
      },
    ];

    // Use the same model that generated the broken code (model-aware repair)
    const response = await callModelAPI(generatorConfig, repairMessages, {
      maxTokens: 8000,
      temperature: 0.1,
      stream: false,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(`[CompileFix] Repair API call failed for ${filePath}: ${response.status} ${errorBody.slice(0, 200)}`);
      return null;
    }

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn(`[CompileFix] Failed to parse repair response for ${filePath}:`, parseErr);
      return null;
    }

    // Handle normalized OpenAI-style format first, then Anthropic fallback
    let repaired: string | null = null;
    if (data?.choices?.[0]?.message?.content) {
      repaired = data.choices[0].message.content;
    } else if (Array.isArray(data?.content)) {
      repaired = data.content
        .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
        .join("");
    }

    if (!repaired || repaired.trim().length < 20) return null;

    // Strip markdown fences if model wrapped it
    const cleaned = repaired
      .replace(/^```(?:tsx?|jsx?|typescript|javascript)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    // Validate the repair actually fixed the issue
    const recheck = validateFileSyntaxServer(cleaned, filePath);
    if (recheck) {
      console.warn(`[CompileFix] Repair of ${filePath} still has errors: ${recheck}`);
      return null;
    }

    console.log(`[CompileFix] ✅ Successfully repaired ${filePath} using ${generatorConfig.provider}`);
    return cleaned;
  } catch (e) {
    console.error(`[CompileFix] Exception repairing ${filePath}:`, e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// VIBE INTENT DETECTION (Backend port of vibe-from-text.ts)
// Detects aesthetic/emotional keywords for Brand Layer injection
// ═══════════════════════════════════════════════════════════════

const VIBE_KEYWORD_MAP: Array<{ vibe: string; keywords: string[]; weight: number }> = [
  { vibe: 'cyberpunk', keywords: ['futuristic', 'neon', 'cyber', 'sci-fi', 'scifi', 'hacker', 'matrix', 'synthwave', 'retrowave', 'vaporwave', 'glitch', 'tech noir'], weight: 3 },
  { vibe: 'luxury', keywords: ['luxury', 'premium', 'elegant', 'exclusive', 'high-end', 'highend', 'sophisticated', 'upscale', 'boutique', 'jewel', 'gold', 'marble', 'opulent'], weight: 3 },
  { vibe: 'playful', keywords: ['playful', 'fun', 'colorful', 'vibrant', 'cheerful', 'bright', 'energetic', 'kids', 'gaming', 'cartoon', 'whimsical', 'quirky'], weight: 3 },
  { vibe: 'minimal', keywords: ['minimal', 'minimalist', 'clean', 'simple', 'zen', 'whitespace', 'bare', 'austere', 'understated', 'stripped'], weight: 3 },
  { vibe: 'corporate', keywords: ['corporate', 'saas', 'enterprise', 'b2b', 'business', 'professional', 'dashboard', 'fintech', 'banking', 'consulting', 'agency'], weight: 2 },
  { vibe: 'editorial', keywords: ['editorial', 'magazine', 'blog', 'journal', 'newspaper', 'article', 'portfolio', 'gallery', 'photography', 'typography'], weight: 2 },
  { vibe: 'modern', keywords: ['modern', 'contemporary', 'sleek', 'sharp', 'startup', 'app', 'landing'], weight: 1 },
];

function detectVibeIntent(prompt: string): string | null {
  if (!prompt || prompt.length < 3) return null;
  const p = prompt.toLowerCase();
  const scores: Record<string, number> = {};
  for (const entry of VIBE_KEYWORD_MAP) {
    for (const kw of entry.keywords) {
      if (p.includes(kw)) {
        scores[entry.vibe] = (scores[entry.vibe] || 0) + entry.weight;
      }
    }
  }
  let bestVibe: string | null = null;
  let bestScore = 0;
  for (const [vibe, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; bestVibe = vibe; }
  }
  return bestScore > 0 ? bestVibe : null;
}

// ═══════════════════════════════════════════════════════════════
// FILE INVENTORY DIFF ENGINE
// Compares current projectFiles against last_valid_files snapshot
// to inject file-level diff awareness into MODIFY/FIX prompts
// ═══════════════════════════════════════════════════════════════

function computeFileDiff(
  prevFiles: Record<string, string> | null,
  newFiles: Record<string, string>,
): { added: string[]; removed: string[]; modified: string[]; unchanged: string[] } {
  if (!prevFiles) {
    return { added: Object.keys(newFiles), removed: [], modified: [], unchanged: [] };
  }
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];
  const unchanged: string[] = [];

  const allKeys = new Set([...Object.keys(prevFiles), ...Object.keys(newFiles)]);
  for (const key of allKeys) {
    if (!(key in prevFiles)) { added.push(key); }
    else if (!(key in newFiles)) { removed.push(key); }
    else if (prevFiles[key] !== newFiles[key]) { modified.push(key); }
    else { unchanged.push(key); }
  }
  return { added, removed, modified, unchanged };
}

// ═══════════════════════════════════════════════════════════════
// NO-OP DETECTOR: Catches "silent failure" where output matches input
// ═══════════════════════════════════════════════════════════════

function isNoOp(prev: string | null, next: string): boolean {
  if (!prev) return false;
  const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
  const a = normalize(prev);
  const b = normalize(next);
  if (a === b) return true;
  const delta = Math.abs(a.length - b.length) / Math.max(a.length, 1);
  return delta < 0.01;
}

// ═══════════════════════════════════════════════════════════════
// INTENT VALIDATOR: Cheap AI check — did output match request?
// ═══════════════════════════════════════════════════════════════

async function validateIntent(
  userPrompt: string,
  generatedCode: string,
  apiKey: string,
): Promise<{ implements_request: boolean; missing_requirements: string[] }> {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a strict code reviewer. Answer ONLY valid JSON.`,
          },
          {
            role: "user",
            content: `User request: "${userPrompt}"\n\nGenerated code (first 3000 chars):\n${generatedCode.slice(0, 3000)}\n\nDoes this code implement the user's request? Answer ONLY valid JSON:\n{"implements_request": boolean, "missing_requirements": string[]}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.warn("[IntentValidator] API call failed, defaulting to pass");
      return { implements_request: true, missing_requirements: [] };
    }

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn("[IntentValidator] Failed to parse API response, defaulting to pass:", parseErr);
      return { implements_request: true, missing_requirements: [] };
    }
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      implements_request: parsed.implements_request ?? true,
      missing_requirements: parsed.missing_requirements ?? [],
    };
  } catch (e) {
    console.warn("[IntentValidator] Parse error, defaulting to pass:", e);
    return { implements_request: true, missing_requirements: [] };
  }
}

// ═══════════════════════════════════════════════════════════════
// LEGACY VALIDATION (kept for backward compat but simplified)
// ═══════════════════════════════════════════════════════════════

// Fair Pricing Economy (8x reduction from original)
const CREDIT_COSTS: Record<string, number> = {
  "vibecoder-pro": 3, // Gemini Pro
  "vibecoder-flash": 0, // Free tier for small edits
  "vibecoder-claude": 5, // Claude Sonnet (premium)
  "vibecoder-gpt4": 5, // GPT-4o (premium)
  "vibecoder-gpt41": 5, // GPT-4.1 (premium)
  "reasoning-o1": 8, // Deep reasoning (expensive)
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// Model Configuration Mapping - Multi-provider routing
type ModelProvider = 'gemini' | 'openai' | 'anthropic';

interface ModelConfig {
  modelId: string;
  provider: ModelProvider;
}

const MODEL_CONFIG: Record<string, ModelConfig> = {
  "vibecoder-pro": { modelId: "gemini-2.5-flash", provider: "gemini" },
  "vibecoder-flash": { modelId: "gemini-2.5-flash", provider: "gemini" },
  "reasoning-o1": { modelId: "gemini-2.5-pro", provider: "gemini" },
  // Premium tier — routes to Claude/OpenAI when keys are available
  "vibecoder-claude": { modelId: "claude-sonnet-4-20250514", provider: "anthropic" },
  "vibecoder-gpt4": { modelId: "gpt-4o", provider: "openai" },
  "vibecoder-gpt41": { modelId: "gpt-4.1", provider: "openai" },
};

// ═══════════════════════════════════════════════════════════════
// PREMIUM FALLBACK CHAIN
// Claude → GPT-4o → abort (never silent downgrade to Flash)
// GPT → Claude → abort
// Gemini stays in its own tier (no cross-tier fallback)
// ═══════════════════════════════════════════════════════════════

const PREMIUM_FALLBACK_CHAIN: Record<string, ModelConfig | null> = {
  "anthropic": { modelId: "gpt-4o", provider: "openai" },   // Claude fails → try GPT
  "openai": { modelId: "claude-sonnet-4-20250514", provider: "anthropic" }, // GPT fails → try Claude
};

// Helper: Call the correct provider API (with premium cascading fallback)
async function callModelAPI(
  config: ModelConfig,
  messages: Array<{ role: string; content: string }>,
  opts: { maxTokens: number; temperature: number; stream: boolean },
  _fallbackAttempt: boolean = false,
): Promise<Response> {
  try {
    const GOOGLE_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY") || "";
    const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY") || "";
    const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

    const makeError = (
      status: number,
      type: string,
      message: string,
      extra: Record<string, unknown> = {},
    ): Response => {
      return new Response(JSON.stringify({ type, message, ...extra }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    };

    const tryPremiumFallback = async (
      providerKey: "openai" | "anthropic",
      reason: string,
      primaryStatus?: number,
      primaryBody?: string,
    ): Promise<Response> => {
      console.error(`[MODEL_ROUTER] Primary failed: ${providerKey} | ${reason}`);

      if (_fallbackAttempt) {
        console.error(`[MODEL_ROUTER] Final failure: fallback already attempted for ${providerKey}`);
        return makeError(503, "MODEL_UNAVAILABLE", "Both premium models failed", {
          provider: providerKey,
          reason,
          primary_status: primaryStatus ?? null,
          primary_error: primaryBody?.slice(0, 500) ?? null,
        });
      }

      const fallback = PREMIUM_FALLBACK_CHAIN[providerKey];
      if (!fallback) {
        console.error(`[MODEL_ROUTER] Final failure: no fallback configured for ${providerKey}`);
        return makeError(503, "MODEL_UNAVAILABLE", "Both premium models failed", {
          provider: providerKey,
          reason,
          primary_status: primaryStatus ?? null,
          primary_error: primaryBody?.slice(0, 500) ?? null,
        });
      }

      console.warn(`[MODEL_ROUTER] Fallback triggered: ${providerKey} -> ${fallback.provider}/${fallback.modelId}`);
      const fallbackResponse = await callModelAPI(fallback, messages, opts, true);
      if (fallbackResponse.ok) return fallbackResponse;

      const fallbackBody = await fallbackResponse.text();
      console.error(`[MODEL_ROUTER] Final failure: ${providerKey} + ${fallback.provider} both failed`);
      return makeError(503, "MODEL_UNAVAILABLE", "Both premium models failed", {
        primary_provider: providerKey,
        primary_status: primaryStatus ?? null,
        primary_error: primaryBody?.slice(0, 500) ?? null,
        fallback_provider: fallback.provider,
        fallback_status: fallbackResponse.status,
        fallback_error: fallbackBody.slice(0, 500),
      });
    };

    console.log(`[MODEL_ROUTER] Provider selected: ${config.provider}/${config.modelId}`);

    switch (config.provider) {
      case "openai": {
        if (!OPENAI_KEY) {
          console.error("[MODEL_ROUTER] OPENAI_API_KEY missing");
          return tryPremiumFallback("openai", "OPENAI_API_KEY is missing");
        }

        const response = await fetch(OPENAI_API_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: config.modelId,
            messages,
            stream: opts.stream,
            max_tokens: opts.maxTokens,
            temperature: opts.temperature,
          }),
        });

        if (!response.ok) {
          const rawText = await response.text();
          return tryPremiumFallback("openai", `OpenAI API error ${response.status}`, response.status, rawText);
        }

        return response;
      }

      case "anthropic": {
        if (!ANTHROPIC_KEY) {
          console.error("[MODEL_ROUTER] ANTHROPIC_API_KEY missing");
          return tryPremiumFallback("anthropic", "ANTHROPIC_API_KEY is missing");
        }

        const systemMsg = messages.find((m) => m.role === "system")?.content || "";
        const nonSystemMsgs = messages.filter((m) => m.role !== "system");
        const userPrompt = nonSystemMsgs
          .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
          .join("\n\n");

        const response = await fetch(ANTHROPIC_API_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: config.modelId,
            max_tokens: opts.maxTokens,
            temperature: opts.temperature,
            system: systemMsg,
            messages: [{ role: "user", content: userPrompt }],
            stream: opts.stream,
          }),
        });

        if (opts.stream) {
          if (!response.ok) {
            const rawText = await response.text();
            return tryPremiumFallback("anthropic", `Anthropic API error ${response.status}`, response.status, rawText);
          }
          return response;
        }

        const rawText = await response.text();
        if (!response.ok) {
          return tryPremiumFallback("anthropic", `Anthropic API error ${response.status}`, response.status, rawText);
        }

        let parsed: any;
        try {
          parsed = JSON.parse(rawText);
        } catch (parseErr) {
          console.error("[MODEL_ROUTER] Anthropic parse error:", parseErr);
          return makeError(502, "RESPONSE_PARSE_ERROR", "Failed to parse Anthropic response", {
            provider: "anthropic",
            details: rawText.slice(0, 1000),
          });
        }

        const extractedContent = Array.isArray(parsed?.content)
          ? parsed.content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("")
          : "";

        const normalized = {
          choices: [
            {
              message: {
                role: "assistant",
                content: extractedContent,
              },
            },
          ],
          provider: "anthropic",
        };

        return new Response(JSON.stringify(normalized), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "gemini":
      default: {
        if (!GOOGLE_KEY) {
          console.error("[MODEL_ROUTER] GOOGLE_GEMINI_API_KEY missing");
          return makeError(503, "CONFIGURATION_ERROR", "GOOGLE_GEMINI_API_KEY is missing", {
            provider: "gemini",
          });
        }

        const response = await fetch(GEMINI_API_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${GOOGLE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: config.modelId,
            messages,
            stream: opts.stream,
            max_tokens: opts.maxTokens,
            temperature: opts.temperature,
          }),
        });

        if (!response.ok) {
          const rawText = await response.text();
          console.error(`[MODEL_ROUTER] Final failure: gemini ${response.status} ${rawText.slice(0, 500)}`);
          return makeError(503, "MODEL_UNAVAILABLE", "Gemini provider failed", {
            provider: "gemini",
            status: response.status,
            details: rawText.slice(0, 500),
          });
        }

        return response;
      }
    }
  } catch (e) {
    console.error("[MODEL_ROUTER_CRASH]", e);
    return new Response(
      JSON.stringify({
        type: "EDGE_CRASH",
        message: String(e),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// STAGE 1: INTENT CLASSIFIER (Chain-of-Thought Reasoning)
// ═══════════════════════════════════════════════════════════════
// This is a fast, lightweight model that THINKS before deciding what to do.
// It uses internal reasoning to classify user intent, just like ChatGPT/Gemini.

const INTENT_CLASSIFIER_PROMPT = `You are an intelligent intent classifier for a UI builder called VibeCoder.
Your job is to REASON about what the user wants and classify their message.

THINK STEP BY STEP:
1. Read the user's message carefully
2. Consider the CONVERSATION HISTORY (what was discussed before? what pronouns refer to?)
3. Consider the CONTEXT (do they have existing code? what did they build before?)
4. Resolve PRONOUNS and REFERENCES ("it", "that", "this", "the one we discussed")
5. Identify the PRIMARY INTENT of their message
6. Classify into one of the categories below

═══════════════════════════════════════════════════════════════
PRONOUN RESOLUTION PROTOCOL (CRITICAL)
═══════════════════════════════════════════════════════════════
When the user uses pronouns like "it", "that", "this", "the button", you MUST:
1. Look at the PREVIOUS messages in the conversation
2. Identify what noun/element was most recently discussed
3. Resolve the pronoun to that specific element
4. Include this resolution in your reasoning

Examples:
- Previous: "What is the Open for Inquiry tab for?"
- Current: "Let's remove it"
- Resolution: "it" = "the Open for Inquiry tab" (from previous message)
- Intent: MODIFY (remove that specific element ONLY)

- Previous: "I added a gradient to the hero"
- Current: "I don't like it"
- Resolution: "it" = "the gradient in the hero" (from previous message)
- Intent: QUESTION (expressing opinion, not a clear action request)

- Previous: "What does this button do?"
- Current: "Remove that"
- Resolution: "that" = "the button" (from previous message)
- Intent: MODIFY (remove that specific button ONLY)

═══════════════════════════════════════════════════════════════
INTENT CATEGORIES:
═══════════════════════════════════════════════════════════════
- "BUILD" = User wants to CREATE something new (a storefront, page, section, component)
- "MODIFY" = User wants to CHANGE something that exists (colors, layout, add element to existing design)
- "QUESTION" = User is ASKING about something (what is X? why did you add Y? how does Z work?)
- "FIX" = User is reporting an ERROR or BUG (crash, broken, not working, red screen)
- "REFUSE" = User is asking for something PROHIBITED (payment integrations, nav above hero, external APIs, stripe, paypal, payment gateway, api endpoint, server route, webhook, checkout override)

═══════════════════════════════════════════════════════════════
REASONING EXAMPLES WITH CONVERSATION CONTEXT:
═══════════════════════════════════════════════════════════════

Example 1 (Pronoun Resolution):
Conversation: ["What is the Open for Inquiry tab for?"]
Current: "Let's remove it"
Reasoning: The user previously asked about "the Open for Inquiry tab". Now they say "remove it" - the pronoun "it" clearly refers to that tab. This is a MODIFY request to remove ONLY that specific tab.
Intent: MODIFY
Target: "Open for Inquiry tab"

Example 2 (Follow-up Opinion):
Conversation: ["Can you explain the gradient effect?"]
Current: "I'm not sure about it"
Reasoning: User asked about "the gradient effect", then expressed uncertainty with "it" referring to that gradient. This is conversational feedback, not a clear action request.
Intent: QUESTION

Example 3 (Clear Action):
Conversation: []
Current: "Add a contact section"
Reasoning: No prior context needed. User explicitly says "add" which is an action. They want a new section added.
Intent: MODIFY

Example 4 (Standalone Question):
Current: "What is the Open for Inquiry tab for?"
Reasoning: The user is asking "what is X for?" - this is a question about an existing element, not a request to build or change anything. They want an explanation.
Intent: QUESTION

Example 5 (Follow-up Removal):
Conversation: ["What does this CTA button do?"]
Current: "We don't need it"
Reasoning: User asked about "this CTA button", then said "we don't need it". The pronoun "it" refers to that CTA button. This is a MODIFY request to remove that specific button.
Intent: MODIFY
Target: "CTA button"

Example 6 (Ambiguous - Default to Question):
Conversation: ["I added a hero section"]
Current: "Hmm, not sure"
Reasoning: User is expressing uncertainty but not giving a clear action. This is conversational.
Intent: QUESTION

Example 7 (Frustrated Follow-up - CRITICAL):
Conversation: ["when clicking a product its opening a new page make it just redirect to it instead of opening a new tab", "AI: Storefronts are single-page experiences..."]
Current: "whats??? i just told you when i click the product it opens a new tab instead of just redirecting me"
Reasoning: User is frustrated because the AI didn't address their PREVIOUS request. They are REPEATING a behavior change request (stop opening new tabs). The pronoun "it" refers to "clicking a product" from their earlier message. Despite the frustrated tone, this is clearly a MODIFY request — they want the product click behavior changed.
Intent: MODIFY
Target: "product click navigation behavior"

Example 8 (Repeated request after bad AI response):
Conversation: ["Change the button color to red", "AI: Sure, I can help with that!"]
Current: "you didn't do it... just change the button color"
Reasoning: User is pointing out the AI failed to execute. This is a repeated MODIFY request. "it" = "changing the button color to red".
Intent: MODIFY
Target: "button color"

CRITICAL: If a user is REPEATING or REPHRASING an earlier request (especially with frustration), ALWAYS classify as MODIFY or FIX, NEVER as QUESTION. They want ACTION, not explanation.

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT:
═══════════════════════════════════════════════════════════════
═══════════════════════════════════════════════════════════════
INTERACTION MODE DETECTION:
═══════════════════════════════════════════════════════════════
Classify how the user is thinking:
- "vision": The user uses emotional/aesthetic language. Examples: "make it feel like", "luxury", "cozy", "bold", "clean", "dark and moody", "bright and cheerful", "futuristic", "elegant". They describe FEELINGS, not code.
- "developer": The user uses technical language. Examples: "CSS grid", "memoize", "useEffect", "flex", "z-index", "component", "useState", "border-radius", "padding", "margin". They describe CODE, not feelings.

Default to "vision" if unclear.

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT:
═══════════════════════════════════════════════════════════════
You must respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "reasoning": "Brief chain-of-thought explaining your classification (1-2 sentences)",
  "intent": "BUILD" | "MODIFY" | "QUESTION" | "FIX" | "REFUSE",
  "interactionMode": "vision" | "developer",
  "confidence": 0.0-1.0,
  "context_needed": true | false,
  "resolved_target": "The specific element being referenced (if pronouns were resolved)"
}

CRITICAL RULES:
- ALWAYS include your reasoning - this is how you "think"
- ALWAYS resolve pronouns before classifying
- Include "resolved_target" when pronouns like "it", "that", "this" are used
- Be DECISIVE - pick the most likely intent even if uncertain
- Default to QUESTION if the message is ambiguous or conversational
- context_needed = true if you need to see the current code to respond properly`;

// ═══════════════════════════════════════════════════════════════
// STAGE 2: EXECUTOR PROMPTS (Specialized for each intent)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// STAGE 0: COMPLEXITY DETECTION (Force Architect Mode)
// ═══════════════════════════════════════════════════════════════
// MICRO-EDIT DETECTION: Skip heavy planning for small surgical changes
// ═══════════════════════════════════════════════════════════════

const MICRO_EDIT_KEYWORDS = [
  "click", "button", "route", "navigate", "redirect", "onclick",
  "href", "link", "typo", "text", "color", "font", "size",
  "title", "rename", "change the", "fix the", "update the",
  "remove the", "add a", "swap", "replace the",
];

function detectMicroEdit(prompt: string, hasExistingCode: boolean): boolean {
  if (!hasExistingCode) return false; // New builds are never micro-edits
  const lower = prompt.toLowerCase();
  const wordCount = prompt.split(/\s+/).filter((w) => w.length > 0).length;
  if (wordCount > 25) return false; // Long prompts are not micro-edits
  return MICRO_EDIT_KEYWORDS.some((kw) => lower.includes(kw));
}

// ═══════════════════════════════════════════════════════════════
// Detects complex builds that should AUTOMATICALLY trigger Plan Mode
// to prevent 500+ line one-shot outputs that cause truncation crashes

/**
 * Determines if a prompt is complex enough to require Architect Mode
 * Returns true if the AI should plan before coding (multi-component builds)
 */
function shouldForceArchitectMode(prompt: string, hasExistingCode: boolean): boolean {
  // If user already has existing code, this is likely a modification - don't force plan
  if (hasExistingCode) return false;

  const lower = prompt.toLowerCase();

  // 1. Explicit multi-component requests (strong signal)
  const fullBuildPatterns = [
    "full page",
    "complete page",
    "entire page",
    "whole page",
    "full storefront",
    "complete storefront",
    "entire storefront",
    "full landing",
    "complete landing",
    "entire landing",
    "build me a",
    "create a complete",
    "design a full",
    "from scratch",
    "everything",
    "all sections",
  ];
  if (fullBuildPatterns.some((pattern) => lower.includes(pattern))) {
    console.log("[ComplexityDetector] Matched full-build pattern");
    return true;
  }

  // 2. Multiple section keywords (3+ sections = complex)
  const sectionKeywords = [
    "hero",
    "product",
    "products",
    "footer",
    "pricing",
    "testimonial",
    "testimonials",
    "about",
    "faq",
    "contact",
    "features",
    "showcase",
    "gallery",
    "cta",
    "banner",
    "navigation",
    "nav",
    "header",
  ];
  const mentionedSections = sectionKeywords.filter((kw) => lower.includes(kw));
  if (mentionedSections.length >= 3) {
    console.log(`[ComplexityDetector] Multiple sections detected: ${mentionedSections.join(", ")}`);
    return true;
  }

  // 3. Long prompts tend to be complex requests (>40 words)
  const wordCount = prompt.split(/\s+/).filter((w) => w.length > 0).length;
  if (wordCount > 40) {
    console.log(`[ComplexityDetector] Long prompt detected: ${wordCount} words`);
    return true;
  }

  // 4. Explicit section lists (comma-separated items)
  const hasListPattern =
    /including:?|with:|contains?:|(?:,\s*(?:and\s+)?(?:a\s+)?(?:the\s+)?[a-z]+\s+(?:section|page|component|area)){2,}/i.test(
      prompt,
    );
  if (hasListPattern) {
    console.log("[ComplexityDetector] List pattern detected");
    return true;
  }

  return false;
}

/**
 * Get the forced Architect Mode prompt injection
 */
function getArchitectModeInjection(): string {
  return `
═══════════════════════════════════════════════════════════════
🏗️ ARCHITECT MODE ENFORCED (Complex Build Detected)
═══════════════════════════════════════════════════════════════
This request involves multiple sections/components. You MUST:
1. Output a PLAN first (/// TYPE: PLAN ///)
2. Wait for user approval before generating code
3. When approved, generate one component at a time (< 150 lines each)

The user's request is complex. Break it down into manageable steps.
═══════════════════════════════════════════════════════════════
`;
}

// ═══════════════════════════════════════════════════════════════
// COMPLETION SENTINEL & MARKERS (Multi-Agent Architecture)
// ═══════════════════════════════════════════════════════════════
// These markers enable truncation detection and component-based generation
const COMPONENT_START_PREFIX = "/// COMPONENT_START:";
const COMPONENT_END_MARKER = "/// COMPONENT_END ///";

const CHAT_EXECUTOR_PROMPT = `You are VibeCoder, a friendly and knowledgeable UI architect for SellsPay.
The user is asking a QUESTION. Your job is to EXPLAIN, CLARIFY, or ENGAGE in conversation.

RULES:
1. Do NOT generate any code
2. Do NOT output "/// TYPE: CODE ///" or "/// BEGIN_CODE ///"
3. Be conversational, helpful, and concise
4. If they ask about a specific element you created, explain its purpose
5. If they ask "what is X for?", explain the design reasoning behind X
6. If they're just chatting, engage naturally

OUTPUT FORMAT:
- Start with: "/// TYPE: CHAT ///"
- Then provide your explanation or response
- Keep it concise (2-5 sentences usually)

PERSONALITY:
- You're a senior designer, not a customer support bot
- Be confident and knowledgeable
- Use present tense and active voice
- No robotic phrases like "I have generated..." or "Here is..."`;

const REFUSE_EXECUTOR_PROMPT = `You are VibeCoder, a UI architect for SellsPay.
The user is asking for something PROHIBITED. You must politely refuse.

PROHIBITED REQUESTS:
- External payment gateways (Stripe keys, PayPal buttons, CashApp links)
- Navigation placed above the hero section
- Custom API key integrations for payments
- Building internal product detail pages (products link to /product/{slug})
- Implementing custom checkout, payment processing, or commission logic
- Adding server endpoints, API routes, or webhooks
- Modifying Stripe/payment provider configuration

OUTPUT FORMAT:
- Start with: "/// TYPE: CHAT ///"
- Politely explain why you cannot do this
- Offer an alternative if possible

EXAMPLE RESPONSES:
- Payment request: "I can't add external payment buttons. SellsPay is a managed marketplace that handles all transactions securely. Your earnings are automatically routed to your Payouts Dashboard."
- Nav above hero: "I keep the navigation integrated within the hero for a clean, immersive landing experience. This is a core design principle for SellsPay storefronts."
- Checkout override: "Checkout is handled by the SellsPay platform to ensure secure, compliant transactions. I can help you customize the product display and shopping experience instead."
- API endpoint: "Server-side logic is managed by the platform. I can help you build beautiful product pages that connect to the existing checkout flow."`;

// The main CODE executor prompt - STRICT DETERMINISTIC VERSION
// Zero conversational drift. Machine-readable output only.
const CODE_EXECUTOR_PROMPT = `You are a deterministic code generation engine.

Your task is to produce a valid JSON file map.
You MUST follow the exact output format.
Failure to follow format will cause the job to fail.

You are NOT a conversational assistant.
You are NOT allowed to provide explanations outside designated sections.
You are NOT allowed to include greetings.
You are NOT allowed to include commentary outside the specified sections.

════════════════════════════════════════════════════════════════
OUTPUT FORMAT (MANDATORY)
════════════════════════════════════════════════════════════════
You MUST output exactly the following sections in this order:

=== ANALYSIS ===
Short technical reasoning about implementation approach.
For FIRST-TIME BUILDS (no existing code), you may SKIP this section.

=== PLAN ===
Concise step-by-step build plan.
For FIRST-TIME BUILDS (no existing code), you may SKIP this section.

=== CODE ===
A valid JSON object representing a file map.
NO markdown fences. NO backticks. NO triple quotes. NO commentary.

The JSON must follow one of these formats:

Option A:
{
  "files": {
    "/App.tsx": "file contents",
    "/components/Hero.tsx": "file contents"
  }
}

Option B:
{
  "/App.tsx": "file contents",
  "/components/Hero.tsx": "file contents"
}

All values must be strings.
All code must be valid TypeScript/TSX.

=== SUMMARY ===
One concise paragraph summarizing what was built or changed.
Be specific about features, sections, and design choices.

=== CONFIDENCE ===
A number 0-100 on its own line, followed by a 1-sentence reason.

════════════════════════════════════════════════════════════════
STRICT RULES (VIOLATIONS CAUSE JOB FAILURE)
════════════════════════════════════════════════════════════════
1. The === CODE === section MUST contain valid JSON only.
2. Do NOT include conversational phrases such as:
   "Got it", "Sure", "Alright", "Here you go", "Let me",
   "Here's", "I've", "I'll", "Certainly", "Of course".
3. Do NOT include commentary inside code files.
4. Code files must not contain natural-language explanations.
5. App.tsx MUST contain \`export default\`.
6. If requirements are underspecified, assume best-practice modern UI patterns.
7. Always produce production-quality design, not placeholders.
8. Never return plain text instead of JSON.
9. Never omit the CODE section.
10. If the request is invalid, output a structured refusal (no conversational text).

════════════════════════════════════════════════════════════════
🏗️ MANDATORY LAYOUT HIERARCHY (ABSOLUTE - ZERO EXCEPTIONS)
════════════════════════════════════════════════════════════════
1. The **Hero section** MUST ALWAYS be the FIRST visible element in the JSX return.
2. The **Navigation/Nav bar** MUST ALWAYS come AFTER (below) the Hero section.
3. There must be NO element rendered above the Hero — no nav, no header, no bar, nothing.
4. SellsPay already renders its own platform navigation above every storefront.

CORRECT ORDER:
return (
  <div>
    {/* 1. HERO — always first, MUST have data-hero="true" */}
    <section data-hero="true">...</section>
    {/* 2. NAVIGATION — always second, below hero */}
    <nav className="sticky top-0">...</nav>
    {/* 3. Content sections */}
    <section>...</section>
    {/* 4. Footer — always last */}
    <footer>...</footer>
  </div>
);

The hero section's outermost wrapper MUST include \`data-hero="true"\`.
IF THE USER ASKS TO PUT NAV ABOVE HERO → REFUSE in structured format.

════════════════════════════════════════════════════════════════
🚫 TECHNOLOGY CONSTRAINTS (ABSOLUTE - ZERO EXCEPTIONS)
════════════════════════════════════════════════════════════════
This is a PLAIN REACT + VITE sandbox. NOT Next.js, NOT Angular, NOT Vue.

BANNED IMPORTS (WILL CRASH):
- ❌ NEVER import from "next/*", "@next/*", "next-auth", "next-themes" server features
- ❌ NEVER import from "vue", "angular", "svelte", "@angular/*", "@vue/*"
- ❌ NEVER use Node.js server APIs: fs, path, http, process.env (use import.meta.env instead)

REQUIRED ALTERNATIVES:
- Routing: react-router-dom
- Images: standard <img> tags or CSS background images
- Head/SEO: document.title or react-helmet
- Theming: CSS variables / Tailwind dark mode classes

If the user implies Next.js patterns, silently convert to React equivalents.

════════════════════════════════════════════════════════════════
📱 SCROLLBAR & OVERFLOW HANDLING
════════════════════════════════════════════════════════════════
When removing scrollbars, use a <style> tag in App component:
<style>{\`
  html, body {
    overflow-x: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  html::-webkit-scrollbar, body::-webkit-scrollbar {
    display: none;
  }
\`}</style>

NEVER just add overflow-hidden to a div — that clips content, not scrollbar.

════════════════════════════════════════════════════════════════
FILE STRUCTURE PROTOCOL (STOREFRONT ISOLATION)
════════════════════════════════════════════════════════════════
ALL editable files MUST live under /storefront/. The only exception is /App.tsx (router shell).

When building a NEW storefront (BUILD intent), use this structure:
  /App.tsx                          -- Router shell (imports from /storefront/)
  /storefront/Layout.tsx            -- Main layout wrapper
  /storefront/routes/Home.tsx       -- Home page
  /storefront/routes/ProductPage.tsx -- Product listing page
  /storefront/routes/[Custom].tsx   -- Custom pages (About, Contact, FAQ, etc.)
  /storefront/components/*.tsx      -- Reusable UI components
  /storefront/theme.ts              -- Theme tokens & config

When MODIFYING, output ONLY the changed file(s).
Keep each file under 150 lines.
Each file must be a valid standalone React component with its own imports.

You may create NEW files under /storefront/routes/ (e.g., Contact.tsx, About.tsx, FAQ.tsx, CampaignLanding.tsx).
You may NOT create files outside /storefront/ (except /App.tsx).
You may NOT modify the routing engine — only the storefront UI layer.

RESTRICTED FOLDERS (NEVER write to these — commit will be rejected):
  /core/**  /checkout/**  /auth/**  /payments/**  /settings/**  /admin/**  /api/**

STOREFRONT PRIMITIVES (PRE-BUILT — import instead of recreating):
  import { ProductGrid } from '/storefront/primitives/ProductGrid'
  import { ProductCard } from '/storefront/primitives/ProductCard'
  import { BuyButton } from '/storefront/primitives/BuyButton'
  import { FeaturedProducts } from '/storefront/primitives/FeaturedProducts'
  import { UserHeader } from '/storefront/primitives/UserHeader'
  import { StoreThemeProvider } from '/storefront/primitives/StoreThemeProvider'

These primitives handle commerce logic internally. DO NOT recreate payment/checkout code.

The sentinel \`// --- VIBECODER_COMPLETE ---\` goes inside /App.tsx content only.

════════════════════════════════════════════════════════════════
COMMERCE BOUNDARY (ABSOLUTE — ZERO EXCEPTIONS)
════════════════════════════════════════════════════════════════
AI MAY: Customize UI, style components, create pages, create product layouts,
         use storefront primitives (ProductGrid, BuyButton, etc.)

AI MAY NOT:
  ❌ Implement payment processing (Stripe, PayPal, CashApp, crypto)
  ❌ Override checkout flow
  ❌ Add custom payment providers or gateways
  ❌ Modify Stripe/commission/fee logic
  ❌ Add server endpoints, API routes, or webhooks
  ❌ Create files outside /storefront/ (except /App.tsx)

All purchases MUST go through useSellsPayCheckout() or the BuyButton primitive.
Revenue flows are managed by the platform — the AI has ZERO access to modify them.

════════════════════════════════════════════════════════════════
█████ MINIMAL DIFF PROTOCOL (HIGHEST PRIORITY) █████
════════════════════════════════════════════════════════════════
YOU ARE STRICTLY FORBIDDEN FROM CHANGING ANYTHING NOT EXPLICITLY REQUESTED.

ANTI-REWRITE MANDATE:
- NEVER rewrite the file from scratch
- NEVER simplify, shorten, or "clean up" existing code
- NEVER replace a complex component with a minimal version
- Output MUST contain ALL existing code with ONLY the requested changes
- If existing code is 300 lines, output must be ~300 lines (plus/minus the change)

FORBIDDEN ACTIONS:
❌ Changing colors when user didn't ask for color changes
❌ Modifying layout when user asked for text change
❌ Removing sections when user asked to edit one element
❌ Adding sections when user asked to modify existing ones
❌ Reordering elements when user didn't ask for reordering
❌ "Improving" or "cleaning up" code while making requested change

════════════════════════════════════════════════════════════════
EDIT TARGET ROUTING (MULTI-FILE AWARENESS)
════════════════════════════════════════════════════════════════
When modifying existing code, identify which file to target:
- "Fix products page" → only modify products-related code
- "Change hero title" → only modify hero section
- "Add a contact page" → add new route + page component
If the request targets a specific component, generate ONLY that file.

════════════════════════════════════════════════════════════════
CREATOR IDENTITY PROTOCOL
════════════════════════════════════════════════════════════════
The creator's identity is injected as CREATOR_IDENTITY at runtime:
- Use their USERNAME as the store name/brand
- Use their EMAIL for contact sections
- NEVER use "SellsPay" as the store name

MANDATORY FOOTER:
Every storefront MUST include:
\`<p className="text-xs text-gray-500">Powered by SellsPay</p>\`
This is the ONLY place "SellsPay" should appear.

════════════════════════════════════════════════════════════════
ADDITIVE CHANGES MANDATE
════════════════════════════════════════════════════════════════
When user asks to ADD something: PRESERVE existing design and APPEND.
- Keep existing Hero, Nav, colors, branding unchanged.
- Add the new section/tab/page to the existing structure.

When user asks to REMOVE something: Remove ONLY the target.
- No collateral changes. No "cleanup" of nearby code.

════════════════════════════════════════════════════════════════
MARKETPLACE PROTOCOL (Non-Negotiable)
════════════════════════════════════════════════════════════════
1. NO CUSTOM GATEWAYS: Never generate Stripe Keys, PayPal, CashApp code.
2. UNIFIED CHECKOUT: All purchases use \`useSellsPayCheckout()\` hook.
   Import: import { useSellsPayCheckout } from "@/hooks/useSellsPayCheckout"
3. PRODUCT LINKING:
   - All product clicks MUST use postMessage (iframe sandbox blocks direct nav)
   - DEFAULT (same tab): window.parent?.postMessage({ type: 'VIBECODER_NAVIGATE', url: \\\`/product/\\\${product.slug || product.id}\\\`, target: '_self' }, '*')
   - NEVER use window.open(), window.location.href, or window.top.location.href
   - NEVER use react-router for product pages

════════════════════════════════════════════════════════════════
FRAMER MOTION & ANIMATION PROTOCOL
════════════════════════════════════════════════════════════════
Framer Motion is PRE-INSTALLED. Import: import { motion, AnimatePresence } from "framer-motion"

ALLOWED:
- Scroll-triggered reveals: whileInView={{ opacity: 1, y: 0 }}
- Hover effects: whileHover={{ scale: 1.02 }}
- Page transitions with AnimatePresence
- Staggered children with staggerChildren

STATIC UI MANDATE:
- NO useState, useEffect, or custom hooks (except useSellsPayCheckout)
- NO onClick handlers that modify state
- NO dynamic data fetching
- ONLY declarative Framer Motion animations

════════════════════════════════════════════════════════════════
COLOR PALETTE & DESIGN SYSTEM
════════════════════════════════════════════════════════════════
PRIMARY PALETTE:
- Background: zinc-950, zinc-900
- Text: zinc-100, zinc-400
- Accent: violet-500, violet-600
- Borders: zinc-800, zinc-700/50
- Glassmorphism: bg-zinc-900/50 backdrop-blur-xl border-zinc-800/50

EFFECTS:
- Shadows: shadow-xl shadow-violet-500/10
- Gradients: bg-gradient-to-r from-violet-500 to-blue-500

════════════════════════════════════════════════════════════════
COMPLETION SENTINEL (PREVENTS TRUNCATION)
════════════════════════════════════════════════════════════════
The sentinel \`// --- VIBECODER_COMPLETE ---\` MUST appear inside /App.tsx content.
Code without it is considered potentially truncated.

════════════════════════════════════════════════════════════════
ARCHITECT MODE (PLAN-BEFORE-CODE)
════════════════════════════════════════════════════════════════
TRIGGER: If the prompt contains [ARCHITECT_MODE_ACTIVE], output a JSON plan instead of code.
Start with: "/// TYPE: PLAN ///"
Output valid JSON: { "type": "plan", "title": "...", "summary": "...", "steps": [...], "estimatedTokens": N }

This is a code execution environment. Format compliance is mandatory.`;

// ═══════════════════════════════════════════════════════════════
// HELPER: Call the Intent Classifier (Stage 1)
// ═══════════════════════════════════════════════════════════════
interface IntentClassification {
  reasoning: string;
  intent: "BUILD" | "MODIFY" | "QUESTION" | "FIX" | "REFUSE";
  interactionMode: "vision" | "developer";
  confidence: number;
  context_needed: boolean;
  resolved_target?: string; // The specific element being referenced (if pronouns were resolved)
}

async function classifyIntent(
  prompt: string,
  hasExistingCode: boolean,
  conversationHistory: Array<{ role: string; content: string }>,
  apiKey: string,
): Promise<IntentClassification> {
  const contextHint = hasExistingCode
    ? "The user HAS existing code/design in their project."
    : "The user has NO existing code - this would be a fresh build.";

  // Build conversation context for pronoun resolution
  const recentMessages = conversationHistory.slice(-6); // Last 3 exchanges
  const conversationContext =
    recentMessages.length > 0
      ? `\n\nCONVERSATION HISTORY (for pronoun resolution):\n${recentMessages.map((m) => `${m.role}: "${m.content}"`).join("\n")}`
      : "";

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash-lite", // Fast, cheap classifier
      messages: [
        { role: "system", content: INTENT_CLASSIFIER_PROMPT },
        { role: "user", content: `Context: ${contextHint}${conversationContext}\n\nCurrent user message: "${prompt}"` },
      ],
      max_tokens: 200,
      temperature: 0.1, // Low temperature for consistent classification
    }),
  });

  if (!response.ok) {
    console.error("Intent classifier failed, defaulting to MODIFY");
    return {
      reasoning: "Classifier unavailable, defaulting to code generation",
      intent: "MODIFY",
      interactionMode: "vision",
      confidence: 0.5,
      context_needed: true,
    };
  }

  const rawText = await response.text();
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (parseErr) {
    console.error("[Intent Classifier] Failed to parse model response, defaulting to MODIFY:", parseErr);
    return {
      reasoning: "Classifier response parse failed, defaulting to code generation",
      intent: "MODIFY",
      interactionMode: "vision",
      confidence: 0.5,
      context_needed: true,
    };
  }
  const content = data.choices?.[0]?.message?.content || "";

  try {
    // Parse the JSON response
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    console.log(`[Intent Classifier] Reasoning: ${parsed.reasoning}`);
    console.log(`[Intent Classifier] Intent: ${parsed.intent} (${parsed.confidence}) | Mode: ${parsed.interactionMode}`);
    if (parsed.resolved_target) {
      console.log(`[Intent Classifier] Resolved Target: ${parsed.resolved_target}`);
    }

    // Confidence threshold: low-confidence mode detection defaults to vision
    // because most Sellspay users are non-technical creators
    const rawMode = parsed.interactionMode || "vision";
    const modeConfidence = parsed.confidence || 0.5;
    const MODE_CONFIDENCE_THRESHOLD = 0.65;
    const resolvedMode = (rawMode === "developer" && modeConfidence < MODE_CONFIDENCE_THRESHOLD) ? "vision" : rawMode;
    if (rawMode === "developer" && resolvedMode === "vision") {
      console.log(`[Intent Classifier] Mode downgraded: developer → vision (confidence ${modeConfidence} < ${MODE_CONFIDENCE_THRESHOLD})`);
    }

    return {
      reasoning: parsed.reasoning || "No reasoning provided",
      intent: parsed.intent || "MODIFY",
      interactionMode: resolvedMode,
      confidence: modeConfidence,
      context_needed: parsed.context_needed ?? true,
      resolved_target: parsed.resolved_target || undefined,
    };
  } catch (e) {
    console.error("Failed to parse classifier response:", content);
    // Fallback: try to extract intent from text
    const upperContent = content.toUpperCase();
    if (upperContent.includes("QUESTION")) {
      return { reasoning: "Detected question pattern", intent: "QUESTION", interactionMode: "vision", confidence: 0.6, context_needed: false };
    }
    if (upperContent.includes("FIX") || upperContent.includes("ERROR")) {
      return { reasoning: "Detected error pattern", intent: "FIX", interactionMode: "developer", confidence: 0.6, context_needed: true };
    }
    if (upperContent.includes("REFUSE")) {
      return { reasoning: "Detected prohibited request", intent: "REFUSE", interactionMode: "vision", confidence: 0.6, context_needed: false };
    }
    return {
      reasoning: "Could not parse, defaulting to modify",
      intent: "MODIFY",
      interactionMode: "vision",
      confidence: 0.5,
      context_needed: true,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// STAGE 0.5: ANALYZER (2-Stage Pipeline)
// Fast Gemini call to infer intent, generate suggestions + questions
// ═══════════════════════════════════════════════════════════════

const ANALYZER_SYSTEM_PROMPT = `You are a premium product strategist for VibeCoder, a website builder for creators.

Goal:
- Convert simplistic user requests into premium builds.
- If the request is underspecified, ask structured multiple-choice questions before code generation.
- Always generate context-aware suggestion chips based on the user's intent and recent intent profile.

Return ONLY valid JSON with this schema:
{
  "intent": {"primary": string, "secondary": string[], "confidence": number},
  "stage": "idea"|"structure"|"build"|"polish",
  "missing": string[],
  "questions": [{"id": string, "label": string, "type":"single"|"multi", "options":[{"value":string,"label":string}]}],
  "suggestions": [{"label": string, "prompt": string}],
  "feature_tags": string[],
  "enhanced_prompt_seed": string
}

Rules:
- questions: 4-6 items when missing info exists; 0 when the request is specific enough.
- suggestions: 5-7 chips, tailored to intent + profile. Labels max 28 chars. Prompts must be directly usable as user messages.
- If the user has existing code and is making a small modification, return 0 questions and 3-5 suggestions.
- enhanced_prompt_seed: a richer version of what the user asked, incorporating inferred context.
- feature_tags: keywords for tracking (e.g. "pricing", "hero", "testimonials").
- intent.primary: one of "saas", "ecommerce", "portfolio", "blog", "marketplace", "booking", "creator", "course", "other".`;

interface AnalyzerResult {
  intent: { primary: string; secondary: string[]; confidence: number };
  stage: string;
  missing: string[];
  questions: Array<{ id: string; label: string; type: "single" | "multi"; options: Array<{ value: string; label: string }> }>;
  suggestions: Array<{ label: string; prompt: string }>;
  feature_tags: string[];
  enhanced_prompt_seed: string;
}

async function analyzeIntent(
  prompt: string,
  hasExistingCode: boolean,
  conversationHistory: Array<{ role: string; content: string }>,
  intentProfile: { primary_intent: string; feature_counts: Record<string, number> } | null,
  apiKey: string,
): Promise<AnalyzerResult | null> {
  try {
    const contextHint = hasExistingCode
      ? "The user HAS existing code/design. This is a modification request."
      : "The user has NO existing code - this is a fresh build.";

    const recentMessages = conversationHistory.slice(-6);
    const conversationContext = recentMessages.length > 0
      ? "\nCONVERSATION HISTORY:\n" + recentMessages.map(m => m.role + ': "' + m.content + '"').join("\n")
      : "";

    const profileContext = intentProfile
      ? "\nINTENT PROFILE: primary=" + intentProfile.primary_intent + ", features=" + JSON.stringify(intentProfile.feature_counts)
      : "";

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: ANALYZER_SYSTEM_PROMPT },
          { role: "user", content: "Context: " + contextHint + conversationContext + profileContext + "\n\nUser message: \"" + prompt + "\"" },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.warn("[Analyzer] API call failed, skipping analysis");
      return null;
    }

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn("[Analyzer] Failed to parse API response, skipping analysis:", parseErr);
      return null;
    }
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    console.log("[Analyzer] Intent: " + (parsed.intent?.primary || "unknown") + " | Questions: " + (parsed.questions?.length || 0) + " | Suggestions: " + (parsed.suggestions?.length || 0));
    return parsed;
  } catch (e) {
    console.warn("[Analyzer] Parse error, skipping:", e);
    return null;
  }
}

async function updateIntentProfile(
  supabase: ReturnType<typeof createClient>,
  projectId: string,
  analysis: AnalyzerResult,
): Promise<void> {
  try {
    // Upsert the intent profile
    const { data: existing } = await supabase
      .from("vibecoder_intent_profiles")
      .select("feature_counts")
      .eq("project_id", projectId)
      .maybeSingle();

    const currentCounts = (existing?.feature_counts as Record<string, number>) || {};
    const updatedCounts = { ...currentCounts };
    
    for (const tag of analysis.feature_tags || []) {
      updatedCounts[tag] = (updatedCounts[tag] || 0) + 1;
    }

    await supabase
      .from("vibecoder_intent_profiles")
      .upsert({
        project_id: projectId,
        primary_intent: analysis.intent?.primary || "other",
        feature_counts: updatedCounts,
        updated_at: new Date().toISOString(),
      }, { onConflict: "project_id" });
  } catch (e) {
    console.warn("[IntentProfile] Update failed:", e);
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Execute based on classified intent (Stage 2)
// ═══════════════════════════════════════════════════════════════
async function executeIntent(
  intent: IntentClassification,
  prompt: string,
  currentCode: string | null,
  productsContext: any[] | null,
  model: string,
  apiKey: string,
  creatorIdentity: { username: string; email: string } | null,
  projectFiles?: Record<string, string> | null,
  lastValidFiles?: Record<string, string> | null,
  brandIdentity?: Record<string, unknown> | null,
  brandIdentityLocked?: boolean,
): Promise<Response> {
  // Select the appropriate system prompt based on intent
  let systemPrompt: string;
  let shouldStream = true;

  switch (intent.intent) {
    case "QUESTION":
      systemPrompt = CHAT_EXECUTOR_PROMPT;
      break;
    case "REFUSE":
      systemPrompt = REFUSE_EXECUTOR_PROMPT;
      break;
    case "FIX":
    case "BUILD":
    case "MODIFY":
    default:
      systemPrompt = CODE_EXECUTOR_PROMPT;
      break;
  }

  // ═══════════════════════════════════════════════════════════════
  // INTENT-SPECIFIC PROMPT SPECIALIZATION
  // ═══════════════════════════════════════════════════════════════
  let intentInjection = "";
  
  // ═══════════════════════════════════════════════════════════════
  // MODE-SPECIFIC BEHAVIOR INJECTION (Vision vs Developer)
  // ═══════════════════════════════════════════════════════════════
  let modeInjection = "";
  if (intent.interactionMode === "developer") {
    modeInjection = `
═══════════════════════════════════════════════════════════════
🔧 DEVELOPER MODE: SURGICAL PRECISION
═══════════════════════════════════════════════════════════════
The user is technical. Apply surgical code discipline:
- Execute LITERALLY what they ask. "CSS grid" → CSS grid. "memo" → React.memo.
- NO creative drift. NO layout reinterpretation. NO design opinions.
- Change ONLY the files and lines explicitly referenced.
- If they say "refactor ProductCard", touch ONLY ProductCard. Nothing else.
- Return the SMALLEST possible diff. Preserve everything untouched.
- No "while I'm at it" improvements. Zero collateral changes.
═══════════════════════════════════════════════════════════════
`;
  } else {
    modeInjection = `
═══════════════════════════════════════════════════════════════
🎨 DESIGN COFOUNDER MODE: BRAND-FIRST INTELLIGENCE
═══════════════════════════════════════════════════════════════
You are a design cofounder, not a code generator. Think like a creative director.

WHEN THE USER DESCRIBES A FEELING, THINK IN:
1. 🎯 BRAND IDENTITY — What story does this storefront tell? What emotion should visitors feel?
2. 📐 LAYOUT HIERARCHY — What should the eye see first? Hero → Social proof → Products → CTA.
3. 🎨 COLOR PSYCHOLOGY — Warm tones = trust. Cool tones = tech. Dark = premium. Bright = energy.
4. 🔘 CTA PLACEMENT — Primary CTA above the fold. Secondary CTA after social proof. Sticky CTA on scroll.
5. 🛒 CONVERSION FLOW — Reduce friction. Clear pricing. Trust signals. Urgency cues. Easy checkout path.

TRANSLATE EMOTIONAL LANGUAGE INTO DESIGN DECISIONS:
- "boring" → Needs visual contrast, dynamic spacing, hero imagery, motion
- "luxury" → Dark bg, serif headings, wide spacing, gold accents, subtle animations
- "modern" → Clean lines, sans-serif, ample whitespace, gradient accents
- "high-converting" → Bold CTAs, social proof sections, pricing clarity, urgency elements
- "professional" → Structured grid, blue accents, credentials section, testimonials
- "fun/playful" → Rounded corners, vibrant colors, bouncy animations, emoji-friendly

CRITICAL: Be OPINIONATED. Creators want confident design decisions, not options.
Make the storefront feel like it was designed by a premium agency.
BUT: Never rewrite everything unless explicitly asked. Merge intelligently.
═══════════════════════════════════════════════════════════════
`;
  }

  if (intent.intent === "FIX") {
    intentInjection = `
═══════════════════════════════════════════════════════════════
🔧 FIX MODE: SURGICAL PRECISION REQUIRED
═══════════════════════════════════════════════════════════════
Focus ONLY on correcting the reported issue.
Do NOT redesign, restyle, or reorganize unrelated sections.
Your ANALYSIS should identify the root cause.
Your PLAN should list only the fix steps.
Keep changes minimal and targeted.
═══════════════════════════════════════════════════════════════
`;
  } else if (intent.intent === "MODIFY") {
    intentInjection = `
═══════════════════════════════════════════════════════════════
✏️ MODIFY MODE: PRESERVE EXISTING DESIGN
═══════════════════════════════════════════════════════════════
Preserve ALL existing layout, styling, and structure unless
the modification explicitly requires changes.
Your diff should be minimal. Only change what was asked.
═══════════════════════════════════════════════════════════════
`;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // BRAND MEMORY: Inject stored brand identity into planner context
  // ═══════════════════════════════════════════════════════════════
  let brandMemoryInjection = "";
  if (brandIdentity && typeof brandIdentity === 'object' && Object.keys(brandIdentity).length > 0) {
    const lockStatus = brandIdentityLocked
      ? "🔒 LOCKED — Do NOT modify any brand tokens (palette, typography, spacing, vibe). The user has locked their brand direction. Only change layout/content, never design tokens."
      : "🔓 UNLOCKED — You may evolve the brand identity if the user's request implies a style change. If you do, output a JSON block at the end of your response tagged === BRAND_UPDATE === with the updated brand_identity object.";
    brandMemoryInjection = `
═══════════════════════════════════════════════════════════════
🧠 BRAND MEMORY: STORED BRAND IDENTITY
═══════════════════════════════════════════════════════════════
${JSON.stringify(brandIdentity, null, 2)}

${lockStatus}

When generating code, ALWAYS reference these brand tokens:
- Use the colorPalette values for all color decisions
- Use the typography style for font choices
- Use the borderRadius scale for component rounding
- Use the spacingScale for section/component spacing
- Use the ctaStyle for button/CTA design decisions
- Use the vibe as the overall design personality

This ensures CONSISTENCY across all generations.
═══════════════════════════════════════════════════════════════
`;
    console.log(`[BrandMemory] Injected brand identity into prompt (locked: ${brandIdentityLocked})`);
  }

  // ═══════════════════════════════════════════════════════════════
  // BRAND LAYER: Vibe-aware design intelligence (Vision mode only)
  // ═══════════════════════════════════════════════════════════════
  let brandLayerInjection = "";
  if (intent.interactionMode === "vision") {
    const detectedVibe = detectVibeIntent(prompt);
    if (detectedVibe) {
      console.log(`[BrandLayer] Detected vibe: ${detectedVibe} — injecting design intelligence`);
      brandLayerInjection = `
═══════════════════════════════════════════════════════════════
🎨 DESIGN INTELLIGENCE: BRAND LAYER
═══════════════════════════════════════════════════════════════
DETECTED VIBE: ${detectedVibe}
Apply the "${detectedVibe}" design system comprehensively across all affected files.

When the user describes a feeling or aesthetic, update the ENTIRE design system coherently:
1. /storefront/theme.ts — Update color tokens, spacing scale, border radius, typography
2. Component files — Apply the theme tokens consistently (use CSS variables, not hardcoded colors)

VIBE MAP:
- "luxury/premium/elegant" → Dark backgrounds, serif headings (Playfair Display), wide spacing (120px sections), subtle borders, gold/warm accents, 0.375rem radius, noise texture
- "futuristic/neon/cyber" → Near-black bg (#0a0a0f), neon accent colors (cyan/magenta), tight spacing (60px), sharp corners (0.125rem), glow effects, Orbitron headings
- "playful/fun/colorful" → Vibrant multi-color palette, rounded corners (1.25rem), bouncy animations (250ms), bold Poppins typography, no texture
- "minimal/clean/simple" → Maximum whitespace, thin Inter font (weight 500), no decorative elements, monochrome, 0rem radius, 100ms transitions
- "corporate/professional" → Blue accents (#2563eb), system Inter fonts (weight 600), structured grid, subtle shadows, 0.5rem radius
- "editorial/magazine" → Light airy backgrounds, Playfair Display headings, high contrast typography, 0.25rem radius, 350ms transitions

CRITICAL: When changing the vibe, update theme.ts AND ensure components reference theme tokens.
Never scatter hardcoded colors — centralize in theme.ts.
${!brandIdentityLocked ? `\nIf you change the vibe, output === BRAND_UPDATE === at the end with the new brand_identity JSON.` : ''}
═══════════════════════════════════════════════════════════════
`;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MICRO-EDIT OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════
  const isMicro = detectMicroEdit(prompt, Boolean(currentCode?.trim()));
  let microInjection = "";
  if (isMicro) {
    console.log(`[Executor] 🔬 Micro-edit detected — reducing token budget`);
    microInjection = `
This is a MICRO-EDIT. Keep your ANALYSIS and PLAN sections to 1-2 lines each.
Focus on the BUILD section. This is a small, surgical change.
`;
  }

  // Build messages array
  const messages: Array<{ role: string; content: string }> = [{ role: "system", content: systemPrompt }];

  // Inject creator identity for personalization
  let creatorInjection = "";
  if (creatorIdentity && (intent.intent === "BUILD" || intent.intent === "MODIFY" || intent.intent === "FIX")) {
    creatorInjection = `
═══════════════════════════════════════════════════════════════
CREATOR_IDENTITY (USE THIS FOR ALL CONTACT/ABOUT/FAQ PAGES):
═══════════════════════════════════════════════════════════════
- Store Name: ${creatorIdentity.username}
- Contact Email: ${creatorIdentity.email}
- Brand: Use "${creatorIdentity.username}" as the brand name, NOT "SellsPay"
- For contact sections: Use "${creatorIdentity.email}"
- For about pages: Reference "${creatorIdentity.username}" as the creator/store owner
- For FAQ: Frame questions as "${creatorIdentity.username}'s products/store"

CRITICAL: "SellsPay" should ONLY appear in the footer as "Powered by SellsPay".
═══════════════════════════════════════════════════════════════
`;
  }

  // Add products context for code generation
  let productsInjection = "";
  if ((intent.intent === "BUILD" || intent.intent === "MODIFY") && productsContext?.length) {
    productsInjection = `
CREATOR_PRODUCTS (REAL DATA):
${JSON.stringify(productsContext, null, 2)}
Use ONLY these real products. NEVER generate fake placeholder products.
`;
  }

  // Build user message based on intent
  if (intent.intent === "QUESTION" || intent.intent === "REFUSE") {
    // For chat/refuse, just pass the prompt
    messages.push({
      role: "user",
      content: currentCode
        ? `The user has this current design:\n\n${currentCode}\n\nThey ask: ${prompt}`
        : `The user asks: ${prompt}`,
    });
  } else {
    // For code generation - include resolved target for surgical precision
    const resolvedTargetContext = intent.resolved_target
      ? `\n[RESOLVED_TARGET]: The user is referring to "${intent.resolved_target}" from a previous conversation. Apply changes ONLY to this specific element.\n`
      : "";

    // Add minimal diff reminder to every code request
    const minimalDiffReminder = `
═══════════════════════════════════════════════════════════════
⚠️ CRITICAL REMINDER: MINIMAL DIFF ONLY ⚠️
═══════════════════════════════════════════════════════════════
You MUST change ONLY what was explicitly requested below.
DO NOT modify colors, layout, styling, or any other elements.
DO NOT "improve" or "clean up" unrelated code.
If the request says "change X", change ONLY X and nothing else.
═══════════════════════════════════════════════════════════════
`;

    if (currentCode?.trim()) {
      // Build code context: prefer multi-file map when available
      let codeContext: string;
      let fileInventoryBlock = "";
      if (projectFiles && typeof projectFiles === 'object' && Object.keys(projectFiles).length > 1) {
        // Compute file inventory diff if lastValidFiles available
        if (lastValidFiles && typeof lastValidFiles === 'object') {
          const diff = computeFileDiff(lastValidFiles as Record<string, string>, projectFiles as Record<string, string>);
          const parts: string[] = ['FILE INVENTORY (do NOT modify unchanged files):'];
          if (diff.unchanged.length > 0) parts.push(`- UNCHANGED: ${diff.unchanged.join(', ')}`);
          if (diff.modified.length > 0) parts.push(`- MODIFIED LAST TIME: ${diff.modified.join(', ')}`);
          if (diff.added.length > 0) parts.push(`- NEW: ${diff.added.join(', ')}`);
          if (diff.removed.length > 0) parts.push(`- REMOVED: ${diff.removed.join(', ')}`);
          parts.push('Only output files you are actually changing.\n');
          fileInventoryBlock = parts.join('\n');
          console.log(`[FileDiff] Inventory: ${diff.unchanged.length} unchanged, ${diff.modified.length} modified, ${diff.added.length} added`);
        }
        
        // Multi-file project: show the full file map so AI can see all components
        const fileEntries = Object.entries(projectFiles)
          .filter(([path, content]) => typeof content === 'string' && content.trim().length > 0)
          .map(([path, content]) => `=== ${path} ===\n${content}`)
          .join('\n\n');
        codeContext = `${fileInventoryBlock}Here is the full project file map:\n\n${fileEntries}\n\nIMPORTANT: Return your response as a complete files map. Modify ONLY the files that need changes. Preserve all other files exactly as they are.`;
      } else {
        // Single-file project: backward compatible
        codeContext = `Here is the current code:\n\n${currentCode}`;
      }

      messages.push({
        role: "user",
        content: `${modeInjection}${brandMemoryInjection}${brandLayerInjection}${intentInjection}${microInjection}${creatorInjection}${productsInjection}${resolvedTargetContext}${minimalDiffReminder}${codeContext}\n\nNow, apply this SPECIFIC change and NOTHING ELSE: ${prompt}`,
      });
    } else {
      // First build (REPLACE mode) — skip ANALYSIS/PLAN to reduce token burden and avoid timeouts
      messages.push({
        role: "user",
        content: `${modeInjection}${brandMemoryInjection}${brandLayerInjection}${intentInjection}${creatorInjection}${productsInjection}Create a complete storefront with this description: ${prompt}\n\nIMPORTANT: This is a FIRST BUILD — skip the ANALYSIS and PLAN sections. Go directly to === CODE ===, then === SUMMARY ===, then === CONFIDENCE ===. Focus all tokens on generating high-quality code.`,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // INTENT-AWARE MODEL ROUTING
  // BUILD → Claude Sonnet (structural JSON discipline, multi-file cohesion)
  // MODIFY/FIX/QUESTION/REFUSE → Gemini Flash (fast, cheap, surgical)
  // User can override with explicit model selection (e.g. vibecoder-claude)
  // ═══════════════════════════════════════════════════════════════
  const isExplicitModelSelection = model !== "vibecoder-pro" && model !== "vibecoder-flash";
  let resolvedModel = model;

  if (!isExplicitModelSelection) {
    // Auto-route based on intent
    if (intent.intent === "BUILD") {
      resolvedModel = "vibecoder-claude"; // Claude Sonnet for full builds
      console.log(`[ModelRouter] BUILD intent → auto-routing to Claude Sonnet (flagship engine)`);
    } else {
      resolvedModel = "vibecoder-flash"; // Gemini Flash for edits/fixes
      console.log(`[ModelRouter] ${intent.intent} intent → using Gemini Flash (surgical worker)`);
    }
  }

  const config = MODEL_CONFIG[resolvedModel] || MODEL_CONFIG["vibecoder-pro"];

  // Determine max tokens based on intent + micro-edit
  // Provider limits: Claude=64000, GPT-4o=16384, Gemini=8192
  const PROVIDER_MAX_TOKENS: Record<string, number> = {
    anthropic: 60000,
    openai: 16000,
    gemini: 8192,
  };
  const providerCap = PROVIDER_MAX_TOKENS[config.provider] || 8192;
  let maxTokens = intent.intent === "QUESTION" || intent.intent === "REFUSE" ? 500 : providerCap;
  if (isMicro) maxTokens = Math.min(16000, providerCap);

  console.log(`[Executor] Using model: ${config.modelId} (${config.provider}) for intent: ${intent.intent}${isMicro ? ' (micro-edit, 16k tokens)' : ''}`);

  // Call the AI via multi-model router
  try {
    const result = await callModelAPI(config, messages, {
      maxTokens,
      temperature: 0.3,
      stream: shouldStream,
    });

    return result;
  } catch (e) {
    console.error("[MODEL_ROUTER_CRASH]", e);
    return new Response(
      JSON.stringify({
        type: "EDGE_CRASH",
        message: String(e),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

serve(async (req) => {
  // MUST BE FIRST: Handles the browser security handshake
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid or missing JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      prompt,
      currentCode,
      projectFiles,
      profileId,
      model = "vibecoder-pro",
      productsContext,
      conversationHistory = [],
      jobId,
      type: requestType,
      answers: clarificationAnswers,
      enhanced_prompt_seed: clientPromptSeed,
      projectId: requestProjectId,
    } = body;

    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GOOGLE_GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase configuration missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ============================================
    // CREDIT ENFORCEMENT: Check and deduct credits
    // ============================================

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const cost = CREDIT_COSTS[model] ?? 3; // Default to pro cost

    // Check if user is admin/owner (bypasses credit checks)
    const { data: isPrivileged } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "owner",
    });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    const bypassCredits = isPrivileged === true || isAdmin === true;

    // Only deduct if cost > 0 (flash is free) AND user is not privileged
    if (cost > 0 && !bypassCredits) {
      // Get current balance
      const { data: wallet, error: walletError } = await supabase
        .from("user_wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (walletError && walletError.code !== "PGRST116") {
        console.error("Wallet fetch error:", walletError);
        throw new Error("Failed to check credit balance");
      }

      const currentBalance = wallet?.balance ?? 0;

      if (currentBalance < cost) {
        return new Response(
          JSON.stringify({
            error: "INSUFFICIENT_CREDITS",
            message: `Insufficient credits. You have ${currentBalance}, but this costs ${cost}.`,
            required: cost,
            available: currentBalance,
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Deduct credits using the secure RPC function
      const { data: deductSuccess, error: deductError } = await supabase.rpc("deduct_credits", {
        p_user_id: userId,
        p_amount: cost,
        p_action: "vibecoder_gen",
      });

      if (deductError) {
        console.error("Credit deduction error:", deductError);
        throw new Error("Failed to deduct credits");
      }

      if (!deductSuccess) {
        return new Response(
          JSON.stringify({
            error: "INSUFFICIENT_CREDITS",
            message: "Insufficient credits for this generation.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      console.log(`Deducted ${cost} credits from user ${userId} for model ${model}`);
    }

    // ════════════════════════════════════════════════════════════
    // FETCH CREATOR IDENTITY + BRAND MEMORY (for personalization)
    // ════════════════════════════════════════════════════════════
    let creatorIdentity: { username: string; email: string } | null = null;
    let brandIdentity: Record<string, unknown> | null = null;
    let brandIdentityLocked = false;

    try {
      // Get user's profile for username + brand identity
      const { data: profile } = await supabase.from("profiles").select("username, brand_identity, brand_identity_locked").eq("user_id", userId).single();

      // Get user's email from auth
      const userEmail = userData.user.email || "";

      if (profile?.username || userEmail) {
        creatorIdentity = {
          username: profile?.username || "My Store",
          email: userEmail,
        };
        console.log(`[Creator Identity] Username: ${creatorIdentity.username}, Email: ${creatorIdentity.email}`);
      }

      if (profile?.brand_identity && typeof profile.brand_identity === 'object') {
        brandIdentity = profile.brand_identity as Record<string, unknown>;
        brandIdentityLocked = profile?.brand_identity_locked === true;
        console.log(`[BrandMemory] Loaded brand identity (locked: ${brandIdentityLocked}): vibe=${brandIdentity.vibe || 'none'}, style=${brandIdentity.brandStyle || 'none'}`);
      }
    } catch (e) {
      console.warn("Failed to fetch creator identity:", e);
    }

    // ════════════════════════════════════════════════════════════
    // STAGE 0: COMPLEXITY DETECTION (Auto-Trigger Architect Mode)
    // ════════════════════════════════════════════════════════════
    const hasExistingCode = Boolean(currentCode?.trim());
    // AUTO-ARCHITECT DISABLED: Was causing unwanted plan approval flows
    // Plan mode now only activates when the user explicitly toggles it on.
    // The old shouldForceArchitectMode() triggered on >40 words, 3+ section keywords,
    // or "build me a" patterns — too aggressive, causing failures and friction.
    const forceArchitect = false;

    if (forceArchitect) {
      console.log(`[Stage 0] 🏗️ Complex build detected - forcing Architect Mode`);
    }

    const intentResult = await classifyIntent(prompt, hasExistingCode, conversationHistory || [], GOOGLE_GEMINI_API_KEY);

    console.log(`[Stage 1] Result: ${intentResult.intent} (${intentResult.confidence}) - ${intentResult.reasoning}`);

    // ════════════════════════════════════════════════════════════
    // STAGE 1.1: ANALYZER (2-Stage Pipeline - Suggestions + Questions)
    // ════════════════════════════════════════════════════════════
    // Skip analyzer for clarification answers (they already went through it)
    // Also skip for QUESTION/REFUSE intents (no code gen needed)
    let analysis: any = null; // Hoisted so streaming section can access suggestions
    if (requestType !== "clarification_answers" && intentResult.intent !== "QUESTION" && intentResult.intent !== "REFUSE") {
      // Fetch existing intent profile for context
      let intentProfile: { primary_intent: string; feature_counts: Record<string, number> } | null = null;
      if (requestProjectId) {
        const { data: profile } = await supabase
          .from("vibecoder_intent_profiles")
          .select("primary_intent, feature_counts")
          .eq("project_id", requestProjectId)
          .maybeSingle();
        if (profile) {
          intentProfile = {
            primary_intent: profile.primary_intent,
            feature_counts: (profile.feature_counts as Record<string, number>) || {},
          };
        }
      }

      analysis = await analyzeIntent(prompt, hasExistingCode, conversationHistory || [], intentProfile, GOOGLE_GEMINI_API_KEY);

      if (analysis) {
        // Update intent profile in background (don't await)
        if (requestProjectId) {
          updateIntentProfile(supabase, requestProjectId, analysis).catch(e => console.warn("[IntentProfile] Background update failed:", e));
        }

        // If analyzer produced questions and request is vague, return suggestions + questions
        // then close the stream (wait for user answers)
        if (analysis.questions && analysis.questions.length > 0) {
          console.log(`[Analyzer] Vague request detected - emitting ${analysis.questions.length} questions`);
          
          const encoder = new TextEncoder();
          const questionStream = new ReadableStream({
            start(controller) {
              // Emit phase
              const phasePayload = `event: phase\ndata: ${JSON.stringify({ phase: "analyzing" })}\n\n`;
              controller.enqueue(encoder.encode(phasePayload));
              
              // Emit suggestions
              if (analysis.suggestions?.length) {
                const sugPayload = `event: suggestions\ndata: ${JSON.stringify(analysis.suggestions)}\n\n`;
                controller.enqueue(encoder.encode(sugPayload));
              }
              
              // Emit questions with enhanced_prompt_seed
              const qPayload = `event: questions\ndata: ${JSON.stringify({
                questions: analysis.questions,
                enhanced_prompt_seed: analysis.enhanced_prompt_seed || "",
              })}\n\n`;
              controller.enqueue(encoder.encode(qPayload));
              
              // Emit analysis text
              const missing = analysis.missing?.length ? `Missing info: ${analysis.missing.join(", ")}` : "";
              const textPayload = `event: text\ndata: ${JSON.stringify({ content: `I need a few details to build this right. ${missing}`.trim() })}\n\n`;
              controller.enqueue(encoder.encode(textPayload));
              
              // Close stream (wait for answers)
              const completePayload = `event: phase\ndata: ${JSON.stringify({ phase: "waiting_for_answers" })}\n\n`;
              controller.enqueue(encoder.encode(completePayload));
              
              controller.close();
            },
          });

          return new Response(questionStream, {
            headers: {
              ...corsHeaders,
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        }

        // No questions needed - emit suggestions and use enhanced prompt
        // Suggestions will be emitted during the main SSE stream below
        // Store analysis for use in the streaming section
        console.log(`[Analyzer] Request is specific enough - ${analysis.suggestions?.length || 0} suggestions generated`);
      }
    }

    // If this is a clarification_answers request, build the enriched prompt
    if (requestType === "clarification_answers" && clarificationAnswers) {
      const answerSummary = Object.entries(clarificationAnswers)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? (v as string[]).join(", ") : v}`)
        .join("; ");
      const enrichedPrompt = clientPromptSeed
        ? `${clientPromptSeed}\n\nUser preferences: ${answerSummary}`
        : `Based on these preferences: ${answerSummary}`;
      console.log(`[Clarification] Built enriched prompt from answers: ${enrichedPrompt.substring(0, 100)}...`);
      // Override prompt with enriched version for codegen
      // (modifiedPrompt will be set below)
    }

    // ════════════════════════════════════════════════════════════
    // FETCH LAST VALID FILES (for File Inventory Diff Engine)
    // ════════════════════════════════════════════════════════════
    let lastValidFiles: Record<string, string> | null = null;
    if (requestProjectId && (intentResult.intent === "MODIFY" || intentResult.intent === "FIX")) {
      try {
        const { data: projectData } = await supabase
          .from("vibecoder_projects")
          .select("last_valid_files")
          .eq("id", requestProjectId)
          .single();
        if (projectData?.last_valid_files && typeof projectData.last_valid_files === 'object') {
          lastValidFiles = projectData.last_valid_files as Record<string, string>;
          console.log(`[FileDiff] Fetched last_valid_files: ${Object.keys(lastValidFiles).length} files`);
        }
      } catch (e) {
        console.warn("[FileDiff] Could not fetch last_valid_files:", e);
      }
    }

    // ════════════════════════════════════════════════════════════
    // STAGE 1.5: ARCHITECT MODE (only when user explicitly requests it)
    // ════════════════════════════════════════════════════════════
    let modifiedPrompt = prompt;
    let forcePlanMode = false;

    if (forceArchitect && (intentResult.intent === "BUILD" || intentResult.intent === "MODIFY")) {
      const alreadyArchitect = prompt.includes("[ARCHITECT_MODE_ACTIVE]");

      if (!alreadyArchitect) {
        console.log(`[Stage 1.5] Injecting Architect Mode into prompt`);
        modifiedPrompt = `[ARCHITECT_MODE_ACTIVE]\n${getArchitectModeInjection()}\nUser Request: ${prompt}`;
        forcePlanMode = true;
      }
    }

    // ════════════════════════════════════════════════════════════
    // STAGE 2: EXECUTE BASED ON CLASSIFIED INTENT
    // ════════════════════════════════════════════════════════════
    console.log(`[Stage 2] Executing ${intentResult.intent} handler (mode: ${intentResult.interactionMode})${forcePlanMode ? " (Plan Mode Forced)" : ""}...`);

    const response = await executeIntent(
      intentResult,
      modifiedPrompt,
      currentCode || null,
      productsContext || null,
      model,
      GOOGLE_GEMINI_API_KEY,
      creatorIdentity,
      projectFiles || null,
      lastValidFiles,
      brandIdentity,
      brandIdentityLocked,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let structured: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(errorText);
        if (parsed && typeof parsed === "object") {
          structured = parsed as Record<string, unknown>;
        }
      } catch {
        // keep fallback payload below
      }

      const isEdgeCrash = structured.type === "EDGE_CRASH";
      const status = isEdgeCrash
        ? 500
        : (response.status === 502 || response.status === 503 ? response.status : 503);
      if (!structured.type) {
        structured.type = status === 502 ? "RESPONSE_PARSE_ERROR" : status === 500 ? "EDGE_CRASH" : "MODEL_UNAVAILABLE";
      }
      if (!structured.message) {
        structured.message = status === 500 ? "Unexpected model router crash" : "AI provider failure";
      }
      if (!structured.details && errorText) {
        structured.details = errorText.slice(0, 500);
      }

      return new Response(JSON.stringify(structured), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.body) {
      throw new Error("No response body from AI");
    }

    // ════════════════════════════════════════════════════════════
    // JOB-BASED PROCESSING: If jobId is provided, process in background
    // and write results to database (allows user to leave and return)
    // ════════════════════════════════════════════════════════════
    // ════════════════════════════════════════════════════════════
    // UNIFIED STREAMING: Always SSE stream + optional DB write
    // ════════════════════════════════════════════════════════════
    if (jobId) {
      console.log(`[Job ${jobId}] Starting streaming + job processing...`);
      await supabase
        .from("ai_generation_jobs")
        .update({
          status: "running",
          started_at: new Date().toISOString(),
          progress_logs: ["Starting AI generation..."],
        })
        .eq("id", jobId);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let buffer = "";
        let fullContent = "";
        
        // Heartbeat: prevent "stuck" perception
        const heartbeatInterval = setInterval(() => {
          try {
            const payload = `event: heartbeat\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch {
            clearInterval(heartbeatInterval);
          }
        }, 10_000);
        
        // Hard timeout: 180s for first builds (REPLACE mode), 120s for job-backed edits, 60s otherwise
        const isFirstBuild = !currentCode?.trim();
        const timeoutMs = isFirstBuild ? 180_000 : jobId ? 120_000 : 60_000;
        console.log(`[Streaming] Timeout set to ${timeoutMs / 1000}s (firstBuild=${isFirstBuild}, jobBacked=${!!jobId})`);
        const streamTimeout = setTimeout(() => {
          console.error("[Streaming] Hard timeout reached");
          const payload = `event: error\ndata: ${JSON.stringify({ code: "STREAM_TIMEOUT", message: "Generation timed out. Please retry with a simpler request." })}\n\n`;
          try {
            controller.enqueue(encoder.encode(payload));
            controller.close();
          } catch { /* already closed */ }
          clearInterval(heartbeatInterval);
        }, timeoutMs);
        
        // Track structured sections
        let currentSection: 'none' | 'analysis' | 'plan' | 'code' | 'summary' | 'confidence' = 'none';
        let analysisEmitted = false;
        let planEmitted = false;
        let codePhaseEmitted = false;
        let summaryEmitted = false;
        let confidenceEmitted = false;
        let lastCodeEmitLength = 0;
        let retryCount = 0;
        const generationStartTime = Date.now();
        
        // ═══════════════════════════════════════════════════════
        // SINGLE AUTHORITY: SUMMARY phase is the canonical parse.
        // These flags prevent Gate 1 from re-deriving/re-validating.
        // ═══════════════════════════════════════════════════════
        let summaryValidated = false;
        let lastMergedFiles: Record<string, string> | null = null;
        
        // Helper to emit structured SSE events
        const emitEvent = (eventType: string, data: any) => {
          const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        };
        
        // Emit initial analyzing phase
        emitEvent('phase', { phase: 'analyzing' });
        
        // Emit analyzer suggestions into the main stream (if available)
        if (analysis?.suggestions?.length) {
          emitEvent('suggestions', analysis.suggestions);
        }
        
        // Process accumulated content and emit structured events
        const processContent = async () => {
          // === ANALYSIS === section
          if (!analysisEmitted && fullContent.includes('=== ANALYSIS ===')) {
            const analysisStart = fullContent.indexOf('=== ANALYSIS ===') + '=== ANALYSIS ==='.length;
            let analysisEnd = fullContent.indexOf('=== PLAN ===');
            if (analysisEnd < 0) analysisEnd = fullContent.indexOf('=== CODE ===');
            if (analysisEnd < 0) analysisEnd = fullContent.length;
            
            const analysisText = fullContent.substring(analysisStart, analysisEnd).trim();
            if (analysisText.length > 5) {
              emitEvent('text', { content: analysisText });
              analysisEmitted = true;
            }
          }
          
          // === PLAN === section
          if (!planEmitted && fullContent.includes('=== PLAN ===')) {
            emitEvent('phase', { phase: 'planning' });
            
            const planStart = fullContent.indexOf('=== PLAN ===') + '=== PLAN ==='.length;
            let planEnd = fullContent.indexOf('=== CODE ===');
            if (planEnd < 0) planEnd = fullContent.length;
            
            const planText = fullContent.substring(planStart, planEnd).trim();
            const items = planText
              .split('\n')
              .map((line: string) => line.replace(/^[-*•]\s*/, '').replace(/^(Step\s+\d+:\s*)/i, '').trim())
              .filter((line: string) => line.length > 2);
            
            if (items.length > 0) {
              emitEvent('plan', { items });
              planEmitted = true;
            }
          }
          
          // === CODE === section — accumulate but DON'T stream as deltas
          if (!codePhaseEmitted && fullContent.includes('=== CODE ===')) {
            emitEvent('phase', { phase: 'building' });
            codePhaseEmitted = true;
          }
          
          // During code accumulation, emit progress (byte count) instead of raw code
          if (codePhaseEmitted && !summaryEmitted) {
            const codeStart = fullContent.indexOf('=== CODE ===') + '=== CODE ==='.length;
            let codeEnd = fullContent.indexOf('=== SUMMARY ===');
            if (codeEnd < 0) codeEnd = fullContent.length;
            const codeSection = fullContent.substring(codeStart, codeEnd);
            // Only emit progress updates, not actual code
            if (codeSection.length > lastCodeEmitLength + 200) {
              emitEvent('code_progress', { bytes: codeSection.length });
              lastCodeEmitLength = codeSection.length;
            }
          }
          
          // === SUMMARY === section — CODE is now complete, parse JSON files
          if (!summaryEmitted && fullContent.includes('=== SUMMARY ===')) {
            // Extract and parse the JSON files from === CODE === section
            const codeStart = fullContent.indexOf('=== CODE ===') + '=== CODE ==='.length;
            const codeEnd = fullContent.indexOf('=== SUMMARY ===');
            const codeSectionRaw = fullContent.substring(codeStart, codeEnd).trim();
            
            // Strip markdown fences if present
            const cleaned = codeSectionRaw
              .replace(/^```(?:json|tsx?|jsx?)?\s*\n?/i, '')
              .replace(/\n?```\s*$/i, '')
              .trim();
            
            // 🔍 DEBUG: Log raw CODE section before any parsing
            console.log(`[Job ${jobId}] RAW_CODE_SECTION (first 2000 chars):`, cleaned.substring(0, 2000));
            console.log(`[Job ${jobId}] RAW_CODE_SECTION (last 500 chars):`, cleaned.substring(Math.max(0, cleaned.length - 500)));
            console.log(`[Job ${jobId}] RAW_CODE_SECTION total length: ${cleaned.length}`);
            
            let filesEmitted = false;
            try {
              const parsed = JSON.parse(cleaned);
              if (parsed.files && typeof parsed.files === 'object') {
                const fileMap: Record<string, string> = parsed.files;
                
                // ═══════════════════════════════════════════════════════
                // ZERO-TRUST LAYER 3: All values must be strings
                // ═══════════════════════════════════════════════════════
                for (const [path, content] of Object.entries(fileMap)) {
                  if (typeof content !== 'string') {
                    throw new Error(`INVALID_FILE_CONTENT_TYPE: ${path} has type ${typeof content}`);
                  }
                }
                
                // ═══════════════════════════════════════════════════════
                // ZERO-TRUST LAYER 4: No conversational signatures
                // ═══════════════════════════════════════════════════════
                const forbiddenStarts = ['Alright', 'Got it!', 'Sure!', "Here's", "Let's", '=== ANALYSIS', '=== PLAN', '=== SUMMARY'];
                for (const [path, content] of Object.entries(fileMap)) {
                  if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
                    const trimmedContent = (content as string).trim();
                    const isConversational = forbiddenStarts.some(s => trimmedContent.startsWith(s));
                    const hasCodeIndicators = /export|import|function|const|return|<\w+/.test(trimmedContent);
                    if (isConversational || !hasCodeIndicators) {
                      throw new Error(`NON_CODE_OUTPUT: ${path} contains conversational text, not code`);
                    }
                  }
                }
                
                // ═══════════════════════════════════════════════════════
                // ZERO-TRUST LAYER 5: App.tsx must export default
                // ═══════════════════════════════════════════════════════
                const appKey = Object.keys(fileMap).find(k => k === 'App.tsx' || k === '/App.tsx');
                if (appKey && !fileMap[appKey].includes('export default')) {
                  console.warn(`[ZERO-TRUST] App.tsx missing export default — will attempt repair`);
                }
                
                // Validate each .tsx file
                const validationErrors: Array<{path: string; error: string}> = [];
                
                for (const [path, content] of Object.entries(fileMap)) {
                  if (path.endsWith('.tsx') || path.endsWith('.ts')) {
                    if (!content || (typeof content === 'string' && content.trim().length < 10)) {
                      validationErrors.push({ path, error: 'File content is empty or too short' });
                    }
                  }
                }
                
                // Auto-repair if validation errors found
                if (validationErrors.length > 0) {
                  console.warn(`[AutoRepair] ${validationErrors.length} file(s) need repair`);
                  const autoRepairConfig = MODEL_CONFIG[model] || MODEL_CONFIG["vibecoder-flash"] || MODEL_CONFIG["vibecoder-pro"];

                  for (const err of validationErrors) {
                    try {
                      const repairedContent = await repairBrokenFile(
                        err.path,
                        fileMap[err.path] || "",
                        err.error,
                        autoRepairConfig,
                      );

                      if (repairedContent && repairedContent.trim().length > 20) {
                        fileMap[err.path] = repairedContent;
                        console.log(`[AutoRepair] ✅ Repaired ${err.path}`);
                      }
                    } catch (repairErr) {
                      console.warn(`[AutoRepair] Failed to repair ${err.path}:`, repairErr);
                    }
                  }
                }
                
                // ═══════════════════════════════════════════════════════
                // COMPILE-FIX RETRY LOOP (Layer 6 Server-Side)
                // Run full syntax validation on all files.
                // If any fail, attempt one targeted repair per file.
                // If repair fails, abort the entire commit.
                // ═══════════════════════════════════════════════════════
                const syntaxResult = validateAllFilesServer(fileMap);
                if (!syntaxResult.valid) {
                  console.warn(`[CompileFix] ${syntaxResult.errors.length} file(s) have syntax errors — attempting repair`);
                  emitEvent('phase', { phase: 'repairing', files: syntaxResult.errors.map(e => e.file) });
                  
                  let allRepaired = true;
                  for (const err of syntaxResult.errors) {
                    // Model-aware repair: use the same model that generated the code
                    const generatorConfig = MODEL_CONFIG[model] || MODEL_CONFIG["vibecoder-pro"];
                    let repaired = await repairBrokenFile(err.file, fileMap[err.file], err.error, generatorConfig);
                    
                    // Lateral retry: if primary repair fails, try the other premium model
                    if (!repaired) {
                      const lateralConfig = PREMIUM_FALLBACK_CHAIN[generatorConfig.provider];
                      if (lateralConfig) {
                        console.log(`[CompileFix] Primary repair failed for ${err.file}, trying lateral: ${lateralConfig.provider}/${lateralConfig.modelId}`);
                        repaired = await repairBrokenFile(err.file, fileMap[err.file], err.error, lateralConfig);
                      }
                    }
                    
                    if (repaired) {
                      fileMap[err.file] = repaired;
                    } else {
                      allRepaired = false;
                      console.error(`[CompileFix] ❌ Could not repair ${err.file} (both primary + lateral failed): ${err.error}`);
                    }
                  }
                  
                  if (!allRepaired) {
                    // Re-validate to get remaining errors
                    const recheckResult = validateAllFilesServer(fileMap);
                    if (!recheckResult.valid) {
                      const errorSummary = recheckResult.errors.map(e => `${e.file}: ${e.error}`).join(' | ');
                      console.error(`[CompileFix] ABORT: Files still have syntax errors after repair: ${errorSummary}`);
                      emitEvent('error', { code: 'SYNTAX_REPAIR_FAILED', message: `Code has syntax errors that could not be auto-repaired: ${errorSummary}` });
                      // Don't emit files — abort this commit
                      summaryValidated = false;
                      lastMergedFiles = null as unknown as Record<string, string>;
                      // Skip to summary section
                    }
                  }
                  
                  if (summaryValidated !== false) {
                    // Final recheck passed
                    const finalCheck = validateAllFilesServer(fileMap);
                    if (finalCheck.valid) {
                      console.log(`[CompileFix] ✅ All files pass syntax validation after repair`);
                    }
                  }
                }
                
                // ═══════════════════════════════════════════════════════
                // LAYER 7: PATH ISOLATION GUARD (Server-Side)
                // Block files targeting restricted folders
                // ═══════════════════════════════════════════════════════
                if (summaryValidated !== false) {
                  const existingPaths = Object.keys(fileMap);
                  const hasLegacyPaths = existingPaths.some(
                    p => !p.startsWith('/storefront/') && p !== '/App.tsx'
                      && !RESTRICTED_PATH_PREFIXES.some(r => p.startsWith(r))
                  );
                  const pathIsolationResult = validatePathIsolationServer(fileMap, hasLegacyPaths);
                  if (!pathIsolationResult.valid) {
                    const errorSummary = pathIsolationResult.errors.map(e => `${e.file}: ${e.error}`).join(' | ');
                    console.error(`[PathIsolation] ABORT: ${errorSummary}`);
                    emitEvent('error', { code: 'PATH_ISOLATION_VIOLATION', message: `Files target restricted folders: ${errorSummary}` });
                    summaryValidated = false;
                    lastMergedFiles = null as unknown as Record<string, string>;
                  }
                }

                // Only emit if all validation passed
                if (summaryValidated !== false) {
                  emitEvent('files', { projectFiles: fileMap });
                  filesEmitted = true;
                  lastMergedFiles = fileMap;
                  summaryValidated = true;
                  console.log(`[Files] Emitted ${Object.keys(fileMap).length} files atomically (summaryValidated=true, syntax+path validated)`);
                }
              }
            } catch (parseErr) {
              console.warn('[Files] JSON parse failed in SUMMARY, attempting fallback extraction:', parseErr);
              
              // ═══════════════════════════════════════════════════════
              // FALLBACK 1: Extract JSON from markdown code blocks
              // ═══════════════════════════════════════════════════════
              const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
              if (codeBlockMatch) {
                try {
                  const innerParsed = JSON.parse(codeBlockMatch[1].trim());
                  if (innerParsed?.files && typeof innerParsed.files === 'object' && Object.keys(innerParsed.files).length > 0) {
                    emitEvent('files', { projectFiles: innerParsed.files });
                    filesEmitted = true;
                    lastMergedFiles = innerParsed.files;
                    summaryValidated = true;
                    console.log(`[Files] FALLBACK 1: Extracted ${Object.keys(innerParsed.files).length} files from code block`);
                  }
                } catch {
                  console.warn('[Files] FALLBACK 1: Code block JSON parse also failed');
                }
              }
              
              // ═══════════════════════════════════════════════════════
              // FALLBACK 2: Repair truncated JSON (unbalanced braces)
              // ═══════════════════════════════════════════════════════
              if (!filesEmitted) {
                try {
                  let repaired = cleaned;
                  let braces = 0, brackets = 0;
                  for (const char of repaired) {
                    if (char === '{') braces++;
                    if (char === '}') braces--;
                    if (char === '[') brackets++;
                    if (char === ']') brackets--;
                  }
                  while (brackets > 0) { repaired += ']'; brackets--; }
                  while (braces > 0) { repaired += '}'; braces--; }
                  
                  if (repaired !== cleaned) {
                    const repairedParsed = JSON.parse(repaired);
                    if (repairedParsed?.files && typeof repairedParsed.files === 'object' && Object.keys(repairedParsed.files).length > 0) {
                      emitEvent('files', { projectFiles: repairedParsed.files });
                      filesEmitted = true;
                      lastMergedFiles = repairedParsed.files;
                      summaryValidated = true;
                      console.log(`[Files] FALLBACK 2: Repaired truncated JSON, extracted ${Object.keys(repairedParsed.files).length} files`);
                    }
                  }
                } catch {
                  console.warn('[Files] FALLBACK 2: Truncated JSON repair failed');
                }
              }
              
              // ═══════════════════════════════════════════════════════
              // ZERO-TRUST: NO raw TSX fallback. Must be valid JSON file map.
              // ═══════════════════════════════════════════════════════
              if (!filesEmitted) {
                console.error('[Files] ZERO-TRUST GATE: No valid JSON file map extracted. All fallbacks exhausted.');
                summaryValidated = false;
                lastMergedFiles = null as unknown as Record<string, string>;
              }
            }
            
            // 🚫 Do NOT emit raw code_chunk as legacy fallback — this causes JSON-as-code bugs
            // If filesEmitted is false at this point, finalization will handle the failure
            const summaryStart = fullContent.indexOf('=== SUMMARY ===') + '=== SUMMARY ==='.length;
            let summaryEnd = fullContent.indexOf('=== CONFIDENCE ===');
            if (summaryEnd < 0) summaryEnd = fullContent.length;
            const summaryText = fullContent.substring(summaryStart, summaryEnd).trim();
            
            if (summaryText.length > 3) {
              emitEvent('summary', { content: summaryText });
              summaryEmitted = true;
            }
          }
          
          // === CONFIDENCE === section
          if (!confidenceEmitted && fullContent.includes('=== CONFIDENCE ===')) {
            const confStart = fullContent.indexOf('=== CONFIDENCE ===') + '=== CONFIDENCE ==='.length;
            const confText = fullContent.substring(confStart).trim();
            const confLines = confText.split('\n').filter((l: string) => l.trim().length > 0);
            
            if (confLines.length >= 1) {
              const scoreMatch = confLines[0].match(/(\d+)/);
              const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 85;
              const reason = confLines.slice(1).join(' ').trim() || 'Generation completed successfully.';
              
              emitEvent('confidence', { score: Math.min(100, Math.max(0, score)), reason });
              confidenceEmitted = true;
              
              // Now emit complete phase (after confidence)
              emitEvent('phase', { phase: 'complete' });
            }
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(":")) continue;
              // Skip Anthropic event-type lines (e.g. "event: content_block_delta")
              if (trimmed.startsWith("event:")) continue;
              if (!trimmed.startsWith("data: ")) continue;

              const jsonStr = trimmed.slice(6).trim();
              if (jsonStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(jsonStr);
                // OpenAI format: choices[0].delta.content
                let content = parsed.choices?.[0]?.delta?.content;
                // Anthropic format: delta.text (content_block_delta event)
                if (!content && parsed.type === 'content_block_delta') {
                  content = parsed.delta?.text;
                }
                if (content) {
                  fullContent += content;
                  
                  // Emit raw token for backward compatibility
                  emitEvent('raw', { content });
                  
                  // Process structured sections
                  await processContent();
                }
              } catch (e) {
                // Incomplete JSON
              }
            }
          }

          // Process remaining buffer
          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                let content = parsed.choices?.[0]?.delta?.content;
                if (!content && parsed.type === 'content_block_delta') content = parsed.delta?.text;
                if (content) {
                  fullContent += content;
                  emitEvent('raw', { content });
                  await processContent();
                }
              } catch (e) {
                // Ignore
              }
            }
          }
          
          // Final: emit complete if no confidence section detected
          if (!confidenceEmitted) {
            // Default confidence when model didn't output the section
            emitEvent('confidence', { score: 75, reason: 'Confidence section not provided by model.' });
            emitEvent('phase', { phase: 'complete' });
          }
          
          // ════════════════════════════════════════════════════════
          // TELEMETRY: Log generation metrics
          // ════════════════════════════════════════════════════════
          const durationMs = Date.now() - generationStartTime;
          const telemetry = {
            intent: intentResult.intent,
            confidence: intentResult.confidence,
            isMicroEdit: detectMicroEdit(prompt, Boolean(currentCode?.trim())),
            promptLength: prompt.length,
            codeContextLength: currentCode?.length ?? 0,
            generatedLength: fullContent.length,
            durationMs,
            retryCount,
            phasesEmitted: { analysis: analysisEmitted, plan: planEmitted, code: codePhaseEmitted, summary: summaryEmitted, confidence: confidenceEmitted },
            model,
          };
          console.log(`[Telemetry] ${JSON.stringify(telemetry)}`);

          // ════════════════════════════════════════════════════════
          // BRAND MEMORY: Auto-update brand_identity if AI evolved it
          // ════════════════════════════════════════════════════════
          if (!brandIdentityLocked && fullContent.includes('=== BRAND_UPDATE ===')) {
            try {
              const brandUpdateStart = fullContent.indexOf('=== BRAND_UPDATE ===') + '=== BRAND_UPDATE ==='.length;
              let brandUpdateEnd = fullContent.indexOf('===', brandUpdateStart + 1);
              if (brandUpdateEnd < 0) brandUpdateEnd = fullContent.length;
              const brandUpdateRaw = fullContent.substring(brandUpdateStart, brandUpdateEnd).trim();
              const brandUpdateClean = brandUpdateRaw
                .replace(/^```(?:json)?\s*/i, '')
                .replace(/```$/i, '')
                .trim();
              const updatedBrandIdentity = JSON.parse(brandUpdateClean);
              if (updatedBrandIdentity && typeof updatedBrandIdentity === 'object') {
                await supabase.from("profiles").update({ brand_identity: updatedBrandIdentity }).eq("user_id", userId);
                console.log(`[BrandMemory] ✅ Auto-updated brand identity: vibe=${updatedBrandIdentity.vibe || 'unknown'}`);
              }
            } catch (e) {
              console.warn('[BrandMemory] Failed to parse/save brand update:', e);
            }
          }

          // ════════════════════════════════════════════════════════
          // JOB FINALIZATION: Write results to DB (if job-backed)
          // ════════════════════════════════════════════════════════
          if (jobId) {
            console.log(`[Job ${jobId}] Stream complete, finalizing. Content length: ${fullContent.length}`);

            let codeResult = null;
            let summary = null;
            let planResult = null;

            // 1. Extract Plan if present
            if (fullContent.includes('"type": "plan"') || fullContent.includes('"type":"plan"')) {
              try {
                const jsonMatch = fullContent.match(/\{[\s\S]*"type"\s*:\s*"plan"[\s\S]*\}/);
                if (jsonMatch) {
                  planResult = JSON.parse(jsonMatch[0]);
                  const phases = planResult?.phases || planResult?.steps || [];
                  const complexity = planResult?.complexity;
                  if (phases.length > 6 || complexity === "high") {
                    console.warn(`[Job ${jobId}] Complexity guard triggered`);
                    await supabase.from("ai_generation_jobs").update({
                      status: "needs_user_action",
                      completed_at: new Date().toISOString(),
                      plan_result: planResult,
                      summary: "This request is too complex for a single generation. Please break it into 2-3 smaller requests.",
                      terminal_reason: "complexity_guard",
                      validation_report: { complexity_guard: true, phase_count: phases.length },
                    }).eq("id", jobId);
                    return; // Stream already sent to client
                  }
                }
              } catch (e) {
                console.error(`[Job ${jobId}] Failed to parse plan:`, e);
              }
            }

            // 2. Extract Code and Summary — prefer structured === CODE === section
            if (fullContent.includes("=== CODE ===")) {
              const codeStart = fullContent.indexOf("=== CODE ===") + "=== CODE ===".length;
              let codeEnd = fullContent.indexOf("=== SUMMARY ===");
              if (codeEnd < 0) codeEnd = fullContent.length;
              codeResult = fullContent.substring(codeStart, codeEnd)
                .replace(/^```(?:tsx?|jsx?|javascript|typescript)?\s*\n?/i, '')
                .replace(/\n?```\s*$/i, '')
                .replace(/\/\/\s*---\s*VIBECODER_COMPLETE\s*---/g, '')
                .trim();
              
              // Extract summary from === SUMMARY === section
              if (fullContent.includes("=== SUMMARY ===")) {
                const sumStart = fullContent.indexOf("=== SUMMARY ===") + "=== SUMMARY ===".length;
                let sumEnd = fullContent.indexOf("=== CONFIDENCE ===");
                if (sumEnd < 0) sumEnd = fullContent.length;
                let summaryBody = fullContent.substring(sumStart, sumEnd).trim();
                
                // Append confidence score to the summary text for display
                if (fullContent.includes("=== CONFIDENCE ===")) {
                  const confStart = fullContent.indexOf("=== CONFIDENCE ===") + "=== CONFIDENCE ===".length;
                  const confText = fullContent.substring(confStart).trim();
                  const confLines = confText.split('\n').filter((l: string) => l.trim().length > 0);
                  if (confLines.length >= 1) {
                    const scoreMatch = confLines[0].match(/(\d+)/);
                    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 85;
                    const reason = confLines.slice(1).join(' ').trim() || 'Generation completed successfully.';
                    summaryBody += `\n\n=== CONFIDENCE === ${score} ${reason}`;
                  }
                }
                
                summary = summaryBody;
              } else {
                // Fall back to analysis text
                const analysisIdx = fullContent.indexOf("=== ANALYSIS ===");
                if (analysisIdx >= 0) {
                  const aEnd = fullContent.indexOf("=== PLAN ===");
                  summary = fullContent.substring(analysisIdx + "=== ANALYSIS ===".length, aEnd > 0 ? aEnd : codeStart).trim();
                }
              }
            } else if (fullContent.includes("/// TYPE: CHAT ///")) {
              // Chat-only response — no code expected
              summary = fullContent.replace("/// TYPE: CHAT ///", "").trim();
            } else {
              // ZERO-TRUST: Do NOT treat raw fullContent as code
              // Only use it as summary text
              summary = fullContent.length > 200 ? fullContent.substring(0, 200) + '...' : fullContent;
              console.warn(`[Job ${jobId}] ZERO-TRUST: No structured sections found. Raw content treated as summary only.`);
            }

            // ═══════════════════════════════════════════════════════
            // VALIDATION GATES
            // ═══════════════════════════════════════════════════════
            let validationError = null;
            let jobStatus = "completed";
            let terminalReason = "all_gates_passed";
            const validationReport: Record<string, unknown> = {
              generated_code_length: codeResult?.length ?? 0,
              truncation_detected: false,
              no_op_detected: false,
              intent_ok: true,
              terminal_reason: "",
            };

            // ═══════════════════════════════════════════════════════
            // GATE -1: NO CODE PRODUCED (conversational response on BUILD/MODIFY/FIX)
            // If the model responded conversationally instead of producing a file map,
            // fail the job explicitly — never let it through as "completed".
            // ═══════════════════════════════════════════════════════
            const codeRequiredIntents = ["BUILD", "MODIFY", "FIX"];
            if (!codeResult && codeRequiredIntents.includes(intentResult.intent)) {
              // Check if SUMMARY streaming already emitted files successfully
              if (summaryValidated && lastMergedFiles && Object.keys(lastMergedFiles).length > 0) {
                // SUMMARY phase handled it — synthesize codeResult from canonical files
                codeResult = JSON.stringify({ files: lastMergedFiles });
                console.log(`[Job ${jobId}] GATE -1: No === CODE === section, but SUMMARY emitted ${Object.keys(lastMergedFiles).length} files — using canonical result`);
              } else {
                console.error(`[Job ${jobId}] GATE -1 FAIL: Intent is ${intentResult.intent} but model produced NO code. Full content length: ${fullContent.length}`);
                console.error(`[Job ${jobId}] GATE -1 DEBUG: Has === CODE ===: ${fullContent.includes('=== CODE ===')}, Has /// BEGIN_CODE ///: ${fullContent.includes('/// BEGIN_CODE ///')}`);
                console.error(`[Job ${jobId}] GATE -1 FIRST 500 chars: ${fullContent.substring(0, 500)}`);
                validationError = { errorType: 'NO_CODE_PRODUCED', errorMessage: 'AI responded conversationally instead of generating code. Please retry your request.' };
                jobStatus = "failed";
                terminalReason = "no_code_produced";
                emitEvent('error', { code: 'NO_CODE_PRODUCED', message: 'AI did not generate any code. Please try again.' });
              }
            }

            if (codeResult) {
              // ═══════════════════════════════════════════════════════
              // SINGLE AUTHORITY VALIDATION
              // If SUMMARY phase already parsed, validated, repaired,
              // and emitted files, use that canonical result.
              // Do NOT re-derive from raw === CODE === section.
              // ═══════════════════════════════════════════════════════
              let isMultiFileJson = false;
              let mergedAppContent: string | null = null;
              
              if (summaryValidated && lastMergedFiles) {
                // ✅ SUMMARY already validated — use canonical merged files
                isMultiFileJson = true;
                const appKey = Object.keys(lastMergedFiles).find(k => 
                  k === '/App.tsx' || k === 'App.tsx' || k.endsWith('/App.tsx')
                );
                mergedAppContent = appKey ? lastMergedFiles[appKey] : null;
                console.log(`[Job ${jobId}] GATE 1: Using SUMMARY-validated files (${Object.keys(lastMergedFiles).length} files, summaryValidated=true)`);
              } else {
                // Fallback: SUMMARY didn't fire (legacy single-file or parse failure)
                try {
                  const parsedResult = JSON.parse(codeResult);
                  if (parsedResult && typeof parsedResult === 'object' && parsedResult.files) {
                    isMultiFileJson = true;
                    const deltaFiles: Record<string, string> = parsedResult.files;
                    const existingFiles: Record<string, string> = projectFiles && typeof projectFiles === 'object'
                      ? projectFiles as Record<string, string>
                      : {};
                    const mergedFiles = { ...existingFiles, ...deltaFiles };
                    const appKey = Object.keys(mergedFiles).find(k => 
                      k === '/App.tsx' || k === 'App.tsx' || k.endsWith('/App.tsx')
                    );
                    mergedAppContent = appKey ? mergedFiles[appKey] : null;
                    console.log(`[Job ${jobId}] GATE 1 FALLBACK: Re-merged ${Object.keys(deltaFiles).length} delta + ${Object.keys(existingFiles).length} existing`);
                  }
                } catch {
                  // ZERO-TRUST: codeResult is not valid JSON — fail explicitly
                  console.error(`[Job ${jobId}] ZERO-TRUST GATE: codeResult is not valid JSON. Failing job.`);
                  validationError = { errorType: 'CORRUPT_JSON_OUTPUT', errorMessage: 'AI returned non-JSON output that cannot be committed as files. Please retry.' };
                  jobStatus = "failed";
                  terminalReason = "corrupt_json_output";
                  validationReport.truncation_detected = true;
                }
              }
              
              // Choose what to validate
              const contentToValidate = isMultiFileJson
                ? (mergedAppContent || '')
                : codeResult;
              
              const diagnostics = {
                intent: intentResult.intent,
                promptLength: prompt.length,
                codeContextLength: currentCode?.length ?? 0,
                generatedLength: codeResult.length,
                isMultiFileJson,
                summaryValidated,
                hasExportDefault: /export\s+default\s/.test(contentToValidate),
                bracketBalance: (contentToValidate.match(/[({[]/g) ?? []).length - (contentToValidate.match(/[)\]}]/g) ?? []).length,
              };
              console.log(`[Job ${jobId}] VALIDATION_INPUT:`, JSON.stringify(diagnostics));

              // GATE 1: Structural validation
              // If summaryValidated=true AND we have a valid App.tsx → lightweight check only
              // If summaryValidated=true AND no App.tsx → skip entirely (SUMMARY already approved)
              let structuralError: { type: string; message: string } | null = null;
              
              if (summaryValidated && lastMergedFiles) {
                // SUMMARY already parsed + repaired + emitted. Trust it.
                if (mergedAppContent) {
                  // Lightweight: only check export default on the canonical App.tsx
                  const hasExport = /export\s+default\s/.test(mergedAppContent);
                  if (!hasExport) {
                    console.warn(`[Job ${jobId}] GATE 1 WARN: SUMMARY-validated App.tsx missing export default — allowing (SUMMARY is authority)`);
                  }
                  // Do NOT fail — SUMMARY already validated and emitted successfully
                  console.log(`[Job ${jobId}] GATE 1 PASS: SUMMARY-validated, App.tsx present`);
                } else {
                  console.log(`[Job ${jobId}] GATE 1 PASS: SUMMARY-validated, no App.tsx in project (partial edit)`);
                }
              } else if (isMultiFileJson && mergedAppContent) {
                structuralError = getValidationError(mergedAppContent, intentResult.intent);
              } else if (isMultiFileJson && !mergedAppContent) {
                if (codeResult.trim().length < 50) {
                  structuralError = { type: "MODEL_EMPTY_RESPONSE", message: "AI returned no usable code. Please retry." };
                } else {
                  console.log(`[Job ${jobId}] GATE 1 SKIP: Multi-file partial edit without App.tsx — export check bypassed`);
                }
              } else {
                structuralError = getValidationError(codeResult, intentResult.intent);
              }
              
              if (structuralError) {
                emitEvent('error', { code: structuralError.type, message: structuralError.message });
                validationError = { errorType: structuralError.type, errorMessage: structuralError.message };
                jobStatus = "failed";
                terminalReason = structuralError.type.toLowerCase();
                validationReport.truncation_detected = true;
                console.error(`[Job ${jobId}] GATE 1 FAIL: ${structuralError.type}`);
              }

              // GATE 2: No-op detection
              if (!validationError && !isMultiFileJson && isNoOp(currentCode, codeResult)) {
                validationReport.no_op_detected = true;
                console.warn(`[Job ${jobId}] GATE 2 WARN: No-op detected`);
              }

              // GATE 3: Intent validation
              // Skip for FIX/micro-edit — the 3000-char window is unreliable for detecting fixes
              // Also skip for multi-file partial edits (delta alone is misleading for intent check)
              const isMicro = detectMicroEdit(prompt, Boolean(currentCode?.trim()));
              const skipIntentCheck = intentResult.intent === "FIX" || isMicro || isMultiFileJson;
              if (!validationError && !skipIntentCheck) {
                try {
                  const intentCheck = await validateIntent(prompt, codeResult, GOOGLE_GEMINI_API_KEY);
                  validationReport.intent_ok = intentCheck.implements_request;
                  
                  if (!intentCheck.implements_request) {
                    console.warn(`[Job ${jobId}] GATE 3 FAIL: Intent check failed`);
                    await supabase
                      .from("ai_generation_jobs")
                      .update({ intent_check_attempts: 1 })
                      .eq("id", jobId);
                    jobStatus = "needs_user_action";
                    terminalReason = "intent_check_failed";
                    validationReport.missing_requirements = intentCheck.missing_requirements;
                  }
                } catch (e) {
                  console.warn(`[Job ${jobId}] Intent validation error (non-fatal):`, e);
                }
              } else if (skipIntentCheck) {
                validationReport.intent_ok = true;
                console.log(`[Job ${jobId}] GATE 3 SKIP: ${intentResult.intent} intent / micro-edit / multi-file — bypassing intent check`);
              }
            }

            validationReport.terminal_reason = terminalReason;

            if (codeResult && summary && !validationError && jobStatus === "completed") {
              try {
                const dataCheck = await checkDataAvailability(supabase, userId, prompt);
                if (dataCheck && (dataCheck.needsSubscriptionPlans || dataCheck.needsProducts)) {
                  const guidance = generateDataGuidance(dataCheck);
                  if (guidance) summary = summary + guidance;
                }
              } catch (e) {
                console.warn(`[Job ${jobId}] Data check failed:`, e);
              }
            }

            // ZERO-TRUST Recovery Save — ONLY from validated file maps, never raw text
            if (codeResult && !validationError && jobStatus === "completed") {
              const { data: jobData } = await supabase
                .from("ai_generation_jobs")
                .select("project_id")
                .eq("id", jobId)
                .single();
              if (jobData?.project_id) {
                // ONLY use SUMMARY-validated files or parsed JSON file maps
                let filesWrapper: Record<string, string> | null = null;
                
                if (summaryValidated && lastMergedFiles) {
                  filesWrapper = lastMergedFiles;
                  console.log(`[Job ${jobId}] Recovery save: using SUMMARY-validated files (${Object.keys(filesWrapper).length} files)`);
                } else {
                  // Try to parse codeResult as JSON file map — NO raw text fallback
                  try {
                    const parsed = JSON.parse(codeResult);
                    if (parsed && typeof parsed === 'object' && parsed.files && typeof parsed.files === 'object') {
                      // Validate all values are strings (Layer 3)
                      const allStrings = Object.values(parsed.files).every((v: unknown) => typeof v === 'string');
                      if (allStrings && Object.keys(parsed.files).length > 0) {
                        const existingFiles: Record<string, string> = projectFiles && typeof projectFiles === 'object'
                          ? projectFiles as Record<string, string>
                          : {};
                        filesWrapper = { ...existingFiles, ...parsed.files };
                      }
                    }
                  } catch {
                    // Not valid JSON — DO NOT wrap raw text as App.tsx
                    console.error(`[Job ${jobId}] ZERO-TRUST: codeResult is not valid JSON file map. Skipping DB persist.`);
                  }
                }
                
                if (filesWrapper && Object.keys(filesWrapper).length > 0) {
                  await supabase.from("vibecoder_projects").update({ files: filesWrapper }).eq("id", jobData.project_id);
                  await supabase.from("project_versions").insert({
                    project_id: jobData.project_id,
                    files_snapshot: filesWrapper,
                    version_label: "Manual Recovery Save",
                  });
                } else {
                  console.error(`[Job ${jobId}] ZERO-TRUST: No valid file map to persist. Skipping recovery save.`);
                }
              }
            }

            // Finalize Job Status
            const updatePayload: Record<string, unknown> = {
              status: jobStatus,
              completed_at: new Date().toISOString(),
              code_result: (validationError || jobStatus !== "completed") ? null : codeResult,
              summary: summary?.slice(0, 8000),
              plan_result: planResult,
              validation_report: validationReport,
              terminal_reason: terminalReason,
              progress_logs: validationError
                ? ["Starting AI generation...", "Processing response...", `⚠️ ${validationError.errorType}`]
                : jobStatus === "needs_user_action"
                ? ["Starting AI generation...", "Processing response...", "⚠️ Intent check failed — user action needed"]
                : ["Starting AI generation...", "Processing response...", "✅ All validation gates passed"],
            };

            if (validationError) {
              updatePayload.error_message = JSON.stringify({
                type: validationError.errorType,
                message: validationError.errorMessage,
              });
            }

            await supabase.from("ai_generation_jobs").update(updatePayload).eq("id", jobId);
            console.log(`[Job ${jobId}] Job ${jobStatus} | Reason: ${terminalReason}`);
          }
        } catch (e) {
          console.error("Stream processing error:", e);
          emitEvent('error', { code: "STREAM_ERROR", message: e instanceof Error ? e.message : 'Stream error' });

          // If job-backed, mark as failed
          if (jobId) {
            await supabase
              .from("ai_generation_jobs")
              .update({
                status: "failed",
                completed_at: new Date().toISOString(),
                error_message: e instanceof Error ? e.message : "Unknown error",
                progress_logs: ["Starting AI generation...", "Error occurred", e instanceof Error ? e.message : "Unknown error"],
              })
              .eq("id", jobId);
          }
        } finally {
          clearInterval(heartbeatInterval);
          clearTimeout(streamTimeout);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("vibecoder-v2 error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
