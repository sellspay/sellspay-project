/**
 * Shared surface system for layered depth across all Studio tools.
 * 
 * Hierarchy (strongest → lightest):
 *   workspace shell → inner page → tool panel (anchor) → section cards → inputs (anchor) → chips
 */
export const uiSurfaces = {
  /** Main tool container — darker anchor layer */
  toolPanel:
    "rounded-[24px] bg-gradient-to-br from-[#e6f2f8] to-[#dbeaf3] border border-[#cde0eb] shadow-[0_4px_14px_rgba(15,23,42,0.05)]",

  /** Primary section card — lighter than tool panel */
  section:
    "rounded-[20px] bg-gradient-to-br from-[#f8fcff] to-[#eef7fb] border border-[#dbeaf1]",

  /** Alternate section card (result, output) — slightly different tint */
  sectionAlt:
    "rounded-[20px] bg-gradient-to-br from-[#f6fbff] to-[#edf6fb] border border-[#d7e7ef]",

  /** Input areas — darker anchor for contrast rhythm */
  input:
    "rounded-[16px] bg-[#e3eef6] border border-[#cddfea] shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]",

  /** Small chips and tags — darker pop */
  chip:
    "rounded-full bg-[#dcecf7] border border-[#c6ddea]",

  /** Upload / drop zones */
  dropzone:
    "rounded-[18px] bg-[#e3eef6] border border-dashed border-[#c4d8e6] shadow-[inset_0_1px_3px_rgba(15,23,42,0.05)]",
} as const;
