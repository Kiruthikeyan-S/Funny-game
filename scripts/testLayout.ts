import { clamp, computeControlSizes, computeStageScale, ENGINE_STAGE_H } from '../utils/gameLayout';

function check(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`LAYOUT FAIL: ${msg}`);
}

const sizes: [number, number][] = [
  [360, 800], [393, 873], [412, 915], [720, 1600],
  [800, 360], [873, 393], [915, 412], [1600, 720],
];

for (const [w, h] of sizes) {
  const land = w > h;
  const label = `${w}x${h} ${land ? 'landscape' : 'portrait'}`;
  const c = computeControlSizes(w, h, land);

  check(c.totalW <= c.availW, `${label}: controls width ${c.totalW} > available ${c.availW}`);
  check(c.small >= 36 && c.big >= 44, `${label}: touch targets too small (${c.small}/${c.big})`);
  check(c.rightH <= (land ? h * 0.5 : h * 0.22), `${label}: control cluster height ${c.rightH} too tall`);

  // Approximate section heights (status bar + nav bar insets ~ 24 each)
  const usable = h - 48 - 12;
  const hud = land ? 26 + 56 + 8 : usable * 0.17;
  const stageH = land ? usable - hud : usable * 0.61;
  const ctrlH = land ? 0 : usable * 0.22;
  check(hud + stageH + ctrlH <= usable + 1, `${label}: sections overflow screen`);
  check(hud >= 84 || land, `${label}: HUD section too short (${hud.toFixed(0)})`);

  const sc = computeStageScale(w - 12, stageH, land);
  check(sc.contentH <= stageH + 0.5, `${label}: scaled content ${sc.contentH.toFixed(0)} taller than stage ${stageH.toFixed(0)}`);
  check(sc.logicalW >= 270, `${label}: logical view width ${sc.logicalW.toFixed(0)} too narrow to see enemies`);
  const emptyTop = stageH - sc.contentH;

  // HUD horizontal budget: left (avatar+bars) + right (stats+pause) + center must fit
  const fs = clamp(land ? h / 32 : w / 36, 9, 12.5);
  const barW = clamp(land ? w * 0.16 : w * 0.23, 72, 130);
  const avatar = clamp(fs * 3.3, 34, 46);
  const left = avatar + 6 + barW;
  const right = 78 + 6 + 32;
  const center = w - 12 - left - right - 12;
  check(center >= 90, `${label}: HUD centre only ${center.toFixed(0)}px`);

  console.log(
    `[PASS] ${label}: ctrl ${c.totalW}/${c.availW}px (small ${c.small}, big ${c.big}), stageH ${stageH.toFixed(0)} scale ${sc.scale.toFixed(2)} logicalW ${sc.logicalW.toFixed(0)} skyAbove ${emptyTop.toFixed(0)}px, HUD centre ${center.toFixed(0)}px`
  );
}
console.log(`\nALL LAYOUT CHECKS PASSED (engine stage ${ENGINE_STAGE_H}px)`);
