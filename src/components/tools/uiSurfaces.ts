/**
 * Shared light surface system — contrast ladder for layered depth.
 *
 *   Page bg (#f7fbff) → Tool shell (#eef6fb) → Panels (white) → Inner (#f4f9fd)
 *   Borders use soft blue-gray for separation.
 */
export const uiSurfaces = {
  /** Page-level background */
  pageBg: "bg-[#f7fbff]",

  /** Outer tool container / shell */
  toolPanel:
    "rounded-[24px] bg-[#eef6fb] border border-[#dbeaf3] shadow-[0_10px_30px_rgba(15,23,42,0.05)]",

  /** Left / Right panel cards */
  section:
    "rounded-[24px] bg-white border border-[#e3edf5] shadow-sm",

  /** Alternate section card */
  sectionAlt:
    "rounded-[20px] bg-[#f4f9fd] border border-[#e1eef6]",

  /** Inner cards (prompt area, settings, etc.) */
  innerCard:
    "rounded-[20px] bg-[#f4f9fd] border border-[#e1eef6]",

  /** Input areas */
  input:
    "rounded-[16px] bg-[#f8fcff] border border-[#dceaf4] text-slate-800 placeholder:text-slate-400",

  /** Active / selected state */
  active:
    "rounded-[14px] bg-blue-50 border border-blue-300 text-slate-900 shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_0_12px_rgba(59,130,246,0.1)]",

  /** Small chips and tags */
  chip:
    "rounded-full bg-[#eef6fb] border border-[#dceaf4]",

  /** Upload / drop zones */
  dropzone:
    "rounded-[16px] bg-[#f8fcff] border border-dashed border-[#dceaf4]",
} as const;
