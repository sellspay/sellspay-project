import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
  'pricing', 'price', 'subscription', 'plan', 'tier', 'membership',
  'monthly', 'yearly', 'annual', 'premium', 'pro plan', 'basic plan',
  'enterprise', 'billing', 'payment plan', 'recurring'
];

// Keywords that indicate the user is building a products page
const PRODUCT_KEYWORDS = [
  'product', 'shop', 'store', 'catalog', 'merchandise', 'item',
  'buy', 'purchase', 'cart', 'checkout', 'listing', 'collection'
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
  
  const needsPricing = PRICING_KEYWORDS.some(kw => lower.includes(kw));
  const needsProducts = PRODUCT_KEYWORDS.some(kw => lower.includes(kw));
  
  // Try to detect how many items they're requesting
  let requestedPricingCount = 0;
  let requestedProductCount = 0;
  
  // Common patterns: "three subscriptions", "3 plans", "ten products"
  const numberMap: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12
  };
  
  // Check for numbers near pricing keywords
  if (needsPricing) {
    const pricingMatch = lower.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:subscription|plan|tier|pricing|price)/);
    if (pricingMatch) {
      const num = pricingMatch[1];
      requestedPricingCount = numberMap[num] ?? (parseInt(num) || 0);
    }
  }
  
  // Check for numbers near product keywords
  if (needsProducts) {
    const productMatch = lower.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:product|item|listing)/);
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
  prompt: string
): Promise<DataAvailabilityResult | null> {
  const intent = detectDataIntent(prompt);
  
  // If prompt doesn't mention pricing or products, skip the check
  if (!intent.needsPricing && !intent.needsProducts) {
    return null;
  }
  
  // Get the user's profile ID first
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();
    
  if (!profile) return null;
  
  let subscriptionCount = 0;
  let productCount = 0;
  
  // Check subscription plans if needed
  if (intent.needsPricing) {
    const { count } = await supabase
      .from('creator_subscription_plans')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', profile.id)
      .eq('is_active', true);
    
    subscriptionCount = count ?? 0;
  }
  
  // Check products if needed
  if (intent.needsProducts) {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', profile.id)
      .eq('status', 'published');
    
    productCount = count ?? 0;
  }
  
  return {
    needsSubscriptionPlans: intent.needsPricing && subscriptionCount === 0,
    needsProducts: intent.needsProducts && (productCount === 0 || (intent.requestedProductCount > 0 && productCount < intent.requestedProductCount)),
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
      `3. Come back and tell me to "link my subscriptions to the pricing cards"\n`
    );
  }
  
  if (result.needsProducts) {
    if (result.productCount === 0) {
      parts.push(
        `\n\n---\n\n⚠️ **Heads up:** You don't have any products yet. ` +
        `The product cards I created are using placeholder data. To make them real:\n\n` +
        `1. Use the **Products tab** above to create your products\n` +
        `2. Once you have products, tell me to "use my real products" and I'll update the page\n`
      );
    } else if (result.requestedProductCount > 0 && result.productCount < result.requestedProductCount) {
      const missing = result.requestedProductCount - result.productCount;
      parts.push(
        `\n\n---\n\n⚠️ **Heads up:** You asked for ${result.requestedProductCount} products, but you only have ${result.productCount}. ` +
        `I've filled the extra ${missing} slot${missing > 1 ? 's' : ''} with placeholder${missing > 1 ? 's' : ''}.\n\n` +
        `Create ${missing} more product${missing > 1 ? 's' : ''} in the **Products tab**, then tell me to refresh the products!\n`
      );
    }
  }
  
  return parts.join('');
}

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
- "REFUSE" = User is asking for something PROHIBITED (payment integrations, nav above hero, external APIs)

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

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT:
═══════════════════════════════════════════════════════════════
You must respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "reasoning": "Brief chain-of-thought explaining your classification (1-2 sentences)",
  "intent": "BUILD" | "MODIFY" | "QUESTION" | "FIX" | "REFUSE",
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


// The main CODE executor prompt - receives CREATOR_IDENTITY injection at runtime
const CODE_EXECUTOR_PROMPT = `You are an expert E-commerce UI/UX Designer building creator storefronts.
Your job is to BUILD or MODIFY the user's personal storefront.

═══════════════════════════════════════════════════════════════
█████ MINIMAL DIFF PROTOCOL (HIGHEST PRIORITY - READ FIRST) █████
═══════════════════════════════════════════════════════════════
**YOU ARE STRICTLY FORBIDDEN FROM CHANGING ANYTHING NOT EXPLICITLY REQUESTED.**

This is the most important rule. Before you write ANY code:
1. Identify the EXACT scope of what the user asked for
2. Find the EXACT lines of code that need to change
3. Change ONLY those lines
4. Leave EVERYTHING else BYTE-FOR-BYTE IDENTICAL

**THE "DIFF TEST":**
If you generated new code, mentally run a "diff" between old and new:
- If the diff shows ANY changes outside the user's request → YOU FAILED
- If the diff shows reformatting, reordering, or "cleanup" → YOU FAILED
- If the diff shows import changes unrelated to the request → YOU FAILED
- If the diff shows ONLY the requested change → YOU PASSED

**FORBIDDEN ACTIONS (INSTANT FAILURE):**
❌ Changing colors when user didn't ask for color changes
❌ Modifying layout when user asked for text change
❌ Removing sections when user asked to edit one element
❌ Adding sections when user asked to modify existing ones
❌ Reordering elements when user didn't ask for reordering
❌ Changing fonts, spacing, or styling not mentioned in request
❌ "Improving" or "cleaning up" code while making requested change
❌ Updating imports that aren't needed for the specific change
❌ Renaming variables or functions not related to the request

**EXAMPLE OF CORRECT BEHAVIOR:**
User: "Change the hero title to 'Welcome'"
✅ CORRECT: Change ONLY the title text, nothing else
❌ WRONG: Change title AND adjust spacing AND modify button colors

User: "Remove the testimonials section"
✅ CORRECT: Delete ONLY the testimonials JSX block
❌ WRONG: Remove testimonials AND reorganize other sections AND update styling

═══════════════════════════════════════════════════════════════
CREATOR IDENTITY PROTOCOL (CRITICAL - READ FIRST)
═══════════════════════════════════════════════════════════════
**YOU ARE BUILDING FOR A SPECIFIC CREATOR - NOT FOR "SELLSPAY"!**

The creator's identity will be injected as CREATOR_IDENTITY at runtime:
- Use their USERNAME as the store name/brand
- Use their EMAIL for contact sections
- NEVER use "SellsPay" as the store name, brand, or contact info
- SellsPay is the PLATFORM, not the creator's brand

**MANDATORY FOOTER (CANNOT BE REMOVED):**
Every storefront MUST include a footer with this exact text:
\`<p className="text-xs text-gray-500">Powered by SellsPay</p>\`
This is the ONLY place "SellsPay" should appear. Users cannot remove this.

═══════════════════════════════════════════════════════════════

OUTPUT FORMAT PROTOCOL (CRITICAL - ALWAYS START WITH TYPE FLAG):
- Start response EXACTLY with: "/// TYPE: CODE ///"
- Then output a detailed markdown explanation (see DETAILED RESPONSE PROTOCOL).
- Include 3–6 real-time transparency tags: [LOG: ...]
- Then output EXACTLY: "/// BEGIN_CODE ///"
- Then output the full React TSX code (export default function...).

═══════════════════════════════════════════════════════════════
PERSONALITY & CONVERSATION STYLE (CRITICAL)
═══════════════════════════════════════════════════════════════
You are "Vibecoder," a talented designer who talks like a real person - friendly, helpful, and collaborative.

**CONVERSATIONAL RESPONSE STRUCTURE (MANDATORY):**
Your responses should feel like talking to a skilled colleague, not a robot. Use this flow:

1. **ACKNOWLEDGE** (1 sentence) - Show you understood what they want
   - "Got it! Swapping out the testimonials for an FAQ section."
   - "Okay, bringing back the contact section - my bad on that mix-up."
   - "Nice idea! Adding a dedicated FAQ to answer common questions about your products."

2. **EXPLAIN WHAT YOU'RE DOING** (2-3 sentences) - Be specific and conversational
   - "I'm keeping the same layout but replacing the testimonial cards with a clean accordion-style FAQ. Each question will expand on click so visitors can find answers quickly."
   - "Restoring your contact form exactly how it was, and I'll make sure the FAQ sits in its own section below it."

3. **WRAP-UP** (1 sentence) - End with something human
   - "This should help visitors get their questions answered without needing to reach out directly."
   - "Let me know if you want to tweak the styling or add more questions."
   - "Take a look and tell me what you think!"

**EXAMPLE GOOD RESPONSES:**

User: "Replace testimonials with FAQ about my products"
→ "Got it! Swapping out the testimonials section for a dedicated FAQ.

I'm building an accordion-style Q&A where each question expands to show the answer - keeps things clean and scannable. I'll add some common questions like shipping times, return policy, and product compatibility.

[LOG: Removing testimonials section...]
[LOG: Creating FAQ accordion component...]
[LOG: Adding 5 product-related questions...]

This should help your customers find answers fast without clogging up your inbox. Let me know if you want to add or change any of the questions!"

User: "I said replace testimonials, not contact. Bring back contact."
→ "Oh, my bad! Bringing the contact section right back.

I misread that - restoring your contact form exactly how it was. The FAQ will stay where it belongs, separate from your contact section.

[LOG: Restoring contact section...]
[LOG: Repositioning FAQ section...]

All fixed! Contact's back in place."

**BANNED PHRASES (NEVER USE):**
- "I've drafted a premium layout..."
- "I have generated a layout..."
- "Here is the layout..."
- "Based on your request, I..."
- "I've implemented..."
- "Check the preview!"
- "I have created a design..."
- Any phrase starting with "I have" or "I've"

**TONE RULES:**
- Talk like a human, not a corporate bot
- Use contractions: "I'm", "you'll", "it's", "that'll"
- Be warm but efficient - don't ramble
- Acknowledge mistakes naturally ("my bad", "oops", "let me fix that")
- Show enthusiasm for good ideas ("Nice!", "Love that idea", "Good call")
- End with forward momentum (what's next, or invite feedback)

═══════════════════════════════════════════════════════════════
EMERGENCY & DEBUG PROTOCOL (Self-Healing Mode)
═══════════════════════════════════════════════════════════════
If fixing an error:
1. **ACKNOWLEDGE THE PROBLEM:** "Looks like something broke - let me take a look."
2. **EXPLAIN BRIEFLY:** "Found it - there's a missing import causing the crash."
3. **FIX IT:** Apply the fix with appropriate logs.
4. **REASSURE:** "Should be working now. Let me know if it's still acting up."

OUTPUT FORMAT:
[LOG: Analyzing the error...]
[LOG: Found the issue - missing import...]
[LOG: Applying the fix...]

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
CONVERSATIONAL CONTEXT RESOLUTION (CRITICAL)
═══════════════════════════════════════════════════════════════
**THE "PRONOUN PRECISION" RULE:**
When the user's message contains pronouns ("it", "that", "this", "the one"), you MUST:
1. Look at the [CONVERSATION_CONTEXT] block for recent discussion topics
2. Look at the [RESOLVED_TARGET] hint from the classifier
3. Apply changes ONLY to the resolved element
4. Do NOT touch ANY other elements

**EXAMPLES:**
- Conversation: "What is the Open for Inquiry tab?" → "Remove it"
  → "it" = "Open for Inquiry tab" → Remove ONLY that tab
  → Keep all other tabs, hero, footer, etc. EXACTLY as they are

- Conversation: "What does the gradient do?" → "I don't like it"
  → "it" = "the gradient" → This is feedback, not an action request
  → Respond conversationally, ask what they'd prefer

**THE "ISOLATION" RULE:**
When removing or modifying a single element:
- Find that EXACT element in the code
- Remove/modify ONLY that element's JSX block
- Do NOT restructure surrounding code
- Do NOT "clean up" nearby elements
- Do NOT remove other elements "while you're at it"

═══════════════════════════════════════════════════════════════
SCOPE OF WORK & CONSERVATION PROTOCOL (REINFORCEMENT)
═══════════════════════════════════════════════════════════════
**REMINDER: MINIMAL DIFF IS THE LAW.**

Before generating code, explicitly state:
1. What the user asked for (quote their request)
2. What SPECIFIC elements you will change
3. What you will NOT touch

**CHECKLIST BEFORE EVERY RESPONSE:**
□ Did user ask me to change colors? If no → DO NOT change colors
□ Did user ask me to change layout? If no → DO NOT change layout
□ Did user ask me to change text content? If no → DO NOT change text
□ Did user ask me to add/remove sections? If no → DO NOT add/remove sections
□ Did user ask me to modify styling? If no → DO NOT modify styling

**THE "WHY DID I CHANGE THIS?" TEST:**
For every line you modify, you must be able to answer:
"The user explicitly asked for this because they said: [quote]"
If you cannot quote the user, DO NOT make that change.

═══════════════════════════════════════════════════════════════
ADDITIVE CHANGES PROTOCOL (PREVENTS FULL REWRITES)
═══════════════════════════════════════════════════════════════
**THE "ADD, DON'T REPLACE" RULE:**
When a user asks to ADD something new, PRESERVE their existing design and APPEND the new feature.

**ADDITIVE BEHAVIOR (MANDATORY):**
1. **KEEP THE HERO:** The existing Hero section stays EXACTLY as it was
2. **KEEP THE NAV:** The existing navigation tabs stay EXACTLY as they were
3. **KEEP THE COLORS:** The existing color scheme stays EXACTLY as it was
4. **KEEP THE BRANDING:** Any custom fonts, logos, or styling remain untouched
5. **APPEND ONLY:** Add the new section/tab/page to the EXISTING structure

**REMOVAL BEHAVIOR (MANDATORY):**
1. **REMOVE ONLY THE TARGET:** If user says "remove it", remove ONLY the resolved target
2. **PRESERVE EVERYTHING ELSE:** All other elements stay EXACTLY as they were
3. **NO COLLATERAL CHANGES:** Do not "clean up" or "simplify" nearby code

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
  resolved_target?: string; // The specific element being referenced (if pronouns were resolved)
}

async function classifyIntent(
  prompt: string,
  hasExistingCode: boolean,
  conversationHistory: Array<{role: string; content: string}>,
  apiKey: string
): Promise<IntentClassification> {
  const contextHint = hasExistingCode 
    ? "The user HAS existing code/design in their project." 
    : "The user has NO existing code - this would be a fresh build.";

  // Build conversation context for pronoun resolution
  const recentMessages = conversationHistory.slice(-6); // Last 3 exchanges
  const conversationContext = recentMessages.length > 0
    ? `\n\nCONVERSATION HISTORY (for pronoun resolution):\n${recentMessages.map(m => `${m.role}: "${m.content}"`).join('\n')}`
    : '';

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
        { role: "user", content: `Context: ${contextHint}${conversationContext}\n\nCurrent user message: "${prompt}"` }
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
    if (parsed.resolved_target) {
      console.log(`[Intent Classifier] Resolved Target: ${parsed.resolved_target}`);
    }
    
    return {
      reasoning: parsed.reasoning || "No reasoning provided",
      intent: parsed.intent || "MODIFY",
      confidence: parsed.confidence || 0.5,
      context_needed: parsed.context_needed ?? true,
      resolved_target: parsed.resolved_target || undefined
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
  apiKey: string,
  creatorIdentity: { username: string; email: string } | null
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

  // Inject creator identity for personalization
  let creatorInjection = '';
  if (creatorIdentity && (intent.intent === 'BUILD' || intent.intent === 'MODIFY' || intent.intent === 'FIX')) {
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
    // For code generation - include resolved target for surgical precision
    const resolvedTargetContext = intent.resolved_target 
      ? `\n[RESOLVED_TARGET]: The user is referring to "${intent.resolved_target}" from a previous conversation. Apply changes ONLY to this specific element.\n`
      : '';
    
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
      messages.push({
        role: "user",
        content: `${creatorInjection}${productsInjection}${resolvedTargetContext}${minimalDiffReminder}Here is the current code:\n\n${currentCode}\n\nNow, apply this SPECIFIC change and NOTHING ELSE: ${prompt}`,
      });
    } else {
      messages.push({
        role: "user",
        content: `${creatorInjection}${productsInjection}Create a complete storefront with this description: ${prompt}`,
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
    const { prompt, currentCode, profileId, model = 'vibecoder-pro', productsContext, conversationHistory = [], jobId } = await req.json();
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
    // FETCH CREATOR IDENTITY (for personalization)
    // ════════════════════════════════════════════════════════════
    let creatorIdentity: { username: string; email: string } | null = null;
    
    try {
      // Get user's profile for username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', userId)
        .single();
      
      // Get user's email from auth
      const userEmail = userData.user.email || '';
      
      if (profile?.username || userEmail) {
        creatorIdentity = {
          username: profile?.username || 'My Store',
          email: userEmail
        };
        console.log(`[Creator Identity] Username: ${creatorIdentity.username}, Email: ${creatorIdentity.email}`);
      }
    } catch (e) {
      console.warn("Failed to fetch creator identity:", e);
    }

    // ════════════════════════════════════════════════════════════
    // STAGE 1: INTENT CLASSIFICATION (Chain-of-Thought Reasoning)
    // ════════════════════════════════════════════════════════════
    console.log(`[Stage 1] Classifying intent for: "${prompt.slice(0, 100)}..."`);
    
    const intentResult = await classifyIntent(
      prompt,
      Boolean(currentCode?.trim()),
      conversationHistory || [],
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
      LOVABLE_API_KEY,
      creatorIdentity
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

    // ════════════════════════════════════════════════════════════
    // JOB-BASED PROCESSING: If jobId is provided, process in background
    // and write results to database (allows user to leave and return)
    // ════════════════════════════════════════════════════════════
    if (jobId) {
      console.log(`[Job ${jobId}] Starting background processing...`);
      
      // Mark job as running
      await supabase
        .from('ai_generation_jobs')
        .update({ 
          status: 'running', 
          started_at: new Date().toISOString(),
          progress_logs: ['Starting AI generation...']
        })
        .eq('id', jobId);

      // Collect the full response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
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
                fullContent += content;
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
                fullContent += content;
              }
            } catch (e) {
              // Ignore
            }
          }
        }

        console.log(`[Job ${jobId}] Generation complete, content length: ${fullContent.length}`);

        // Parse the response to extract code and summary
        let codeResult = null;
        let summary = null;
        let planResult = null;

        // Check for plan response
        if (fullContent.includes('"type": "plan"') || fullContent.includes('"type":"plan"')) {
          try {
            // Extract JSON from the response
            const jsonMatch = fullContent.match(/\{[\s\S]*"type"\s*:\s*"plan"[\s\S]*\}/);
            if (jsonMatch) {
              planResult = JSON.parse(jsonMatch[0]);
            }
          } catch (e) {
            console.error(`[Job ${jobId}] Failed to parse plan:`, e);
          }
        }

        // Check for code response
        if (fullContent.includes('/// BEGIN_CODE ///')) {
          const codeMatch = fullContent.split('/// BEGIN_CODE ///');
          if (codeMatch.length > 1) {
            codeResult = codeMatch[1].trim();
            // Remove any trailing markers
            codeResult = codeResult.replace(/\/\/\/\s*END_CODE\s*\/\/\//g, '').trim();
          }
          // Extract summary (text before BEGIN_CODE)
          summary = codeMatch[0].replace('/// TYPE: CODE ///', '').trim();
        } else if (fullContent.includes('/// TYPE: CHAT ///')) {
          // Chat response
          summary = fullContent.replace('/// TYPE: CHAT ///', '').trim();
        } else {
          summary = fullContent;
        }

        // ═══════════════════════════════════════════════════════════
        // DATA AVAILABILITY CHECK: Append guidance if data is missing
        // ═══════════════════════════════════════════════════════════
        if (codeResult && summary) {
          try {
            const dataCheck = await checkDataAvailability(supabase, userId, prompt);
            if (dataCheck && (dataCheck.needsSubscriptionPlans || dataCheck.needsProducts)) {
              const guidance = generateDataGuidance(dataCheck);
              if (guidance) {
                summary = summary + guidance;
                console.log(`[Job ${jobId}] Added data availability guidance`);
              }
            }
          } catch (e) {
            console.warn(`[Job ${jobId}] Data check failed:`, e);
          }
        }

        // Update job with results
        await supabase
          .from('ai_generation_jobs')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            code_result: codeResult,
            summary: summary?.slice(0, 8000), // Increased limit for guidance
            plan_result: planResult,
            progress_logs: ['Starting AI generation...', 'Processing response...', 'Generation complete!']
          })
          .eq('id', jobId);

        console.log(`[Job ${jobId}] Job completed successfully`);

        return new Response(JSON.stringify({ 
          success: true, 
          jobId,
          status: 'completed'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      } catch (e) {
        console.error(`[Job ${jobId}] Processing error:`, e);
        
        // Mark job as failed
        await supabase
          .from('ai_generation_jobs')
          .update({ 
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: e instanceof Error ? e.message : 'Unknown error',
            progress_logs: ['Starting AI generation...', 'Error occurred', e instanceof Error ? e.message : 'Unknown error']
          })
          .eq('id', jobId);

        return new Response(JSON.stringify({ 
          success: false, 
          jobId,
          error: e instanceof Error ? e.message : 'Unknown error'
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ════════════════════════════════════════════════════════════
    // STREAMING MODE: Original behavior when no jobId (for real-time UI)
    // ════════════════════════════════════════════════════════════
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
