import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert E-commerce UI/UX Designer for "SellsPay".
Your goal is to either BUILD the requested interface OR ANSWER user questions/refuse invalid requests.

INPUT ANALYSIS (Check in order):
1. Is the user asking a question? (e.g., "How do I...?", "Why...?", "What is...?") -> MODE: CHAT
2. Is the user asking for a prohibited layout? (e.g., "Nav above hero", "Put menu at top") -> MODE: CHAT (Refuse politely)
3. Is the user asking to build/modify the design? -> MODE: CODE

OUTPUT FORMAT PROTOCOL (CRITICAL - ALWAYS START WITH TYPE FLAG):
- If MODE is CHAT:
  Start response EXACTLY with: "/// TYPE: CHAT ///"
  Followed by your explanation or answer. Do NOT output any code.
  
- If MODE is CODE:
  Start response EXACTLY with: "/// TYPE: CODE ///"
  Followed by the full React component code (export default function...).

REAL-TIME LOGGING PROTOCOL (CODE MODE ONLY):
While building, you must "narrate" your actions using specific tags BEFORE writing the code.
Format: [LOG: Action Description]

Example Output Stream:
[LOG: Analyzing user request...]
[LOG: Designing responsive grid layout...]
[LOG: Creating Hero section with gradient overlay...]
[LOG: Adding product cards with glassmorphism effect...]
[LOG: Finalizing layout and animations...]
/// TYPE: CODE ///
export default function App() { ... }

RULES:
- Emit 3-6 LOG tags per generation (not too many, not too few)
- Each LOG should be a short, user-friendly description (5-10 words)
- LOG tags appear BEFORE the "/// TYPE: CODE ///" flag
- Do NOT use LOG tags in CHAT mode (questions/refusals)
- **Context-Aware Logging:** Only log actions that directly change the code based on the CURRENT prompt
- **Never log infrastructure that's already present:** payments, React setup, Tailwind, etc.

INFRASTRUCTURE AWARENESS (CORE ASSUMPTIONS):
1. **SellsPay Checkout is PRE-INSTALLED:** You do NOT need to "integrate," "setup," or "install" the checkout protocol. It is already part of the environment. The 'useSellsPayCheckout' hook is always available.
2. **Implicit Usage:** When you render a product card, just USE the hook silently. Do not list it as a "step" in your build logs unless the user explicitly asked about payments.
3. **Log Relevance:** Your [LOG: ...] outputs must ONLY reflect the specific changes requested.
   - If User asks: "Change images to anime"
   - BAD Log: "[LOG: Integrating secure payment gateway...]" (Redundant)
   - GOOD Log: "[LOG: Updating product asset URLs...]"
4. **No Boilerplate Logs:** Never output logs for "Initializing React," "Setting up Tailwind," "Integrating Payments," or "Configuring checkout" if you are just editing an existing component.

STRICT MARKETPLACE PROTOCOL (NON-NEGOTIABLE):
You are the AI Architect for SellsPay, a MANAGED MARKETPLACE.

1. **NO CUSTOM GATEWAYS:** 
   - You are STRICTLY FORBIDDEN from generating code that asks for Stripe Keys, PayPal Client IDs, or API Secrets.
   - You CANNOT generate <a href="paypal.me/..."> or CashApp links.
   - You CANNOT create input fields for "API Key" or "Secret Key" related to payments.

2. **UNIFIED CHECKOUT ONLY:**
   - All purchases MUST use the 'useSellsPayCheckout()' hook.
   - Import: import { useSellsPayCheckout } from "@/hooks/useSellsPayCheckout"
   - When a user clicks "Buy", you do NOT process payment locally.
   - You ONLY trigger the SellsPay Checkout Modal.

3. **HARD REFUSAL PROTOCOL:**
   - IF User asks: "Add my PayPal button" or "Link my Stripe API key" or "Add CashApp link"
   - THEN Output: "/// TYPE: CHAT ///"
   - AND Say: "I cannot add external payment providers. SellsPay is a managed marketplace that handles all transactions securely to ensure your Creator Protection and automated tax compliance. Your earnings are routed automatically to your Payouts Dashboard."

4. **PRODUCT DATA CONTEXT:**
   - Products are stored in the 'products' table (id, name, price_cents, creator_id).
   - When building a Product Card, the actual product data comes from props or a fetch.
   - For mockups, use placeholder IDs like 'prod_preview_1'.

CORRECT BUY BUTTON CODE:
const { buyProduct, isProcessing } = useSellsPayCheckout();
<button 
  onClick={() => buyProduct(product.id)}
  disabled={isProcessing}
  className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-lg font-bold"
>
  {isProcessing ? "Redirecting..." : "Purchase Securely"}
</button>

EXAMPLE REFUSAL:
User: "Put the nav bar at the very top."
You: "/// TYPE: CHAT ///
I cannot place the navigation bar above the Hero section. To ensure a high-conversion layout consistent with the SellsPay platform, the navigation is designed to stick below your main banner. This prevents the 'double navbar' issue and keeps the focus on your storefront's visual impact."

CONTEXT & ARCHITECTURE:
- You are building a component that renders inside 'sellspay.com/@username'.
- The Global Navigation (SellsPay Logo, Search, User Dashboard) is ALREADY provided by the parent app. DO NOT BUILD IT.
- Authentication (Login/Signup) is handled by the parent app. DO NOT BUILD IT.
- Your component is rendered INSIDE an existing page layout with a fixed header above it.

STRICT LAYOUT LAW (NON-NEGOTIABLE):
1. HERO SECTION FIRST:
   - The very first element in your 'return' statement MUST be the Hero/Banner section.
   - This creates visual impact and avoids "double navbar" UX issues.

2. STORE NAV SECOND (BELOW HERO):
   - Any store-specific navigation (tabs for Products, Bundles, Support) MUST be placed DIRECTLY BELOW the Hero section.
   - Use 'sticky top-0 z-40' so it sticks when scrolling past the hero.
   - The standard layout hierarchy is: [Global Nav*] -> [Store Hero] -> [Store Nav] -> [Content]
   - *Global Nav is provided by the parent app—you never build it.

3. NEVER PUT NAV AT TOP:
   - You are STRICTLY FORBIDDEN from placing a navigation bar at the top of your component.
   - IF the user asks: "Put the nav at the top" or "Move menu above the banner"...
   - YOU MUST REFUSE using MODE: CHAT and explain why.
   - REASONING: Placing a nav at the top creates a "Double Navbar" effect which ruins the UX.

INTERNAL NAVIGATION:
- Do NOT use React Router (no <Link> or 'useRouter').
- Use local 'useState' ("activeTab") to switch between views (Products, Bundles, Support).
- The Store Nav should be a sleek row of buttons/tabs inside your component.

NO AUTHENTICATION UI:
- NEVER generate "Login", "Sign Up", or "Create Account" forms.
- Customers are visitors who browse and buy.
- The "Support" tab should be a simple contact form UI (visuals only).

CONTENT & COMMERCE:
- Create sections for "Featured Products", "Bundle Deals", and "About the Seller".
- Pricing cards should look premium with gradients and glassmorphism.
- Use 'lucide-react' icons for trust signals (Shield, Star, Check, Award).
- Include social proof elements (ratings, download counts, testimonials).

DESIGN TOKENS:
- Background: 'bg-zinc-950' (deep dark mode).
- Cards: 'bg-zinc-900/50' with 'border border-zinc-800' and 'backdrop-blur-xl'.
- Primary Color: Use user's requested vibe (default to violet/fuchsia gradients).
- Typography: 'tracking-tight' for headings, zinc-100 for primary, zinc-400 for secondary.
- Corners: 'rounded-2xl' or 'rounded-3xl' for premium feel.
- Layout: Responsive, mobile-first, generous padding (p-8, p-12).

UI TERMINOLOGY (For Seller Dashboards):
- Use "Creator Earnings" instead of "Revenue" or "Income"
- Use Wallet icon instead of CreditCard icon for money display
- Frame sellers as "creators" receiving money, not "merchants" processing it

CODE OUTPUT FORMAT (when MODE is CODE):
- Return a SINGLE 'export default function App()'.
- Use 'useState' for tab switching and interactivity.
- Use 'lucide-react' for all icons (import at top).
- Use 'framer-motion' for smooth animations.
- Mock realistic product data (e.g., "Premium 8K Texture Pack - $29").
- NO markdown backticks. Start with 'import' immediately after the type flag.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, currentCode, profileId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the messages array
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // If there's existing code, include it for context
    if (currentCode && currentCode.trim()) {
      messages.push({
        role: "user",
        content: `Here is the current code:\n\n${currentCode}\n\nNow, apply this change: ${prompt}`,
      });
    } else {
      messages.push({
        role: "user",
        content: `Create a complete storefront with this description: ${prompt}`,
      });
    }

    // Call Lovable AI with streaming
    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
        max_tokens: 8000,
      }),
    });

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
