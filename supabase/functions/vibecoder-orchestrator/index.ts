import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * VibeCoder Orchestrator (v3.0 - Multi-File Pipeline)
 * 
 * MAJOR CHANGES:
 * 1. Architect returns a "files" array (manifest)
 * 2. Builder is called ONCE PER FILE
 * 3. All files saved to project_files table
 * 4. Files bundled into single App.tsx for preview
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ═══════════════════════════════════════════════════════════════
// SELLSPAY INFRASTRUCTURE CONTEXT (Injected before every prompt)
// ═══════════════════════════════════════════════════════════════
const SELLSPAY_INFRASTRUCTURE_CONTEXT = `
### ═══════════════════════════════════════════════════════════════
### 🔒 SELLSPAY MANAGED INFRASTRUCTURE (READ-ONLY)
### ═══════════════════════════════════════════════════════════════

You are a Senior UI Engineer on the SellsPay Platform.
The backend is FULLY MANAGED. You cannot build:

| Category      | Status    | Your Action                    |
|---------------|-----------|--------------------------------|
| Login/Signup  | ✅ SOLVED | NOT IN SCOPE                   |
| Payments      | ✅ SOLVED | onClick={() => onBuy(id)}      |
| Settings      | ✅ SOLVED | NOT IN SCOPE                   |
| Database      | ✅ SOLVED | Products passed via props      |

Your ENTIRE job is VISUAL DESIGN:
- Cinematic hero sections with 3+ gradient layers
- Asymmetric editorial product grids (NO uniform columns)
- Glassmorphism cards with depth and motion
- Framer Motion animations on every element
- Premium typography (text-7xl+ for heroes)
- Complex shadows, glow effects, and layering

When a user asks for "a store", they mean the FRONTEND ONLY.
Maximize visual complexity. Use every line for styling.
NEVER waste tokens on auth, payments, or backend logic—they're SOLVED.
`;

interface OrchestratorRequest {
  prompt: string;
  currentCode?: string;
  styleProfile?: string;
  userId: string;
  projectId?: string;
  skipArchitect?: boolean;
}

interface FileManifest {
  path: string;
  description: string;
  lineEstimate: number;
  priority: number;
}

interface StreamEvent {
  type: 'status' | 'log' | 'plan' | 'code' | 'code_chunk' | 'file_complete' | 'error' | 'complete';
  step?: string;
  data: unknown;
}

// ═══════════════════════════════════════════════════════════════
// TIERED CREDIT PRICING
// ═══════════════════════════════════════════════════════════════
function calculateCredits(complexityScore: number, fileCount: number): number {
  // Base cost per file + complexity multiplier
  const baseCost = fileCount * 2;
  const complexityMultiplier = complexityScore <= 3 ? 1 : complexityScore <= 6 ? 1.5 : 2;
  return Math.ceil(baseCost * complexityMultiplier);
}

// ═══════════════════════════════════════════════════════════════
// FILE VALIDATION
// ═══════════════════════════════════════════════════════════════
function validateFile(code: string, filePath: string): { valid: boolean; error?: string } {
  const lines = code.split('\n');
  const lineCount = lines.length;
  
  // Data files: max 30 lines
  if (filePath.includes('data/') && lineCount > 35) {
    return { valid: false, error: `Data file exceeds 30-line limit (${lineCount} lines)` };
  }
  
  // Component files: max 80 lines
  if (filePath.includes('components/') && lineCount > 85) {
    return { valid: false, error: `Component exceeds 80-line limit (${lineCount} lines)` };
  }
  
  // App.tsx: max 50 lines
  if (filePath === 'App.tsx' && lineCount > 55) {
    return { valid: false, error: `App.tsx exceeds 50-line limit (${lineCount} lines)` };
  }
  
  // Check bracket balance
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (Math.abs(openBraces - closeBraces) > 1) {
    return { valid: false, error: `Unbalanced braces: ${openBraces} open, ${closeBraces} close` };
  }
  
  // Check for component files having export
  if (filePath.endsWith('.tsx') && !code.includes('export')) {
    return { valid: false, error: 'Component file must have an export' };
  }
  
  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════
// BUNDLE FILES INTO SINGLE APP.TSX FOR PREVIEW
// ═══════════════════════════════════════════════════════════════
function bundleFilesForPreview(files: Record<string, string>): string {
  // Order: data files first, then components, then App.tsx
  const dataFiles: string[] = [];
  const componentFiles: string[] = [];
  let appFile = '';
  
  for (const [path, content] of Object.entries(files)) {
    if (path.includes('data/')) {
      dataFiles.push(content);
    } else if (path.includes('components/')) {
      componentFiles.push(content);
    } else if (path === 'App.tsx' || path === '/App.tsx') {
      appFile = content;
    }
  }
  
  // Strip imports from bundled code (they'll be provided by the preview environment)
  const stripImports = (code: string) => {
    return code
      .replace(/^import\s+.*from\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/^import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?\s*$/gm, '')
      .trim();
  };
  
  // Convert exports to inline for bundling
  const inlineExports = (code: string) => {
    return stripImports(code)
      .replace(/^export\s+default\s+/gm, '')
      .replace(/^export\s+/gm, '');
  };
  
  // Build bundled code
  let bundled = `// ═══════════════════════════════════════════════════════════════
// BUNDLED STOREFRONT (Auto-generated from multi-file build)
// ═══════════════════════════════════════════════════════════════

`;

  // Add data definitions
  if (dataFiles.length > 0) {
    bundled += '// === DATA ===\n';
    for (const data of dataFiles) {
      bundled += inlineExports(data) + '\n\n';
    }
  }
  
  // Add component definitions (convert to inline functions)
  if (componentFiles.length > 0) {
    bundled += '// === COMPONENTS ===\n';
    for (const comp of componentFiles) {
      bundled += inlineExports(comp) + '\n\n';
    }
  }
  
  // Add main App
  if (appFile) {
    bundled += '// === MAIN APP ===\n';
    // Keep the export default for App
    bundled += stripImports(appFile);
  }
  
  return bundled;
}

// ═══════════════════════════════════════════════════════════════
// STREAM UTILITIES
// ═══════════════════════════════════════════════════════════════
function tryEnqueue(controller: ReadableStreamDefaultController, chunk: Uint8Array): boolean {
  try {
    controller.enqueue(chunk);
    return true;
  } catch (err) {
    console.log('[Orchestrator] Stream enqueue failed:', err instanceof Error ? err.message : String(err));
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

// ═══════════════════════════════════════════════════════════════
// EXTRACT STREAMED CODE FROM BUILDER
// ═══════════════════════════════════════════════════════════════
async function extractStreamedCode(
  response: Response,
  controller?: ReadableStreamDefaultController,
  streamState?: { closed: boolean }
): Promise<string> {
  if (!response.body) throw new Error("No response body");
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let fullContent = "";
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    textBuffer += decoder.decode(value, { stream: true });
    
    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line || line.startsWith(':')) continue;
      if (!line.startsWith('data: ')) continue;
      
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]' || !jsonStr) continue;
      
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullContent += content;
        }
      } catch {
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }
  
  return fullContent;
}

function extractFileFromResponse(content: string): string {
  // Look for /// BEGIN_FILE /// ... /// END_FILE /// markers
  const beginIdx = content.indexOf('/// BEGIN_FILE ///');
  const endIdx = content.indexOf('/// END_FILE ///');
  
  let code = '';
  if (beginIdx >= 0 && endIdx > beginIdx) {
    code = content.substring(beginIdx + '/// BEGIN_FILE ///'.length, endIdx);
  } else if (beginIdx >= 0) {
    code = content.substring(beginIdx + '/// BEGIN_FILE ///'.length);
  } else {
    // Fallback: try to extract from markdown code blocks
    const codeMatch = content.match(/```(?:tsx?|typescript)?\s*([\s\S]*?)```/);
    code = codeMatch ? codeMatch[1] : content;
  }
  
  return code.trim();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const streamState = { closed: false };
      let heartbeat: number | undefined;

      const closeStream = () => {
        if (streamState.closed) return;
        streamState.closed = true;
        if (heartbeat) clearInterval(heartbeat);
        try { controller.close(); } catch { /* ignore */ }
      };

      const onAbort = () => closeStream();
      req.signal?.addEventListener('abort', onAbort, { once: true });
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
          sendEvent(controller, { type: 'error', data: { message: "Missing required fields" } }, streamState);
          closeStream();
          return;
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        // Get auth user ID from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('id', userId)
          .maybeSingle();
        
        const authUserId = profileData?.user_id || userId;

        // Check for admin/owner bypass
        const { data: roleRows } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUserId)
          .in('role', ['admin', 'owner']);

        const isPrivileged = (roleRows?.length ?? 0) > 0;

        // Check credits
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle();
        
        const credits = isPrivileged ? Number.POSITIVE_INFINITY : (wallet?.balance ?? 0);

        let architectPlan: Record<string, unknown> | null = null;
        let files: FileManifest[] = [];
        let complexityScore = 5;

        // ═══════════════════════════════════════════════════════════════
        // STAGE 1: ARCHITECT - Get file manifest
        // ═══════════════════════════════════════════════════════════════
        if (!skipArchitect) {
          sendEvent(controller, { 
            type: 'status', 
            step: 'architect',
            data: { message: "Creating modular file manifest..." } 
          }, streamState);

          // Prepend infrastructure context to prompt for the Architect
          const enrichedPrompt = SELLSPAY_INFRASTRUCTURE_CONTEXT + "\n\n## USER REQUEST\n" + prompt;
          
          const architectResponse = await callAgent('vibecoder-architect', {
            prompt: enrichedPrompt,
            currentCodeSummary: currentCode ? `${currentCode.split('\n').length} lines` : undefined,
            styleProfile,
          });
          
          if (!architectResponse.ok) {
            const errorText = await architectResponse.text();
            sendEvent(controller, { type: 'error', data: { message: `Architect failed: ${errorText}` } }, streamState);
            closeStream();
            return;
          }
          
          const architectResult = await architectResponse.json();
          architectPlan = architectResult.plan;
          
          // Extract files array
          files = (architectPlan?.files as FileManifest[]) || [];
          complexityScore = Number(architectPlan?.complexityScore) || 5;
          
          if (files.length === 0) {
            // Fallback to single-file mode
            files = [{ path: 'App.tsx', description: 'Complete storefront', lineEstimate: 120, priority: 1 }];
          }
          
          // Sort by priority
          files.sort((a, b) => a.priority - b.priority);
          
          sendEvent(controller, { type: 'log', data: `Manifest: ${files.length} files planned` }, streamState);
          sendEvent(controller, { type: 'plan', data: architectPlan }, streamState);
        } else {
          // Skip architect = single file edit
          files = [{ path: 'App.tsx', description: prompt, lineEstimate: 100, priority: 1 }];
        }

        // ═══════════════════════════════════════════════════════════════
        // CALCULATE & DEDUCT CREDITS
        // ═══════════════════════════════════════════════════════════════
        const actualCredits = calculateCredits(complexityScore, files.length);
        
        if (!isPrivileged && credits < actualCredits) {
          sendEvent(controller, { 
            type: 'error', 
            data: { message: `Insufficient credits. Need ${actualCredits}, have ${credits}.` } 
          }, streamState);
          closeStream();
          return;
        }
        
        if (!isPrivileged) {
          await supabase.rpc('deduct_credits', { 
            p_user_id: userId, 
            p_amount: actualCredits,
            p_action: 'vibecoder_gen'
          });
        }
        
        sendEvent(controller, { type: 'log', data: `Credits: ${isPrivileged ? '0 (bypass)' : actualCredits}` }, streamState);

        // ═══════════════════════════════════════════════════════════════
        // STAGE 2: BUILD EACH FILE
        // ═══════════════════════════════════════════════════════════════
        const generatedFiles: Record<string, string> = {};
        
        for (const fileSpec of files) {
          sendEvent(controller, { 
            type: 'status', 
            step: 'builder',
            data: { message: `Generating ${fileSpec.path}...` } 
          }, streamState);
          
          const builderResponse = await callAgent('vibecoder-builder', {
            prompt,
            architectPlan,
            targetFile: fileSpec,
            otherFiles: generatedFiles,
            styleProfile,
          });
          
          if (!builderResponse.ok) {
            sendEvent(controller, { type: 'log', data: `⚠️ Failed to generate ${fileSpec.path}` }, streamState);
            continue;
          }
          
          const rawContent = await extractStreamedCode(builderResponse, controller, streamState);
          const fileCode = extractFileFromResponse(rawContent);
          
          // Validate file
          const validation = validateFile(fileCode, fileSpec.path);
          if (!validation.valid) {
            sendEvent(controller, { type: 'log', data: `⚠️ ${fileSpec.path}: ${validation.error}` }, streamState);
            // Try to use anyway if it's not empty
            if (fileCode.length > 50) {
              generatedFiles[fileSpec.path] = fileCode;
            }
          } else {
            generatedFiles[fileSpec.path] = fileCode;
            sendEvent(controller, { type: 'log', data: `✓ ${fileSpec.path} (${fileCode.split('\n').length} lines)` }, streamState);
          }
          
          // Notify file completion
          sendEvent(controller, { 
            type: 'file_complete', 
            data: { path: fileSpec.path, lines: fileCode.split('\n').length } 
          }, streamState);
        }

        // ═══════════════════════════════════════════════════════════════
        // STAGE 3: SAVE FILES TO DATABASE
        // ═══════════════════════════════════════════════════════════════
        if (projectId) {
          sendEvent(controller, { type: 'log', data: 'Saving files to project...' }, streamState);
          
          for (const [path, content] of Object.entries(generatedFiles)) {
            await supabase.from('project_files').upsert(
              {
                project_id: projectId,
                profile_id: userId,
                file_path: `/${path}`,
                content,
                version: 1,
              },
              { onConflict: 'project_id,file_path' }
            );
          }
        }

        // ═══════════════════════════════════════════════════════════════
        // STAGE 4: BUNDLE FOR PREVIEW
        // ═══════════════════════════════════════════════════════════════
        sendEvent(controller, { type: 'log', data: 'Bundling for preview...' }, streamState);
        
        const bundledCode = bundleFilesForPreview(generatedFiles);
        
        // Save bundled version as App.tsx for preview
        if (projectId) {
          await supabase.from('project_files').upsert(
            {
              project_id: projectId,
              profile_id: userId,
              file_path: '/App.tsx',
              content: bundledCode,
              version: 1,
            },
            { onConflict: 'project_id,file_path' }
          );
        }

        // ═══════════════════════════════════════════════════════════════
        // STAGE 5: DELIVER
        // ═══════════════════════════════════════════════════════════════
        sendEvent(controller, {
          type: 'code',
          data: {
            code: bundledCode,
            files: generatedFiles,
            summary: `Generated ${Object.keys(generatedFiles).length} files.`,
          },
        }, streamState);

        sendEvent(controller, {
          type: 'complete',
          data: {
            success: true,
            fileCount: Object.keys(generatedFiles).length,
            creditsUsed: actualCredits,
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
