import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * VibeCoder Builder Agent
 * 
 * Role: Lead Frontend Engineer & Tailwind Master
 * Model: google/gemini-3-flash-preview (fast code generation)
 * 
 * This agent receives the Architect's plan and generates production-ready React code.
 * It outputs COMPLETE TSX files that render in Sandpack.
 */

const BUILDER_SYSTEM_PROMPT = `You are the Lead Frontend Engineer at SellsPay.
You implement the Architect's plan using React, Tailwind CSS, and Lucide Icons.
Your code must be beautiful, functional, and strictly adhere to the marketplace guardrails.

### TECHNICAL STACK
- Framework: React (Vite/Sandpack environment)
- Styling: Tailwind CSS ONLY (use modern patterns: grid, flex, aspect-ratio)
- Icons: Lucide-React (import from 'lucide-react')
- Animations: Framer Motion (import { motion } from 'framer-motion')
- Checkout: useSellsPayCheckout hook (always available)

### MARKETPLACE GUARDRAILS (ZERO TOLERANCE)
1. **NO AUTH**: Never build login/signup forms. Assume user data comes from SellsPay.
2. **NO PAYMENTS**: Never build Stripe/PayPal forms. Use \`useSellsPayCheckout()\`.
3. **NO BACKEND**: Never use axios or fetch for product data. Use props or mock data.
4. **NO ROUTER**: Use local useState for tabs, NOT React Router.

### LAYOUT LAW (NON-NEGOTIABLE)
1. Hero section MUST be the FIRST element in the return statement.
2. Store navigation (Products, Bundles, About tabs) goes BELOW hero with \`sticky top-0 z-40\`.
3. NEVER place a nav bar at the absolute top of the component.

### ELITE DESIGN RULES
Based on the Architect's style analysis, apply these patterns:

**Glassmorphism:**
\`bg-white/10 backdrop-blur-md border border-white/20\`

**Sophisticated Shadows:**
\`shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]\`

**Type Hierarchy:**
- Headings: \`tracking-tight font-bold text-zinc-100\`
- Body: \`leading-relaxed text-zinc-400\`

**Motion (Framer):**
\`<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>\`

### IMAGE PROTOCOL
- NEVER use local paths like \`src="/images/...\` or \`./assets/...\`
- ALWAYS use Unsplash URLs: \`https://images.unsplash.com/photo-XXXXX?auto=format&fit=crop&w=800&q=80\`

### SELLSPAY CHECKOUT INTEGRATION
\`\`\`tsx
import { useSellsPayCheckout } from "@/hooks/useSellsPayCheckout";

const { buyProduct, isProcessing } = useSellsPayCheckout();

<button 
  onClick={() => buyProduct(product.id)}
  disabled={isProcessing}
  className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-lg font-bold"
>
  {isProcessing ? "Processing..." : "Buy Now"}
</button>
\`\`\`

### OUTPUT FORMAT
You MUST output:
1. A brief markdown summary (3-6 numbered points) of what you built
2. [LOG: Action] tags for real-time transparency (3-5 logs)
3. The marker: \`/// BEGIN_CODE ///\`
4. The COMPLETE React TSX code starting with \`export default function App()\`

Example:
\`\`\`
/// TYPE: CODE ///
Building a luxury streetwear storefront with neon accents.

1. **Hero Section**: Full-bleed gradient with animated headline
2. **Product Grid**: 3-column layout with hover animations
3. **Sticky Nav**: Glassmorphism tab bar below hero

[LOG: Constructing hero gradient...]
[LOG: Building product card components...]
[LOG: Adding framer motion animations...]
/// BEGIN_CODE ///
export default function App() {
  // ... complete code
}
\`\`\`

### SELF-HEALING CHECKLIST
Before outputting code, verify:
1. All imports are valid (no hallucinated libraries)
2. useSellsPayCheckout is properly imported
3. Every component in a list has a unique key
4. No unused variables that would crash a linter
5. All images use external URLs (Unsplash)`;

interface BuilderRequest {
  prompt: string;
  architectPlan: Record<string, unknown>;
  currentCode?: string;
  prunedContext?: string;
  styleProfile?: string;
  healingContext?: {
    errorType: string;
    errorMessage: string;
    failedCode: string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt, 
      architectPlan, 
      currentCode, 
      prunedContext,
      styleProfile,
      healingContext 
    } = await req.json() as BuilderRequest;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the user message with all context
    let userMessage = `## User Request\n${prompt}\n`;
    
    if (architectPlan) {
      userMessage += `\n## Architect's Plan\n\`\`\`json\n${JSON.stringify(architectPlan, null, 2)}\n\`\`\`\n`;
    }
    
    if (styleProfile) {
      userMessage += `\n## Style Profile\n${styleProfile}\n`;
    }
    
    if (prunedContext) {
      userMessage += `\n## Relevant Existing Code\n\`\`\`tsx\n${prunedContext}\n\`\`\`\n`;
    } else if (currentCode) {
      userMessage += `\n## Current Full Code\n\`\`\`tsx\n${currentCode}\n\`\`\`\n`;
    }
    
    // Self-healing mode: Include error context for fixes
    if (healingContext) {
      userMessage += `\n## 🚨 CRITICAL: Code Failed Validation\n`;
      userMessage += `**Error Type:** ${healingContext.errorType}\n`;
      userMessage += `**Error Message:** ${healingContext.errorMessage}\n`;
      userMessage += `**Failed Code Snippet:**\n\`\`\`tsx\n${healingContext.failedCode.substring(0, 500)}...\n\`\`\`\n`;
      userMessage += `\nFix this specific error while preserving all other functionality.`;
    }

    userMessage += `\n## Instructions\nGenerate complete, production-ready React TSX code following the architect's plan. Output the full file content.`;

    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: BUILDER_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 8000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Builder AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Builder agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
