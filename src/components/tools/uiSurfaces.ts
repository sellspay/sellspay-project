/**
 * Shared dark surface system — contrast ladder for layered depth.
 *
 *   Page bg (#0e0e10) → Tool shell (#18181b) → Panels (#1e1e22) → Inner (#141416)
 *   Borders use subtle white alpha for separation.
 */
export const uiSurfaces = {
  /** Page-level background */
  pageBg: "bg-[#0e0e10]",

  /** Outer tool container / shell */
  toolPanel:
    "rounded-[24px] bg-[#18181b] border border-white/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.4)]",

  /** Left / Right panel cards */
  section:
    "rounded-[16px] bg-[#1e1e22] border border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.2)]",

  /** Alternate section card */
  sectionAlt:
    "rounded-[16px] bg-[#1e1e22] border border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.2)]",

  /** Inner cards (prompt area, settings, etc.) */
  innerCard:
    "rounded-[14px] bg-[#141416] border border-white/[0.06]",

  /** Input areas */
  input:
    "rounded-[14px] bg-[#0e0e10] border border-white/[0.08] text-white placeholder:text-zinc-500",

  /** Active / selected state */
  active:
    "rounded-[14px] bg-cyan-500/10 border border-cyan-500/40 text-white shadow-[0_0_0_1px_rgba(6,182,212,0.4),0_0_20px_rgba(6,182,212,0.15)]",

  /** Small chips and tags */
  chip:
    "rounded-full bg-white/[0.04] border border-white/[0.06]",

  /** Upload / drop zones */
  dropzone:
    "rounded-[16px] bg-white/[0.02] border border-dashed border-white/[0.08]",
} as const;
