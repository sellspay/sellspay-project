/**
 * Shared surface system for layered depth across all Studio tools.
 *
 * 5-layer palette + 3 anchor blues for structure:
 *   App bg (#f7fbff) → Shell (#eef6fb) → Card (#fff) → Inner (#f4f9fd) → Input (#f8fcff)
 *   Mid blue (#cfe3ee) · Strong blue (#9fc2d4) · Deep accent (#6fa6bd)
 */
export const uiSurfaces = {
  /** Main tool container — shell with depth shadow */
  toolPanel:
    "rounded-[24px] bg-[#eef6fb] border border-[#cfe3ee] shadow-[inset_0_1px_0_#ffffff,0_4px_20px_rgba(111,166,189,0.15)]",

  /** Primary section card — white with mid-blue border */
  section:
    "rounded-[20px] bg-white border border-[#cfe3ee]",

  /** Alternate section card — inner tint with strong-blue border */
  sectionAlt:
    "rounded-[20px] bg-[#f4f9fd] border border-[#9fc2d4]",

  /** Input areas — lightest ice, strong border */
  input:
    "rounded-[16px] bg-[#f8fcff] border border-[#9fc2d4] shadow-[inset_0_1px_2px_rgba(111,166,189,0.10)]",

  /** Active / selected state */
  active:
    "rounded-[16px] bg-[#e6f3fb] border border-[#6fa6bd]",

  /** Small chips and tags */
  chip:
    "rounded-full bg-[#eef6fb] border border-[#cfe3ee]",

  /** Upload / drop zones */
  dropzone:
    "rounded-[18px] bg-[#f8fcff] border border-dashed border-[#9fc2d4] shadow-[inset_0_1px_3px_rgba(111,166,189,0.08)]",
} as const;
