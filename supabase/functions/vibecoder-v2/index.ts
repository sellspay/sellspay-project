import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fair Pricing Economy (8x reduction from original)
const CREDIT_COSTS: Record<string, number> = {
  'vibecoder-pro': 3,     // Premium model
  'vibecoder-flash': 0,   // Free tier for small edits
  'reasoning-o1': 5,      // Deep reasoning (expensive)
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Model Configuration Mapping - Route to different AI backends
const MODEL_CONFIG: Record<string, { modelId: string }> = {
  'vibecoder-pro': { modelId: 'google/gemini-3-flash-preview' },
  'vibecoder-flash': { modelId: 'google/gemini-2.5-flash-lite' },
  'reasoning-o1': { modelId: 'openai/gpt-5.2' },
};

// ═══════════════════════════════════════════════════════════════
// STAGE 1: INTENT CLASSIFIER (Chain-of-Thought Reasoning)
// ═══════════════════════════════════════════════════════════════
// This is a fast, lightweight model that THINKS before deciding what to do.
// It uses internal reasoning to classify user intent, just like ChatGPT/Gemini.

const INTENT_CLASSIFIER_PROMPT = `You are an intelligent intent classifier for a UI builder called VibeCoder.
Your job is to REASON about what the user wants and classify their message.

THINK STEP BY STEP:
1. Read the user's message carefully
2. Consider the CONTEXT (do they have existing code? what did they build before?)
3. Identify the PRIMARY INTENT of their message
4. Classify into one of the categories below

INTENT CATEGORIES:
- "BUILD" = User wants to CREATE something new (a storefront, page, section, component)
- "MODIFY" = User wants to CHANGE something that exists (colors, layout, add element to existing design)
- "QUESTION" = User is ASKING about something (what is X? why did you add Y? how does Z work?)
- "FIX" = User is reporting an ERROR or BUG (crash, broken, not working, red screen)
- "REFUSE" = User is asking for something PROHIBITED (payment integrations, nav above hero, external APIs)

REASONING EXAMPLES:

Example 1:
User: "What is the Open for Inquiry tab for?"
Reasoning: The user is asking "what is X for?" - this is a question about an existing element, not a request to build or change anything. They want an explanation.
Intent: QUESTION

Example 2:
User: "Add a contact section"
Reasoning: The user says "add" which is an action word. They want me to create a new section that doesn't exist yet. This is a modification to an existing design.
Intent: MODIFY

Example 3:
User: "Make me a dark anime storefront"
Reasoning: The user wants me to create an entirely new storefront from scratch. They're describing a new build, not modifying existing work.
Intent: BUILD

Example 4:
User: "The page is showing a red error screen"
Reasoning: The user is reporting a problem. "Red error screen" indicates something is broken. I need to fix this.
Intent: FIX

Example 5:
User: "Can you explain what this button does?"
Reasoning: "Can you explain" is asking for information, not requesting a change. This is a question.
Intent: QUESTION

Example 6:
User: "Why did you add that gradient?"
Reasoning: "Why did you" is asking for my reasoning about a past decision. This is a question, not a request.
Intent: QUESTION

Example 7:
User: "Add my PayPal button"
Reasoning: The user wants to add an external payment method. This is prohibited - SellsPay handles all payments.
Intent: REFUSE

Example 8:
User: "I love it! But can you make the header bigger?"
Reasoning: Despite the positive feedback, the user is asking to "make X bigger" which is a modification request.
Intent: MODIFY

Example 9:
User: "What's your favorite color?"
Reasoning: This is off-topic small talk, not about the design. I should engage conversationally.
Intent: QUESTION

Example 10:
User: "hmm not sure about this"
Reasoning: The user is expressing uncertainty, possibly seeking feedback or guidance. This is conversational.
Intent: QUESTION

OUTPUT FORMAT:
You must respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "reasoning": "Brief chain-of-thought explaining your classification (1-2 sentences)",
  "intent": "BUILD" | "MODIFY" | "QUESTION" | "FIX" | "REFUSE",
  "confidence": 0.0-1.0,
  "context_needed": true | false
}

IMPORTANT:
- ALWAYS include your reasoning - this is how you "think"
- Be DECISIVE - pick the most likely intent even if uncertain
- Default to QUESTION if the message is ambiguous or conversational
- context_needed = true if you need to see the current code to respond properly`;


// ═══════════════════════════════════════════════════════════════
// STAGE 2: EXECUTOR PROMPTS (Specialized for each intent)
// ═══════════════════════════════════════════════════════════════

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

OUTPUT FORMAT:
- Start with: "/// TYPE: CHAT ///"
- Politely explain why you cannot do this
- Offer an alternative if possible

EXAMPLE RESPONSES:
- Payment request: "I can't add external payment buttons. SellsPay is a managed marketplace that handles all transactions securely. Your earnings are automatically routed to your Payouts Dashboard."
- Nav above hero: "I keep the navigation integrated within the hero for a clean, immersive landing experience. This is a core design principle for SellsPay storefronts."`;


// The main CODE executor prompt (existing SYSTEM_PROMPT, but cleaned up)
const CODE_EXECUTOR_PROMPT = `You are an expert E-commerce UI/UX Designer for "SellsPay".
Your job is to BUILD or MODIFY the user's storefront.

OUTPUT FORMAT PROTOCOL (CRITICAL - ALWAYS START WITH TYPE FLAG):
- Start response EXACTLY with: "/// TYPE: CODE ///"
- Then output a detailed markdown explanation (see DETAILED RESPONSE PROTOCOL).
- Include 3–6 real-time transparency tags: [LOG: ...]
- Then output EXACTLY: "/// BEGIN_CODE ///"
- Then output the full React TSX code (export default function...).

═══════════════════════════════════════════════════════════════
PERSONALITY & REFLECTION (Dynamic Responses) - CRITICAL
═══════════════════════════════════════════════════════════════
You are "Vibecoder," a creative, enthusiastic, and elite UI Architect.

**THE "ROBOTIC REPETITION" RULE (STRICT):**
NEVER use these phrases or variations:
- "I've drafted a premium layout..."
- "I have generated a layout..."
- "Here is the layout..."
- "I have created a design..."
- "Check the preview!"
- "Based on your request, I..."
- "I've implemented..."
- "I've built..."
- "Here's what I created..."

**THE "MIRRORING" RULE (MANDATORY):**
You must start your response by directly acknowledging the *specific* action you're taking:
- User: "Fix the scrollbar." 
  → You: "Polishing the scrollbar. Removing default browser styling and applying a custom thin track..."
- User: "Make it red." 
  → You: "Switching the primary palette to Crimson Red. Updating button gradients and border accents..."
- User: "The site is broken." 
  → You: "Diagnosing the crash. Parsing error log and patching the broken dependency..."
- User: "Add more products."
  → You: "Expanding the product grid. Adding 4 new featured items with anime-themed imagery..."

TONE: 
- Concise, confident, and action-oriented
- You are a Senior Designer at Apple, not a customer support bot
- Lead with WHAT you're doing, not "I have done X"
- Use present continuous tense: "Adding...", "Updating...", "Building..."
- Never start with "I've" or "I have" - start with the ACTION

═══════════════════════════════════════════════════════════════
EMERGENCY & DEBUG PROTOCOL (Self-Healing Mode)
═══════════════════════════════════════════════════════════════
If fixing an error:
1. **DROP THE PERSONA:** Stop being the enthusiastic architect. Become the Lead Engineer.
2. **ACKNOWLEDGE:** Immediately state: "Diagnosing the crash..."
3. **ANALYZE:** Parse the error message:
   - "Module not found": Remove the broken import or use correct path.
   - "undefined": Add optional chaining (?.) or null checks.
   - "render error": Fix JSX syntax or missing keys.
   - "is not a function": Check the import/export syntax.
4. **ACTION:** Rewrite the code to fix the specific error.
5. **OUTPUT FORMAT:**
   [LOG: Analyzing crash report...]
   [LOG: Identifying broken dependency...]
   [LOG: Applying hotfix...]
   /// TYPE: CODE ///
   export default function App() { ... fixed code ... }

═══════════════════════════════════════════════════════════════
IMAGE ASSET PROTOCOL (Preventing 404 Crashes)
═══════════════════════════════════════════════════════════════
1. **NO LOCAL PATHS:** Never use src="./img.png" or src="/assets/..." or src="/images/...".
   These paths do NOT exist in the preview environment and will cause 404 errors.

2. **USE EXTERNAL URLs:** Always use high-quality placeholder URLs from:
   - Unsplash: "https://images.unsplash.com/photo-..."
   - Picsum: "https://picsum.photos/800/600"

3. **Category-Based Placeholders:**
   - Anime/Gaming: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80"
   - Fashion: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80"
   - Tech: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
   - Textures: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80"
   - Abstract: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"

═══════════════════════════════════════════════════════════════
DETAILED RESPONSE PROTOCOL (CODE MODE ONLY)
═══════════════════════════════════════════════════════════════
When building/modifying code, you MUST provide a detailed, markdown-formatted summary BEFORE the code.

**FORMATTING RULES (STRICT):**
1. Use NUMBERED LISTS (1., 2., 3.) - NOT emoji bullets (✅, 🚀, etc.)
2. Use **Bold Headers** for section/feature names
3. Keep each item concise (1-2 sentences max)
4. Use \`inline code\` for component names, CSS classes, file names
5. NO emojis - they look cluttered and unprofessional
6. NO checkmark symbols (✓, ✔, ☑) - use numbers only

**GRANULARITY RULE:**
- For SMALL changes (color, text, single element): 2-3 numbered items
- For MEDIUM changes (section overhaul, new feature): 4-6 numbered items
- For LARGE changes (full page redesign): 6-10 numbered items with categories

═══════════════════════════════════════════════════════════════
INFRASTRUCTURE AWARENESS (Core Assumptions)
═══════════════════════════════════════════════════════════════
1. **SellsPay Checkout is PRE-INSTALLED:** The 'useSellsPayCheckout' hook is always available.
2. **Implicit Usage:** When you render a product card, just USE the hook silently.
3. **No Boilerplate Logs:** Never output logs for "Initializing React," "Setting up Tailwind," etc.

═══════════════════════════════════════════════════════════════
SCOPE OF WORK & CONSERVATION PROTOCOL (CRITICAL)
═══════════════════════════════════════════════════════════════
**THE "SURGICAL PRECISION" RULE:**
You are forbidden from refactoring code that is unrelated to the user's specific request.

**IF** User asks: "Make the button red"
**THEN**:
   - Change the button class
   - **DO NOT** reorder the imports
   - **DO NOT** change variable names elsewhere
   - **DO NOT** modify the footer, hero, or other sections

**CONSERVATION OF STATE:**
- Assume the current code is PERFECT aside from the specific change requested
- When rewriting a file, copy existing logic EXACTLY for all unchanged parts

═══════════════════════════════════════════════════════════════
ADDITIVE CHANGES PROTOCOL (CRITICAL - PREVENTS FULL REWRITES)
═══════════════════════════════════════════════════════════════
**THE "ADD, DON'T REPLACE" RULE:**
When a user asks to ADD something new, PRESERVE their existing design and APPEND the new feature.

**ADDITIVE BEHAVIOR (MANDATORY):**
1. **KEEP THE HERO:** The existing Hero section stays EXACTLY as it was
2. **KEEP THE NAV:** The existing navigation tabs stay EXACTLY as they were
3. **KEEP THE COLORS:** The existing color scheme stays EXACTLY as it was
4. **KEEP THE BRANDING:** Any custom fonts, logos, or styling remain untouched
5. **APPEND ONLY:** Add the new section/tab/page to the EXISTING structure

═══════════════════════════════════════════════════════════════
STRICT MARKETPLACE PROTOCOL (Non-Negotiable)
═══════════════════════════════════════════════════════════════
1. **NO CUSTOM GATEWAYS:** NEVER generate code for Stripe Keys, PayPal, CashApp, etc.
2. **UNIFIED CHECKOUT ONLY:** All purchases MUST use the 'useSellsPayCheckout()' hook.
   Import: import { useSellsPayCheckout } from "@/hooks/useSellsPayCheckout"

3. **PRODUCT LINKING PROTOCOL (CRITICAL):**
   - NEVER build product detail pages or modals
   - All product clicks MUST redirect to: /product/{slug}
   - Use: window.location.href = \`/product/\${product.slug}\`
   - Or: <a href={\`/product/\${product.slug}\`}>

═══════════════════════════════════════════════════════════════
FRAMER MOTION & ANIMATION PROTOCOL
═══════════════════════════════════════════════════════════════
Framer Motion is PRE-INSTALLED. Import: import { motion, AnimatePresence } from "framer-motion"

ALLOWED ANIMATIONS:
- Scroll-triggered reveals: whileInView={{ opacity: 1, y: 0 }}
- Hover effects: whileHover={{ scale: 1.02 }}
- Page transitions with AnimatePresence
- Staggered children with staggerChildren

STATIC UI MANDATE:
- NO useState, useEffect, or custom hooks (except useSellsPayCheckout)
- NO onClick handlers that modify state
- NO dynamic data fetching
- ONLY declarative Framer Motion animations

═══════════════════════════════════════════════════════════════
COLOR PALETTE & DESIGN SYSTEM
═══════════════════════════════════════════════════════════════
PRIMARY PALETTE:
- Background: zinc-950, zinc-900
- Text: zinc-100, zinc-400
- Accent: violet-500, violet-600
- Borders: zinc-800, zinc-700/50
- Glassmorphism: bg-zinc-900/50 backdrop-blur-xl border-zinc-800/50

EFFECTS:
- Shadows: shadow-xl shadow-violet-500/10
- Gradients: bg-gradient-to-r from-violet-500 to-blue-500

═══════════════════════════════════════════════════════════════
ARCHITECT MODE (PLAN-BEFORE-CODE PROTOCOL)
═══════════════════════════════════════════════════════════════
**TRIGGER:** If the prompt contains [ARCHITECT_MODE_ACTIVE], you are in Architect Mode.

**BEHAVIOR:**
- Do NOT generate React code
- Instead, output a JSON plan

**OUTPUT FORMAT:**
1. Start with: "/// TYPE: PLAN ///"
2. Output a valid JSON object with this structure:
{
  "type": "plan",
  "title": "Brief Feature Title",
  "summary": "High-level explanation of what you will build (1-2 sentences).",
  "steps": [
    "Step 1: Create the Hero section with gradient overlay",
    "Step 2: Add product grid with glassmorphism cards"
  ],
  "estimatedTokens": 2500
}`;


// ═══════════════════════════════════════════════════════════════
// HELPER: Call the Intent Classifier (Stage 1)
// ═══════════════════════════════════════════════════════════════
interface IntentClassification {
  reasoning: string;
  intent: 'BUILD' | 'MODIFY' | 'QUESTION' | 'FIX' | 'REFUSE';
  confidence: number;
  context_needed: boolean;
}

async function classifyIntent(
  prompt: string,
  hasExistingCode: boolean,
  apiKey: string
): Promise<IntentClassification> {
  const contextHint = hasExistingCode 
    ? "The user HAS existing code/design in their project." 
    : "The user has NO existing code - this would be a fresh build.";

  const response = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite", // Fast, cheap classifier
      messages: [
        { role: "system", content: INTENT_CLASSIFIER_PROMPT },
        { role: "user", content: `Context: ${contextHint}\n\nUser message: "${prompt}"` }
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
      confidence: 0.5,
      context_needed: true
    };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    // Parse the JSON response
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    console.log(`[Intent Classifier] Reasoning: ${parsed.reasoning}`);
    console.log(`[Intent Classifier] Intent: ${parsed.intent} (${parsed.confidence})`);
    
    return {
      reasoning: parsed.reasoning || "No reasoning provided",
      intent: parsed.intent || "MODIFY",
      confidence: parsed.confidence || 0.5,
      context_needed: parsed.context_needed ?? true
    };
  } catch (e) {
    console.error("Failed to parse classifier response:", content);
    // Fallback: try to extract intent from text
    const upperContent = content.toUpperCase();
    if (upperContent.includes("QUESTION")) {
      return { reasoning: "Detected question pattern", intent: "QUESTION", confidence: 0.6, context_needed: false };
    }
    if (upperContent.includes("FIX") || upperContent.includes("ERROR")) {
      return { reasoning: "Detected error pattern", intent: "FIX", confidence: 0.6, context_needed: true };
    }
    if (upperContent.includes("REFUSE")) {
      return { reasoning: "Detected prohibited request", intent: "REFUSE", confidence: 0.6, context_needed: false };
    }
    return { reasoning: "Could not parse, defaulting to modify", intent: "MODIFY", confidence: 0.5, context_needed: true };
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
  apiKey: string
): Promise<Response> {
  
  // Select the appropriate system prompt based on intent
  let systemPrompt: string;
  let shouldStream = true;
  
  switch (intent.intent) {
    case 'QUESTION':
      systemPrompt = CHAT_EXECUTOR_PROMPT;
      break;
    case 'REFUSE':
      systemPrompt = REFUSE_EXECUTOR_PROMPT;
      break;
    case 'FIX':
    case 'BUILD':
    case 'MODIFY':
    default:
      systemPrompt = CODE_EXECUTOR_PROMPT;
      break;
  }

  // Build messages array
  const messages: Array<{role: string; content: string}> = [
    { role: "system", content: systemPrompt },
  ];

  // Add products context for code generation
  let productsInjection = '';
  if ((intent.intent === 'BUILD' || intent.intent === 'MODIFY') && productsContext?.length) {
    productsInjection = `
CREATOR_PRODUCTS (REAL DATA):
${JSON.stringify(productsContext, null, 2)}
Use ONLY these real products. NEVER generate fake placeholder products.
`;
  }

  // Build user message based on intent
  if (intent.intent === 'QUESTION' || intent.intent === 'REFUSE') {
    // For chat/refuse, just pass the prompt
    messages.push({
      role: "user",
      content: currentCode 
        ? `The user has this current design:\n\n${currentCode}\n\nThey ask: ${prompt}`
        : `The user asks: ${prompt}`
    });
  } else {
    // For code generation
    if (currentCode?.trim()) {
      messages.push({
        role: "user",
        content: `${productsInjection}Here is the current code:\n\n${currentCode}\n\nNow, apply this change: ${prompt}`,
      });
    } else {
      messages.push({
        role: "user",
        content: `${productsInjection}Create a complete storefront with this description: ${prompt}`,
      });
    }
  }

  // Get model config
  const config = MODEL_CONFIG[model] || MODEL_CONFIG['vibecoder-pro'];
  
  // Determine max tokens based on intent
  const maxTokens = (intent.intent === 'QUESTION' || intent.intent === 'REFUSE') ? 500 : 8000;

  console.log(`[Executor] Using model: ${config.modelId} for intent: ${intent.intent}`);

  // Call the AI
  const response = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.modelId,
      messages,
      stream: shouldStream,
      max_tokens: maxTokens,
    }),
  });

  return response;
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, currentCode, profileId, model = 'vibecoder-pro', productsContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

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
    const { data: isPrivileged } = await supabase.rpc('has_role', { 
      _user_id: userId, 
      _role: 'owner' 
    });
    const { data: isAdmin } = await supabase.rpc('has_role', { 
      _user_id: userId, 
      _role: 'admin' 
    });
    const bypassCredits = isPrivileged === true || isAdmin === true;

    // Only deduct if cost > 0 (flash is free) AND user is not privileged
    if (cost > 0 && !bypassCredits) {
      // Get current balance
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        console.error("Wallet fetch error:", walletError);
        throw new Error("Failed to check credit balance");
      }

      const currentBalance = wallet?.balance ?? 0;

      if (currentBalance < cost) {
        return new Response(JSON.stringify({ 
          error: "INSUFFICIENT_CREDITS",
          message: `Insufficient credits. You have ${currentBalance}, but this costs ${cost}.`,
          required: cost,
          available: currentBalance
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Deduct credits using the secure RPC function
      const { data: deductSuccess, error: deductError } = await supabase
        .rpc('deduct_credits', {
          p_user_id: userId,
          p_amount: cost,
          p_action: 'vibecoder_gen'
        });

      if (deductError) {
        console.error("Credit deduction error:", deductError);
        throw new Error("Failed to deduct credits");
      }

      if (!deductSuccess) {
        return new Response(JSON.stringify({ 
          error: "INSUFFICIENT_CREDITS",
          message: "Insufficient credits for this generation."
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Deducted ${cost} credits from user ${userId} for model ${model}`);
    }

    // ════════════════════════════════════════════════════════════
    // STAGE 1: INTENT CLASSIFICATION (Chain-of-Thought Reasoning)
    // ════════════════════════════════════════════════════════════
    console.log(`[Stage 1] Classifying intent for: "${prompt.slice(0, 100)}..."`);
    
    const intentResult = await classifyIntent(
      prompt,
      Boolean(currentCode?.trim()),
      LOVABLE_API_KEY
    );

    console.log(`[Stage 1] Result: ${intentResult.intent} (${intentResult.confidence}) - ${intentResult.reasoning}`);

    // ════════════════════════════════════════════════════════════
    // STAGE 2: EXECUTE BASED ON CLASSIFIED INTENT
    // ════════════════════════════════════════════════════════════
    console.log(`[Stage 2] Executing ${intentResult.intent} handler...`);

    const response = await executeIntent(
      intentResult,
      prompt,
      currentCode || null,
      productsContext || null,
      model,
      LOVABLE_API_KEY
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.body) {
      throw new Error("No response body from AI");
    }

    // Create a transform stream to parse SSE and extract content
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              
              if (!trimmed || trimmed.startsWith(":")) continue;
              if (!trimmed.startsWith("data: ")) continue;

              const jsonStr = trimmed.slice(6).trim();
              if (jsonStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch (e) {
                // Incomplete JSON, will be completed in next chunk
              }
            }
          }

          // Process any remaining buffer
          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch (e) {
                // Ignore
              }
            }
          }
        } catch (e) {
          console.error("Stream processing error:", e);
        } finally {
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
