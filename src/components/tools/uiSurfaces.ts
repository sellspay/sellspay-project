/**
 * Shared surface system for layered depth across all Studio tools.
 *
 * Hierarchy (strongest → lightest):
 *   app bg (#f7fbff) → window shell (#eef6fb) → card (#ffffff) → inner card (#f4f9fd) → inputs (#f8fcff) → chips
 */
export const uiSurfaces = {
  /** Main tool container — soft ice shell */
  toolPanel:
    "rounded-[24px] bg-[#eef6fb] border border-[#dbeaf3] shadow-[0_4px_14px_rgba(15,23,42,0.04)]",

  /** Primary section card — white */
  section:
    "rounded-[20px] bg-white border border-[#e3edf5]",

  /** Alternate section card (result, output) — soft ice */
  sectionAlt:
    "rounded-[20px] bg-[#f4f9fd] border border-[#e1eef6]",

  /** Input areas — lightest ice with subtle inset */
  input:
    "rounded-[16px] bg-[#f8fcff] border border-[#dceaf4] shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]",

  /** Small chips and tags */
  chip:
    "rounded-full bg-[#eef6fb] border border-[#dbeaf3]",

  /** Upload / drop zones */
  dropzone:
    "rounded-[18px] bg-[#f8fcff] border border-dashed border-[#c4d8e6] shadow-[inset_0_1px_3px_rgba(15,23,42,0.03)]",
} as const;
