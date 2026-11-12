// Pure responsive-layout math for the LANDSCAPE-ONLY gameplay screen (unit-testable).

export const ENGINE_STAGE_H = 250; // logical stage height used by the combat engine

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export interface StageScale {
  scale: number;
  logicalW: number;
}

/** Stage fills the whole screen: logical 250px height maps to full screen height. */
export function computeStageScale(screenW: number, screenH: number): StageScale {
  const scale = Math.max(0.5, screenH / ENGINE_STAGE_H);
  return { scale, logicalW: screenW / scale };
}

export interface ControlLayout {
  big: number; // move + jump
  mid: number; // potion/block/skill/dodge/heavy
  attack: number;
  gap: number;
  leftW: number;
  midW: number;
  rightW: number;
  totalW: number;
  availW: number;
  height: number;
}

export function computeControlLayout(screenW: number, screenH: number, insetL = 0, insetR = 0): ControlLayout {
  const pad = 14;
  const availW = screenW - insetL - insetR - pad * 2;
  const gap = 6;
  const big = Math.floor(clamp(Math.min(screenH * 0.19, screenW * 0.085), 44, 74));
  const mid = Math.floor(big * 0.78);
  const attack = Math.floor(big * 0.95);
  const leftW = big * 2 + 8;
  const midW = mid * 5 + attack + gap * 5;
  const rightW = big;
  return {
    big, mid, attack, gap, leftW, midW, rightW,
    totalW: leftW + midW + rightW + 16,
    availW,
    height: big,
  };
}

export interface HudLayout {
  u: number; // global HUD scale
  leftW: number;
  rightW: number;
  centerW: number;
  availW: number;
  topH: number;
}

export function computeHudLayout(screenW: number, screenH: number, insetL = 0, insetR = 0): HudLayout {
  const u = clamp(Math.min(screenH / 360, screenW / 800), 0.8, 1.5);
  const pad = 10;
  const availW = screenW - insetL - insetR - pad * 2;
  const leftW = Math.round(182 * u);
  const rightW = Math.round(214 * u);
  const centerW = Math.min(Math.round(330 * u), availW - leftW - rightW - 16);
  return { u, leftW, rightW, centerW, availW, topH: Math.round(104 * u) };
}
