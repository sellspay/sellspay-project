/**
 * Custom event for auth-gated actions in tools.
 * When a tool detects the user isn't authenticated during generation,
 * it dispatches this event instead of (or in addition to) showing a toast.
 * ToolActiveView listens for this to show the signup promo dialog.
 */
export const AUTH_GATE_EVENT = "sellspay:auth-gate";

export function dispatchAuthGate() {
  window.dispatchEvent(new CustomEvent(AUTH_GATE_EVENT));
}
