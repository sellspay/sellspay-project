
# SellsPay Policy Guardrail System

## Overview
This implementation creates a three-layer defense system that prevents the AI from generating authentication, settings, backend, or any platform-managed functionality. The system stops forbidden requests instantly on the client side, saving API costs and preventing scope creep.

## Problem
The AI is "over-helping" by building full-stack features (Login, Settings, Profiles, Authentication) that:
1. Conflict with SellsPay's core infrastructure
2. Create security vulnerabilities with mock authentication
3. Waste API tokens on code that gets discarded
4. Confuse users about what they can actually build

## Solution Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     USER PROMPT INPUT                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 1: POLICY GUARD (Client-Side)                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ checkPolicyViolation(prompt)                               │  │
│  │   - Scans for forbidden keywords                           │  │
│  │   - Returns violation rule if matched                      │  │
│  │   - Blocks request BEFORE hitting AI API                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
           ┌─────────────────┴─────────────────┐
           │                                   │
     ✅ ALLOWED                         🛑 BLOCKED
           │                                   │
           ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────────────┐
│   Continue to AI    │           │   Display Policy Card       │
│   Generation        │           │   (No API call made)        │
└─────────────────────┘           └─────────────────────────────┘
```

## Policy Categories

| Category | Description | Keywords |
|----------|-------------|----------|
| **Security Policy** | Authentication is handled by SellsPay | login, signup, sign in, password, 2fa, otp, auth, logout |
| **Platform Scope** | User management is platform-level | settings page, profile edit, billing, change email, subscription settings |
| **Architecture Limit** | VibeCoder is frontend-only | create database, backend api, admin panel, server setup |
| **Payment Policy** | All payments via SellsPay | stripe key, paypal client, custom checkout, payment gateway |

## Implementation Steps

### Part 1: Create Policy Engine
**File**: `src/utils/policyGuard.ts`

Create a dedicated module containing:
- `POLICY_RULES` array with structured violation definitions
- `checkPolicyViolation(prompt)` function that scans user input
- Each rule has: `id`, `category`, `keywords[]`, `message`

### Part 2: Integrate Guardrail into Message Handler
**File**: `src/components/ai-builder/AIBuilderCanvas.tsx`

Modify `handleSendMessage`:
1. Import `checkPolicyViolation` from policy guard
2. Check prompt against policy BEFORE any other logic
3. If violation detected:
   - Add user message to chat (so they see what they typed)
   - Add policy violation response with special metadata
   - Return early (do NOT call AI API)

### Part 3: Update Message Types
**File**: `src/components/ai-builder/hooks/useVibecoderProjects.ts`

Extend `VibecoderMessage` interface to support metadata:
- Add optional `meta_data?: { type?: string; category?: string }` field
- This is a local-only extension (no DB changes needed since we're not persisting policy violations)

### Part 4: Create Policy Card UI Component
**File**: `src/components/ai-builder/PolicyViolationCard.tsx`

A distinct, authoritative UI card that:
- Shows a Shield icon with the violation category
- Displays the polite refusal message
- Has a subtle "SellsPay Content Guidelines" footer
- Uses amber/yellow warning styling (not aggressive red)

### Part 5: Render Policy Cards in Chat
**File**: `src/components/ai-builder/VibecoderMessageBubble.tsx`

Update the message rendering logic:
1. Import `PolicyViolationCard`
2. Check for `meta_data?.type === 'policy_violation'`
3. Render the policy card instead of standard assistant bubble

## Technical Details

### Policy Guard Utility
```typescript
// src/utils/policyGuard.ts

export interface PolicyRule {
  id: string;
  category: string;
  keywords: string[];
  message: string;
}

export const POLICY_RULES: PolicyRule[] = [
  {
    id: 'auth_restriction',
    category: 'Security Policy',
    keywords: ['login', 'sign in', 'signin', 'signup', 'register', 'password', '2fa', 'logout', 'authentication'],
    message: 'Authentication features are securely managed by the SellsPay platform...'
  },
  // Additional rules...
];

export function checkPolicyViolation(prompt: string): PolicyRule | null {
  const lowerPrompt = prompt.toLowerCase();
  return POLICY_RULES.find(rule => 
    rule.keywords.some(kw => lowerPrompt.includes(kw))
  ) ?? null;
}
```

### Message Handler Integration
```typescript
// In handleSendMessage
const violation = checkPolicyViolation(prompt);
if (violation) {
  // Show user's message
  await addMessage('user', prompt, undefined, projectId);
  
  // Add policy response (local only, not saved to DB)
  setMessages(prev => [...prev, {
    id: `policy-${Date.now()}`,
    role: 'assistant',
    content: violation.message,
    meta_data: { type: 'policy_violation', category: violation.category }
  }]);
  
  return; // STOP - no AI call
}
```

## Benefits

1. **Cost Savings**: Zero API tokens spent on forbidden requests
2. **Instant Feedback**: User sees policy response immediately (no loading state)
3. **Educational**: Explains WHY they can't do something and what they CAN do
4. **Extensible**: Easy to add new policy rules as categories expand
5. **Professional UX**: Distinct card design makes policies feel official, not like errors

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/utils/policyGuard.ts` | CREATE | Policy rules and checker function |
| `src/components/ai-builder/PolicyViolationCard.tsx` | CREATE | Styled policy violation UI |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | MODIFY | Add guardrail check to handleSendMessage |
| `src/components/ai-builder/hooks/useVibecoderProjects.ts` | MODIFY | Extend VibecoderMessage type with meta_data |
| `src/components/ai-builder/VibecoderMessageBubble.tsx` | MODIFY | Render PolicyViolationCard for violations |
