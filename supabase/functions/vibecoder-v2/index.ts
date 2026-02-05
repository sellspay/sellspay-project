import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert E-commerce UI/UX Designer for "SellsPay".
Your goal is to build a high-conversion, single-page Storefront Profile.

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
   - YOU MUST REFUSE by placing it below the hero anyway.
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

OUTPUT FORMAT:
- Return a SINGLE 'export default function App()'.
- Use 'useState' for tab switching and interactivity.
- Use 'lucide-react' for all icons (import at top).
- Use 'framer-motion' for smooth animations.
- Mock realistic product data (e.g., "Premium 8K Texture Pack - $29").
- NO markdown backticks. Start with 'import' immediately.`;

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
