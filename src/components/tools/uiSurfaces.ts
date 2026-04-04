/**
 * Shared surface system — contrast ladder for layered depth.
 *
 *   Page bg (#f8fafc) → Tool shell (#e9eef5) → Panels (#dde5ee) → Inner cards (#cfd8e3)
 *   Borders step down with the surfaces for consistent separation.
 */
export const uiSurfaces = {
  /** Page-level background */
  pageBg: "bg-[#f8fafc]",

  /** Outer tool container / shell */
  toolPanel:
    "rounded-[24px] bg-[#e9eef5] border border-[#d1d5db] shadow-[0_10px_30px_rgba(0,0,0,0.06)]",

  /** Left / Right panel cards */
  section:
    "rounded-[16px] bg-[#dde5ee] border border-[#cbd5e1] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",

  /** Alternate section card (same as section for consistency) */
  sectionAlt:
    "rounded-[16px] bg-[#dde5ee] border border-[#cbd5e1] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",

  /** Inner cards (prompt area, settings, etc.) */
  innerCard:
    "rounded-[14px] bg-[#cfd8e3] border border-[#bfc9d6]",

  /** Input areas */
  input:
    "rounded-[14px] bg-[#f8fafc] border border-[#cbd5e1] text-foreground placeholder:text-[#9ca3af]",

  /** Active / selected state — blue glow */
  active:
    "rounded-[14px] bg-[#1e3a8a]/20 border border-[#3b82f6] text-foreground shadow-[0_0_0_1px_#3b82f6,0_0_20px_rgba(59,130,246,0.3)]",

  /** Small chips and tags */
  chip:
    "rounded-full bg-[#dde5ee] border border-[#cbd5e1]",

  /** Upload / drop zones */
  dropzone:
    "rounded-[16px] bg-[#dde5ee] border border-dashed border-[#cbd5e1]",
} as const;
