/**
 * Shared surface system for layered depth across all Studio tools.
 *
 * Dark workspace palette with blue glow accents.
 *   App bg (#0f172a) → Surface (#111827) → Panel (#1f2937) → Card (#111827)
 *   Borders: soft (#1f2937) · mid (#374151)
 *   Blue: dark (#1d4ed8) · mid (#2563eb) · glow (#3b82f6)
 *   Text: primary (#f9fafb) · secondary (#9ca3af) · muted (#6b7280)
 */
export const uiSurfaces = {
  /** Main tool container */
  toolPanel:
    "rounded-[24px] bg-[#0f172a] border border-[#1f2937] shadow-[0_20px_60px_rgba(0,0,0,0.6)]",

  /** Section card */
  section:
    "rounded-[16px] bg-[#1f2937] border border-[#374151]",

  /** Alternate section card */
  sectionAlt:
    "rounded-[16px] bg-[#111827] border border-[#374151]",

  /** Input areas */
  input:
    "rounded-[14px] bg-[#111827] border border-[#374151] text-white placeholder:text-[#6b7280]",

  /** Active / selected state — blue glow */
  active:
    "rounded-[14px] bg-[#1e3a8a]/20 border border-[#3b82f6] text-white shadow-[0_0_0_1px_#3b82f6,0_0_20px_rgba(59,130,246,0.3)]",

  /** Small chips and tags */
  chip:
    "rounded-full bg-[#1f2937] border border-[#374151]",

  /** Upload / drop zones */
  dropzone:
    "rounded-[16px] bg-[#111827] border border-dashed border-[#374151]",
} as const;
