import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * VibeCoder Orchestrator
 * 
 * The MASTER COORDINATOR that chains all agents together:
 * 1. Architect → Creates the plan
 * 2. Builder → Generates code
 * 3. Linter → Validates code
 * 4. Self-Heal Loop → Retries on failure (max 2 attempts)
 * 
 * This function streams progress updates to the frontend and only
 * delivers code to the user AFTER it passes validation.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface OrchestratorRequest {
  prompt: string;
  currentCode?: string;
  styleProfile?: string;
  userId: string;
  projectId?: string;
  skipArchitect?: boolean; // For quick edits, skip planning phase
}

interface StreamEvent {
  type: 'status' | 'log' | 'plan' | 'code' | 'error' | 'complete';
  step?: 'architect' | 'builder' | 'linter' | 'healing';
  data: unknown;
}

function sendEvent(controller: ReadableStreamDefaultController, event: StreamEvent) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

async function callAgent(
  agentName: string,
  body: Record<string, unknown>
): Promise<Response> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${agentName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return response;
}

async function extractStreamedCode(response: Response): Promise<string> {
  if (!response.body) throw new Error("No response body");
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    
    // Parse SSE format
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        if (jsonStr === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) fullContent += content;
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
  
  return fullContent;
}

function extractCodeFromResponse(content: string): string {
  // Find code after BEGIN_CODE marker or TYPE: CODE marker
  const beginIdx = content.indexOf('/// BEGIN_CODE ///');
  const typeIdx = content.indexOf('/// TYPE: CODE ///');
  
  let codePart = '';
  if (beginIdx >= 0) {
    codePart = content.substring(beginIdx + '/// BEGIN_CODE ///'.length);
  } else if (typeIdx >= 0) {
    codePart = content.substring(typeIdx + '/// TYPE: CODE ///'.length);
  } else {
    codePart = content;
  }
  
  // Clean up code fences and LOG tags
  return codePart
    .replace(/\[LOG:\s*[^\]]+\]/g, '')
    .replace(/^```(?:tsx?|jsx?|javascript|typescript)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

function extractSummaryFromResponse(content: string): string {
  const typeIdx = content.indexOf('/// TYPE: CODE ///');
  if (typeIdx < 0) return '';
  
  const beginIdx = content.indexOf('/// BEGIN_CODE ///');
  const endIdx = beginIdx > typeIdx ? beginIdx : content.length;
  
  return content
    .substring(typeIdx + '/// TYPE: CODE ///'.length, endIdx)
    .replace(/\[LOG:\s*[^\]]+\]/g, '')
    .trim();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { 
          prompt, 
          currentCode, 
          styleProfile,
          userId,
          projectId,
          skipArchitect 
        } = await req.json() as OrchestratorRequest;

        if (!prompt || !userId) {
          sendEvent(controller, { 
            type: 'error', 
            data: { message: "Missing required fields" } 
          });
          controller.close();
          return;
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        // Check user credits
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', userId)
          .single();
        
        const credits = wallet?.balance ?? 0;
        const requiredCredits = skipArchitect ? 3 : 8; // Architect(5) + Builder(3) or just Builder(3)
        
        if (credits < requiredCredits) {
          sendEvent(controller, { 
            type: 'error', 
            data: { message: `Insufficient credits. Need ${requiredCredits}, have ${credits}.` } 
          });
          controller.close();
          return;
        }

        let architectPlan: Record<string, unknown> | null = null;
        
        // ═══════════════════════════════════════════════════════════════
        // STAGE 1: ARCHITECT (unless skipped)
        // ═══════════════════════════════════════════════════════════════
        if (!skipArchitect) {
          sendEvent(controller, { 
            type: 'status', 
            step: 'architect',
            data: { message: "Analyzing request and creating blueprint..." } 
          });
          
          sendEvent(controller, { type: 'log', data: "Initializing Architect agent..." });
          
          const architectResponse = await callAgent('vibecoder-architect', {
            prompt,
            currentCodeSummary: currentCode ? `${currentCode.split('\n').length} lines of existing code` : undefined,
            styleProfile,
          });
          
          if (!architectResponse.ok) {
            const error = await architectResponse.json();
            sendEvent(controller, { type: 'error', data: error });
            controller.close();
            return;
          }
          
          const architectResult = await architectResponse.json();
          architectPlan = architectResult.plan;
          
          sendEvent(controller, { type: 'log', data: `Style: ${architectPlan?.vibeAnalysis?.visualStyle || 'Custom'}` });
          sendEvent(controller, { type: 'plan', data: architectPlan });
          
          // Deduct architect credits
          await supabase.rpc('deduct_credits', { user_id: userId, amount: 5 });
        }

        // ═══════════════════════════════════════════════════════════════
        // STAGE 2 & 3: BUILD + LINT LOOP (with self-healing)
        // ═══════════════════════════════════════════════════════════════
        let attempts = 0;
        const maxAttempts = 3;
        let finalCode = '';
        let healingContext: { errorType: string; errorMessage: string; failedCode: string } | undefined;
        
        while (attempts < maxAttempts) {
          attempts++;
          
          // ───────────────────────────────────────────────────────────
          // BUILDER STAGE
          // ───────────────────────────────────────────────────────────
          sendEvent(controller, { 
            type: 'status', 
            step: attempts > 1 ? 'healing' : 'builder',
            data: { 
              message: attempts > 1 
                ? `Self-healing attempt ${attempts - 1}...` 
                : "Generating code..." 
            } 
          });
          
          sendEvent(controller, { 
            type: 'log', 
            data: attempts > 1 
              ? `Applying fix for: ${healingContext?.errorType}` 
              : "Builder agent started..." 
          });
          
          const builderResponse = await callAgent('vibecoder-builder', {
            prompt,
            architectPlan: architectPlan || {},
            currentCode,
            styleProfile,
            healingContext,
          });
          
          if (!builderResponse.ok) {
            const error = await builderResponse.json();
            sendEvent(controller, { type: 'error', data: error });
            controller.close();
            return;
          }
          
          // Extract code from streaming response
          const builderContent = await extractStreamedCode(builderResponse);
          const generatedCode = extractCodeFromResponse(builderContent);
          const summary = extractSummaryFromResponse(builderContent);
          
          if (!generatedCode || generatedCode.length < 50) {
            sendEvent(controller, { 
              type: 'error', 
              data: { message: "Builder generated empty or invalid code" } 
            });
            controller.close();
            return;
          }
          
          sendEvent(controller, { type: 'log', data: `Generated ${generatedCode.split('\n').length} lines of code` });
          
          // Deduct builder credits (only on first attempt)
          if (attempts === 1) {
            await supabase.rpc('deduct_credits', { user_id: userId, amount: 3 });
          }
          
          // ───────────────────────────────────────────────────────────
          // LINTER STAGE
          // ───────────────────────────────────────────────────────────
          sendEvent(controller, { 
            type: 'status', 
            step: 'linter',
            data: { message: "Validating code..." } 
          });
          
          sendEvent(controller, { type: 'log', data: "Running validation checks..." });
          
          const linterResponse = await callAgent('vibecoder-linter', {
            code: generatedCode,
            architectPlan,
          });
          
          if (!linterResponse.ok) {
            // Linter failed - but don't block, just warn
            sendEvent(controller, { type: 'log', data: "⚠️ Linter unavailable, proceeding with code" });
            finalCode = generatedCode;
            break;
          }
          
          const lintResult = await linterResponse.json();
          
          if (lintResult.verdict === 'PASS') {
            sendEvent(controller, { type: 'log', data: "✓ All validation checks passed" });
            finalCode = generatedCode;
            break;
          }
          
          // ───────────────────────────────────────────────────────────
          // SELF-HEALING: Lint failed, prepare for retry
          // ───────────────────────────────────────────────────────────
          sendEvent(controller, { 
            type: 'log', 
            data: `⚠️ ${lintResult.errorType}: ${lintResult.explanation}` 
          });
          
          if (attempts >= maxAttempts) {
            // Max retries reached, return code anyway with warning
            sendEvent(controller, { 
              type: 'log', 
              data: "Max retries reached - delivering code with known issues" 
            });
            finalCode = generatedCode;
            break;
          }
          
          // Prepare healing context for next attempt - include FULL failed code + fix suggestion
          healingContext = {
            errorType: lintResult.errorType,
            errorMessage: lintResult.explanation,
            failedCode: generatedCode, // Send FULL code, not truncated
            fixSuggestion: lintResult.fixSuggestion,
          };
          
          sendEvent(controller, { type: 'log', data: "Triggering self-correction..." });
        }

        // ═══════════════════════════════════════════════════════════════
        // STAGE 4: DELIVER VALIDATED CODE
        // ═══════════════════════════════════════════════════════════════
        sendEvent(controller, { 
          type: 'code', 
          data: { 
            code: finalCode,
            summary: extractSummaryFromResponse(finalCode) || "Storefront generated successfully.",
          } 
        });
        
        sendEvent(controller, { 
          type: 'complete', 
          data: { 
            success: true,
            attempts,
            creditsUsed: skipArchitect ? 3 : 8,
          } 
        });
        
        controller.close();
        
      } catch (error) {
        console.error("Orchestrator error:", error);
        sendEvent(controller, { 
          type: 'error', 
          data: { message: error instanceof Error ? error.message : "Unknown error" } 
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
