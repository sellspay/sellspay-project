

# VibeCoder Orchestration Architecture Refactor — IMPLEMENTED ✅

## Overview
Refactored the `vibecoder-v2` edge function into a 4-layer scope-aware orchestration system.

## What Was Implemented

### Layer 1: Intent Classifier (existing — no change)
- Gemini Flash Lite classifies intent as BUILD/MODIFY/FIX/QUESTION/REFUSE

### Layer 2: Scope Analyzer ✅ NEW
- `analyzeScope()` function using Gemini Flash Lite (fast, cheap)
- Input: file paths + user prompt + conversation history
- Output: `{ affectedFiles[], strategy: "micro"|"partial"|"full", estimatedOutputTokens }`
- Called before executeIntent for MODIFY/FIX intents with multi-file projects
- 15s timeout to avoid blocking generation

### Layer 3: Token Guardrail + Context Scoping ✅ NEW
- `estimateTokenBudget()` estimates input/output tokens before Claude call
- Provider-specific output caps (Claude: 50K, GPT: 14K, Gemini: 50K)
- Context scoping in executeIntent: micro/partial strategies only send affected files
- Other files listed by path only (no content) to save tokens

### Layer 4: Generation + Structured Retry ✅ UPGRADED
- Model routing: Claude for all code gen, Gemini Flash for chat only
- After all 3 JSON fallbacks fail, triggers non-streaming model retry
- Retry uses explicit JSON-only instruction + temperature 0.1
- Emits `phase: retrying` event to frontend

### Frontend: Scoping Phase ✅ NEW
- Added `scoping` phase to StreamingPhaseCard
- Cyan-colored indicator with Search icon during scope analysis

## Files Changed
1. `supabase/functions/vibecoder-v2/index.ts` — All backend orchestration
2. `src/components/ai-builder/StreamingPhaseCard.tsx` — Scoping phase UI

## Expected Outcomes
- MODIFY sends only affected files to Claude (40-60% token reduction)
- Truncation failures reduced (less output pressure)
- Model-level retry catches JSON failures that fallbacks miss
- "make it more premium" modifies theme.ts + affected components only
