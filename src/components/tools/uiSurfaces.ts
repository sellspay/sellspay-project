/**
 * Shared surface system for layered depth across all Studio tools.
 *
 * Neutral dark workspace palette with blue glow accents.
 *   App bg (#f3f5f8) → Surface (#ffffff) → Panel (#ffffff) → Card (#f3f5f8)
 *   Borders: soft (#3a3a3a) · mid (#e0e0e0)
 *   Blue: dark (#1d4ed8) · mid (#2563eb) · glow (#3b82f6)
 *   Text: primary (#111827) · secondary (#6b7280) · muted (#9ca3af)
 */
export const uiSurfaces = {
  /** Main tool container */
  toolPanel:
    "rounded-[24px] bg-[#f3f5f8] border border-[#3a3a3a] shadow-sm",

  /** Section card */
  section:
    "rounded-[16px] bg-[#ffffff] border border-[#e0e0e0]",

  /** Alternate section card */
  sectionAlt:
    "rounded-[16px] bg-[#ffffff] border border-[#e0e0e0]",

  /** Input areas */
  input:
    "rounded-[14px] bg-[#ffffff] border border-[#e0e0e0] text-foreground placeholder:text-[#9ca3af]",

  /** Active / selected state — blue glow */
  active:
    "rounded-[14px] bg-[#1e3a8a]/20 border border-[#3b82f6] text-foreground shadow-[0_0_0_1px_#3b82f6,0_0_20px_rgba(59,130,246,0.3)]",

  /** Small chips and tags */
  chip:
    "rounded-full bg-[#ffffff] border border-[#e0e0e0]",

  /** Upload / drop zones */
  dropzone:
    "rounded-[16px] bg-[#ffffff] border border-dashed border-[#e0e0e0]",
} as const;
