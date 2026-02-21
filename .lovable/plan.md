
# Fix Build Errors: Wire Up Phase Streaming

The build errors are caused by 5 variables being used in `AIBuilderCanvas.tsx` without being destructured from `useAgentLoop`. Two quick edits needed:

## Changes

### 1. AIBuilderCanvas.tsx -- Destructure new variables from useAgentLoop (line ~423-443)

Add the missing variables and callbacks to the destructuring:

```typescript
const {
  agentStep,
  agentLogs,
  isAgentRunning,
  startAgent,
  cancelAgent,
  resetAgent,
  onStreamLog,
  onStreamingComplete,
  onStreamingError,
  triggerSelfCorrection,
  lockedProjectId,
  mountProject: mountAgentProject,
  unmountProject: unmountAgentProject,
  // NEW: Phase streaming
  onPhaseChange,
  onAnalysis,
  onPlanItems,
  onStreamSummary,
  streamPhase,
  analysisText,
  planItems,
  completedPlanItems,
  summaryText,
} = useAgentLoop({ ... });
```

### 2. AIBuilderCanvas.tsx -- Pass phase callbacks to useStreamingCode (line ~234)

Add the four new callbacks to the `useStreamingCode` options object so that SSE phase events flow from the stream parser into the agent loop state:

```typescript
} = useStreamingCode({
  // ...existing options...
  onPhaseChange,
  onAnalysis,
  onPlanItems,
  onStreamSummary,
});
```

No other files need changes -- the hooks already export and accept these, they just need to be connected.
