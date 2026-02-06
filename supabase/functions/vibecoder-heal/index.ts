import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * VibeCoder Heal Agent (v2.1)
 * 
 * DEDICATED healing endpoint for runtime errors.
 * Called directly from the frontend when Sandpack crashes.
 * 
 * This SKIPS the Architect and goes straight to the Builder
 * with full error context for surgical fixes.
 * 
 * ADVANTAGES over previous flow:
 * 1. Receives ACTUAL runtime error stack traces
 * 2. Has the COMPLETE failed code (not truncated)
 * 3. Doesn't restart the full pipeline
 * 4. Uses same model as Builder for consistency
 * 5. Logs healing stats for "AI squashing bugs" metrics
 */

interface HealRequest {
  runtimeError: string;
  failedCode: string;
  styleProfile?: string;
  architectPlan?: Record<string, unknown>;
  userId: string;
  projectId?: string;
}

const HEALING_SYSTEM_PROMPT = `You are the SellsPay Emergency Code Doctor.
Your ONLY job is to FIX the specific runtime error without changing anything else.

### SURGICAL PRECISION PROTOCOL
1. **DIAGNOSE**: Identify the EXACT line/expression causing the error
2. **FIX ONLY THAT**: Apply the minimal fix (add ?., fix import, wrap in try-catch, etc.)
3. **PRESERVE EVERYTHING**: Do NOT refactor, reorganize, or "improve" other code
4. **MAINTAIN STYLING**: Keep all Tailwind classes exactly as they were
5. **NO NEW FEATURES**: This is emergency surgery, not enhancement

### COMMON RUNTIME FIXES
- "Cannot read property of undefined" → Add optional chaining (?.) or nullish check
- "X is not defined" → Add the missing import statement
- "Invalid hook call" → Move hook to component top level
- "Each child should have unique key" → Add key={id} or key={index}
- "Unexpected token" → Fix JSX syntax (missing closing tag, bracket)
- "products.map is not a function" → Add Array.isArray() check or ?.

### OUTPUT FORMAT
1. Brief explanation of what was wrong (1-2 sentences)
2. The marker: \`/// BEGIN_CODE ///\`
3. The COMPLETE fixed file (not just a snippet)

Example:
\`\`\`
The error "Cannot read property 'map' of undefined" was caused by products being undefined on initial render. Added optional chaining.

/// BEGIN_CODE ///
export default function App() {
  // ... complete fixed code
}
\`\`\``;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client for logging
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { 
      runtimeError, 
      failedCode, 
      styleProfile,
      architectPlan,
      userId,
      projectId,
    } = await req.json() as HealRequest;

    if (!runtimeError || !failedCode) {
      return new Response(
        JSON.stringify({ error: "Missing runtimeError or failedCode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!runtimeError || !failedCode) {
      return new Response(
        JSON.stringify({ error: "Missing runtimeError or failedCode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`[HEAL] Fixing error for user ${userId}:`, runtimeError.substring(0, 200));

    // Build targeted healing prompt
    const userMessage = `## 🚨 RUNTIME ERROR (Browser crashed with this)
\`\`\`
${runtimeError}
\`\`\`

## FAILED CODE (Fix this)
\`\`\`tsx
${failedCode}
\`\`\`

## INSTRUCTIONS
1. Find the EXACT line causing "${runtimeError.split('\n')[0]}"
2. Apply the MINIMAL fix
3. Do NOT change styling or add features
4. Output the COMPLETE fixed file

${styleProfile ? `Style Profile: ${styleProfile} (preserve this aesthetic)` : ''}`;

    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: HEALING_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3, // Lower temperature for more deterministic fixes
        max_tokens: 8000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Heal AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Log successful healing attempt initiation
    const errorType = runtimeError.includes("Cannot read") ? "undefined_access" :
                     runtimeError.includes("is not defined") ? "missing_import" :
                     runtimeError.includes("hook") ? "hook_violation" :
                     runtimeError.includes("key") ? "missing_key" :
                     "syntax_error";

    // Log the healing attempt
    try {
      await supabase.from("vibecoder_heal_logs").insert({
        project_id: projectId || null,
        user_id: userId,
        error_type: errorType,
        error_message: runtimeError.substring(0, 500),
        healing_source: "frontend",
        success: true, // Will be updated by frontend if it fails
        attempts: 1,
      });
    } catch (logError) {
      console.error("Failed to log healing stat:", logError);
      // Don't fail the request if logging fails
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
    console.error("Heal agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
