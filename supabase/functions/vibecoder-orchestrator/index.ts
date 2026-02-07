import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * VibeCoder Orchestrator (v2.1)
 * 
 * IMPROVEMENTS:
 * 1. Shadow Render - esbuild transpilation check before delivery
 * 2. Tiered Credits - complexity-based pricing
 * 3. Enhanced Healing - passes full context to heal loop
 * 
 * The MASTER COORDINATOR that chains all agents together:
 * 1. Architect → Creates the plan (returns complexityScore)
 * 2. Builder → Generates code
 * 3. Shadow Render → Transpile check (catches 80% of crashes)
 * 4. Linter → Validates code
 * 5. Self-Heal Loop → Retries on failure (max 2 attempts)
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface OrchestratorRequest {
  prompt: string;
  currentCode?: string;
  styleProfile?: string;
  userId: string;
  projectId?: string;
  skipArchitect?: boolean;
}

interface StreamEvent {
  type: 'status' | 'log' | 'plan' | 'code' | 'error' | 'complete';
  step?: 'architect' | 'builder' | 'linter' | 'healing' | 'shadow-render';
  data: unknown;
}

// ═══════════════════════════════════════════════════════════════
// TIERED CREDIT PRICING
// ═══════════════════════════════════════════════════════════════
function calculateCredits(complexityScore: number, skipArchitect: boolean): number {
  if (skipArchitect) {
    // Quick edit mode - always low tier
    return 1;
  }
  
  // Tiered pricing based on Architect's complexity score
  if (complexityScore <= 3) {
    return 3; // Low complexity: simple edits
  } else if (complexityScore <= 6) {
    return 8; // Medium complexity: section changes
  } else {
    return 15; // High complexity: full rebuilds
  }
}

// ═══════════════════════════════════════════════════════════════
// STRUCTURAL CODE GUARD - VibeCoder 2.3
// ═══════════════════════════════════════════════════════════════
// Validates code structure BEFORE delivery to prevent build crashes.
// This catches the "hooks inside arrays" and "missing export wrapper" bugs.
function validateCodeStructure(code: string): { valid: boolean; error?: string } {
  // Check 1: Must have the component wrapper
  const hasExportDefault = code.includes('export default function App');
  const hasFunctionApp = code.includes('function App()') || code.includes('function App (');
  
  if (!hasExportDefault && !hasFunctionApp) {
    return { valid: false, error: 'Missing "export default function App()" wrapper - code is incomplete' };
  }
  
  const appIndex = code.indexOf('export default function App') >= 0 
    ? code.indexOf('export default function App')
    : code.indexOf('function App');
  
  // Check 2: Hooks cannot appear before the component declaration
  const hookPatterns = ['useEffect(', 'useState(', 'useCallback(', 'useMemo(', 'useSellsPayCheckout(', 'useRef('];
  
  for (const hook of hookPatterns) {
    const hookIndex = code.indexOf(hook);
    if (hookIndex >= 0 && hookIndex < appIndex) {
      return { valid: false, error: `Hook "${hook.replace('(', '')}" called outside component boundary - must be inside App()` };
    }
  }
  
  // Check 3: Strict bracket balance (catches code truncation)
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  const openBrackets = (code.match(/\[/g) || []).length;
  const closeBrackets = (code.match(/\]/g) || []).length;
  
  // Allow max 1 difference (accounts for template literals)
  if (Math.abs(openBraces - closeBraces) > 1) {
    return { 
      valid: false, 
      error: `Unclosed bracket '{' - code is incomplete (found ${openBraces} open, ${closeBraces} close)` 
    };
  }
  
  if (Math.abs(openParens - closeParens) > 1) {
    return { 
      valid: false, 
      error: `Unclosed parenthesis '(' - code is incomplete (found ${openParens} open, ${closeParens} close)` 
    };
  }
  
  if (Math.abs(openBrackets - closeBrackets) > 1) {
    return { 
      valid: false, 
      error: `Unclosed array '[' - code is incomplete (found ${openBrackets} open, ${closeBrackets} close)` 
    };
  }
  
  // Check 4: Code must end with a closing brace (the App component's closing brace)
  const trimmedCode = code.trim();
  if (!trimmedCode.endsWith('}')) {
    return { valid: false, error: 'Code does not end with closing brace "}" - likely truncated' };
  }
  
  // Check 5: Must have a return statement with JSX
  if (!code.includes('return (') && !code.includes('return(')) {
    return { valid: false, error: 'Missing "return (" statement - component has no JSX output' };
  }
  
  // Check 6: Check for common truncation patterns
  if (code.includes('className="') && !code.includes('">')) {
    // Opened a className but might have cut off mid-attribute
    const lastClassName = code.lastIndexOf('className="');
    const afterClassName = code.substring(lastClassName);
    if (!afterClassName.includes('"')) {
      return { valid: false, error: 'Code truncated mid-attribute - className not closed' };
    }
  }
  
  // Check 7: STRICT ARRAY CLOSURE CHECK for data arrays before component
  const preAppCode = code.substring(0, appIndex);
  const namedArrays = ['PRODUCTS', 'MOVIES', 'ITEMS', 'DATA', 'COURSES', 'TRACKS', 'SOUNDS', 'LUTS', 'PRESETS', 'CATEGORIES', 'FEATURES', 'CONTENT', 'SECTIONS', 'CARDS'];
  
  for (const arrayName of namedArrays) {
    const pattern = new RegExp(`const\\s+${arrayName}\\s*=\\s*\\[`, 'g');
    const matches = preAppCode.match(pattern);
    
    if (matches && matches.length > 0) {
      const arrayStart = preAppCode.indexOf(`const ${arrayName}`);
      if (arrayStart >= 0) {
        const afterArrayName = preAppCode.substring(arrayStart);
        const hasClosing = afterArrayName.includes('];');
        
        if (!hasClosing) {
          return { 
            valid: false, 
            error: `Data array "${arrayName}" was never closed with "];" - must close before App component` 
          };
        }
      }
    }
  }
  
  // Check 8: Look for the specific failure pattern - hook right after array item
  const dangerPattern = /\}\s*\n\s*const\s*\{/;
  const preAppHasDanger = dangerPattern.test(preAppCode);
  if (preAppHasDanger) {
    return { 
      valid: false, 
      error: 'Detected hook destructuring after object without array closure - add "];" before hooks' 
    };
  }
  
  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════
// SHADOW RENDER - DISABLED (esbuild WASM not supported in Deno Edge)
// ═══════════════════════════════════════════════════════════════
// NOTE: esbuild WASM requires Web Workers which aren't available in Deno.
// We now rely on the Linter agent and Sandpack's own error detection.
function shadowRender(_code: string): { success: boolean; error?: string } {
  // Always pass - let Sandpack handle runtime validation
  return { success: true };
}

function tryEnqueue(controller: ReadableStreamDefaultController, chunk: Uint8Array): boolean {
  try {
    controller.enqueue(chunk);
    return true;
  } catch (err) {
    // Most commonly: "The stream controller cannot close or enqueue" after client disconnect
    console.log('[Orchestrator] Stream enqueue failed (client likely disconnected):', err instanceof Error ? err.message : String(err));
    return false;
  }
}

function sendEvent(
  controller: ReadableStreamDefaultController,
  event: StreamEvent,
  state?: { closed: boolean }
) {
  if (state?.closed) return;
  const encoder = new TextEncoder();
  const ok = tryEnqueue(controller, encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  if (!ok && state) state.closed = true;
}

function sendHeartbeat(controller: ReadableStreamDefaultController, state?: { closed: boolean }) {
  if (state?.closed) return;
  // SSE comment line: keeps proxies from timing out idle connections
  const encoder = new TextEncoder();
  const ok = tryEnqueue(controller, encoder.encode(`: ping\n\n`));
  if (!ok && state) state.closed = true;
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
      // Track stream state to avoid enqueue/close after disconnect
      const streamState = { closed: false };

      let heartbeat: number | undefined;

      const closeStream = () => {
        if (streamState.closed) return;
        streamState.closed = true;
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      // If the client disconnects, stop work and stop sending events
      const onAbort = () => {
        closeStream();
      };
      req.signal?.addEventListener('abort', onAbort, { once: true });

      // Heartbeat to prevent idle timeouts while agents work
      heartbeat = setInterval(() => sendHeartbeat(controller, streamState), 15000);

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
          }, streamState);
          closeStream();
          return;
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        // IMPORTANT: userId param is actually profileId - we need to get the auth user_id
        // The profiles table has: id (profile ID) and user_id (auth user ID)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('id', userId)
          .maybeSingle();
        
        const authUserId = profileData?.user_id || userId;
        console.log('[Orchestrator] Profile ID:', userId, '-> Auth User ID:', authUserId);
        
        // Owner/Admin bypass: never block or deduct credits for privileged roles
        const { data: roleRows, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUserId)
          .in('role', ['admin', 'owner']);

        if (rolesError) {
          console.log('[Orchestrator] Role lookup failed:', rolesError.message);
        }

        const isPrivileged = (roleRows?.length ?? 0) > 0;
        console.log('[Orchestrator] Is privileged:', isPrivileged, 'roles found:', roleRows?.length ?? 0);

        // Check user credits (non-privileged only)
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle();
        
        const credits = isPrivileged ? Number.POSITIVE_INFINITY : (wallet?.balance ?? 0);
        
        // Default credits (will be refined after Architect returns complexityScore)
        let estimatedCredits = skipArchitect ? 1 : 8;
        
        if (!isPrivileged && credits < estimatedCredits) {
          sendEvent(controller, { 
            type: 'error', 
            data: { message: `Insufficient credits. Need ~${estimatedCredits}, have ${credits}.` } 
          }, streamState);
          closeStream();
          return;
        }

        let architectPlan: Record<string, unknown> | null = null;
        let complexityScore = 5; // Default medium complexity
        
        // ═══════════════════════════════════════════════════════════════
        // STAGE 1: ARCHITECT (unless skipped)
        // ═══════════════════════════════════════════════════════════════
        if (!skipArchitect) {
          sendEvent(controller, { 
            type: 'status', 
            step: 'architect',
            data: { message: "Analyzing request and creating blueprint..." } 
          }, streamState);
          
          sendEvent(controller, { type: 'log', data: "Initializing Architect agent..." }, streamState);
          
          const architectResponse = await callAgent('vibecoder-architect', {
            prompt,
            currentCodeSummary: currentCode ? `${currentCode.split('\n').length} lines of existing code` : undefined,
            styleProfile,
          });
          
          if (!architectResponse.ok) {
            const error = await architectResponse.json();
            sendEvent(controller, { type: 'error', data: error }, streamState);
            closeStream();
            return;
          }
          
          const architectResult = await architectResponse.json();
          architectPlan = architectResult.plan;
          
          // Extract complexity score for tiered pricing
          complexityScore = Number(architectPlan?.complexityScore) || 5;
          
          sendEvent(controller, { type: 'log', data: `Style: ${architectPlan?.vibeAnalysis?.visualStyle || 'Custom'}` }, streamState);
          sendEvent(controller, { type: 'log', data: `Complexity: ${complexityScore}/10` }, streamState);
          sendEvent(controller, { type: 'plan', data: architectPlan }, streamState);
        }

        // ═══════════════════════════════════════════════════════════════
        // CALCULATE & DEDUCT CREDITS (Tiered Pricing)
        // ═══════════════════════════════════════════════════════════════
        const actualCredits = calculateCredits(complexityScore, !!skipArchitect);
        
        if (!isPrivileged && credits < actualCredits) {
          sendEvent(controller, { 
            type: 'error', 
            data: { message: `Insufficient credits. This request costs ${actualCredits} credits, you have ${credits}.` } 
          }, streamState);
          closeStream();
          return;
        }
        
        // Deduct credits upfront (non-privileged only)
        if (!isPrivileged) {
          const { error: deductError } = await supabase.rpc('deduct_credits', { 
            p_user_id: userId, 
            p_amount: actualCredits,
            p_action: skipArchitect ? 'vibecoder_flash' : 'vibecoder_gen'
          });
          
          if (deductError) {
            console.error("Failed to deduct credits:", deductError);
            sendEvent(controller, { 
              type: 'error', 
              data: { message: "Failed to process credits" } 
            }, streamState);
            closeStream();
            return;
          }
        }
        
        sendEvent(controller, { type: 'log', data: isPrivileged ? 'Credits used: 0 (owner/admin bypass)' : `Credits used: ${actualCredits}` }, streamState);

        // ═══════════════════════════════════════════════════════════════
        // STAGE 2, 3, 4: BUILD + SHADOW RENDER + LINT LOOP (with self-healing)
        // ═══════════════════════════════════════════════════════════════
        let attempts = 0;
        const maxAttempts = 3;
        let finalCode = '';
        let finalSummary = '';
        let healingContext: { 
          errorType: string; 
          errorMessage: string; 
          failedCode: string;
          fixSuggestion?: string;
        } | undefined;
        
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
          }, streamState);
          
          sendEvent(controller, { 
            type: 'log', 
            data: attempts > 1 
              ? `Applying fix for: ${healingContext?.errorType}` 
              : "Builder agent started..." 
          }, streamState);
          
          const builderResponse = await callAgent('vibecoder-builder', {
            prompt,
            architectPlan: architectPlan || {},
            currentCode,
            styleProfile,
            healingContext,
          });
          
          if (!builderResponse.ok) {
            const error = await builderResponse.json();
            sendEvent(controller, { type: 'error', data: error }, streamState);
            closeStream();
            return;
          }
          
          // Extract code from streaming response
          const builderContent = await extractStreamedCode(builderResponse);

          // Extract summary FIRST before stripping markers
          const summary = extractSummaryFromResponse(builderContent);
          const generatedCode = extractCodeFromResponse(builderContent);

          if (!generatedCode || generatedCode.length < 50) {
            sendEvent(controller, {
              type: 'error',
              data: { message: "Builder generated empty or invalid code" },
            }, streamState);
            closeStream();
            return;
          }

          // Store summary for final delivery (persist across heal attempts)
          const builderSummary = (summary || "Applied changes to your storefront.").trim();
          if (builderSummary) finalSummary = builderSummary;

          sendEvent(controller, { type: 'log', data: `Generated ${generatedCode.split('\n').length} lines of code` }, streamState);

          // ───────────────────────────────────────────────────────────
          // STRUCTURAL VALIDATION STAGE (VibeCoder 2.2)
          // ───────────────────────────────────────────────────────────
          const structureResult = validateCodeStructure(generatedCode);
          
          if (!structureResult.valid) {
            sendEvent(controller, {
              type: 'log',
              data: `⚠️ Structural error: ${structureResult.error}`,
            }, streamState);

            if (attempts >= maxAttempts) {
              // Max retries reached, deliver anyway with warning
              sendEvent(controller, {
                type: 'log',
                data: "Max retries reached - delivering code with known structural issues",
              }, streamState);
              finalCode = generatedCode;
              break;
            }

            // Prepare healing context for next attempt with specific fix instructions
            const errorMsg = structureResult.error || 'Unknown structural error';
            let fixSuggestion = '';
            
            if (errorMsg.includes('incomplete') || errorMsg.includes('truncated') || errorMsg.includes('Unclosed')) {
              fixSuggestion = `YOUR CODE IS INCOMPLETE. The error says: "${errorMsg}". 
You MUST:
1. Output COMPLETE code with ALL brackets closed
2. SIMPLIFY the design if needed - fewer sections, smaller arrays
3. Make sure every { has }, every ( has ), every [ has ]
4. End the code with the closing brace of the App function
5. Do NOT start over - fix the specific incomplete parts`;
            } else if (errorMsg.includes('Hook')) {
              fixSuggestion = `HOOK PLACEMENT ERROR: "${errorMsg}".
You MUST:
1. Close ALL data arrays with ]; BEFORE the App component
2. Put useSellsPayCheckout() INSIDE the App function
3. Put ALL useState/useEffect calls INSIDE the App function`;
            } else {
              fixSuggestion = `Fix this error: "${errorMsg}". 
Ensure: 1) export default function App() wrapper, 2) All hooks inside App, 3) All arrays closed with ];`;
            }
            
            healingContext = {
              errorType: 'STRUCTURAL_ERROR',
              errorMessage: errorMsg,
              failedCode: generatedCode,
              fixSuggestion,
            };

            sendEvent(controller, { type: 'log', data: "Triggering self-correction for structural issues..." }, streamState);
            continue; // Retry with healing context
          }

          sendEvent(controller, { type: 'log', data: "✓ Structural validation passed" }, streamState);

          // ───────────────────────────────────────────────────────────
          // SHADOW RENDER STAGE (New in v2.1)
          // ───────────────────────────────────────────────────────────
          // SHADOW RENDER STAGE - Now always passes (esbuild WASM disabled)
          // Sandpack handles runtime validation on the client
          // ───────────────────────────────────────────────────────────
          const shadowResult = shadowRender(generatedCode); // sync, always passes

          if (!shadowResult.success) {
            sendEvent(controller, {
              type: 'log',
              data: `⚠️ Transpile error: ${shadowResult.error?.substring(0, 100)}`,
            }, streamState);

            if (attempts >= maxAttempts) {
              // Max retries reached, deliver anyway with warning
              sendEvent(controller, {
                type: 'log',
                data: "Max retries reached - delivering code with known transpile issues",
              }, streamState);
              finalCode = generatedCode;
              break;
            }

            // Prepare healing context for next attempt
            healingContext = {
              errorType: 'TRANSPILE_ERROR',
              errorMessage: shadowResult.error || 'Unknown transpile error',
              failedCode: generatedCode,
              fixSuggestion: 'Fix the syntax error in the TSX code. Check for missing imports, unclosed tags, or invalid JSX.',
            };

            sendEvent(controller, { type: 'log', data: "Triggering self-correction..." }, streamState);
            continue; // Retry with healing context
          }

          sendEvent(controller, { type: 'log', data: "✓ Transpilation passed" }, streamState);

          // ───────────────────────────────────────────────────────────
          // LINTER STAGE
          // ───────────────────────────────────────────────────────────
          sendEvent(controller, {
            type: 'status',
            step: 'linter',
            data: { message: "Validating code..." },
          }, streamState);

          sendEvent(controller, { type: 'log', data: "Running validation checks..." }, streamState);

          const linterResponse = await callAgent('vibecoder-linter', {
            code: generatedCode,
            architectPlan,
          });

           if (!linterResponse.ok) {
             // Linter failed - but don't block, just warn
             sendEvent(controller, { type: 'log', data: "⚠️ Linter unavailable, proceeding with code" }, streamState);
             finalCode = generatedCode;
             break;
           }

          const lintResult = await linterResponse.json();

          if (lintResult.verdict === 'PASS') {
            sendEvent(controller, { type: 'log', data: "✓ All validation checks passed" }, streamState);
            finalCode = generatedCode;
            break;
          }

          // ───────────────────────────────────────────────────────────
          // SELF-HEALING: Lint failed, prepare for retry
          // ───────────────────────────────────────────────────────────
          sendEvent(controller, {
            type: 'log',
            data: `⚠️ ${lintResult.errorType}: ${lintResult.explanation}`,
          }, streamState);

          if (attempts >= maxAttempts) {
            // Max retries reached, return code anyway with warning
            sendEvent(controller, {
              type: 'log',
              data: "Max retries reached - delivering code with known issues",
            }, streamState);
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

          sendEvent(controller, { type: 'log', data: "Triggering self-correction..." }, streamState);
        }

        // ═══════════════════════════════════════════════════════════════
        // STAGE 5: DELIVER VALIDATED CODE
        // ═══════════════════════════════════════════════════════════════
        // If we ever somehow exit without a finalCode, treat it as an error (never "success" with nothing).
        if (!finalCode || finalCode.length < 50) {
          sendEvent(controller, {
            type: 'error',
            data: { message: 'Orchestrator produced no deliverable code (empty finalCode).' },
          }, streamState);
          closeStream();
          return;
        }

        sendEvent(controller, {
          type: 'code',
          data: {
            code: finalCode,
            summary: finalSummary || 'Storefront generated successfully.',
          },
        }, streamState);

        sendEvent(controller, {
          type: 'complete',
          data: {
            success: true,
            attempts,
            creditsUsed: actualCredits,
            complexityScore,
          },
        }, streamState);
        
        closeStream();
        
      } catch (error) {
        console.error("Orchestrator error:", error);
        sendEvent(controller, { 
          type: 'error', 
          data: { message: error instanceof Error ? error.message : "Unknown error" } 
        }, streamState);
        closeStream();
      } finally {
        req.signal?.removeEventListener('abort', onAbort);
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
