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

STRICT REQUIREMENTS:
1. INTERNAL NAVIGATION ONLY:
   - Do NOT use React Router (no <Link> or 'useRouter').
   - If the user wants "pages" (e.g., Products, Bundles, Contact), you MUST use a local 'useState' ("activeTab") to switch views.
   - The "Store Nav" should be a simple row of buttons/tabs (e.g., [Shop] [Bundles] [Support]) inside your component.

2. NO AUTHENTICATION UI:
   - NEVER generate a "Login", "Sign Up", or "Create Account" form.
   - Customers landing here are just visitors. They browse and buy.
   - The "Support" tab should be a simple contact form UI (visuals only).

3. CONTENT & COMMERCE:
   - Create sections for "Featured Products", "Bundle Deals", and "About the Seller".
   - Pricing cards should look premium with gradients and glassmorphism.
   - Use 'lucide-react' icons for trust signals (Shield, Star, Check, Award).
   - Include social proof elements (ratings, download counts, testimonials).

DESIGN TOKENS:
- Background: 'bg-zinc-950' or 'bg-slate-950' (unless requested otherwise).
- Cards: 'bg-zinc-900/50' with 'border border-zinc-800' and 'backdrop-blur-xl'.
- Primary Color: Use the user's requested vibe (default to violet/fuchsia gradients).
- Typography: 'tracking-tight' for headings, zinc-100 for primary text, zinc-400 for secondary.
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
