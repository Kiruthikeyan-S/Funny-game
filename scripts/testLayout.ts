import { clamp, computeControlLayout, computeHudLayout, computeStageScale, ENGINE_STAGE_H } from '../utils/gameLayout';

function check(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`LAYOUT FAIL: ${msg}`);
}

// Landscape-only. Includes the sizes the user asked for (rotated) and small phones.
const sizes: [number, number][] = [
  [640, 360], [800, 360], [873, 393], [915, 412], [1600, 720], [800, 360 - 0], [1280, 720],
];
const insets = { l: 24, r: 24 }; // worst-case notch / gesture insets

for (const [w, h] of sizes) {
  const label = `${w}x${h} landscape`;
  const st = computeStageScale(w, h);
  check(Math.abs(st.scale * ENGINE_STAGE_H - h) < 0.5, `${label}: stage does not fill screen height`);
  check(st.logicalW >= 420, `${label}: logical view only ${st.logicalW.toFixed(0)} wide`);

  const c = computeControlLayout(w, h, insets.l, insets.r);
  check(c.totalW <= c.availW, `${label}: controls need ${c.totalW}px but only ${c.availW}px available`);
  check(c.mid >= 34 && c.big >= 44, `${label}: touch targets too small (${c.mid}/${c.big})`);
  check(c.height <= h * 0.25, `${label}: controls cover ${(c.height / h * 100).toFixed(0)}% of height`);

  const hud = computeHudLayout(w, h, insets.l, insets.r);
  check(hud.centerW >= 190, `${label}: HUD centre only ${hud.centerW}px`);
  check(hud.leftW + hud.centerW + hud.rightW + 16 <= hud.availW + 1, `${label}: HUD row overflows`);
  check(hud.topH <= h * 0.34, `${label}: HUD covers ${(hud.topH / h * 100).toFixed(0)}% of height`);

  console.log(
    `[PASS] ${label}: stage scale ${st.scale.toFixed(2)} (logical ${st.logicalW.toFixed(0)}x250), controls ${c.totalW}/${c.availW}px (big ${c.big}, mid ${c.mid}), HUD L${hud.leftW}+C${hud.centerW}+R${hud.rightW}/${hud.availW}px, top ${(hud.topH / h * 100).toFixed(0)}% / bottom ${(c.height / h * 100).toFixed(0)}%`
  );
}
console.log('\nALL LANDSCAPE LAYOUT CHECKS PASSED');
