/**
 * Shared surface system for layered depth across all Studio tools.
 * 
 * Hierarchy (strongest → lightest):
 *   workspace shell → inner page → tool panel → section cards → inputs → chips
 */
export const uiSurfaces = {
  /** Main tool container — the large rounded panel holding the tool */
  toolPanel:
    "rounded-[24px] bg-gradient-to-br from-[#f2f8fc] to-[#e9f3f8] border border-[#d7e7ef] shadow-[0_4px_14px_rgba(15,23,42,0.04)]",

  /** Primary section card (prompt, upload, etc.) */
  section:
    "rounded-[20px] bg-gradient-to-br from-[#f8fcff] to-[#eef6fb] border border-[#dbeaf1]",

  /** Alternate section card (result, output, etc.) — slightly different tint */
  sectionAlt:
    "rounded-[20px] bg-gradient-to-br from-[#f9fcff] to-[#eff7fb] border border-[#dceaf1]",

  /** Input areas — textarea, prompt boxes, text fields */
  input:
    "rounded-[16px] bg-[#eef6fb] border border-[#d4e4ec]",

  /** Small chips and tags */
  chip:
    "rounded-full bg-[#e7f2f9] border border-[#d6e6ef]",

  /** Upload / drop zones */
  dropzone:
    "rounded-[18px] bg-[#edf6fb] border border-dashed border-[#cfe0ea]",
} as const;
