/**
 * Shared surface system for layered depth across all Studio tools.
 *
 * Neutral dark workspace palette with blue glow accents.
 *   App bg (#2e2e2e) → Surface (#383838) → Panel (#383838) → Card (#2e2e2e)
 *   Borders: soft (#3a3a3a) · mid (#474747)
 *   Blue: dark (#1d4ed8) · mid (#2563eb) · glow (#3b82f6)
 *   Text: primary (#f5f5f5) · secondary (#a3a3a3) · muted (#737373)
 */
export const uiSurfaces = {
  /** Main tool container */
  toolPanel:
    "rounded-[24px] bg-[#2e2e2e] border border-[#3a3a3a] shadow-[0_20px_60px_rgba(0,0,0,0.6)]",

  /** Section card */
  section:
    "rounded-[16px] bg-[#383838] border border-[#474747]",

  /** Alternate section card */
  sectionAlt:
    "rounded-[16px] bg-[#333333] border border-[#474747]",

  /** Input areas */
  input:
    "rounded-[14px] bg-[#333333] border border-[#474747] text-white placeholder:text-[#737373]",

  /** Active / selected state — blue glow */
  active:
    "rounded-[14px] bg-[#1e3a8a]/20 border border-[#3b82f6] text-white shadow-[0_0_0_1px_#3b82f6,0_0_20px_rgba(59,130,246,0.3)]",

  /** Small chips and tags */
  chip:
    "rounded-full bg-[#383838] border border-[#474747]",

  /** Upload / drop zones */
  dropzone:
    "rounded-[16px] bg-[#333333] border border-dashed border-[#474747]",
} as const;
