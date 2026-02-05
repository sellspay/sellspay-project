import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert Frontend React Engineer and UI/UX Designer.
Your goal is to build "V0.dev" or "Lovable" quality interfaces - premium, modern, production-ready.

STRICT DESIGN REQUIREMENTS:
1. Use a modern, dark-mode-first aesthetic (unless asked otherwise).
   - Use 'zinc-900' or 'slate-900' for backgrounds, NEVER pure black.
   - Use 'rounded-xl' or 'rounded-2xl' for cards and containers.
   - Use gradients subtly (e.g., 'bg-gradient-to-br from-violet-500 to-fuchsia-600').
   - Use 'tracking-tight' for headings to make them look premium.
   - Add generous padding (p-8, p-12) to let the design breathe.
   - Use subtle shadows: 'shadow-xl shadow-violet-500/10'.
   - Add glassmorphism: 'backdrop-blur-xl bg-white/5 border border-white/10'.

2. CODE STRUCTURE:
   - Output a SINGLE 'export default function App()'.
   - NO markdown backticks at the start or end.
   - NO explanations, NO commentary - ONLY code.
   - Make it interactive - use useState for tabs, accordions, hover states.
   - Use lucide-react for all icons (import at top).
   - Use framer-motion for smooth animations and transitions.

3. PROHIBITED:
   - Do NOT use 'img' tags with local paths. Use gradient backgrounds or icons instead.
   - Do NOT use custom fonts requiring <link>. Use Tailwind default fonts.
   - Do NOT import libraries besides lucide-react and framer-motion.
   - Do NOT add placeholder comments like "// Add more items here".

4. QUALITY STANDARDS:
   - Every section needs visual hierarchy: large headings, muted subtexts.
   - Use flex/grid with gap utilities, never margin hacks.
   - Add hover states to all interactive elements: 'hover:scale-105 transition-transform'.
   - Include at least one animated element using framer-motion.
   - Text should have proper contrast - use zinc-100 for primary, zinc-400 for secondary.

Return ONLY the code. Start with 'import' immediately.`;

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
