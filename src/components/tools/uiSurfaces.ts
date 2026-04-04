/**
 * Shared surface system for layered depth across all Studio tools.
 *
 * Palette: white + neutral grays base, blue only for accent/active.
 *   App bg (#f5f7fa) → Shell (#fff) → Card (#f9fafb) → Inner (#f3f4f6) → Input (#f1f5f9)
 *   Borders: light (#e5e7eb) · mid (#d1d5db) · strong (#9ca3af)
 *   Blue: light (#e0f2fe) · mid (#3b82f6) · dark (#1e40af)
 */
export const uiSurfaces = {
  /** Main tool container — clean white shell */
  toolPanel:
    "rounded-[24px] bg-[#f9fafb] border border-[#e5e7eb] shadow-[0_10px_30px_rgba(0,0,0,0.05)]",

  /** Primary section card */
  section:
    "rounded-[16px] bg-[#f3f4f6] border border-[#d1d5db]",

  /** Alternate section card */
  sectionAlt:
    "rounded-[16px] bg-white border border-[#d1d5db] shadow-[0_6px_16px_rgba(0,0,0,0.06)]",

  /** Input areas */
  input:
    "rounded-[14px] bg-[#f1f5f9] border border-[#d1d5db] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]",

  /** Active / selected state — blue accent */
  active:
    "rounded-[14px] bg-[#e0f2fe] border border-[#3b82f6]",

  /** Small chips and tags */
  chip:
    "rounded-full bg-[#f3f4f6] border border-[#d1d5db]",

  /** Upload / drop zones */
  dropzone:
    "rounded-[16px] bg-[#f1f5f9] border border-dashed border-[#9ca3af] shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)]",
} as const;
