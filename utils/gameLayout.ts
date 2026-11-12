// Pure responsive-layout math for the gameplay screen (unit-testable, no React).

export const ENGINE_STAGE_H = 250; // logical stage height used by the combat engine

export interface ControlSizes {
  small: number;
  big: number;
  bigAction: number;
  gap: number;
  pad: number;
  leftW: number;
  rightW: number;
  totalW: number;
  availW: number;
  rightH: number;
}

export function computeControlSizes(w: number, h: number, isLandscape: boolean): ControlSizes {
  const pad = isLandscape ? 14 : 12;
  const gap = 6;
  const availW = w - pad * 2;
  const maxSmall = isLandscape ? Math.min(46, h * 0.125) : 54;
  const maxBig = isLandscape ? Math.min(60, h * 0.165) : 76;

  const small = Math.max(36, Math.floor(Math.min(maxSmall, (availW * 0.58 - gap * 3) / 4)));
  const rightW = small * 4 + gap * 3;
  const big = Math.max(44, Math.floor(Math.min(maxBig, (availW - rightW - 12 - gap) / 2)));
  const bigAction = Math.round(small * 1.3);
  const leftW = big * 2 + gap;
  const rightH = small + bigAction + gap;
  return {
    small,
    big,
    bigAction,
    gap,
    pad,
    leftW,
    rightW,
    totalW: leftW + rightW + 12,
    availW,
    rightH,
  };
}

export interface StageScale {
  scale: number;
  logicalW: number;
  contentH: number;
}

/** Scale the engine's 250px-high logical stage to fill the real stage box. */
export function computeStageScale(stageW: number, stageH: number, isLandscape: boolean): StageScale {
  const targetLogicalW = isLandscape ? 520 : 280;
  const scale = Math.max(0.5, Math.min(stageH / ENGINE_STAGE_H, stageW / targetLogicalW));
  return { scale, logicalW: stageW / scale, contentH: ENGINE_STAGE_H * scale };
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
