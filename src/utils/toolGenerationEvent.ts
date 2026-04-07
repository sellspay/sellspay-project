/** Custom events for tool generation state, used to block navigation and notify on completion */

export const TOOL_GEN_START = "tool-generation-start";
export const TOOL_GEN_END = "tool-generation-end";

export interface ToolGenDetail {
  toolId: string;
  toolName: string;
  assetUrl?: string;
  assetType?: "image" | "audio" | "video";
}

export function dispatchToolGenStart(detail: ToolGenDetail) {
  window.dispatchEvent(new CustomEvent(TOOL_GEN_START, { detail }));
}

export function dispatchToolGenEnd(detail: ToolGenDetail & { success: boolean }) {
  window.dispatchEvent(new CustomEvent(TOOL_GEN_END, { detail }));
}
