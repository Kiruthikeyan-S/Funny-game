// ============================================================================
// THE CURSED KINGDOM — CORE 2D COMBAT, 9-STATE ENEMY AI & WAVE ENGINE
// ============================================================================

import {
  EnemyAIState,
  LEVELS_DATA,
  LevelInfo,
  MONSTERS_DATA,
  MonsterAttackPattern,
  MonsterId,
} from '../constants/gameData';

export const STAGE_HEIGHT = 250;
export const GROUND_Y = 204;

export interface PlayerUpgrades {
  weapon: number; // 1..5
  armor: number;  // 1..5
  health: number; // 1..5
  skill: number;  // 1..5
}

export const DEFAULT_UPGRADES: PlayerUpgrades = {
  weapon: 1,
  armor: 1,
  health: 1,
  skill: 1,
};

export interface DamageIndicator {
  id: string;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
}

export interface EnemyProjectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  ownerId: string;
  effect?: 'poison' | 'freeze' | 'fire';
}

export interface ActiveEnemy {
  id: string;
  monsterId: MonsterId;
  name: string;
  waveIndex: number;
  x: number;
  y: number;
  startX: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  detectRange: number;
  attackRange: number;
  windupFrames: number;
  attackFrames: number;
  recoverFrames: number;
  cooldownFrames: number;
  attackPattern: MonsterAttackPattern;
  aiState: EnemyAIState;
  stateTimer: number;
  attackCooldown: number;
  hasDealtDamageThisAttack: boolean;
  isBoss: boolean;
  bossPhase: 1 | 2;
  shieldActive: boolean;
  guardBroken: boolean;
  escapeThreshold: number;
  telegraphAbilityName: string;
}

export interface CollectibleItem {
  id: string;
  x: number;
  y: number;
  type: 'coin' | 'gem' | 'heart' | 'potion';
  collected: boolean;
}

export interface PlayerEntity {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  speed: number;
  jumpForce: number;
  facing: number;
  onGround: boolean;
  jumpsLeft: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  defense: number;
  baseSwordDamage: number;
  skillDamageMult: number;
  comboStep: 1 | 2 | 3;
  comboWindowTimer: number;
  attackTimer: number;
  heavyAttackTimer: number;
  attackCooldown: number;
  blocking: boolean;
  dodgeTimer: number;
  dodgeCooldown: number;
  skillCooldown: number; // frames remaining (0 = ready)
  skillMaxCooldown: number;
  potionCooldown: number;
  stoneFlashTimer: number;
  invulnTimer: number;
  poisonTimer: number;
  rootTimer: number;
}

export interface EngineState {
  running: boolean;
  level: LevelInfo;
  startTimeMs: number;
  cameraX: number;
  controls: {
    left: boolean;
    right: boolean;
    block: boolean;
  };
  player: PlayerEntity;
  potionsLeft: number;
  platforms: { x: number; y: number; w: number; h: number }[];
  enemies: ActiveEnemy[];
  projectiles: EnemyProjectile[];
  items: CollectibleItem[];
  damageIndicators: DamageIndicator[];
  checkpointX: number;
  checkpointActivated: boolean;
  currentWave: number;
  totalWaves: number;
  allWavesCleared: boolean;
  portalX: number;
  coinsCollected: number;
  gemsCollected: number;
  enemiesDefeated: number;
  bossWarningText: string;
  bossIntroTimer: number;
  bossDefeatedTimer: number;
  bossDefeatedName: string;
  toastText: string;
  dialogueSpeaker: string;
  dialogueText: string;
  outcome: 'NONE' | 'VICTORY' | 'DEFEAT';
}

let uidCounter = 1;
function nextUid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${uidCounter}`;
}

const WEAPON_BONUS = [0, 6, 13, 21, 30];
const ARMOR_BONUS = [0, 4, 9, 15, 22];
const HEALTH_BONUS = [0, 25, 55, 90, 135];
const SKILL_MULT = [2.2, 2.53, 2.86, 3.3, 3.85];
const SKILL_COOLDOWN = [240, 216, 192, 168, 144];

export function computePlayerMaxHp(levelNum: number, healthTier = 1): number {
  const tierIdx = Math.max(0, Math.min(4, healthTier - 1));
  return 120 + (levelNum - 1) * 8 + HEALTH_BONUS[tierIdx];
}

export function computePlayerSwordDamage(levelNum: number, weaponTier = 1): number {
  const tierIdx = Math.max(0, Math.min(4, weaponTier - 1));
  return 28 + (levelNum - 1) * 3 + WEAPON_BONUS[tierIdx];
}

export function computePlayerDefense(levelNum: number, armorTier = 1): number {
  const tierIdx = Math.max(0, Math.min(4, armorTier - 1));
  return 4 + Math.floor(levelNum / 2) + ARMOR_BONUS[tierIdx];
}

export function createEnemyFromMonster(
  monsterId: MonsterId,
  x: number,
  waveIndex: number,
  isBossOverride = false
): ActiveEnemy {
  const cfg = MONSTERS_DATA[monsterId];
  const isBoss = isBossOverride || cfg.isBoss;
  const maxHp = isBoss ? cfg.combatHp : cfg.minionHp;
  const size = isBoss ? Math.round(54 * Math.min(1.28, cfg.scale)) : 44;
  const isFlying = Boolean(cfg.isFlying);

  return {
    id: nextUid(monsterId),
    monsterId,
    name: cfg.name,
    waveIndex,
    x,
    y: isFlying ? 128 : GROUND_Y - size,
    startX: x,
    w: size,
    h: size,
    vx: 0,
    vy: 0,
    facing: -1,
    hp: maxHp,
    maxHp,
    attack: isBoss ? cfg.combatAttack : Math.round(cfg.combatAttack * 0.8),
    defense: isBoss ? cfg.combatDefense : Math.round(cfg.combatDefense * 0.7),
    moveSpeed: cfg.moveSpeed,
    detectRange: cfg.detectRange,
    attackRange: cfg.attackRange,
    windupFrames: cfg.windupFrames,
    attackFrames: cfg.attackFrames,
    recoverFrames: cfg.recoverFrames,
    cooldownFrames: cfg.cooldownFrames,
    attackPattern: cfg.attackPattern,
    aiState: 'IDLE',
    stateTimer: 25,
    attackCooldown: 20,
    hasDealtDamageThisAttack: false,
    isBoss,
    bossPhase: 1,
    shieldActive: Boolean(isBoss && cfg.needsStone),
    guardBroken: false,
    escapeThreshold: isBoss ? cfg.escapeThreshold || 0 : 0,
    telegraphAbilityName: cfg.abilities[0].name,
  };
}

export function createInitialEngineState(
  levelNumber: number,
  upgrades: PlayerUpgrades = DEFAULT_UPGRADES,
  initialPotions = 3
): EngineState {
  const lvl = LEVELS_DATA.find((l) => l.level === levelNumber) || LEVELS_DATA[0];
  const maxHp = computePlayerMaxHp(lvl.level, upgrades.health);
  const baseSword = computePlayerSwordDamage(lvl.level, upgrades.weapon);
  const defense = computePlayerDefense(lvl.level, upgrades.armor);
  const skillTierIdx = Math.max(0, Math.min(4, upgrades.skill - 1));

  const platforms: { x: number; y: number; w: number; h: number }[] = [];
  const items: CollectibleItem[] = [];
  const count = Math.floor(lvl.length / 250);
  for (let i = 1; i < count; i++) {
    const px = i * 240;
    const py = i % 2 === 0 ? 142 : 108;
    platforms.push({ x: px, y: py, w: 112, h: 14 });
    items.push({ id: `coin_${i}_a`, x: px + 24, y: py - 24, type: 'coin', collected: false });
    items.push({ id: `coin_${i}_b`, x: px + 60, y: py - 24, type: 'coin', collected: false });
    if (i <= lvl.gemsInLevel) {
      items.push({ id: `gem_${i}`, x: px + 88, y: py - 26, type: 'gem', collected: false });
    } else if (i % 3 === 0) {
      items.push({ id: `potion_${i}`, x: px + 88, y: py - 24, type: 'potion', collected: false });
    } else if (i % 2 === 0) {
      items.push({ id: `heart_${i}`, x: px + 88, y: py - 24, type: 'heart', collected: false });
    }
  }

  const firstWave = lvl.waves[0];
  const enemies: ActiveEnemy[] = firstWave
    ? firstWave.spawns.map((s) =>
        createEnemyFromMonster(s.monsterId, s.offsetX, 1, Boolean(s.isBoss))
      )
    : [];

  return {
    running: true,
    level: lvl,
    startTimeMs: Date.now(),
    cameraX: 0,
    controls: { left: false, right: false, block: false },
    player: {
      x: 68,
      y: GROUND_Y - 48,
      w: 38,
      h: 48,
      vx: 0,
      vy: 0,
      speed: 4.5,
      jumpForce: -10.8,
      facing: 1,
      onGround: true,
      jumpsLeft: 2,
      hp: maxHp,
      maxHp,
      stamina: 100,
      maxStamina: 100,
      defense,
      baseSwordDamage: baseSword,
      skillDamageMult: SKILL_MULT[skillTierIdx],
      comboStep: 1,
      comboWindowTimer: 0,
      attackTimer: 0,
      heavyAttackTimer: 0,
      attackCooldown: 0,
      blocking: false,
      dodgeTimer: 0,
      dodgeCooldown: 0,
      skillCooldown: 0,
      skillMaxCooldown: SKILL_COOLDOWN[skillTierIdx],
      potionCooldown: 0,
      stoneFlashTimer: 0,
      invulnTimer: 0,
      poisonTimer: 0,
      rootTimer: 0,
    },
    potionsLeft: initialPotions,
    platforms,
    enemies,
    projectiles: [],
    items,
    damageIndicators: [],
    checkpointX: lvl.checkpointX,
    checkpointActivated: false,
    currentWave: 1,
    totalWaves: lvl.waves.length,
    allWavesCleared: false,
    portalX: lvl.length - 85,
    coinsCollected: 0,
    gemsCollected: 0,
    enemiesDefeated: 0,
    bossWarningText: '',
    bossIntroTimer: 0,
    bossDefeatedTimer: 0,
    bossDefeatedName: '',
    toastText: `WAVE 1/${lvl.waves.length} — ${lvl.objective.toUpperCase()}`,
    dialogueSpeaker: lvl.introSpeaker,
    dialogueText: lvl.introDialogue,
    outcome: 'NONE',
  };
}

export function addDamageIndicator(
  state: EngineState,
  x: number,
  y: number,
  text: string,
  color: string
): void {
  state.damageIndicators.push({
    id: nextUid('dmg'),
    x,
    y,
    vy: -1.4,
    text,
    color,
    life: 36,
  });
}

// Player Jump Action
export function playerJump(state: EngineState): boolean {
  if (!state.running || state.outcome !== 'NONE') return false;
  const p = state.player;
  if (p.rootTimer > 0) {
    state.toastText = 'TRAPPED BY ROOTS! DODGE OR WAIT TO BREAK FREE!';
    return false;
  }
  if (p.jumpsLeft > 0 && p.stamina >= 8) {
    p.vy = p.jumpForce;
    p.jumpsLeft -= 1;
    p.onGround = false;
    p.stamina = Math.max(0, p.stamina - 8);
    return true;
  }
  return false;
}

// Player Dodge Roll Action (with i-frames, root escape & stamina cost)
export function playerDodge(state: EngineState): boolean {
  if (!state.running || state.outcome !== 'NONE') return false;
  const p = state.player;
  if (p.dodgeCooldown > 0 || p.stamina < 22) {
    if (p.stamina < 22) {
      state.toastText = 'LOW STAMINA FOR DODGE!';
    }
    return false;
  }
  p.stamina -= 22;
  p.rootTimer = 0; // Dodge breaks root snares
  p.dodgeTimer = 16;
  p.dodgeCooldown = 36;
  p.vx = p.facing * 8.2;
  addDamageIndicator(state, p.x + p.w / 2, p.y - 6, 'DODGE!', '#38e4ae');
  return true;
}

// Player Healing Potion Usage
export function playerUsePotion(state: EngineState): boolean {
  if (!state.running || state.outcome !== 'NONE') return false;
  const p = state.player;
  if (p.potionCooldown > 0) return false;
  if (state.potionsLeft <= 0) {
    state.toastText = 'NO POTIONS LEFT! COLLECT OR BUY MORE IN ARMORY!';
    return false;
  }
  if (p.hp >= p.maxHp && p.poisonTimer <= 0) {
    state.toastText = 'HEALTH IS ALREADY FULL!';
    return false;
  }

  state.potionsLeft -= 1;
  p.potionCooldown = 45;
  p.poisonTimer = 0;
  p.rootTimer = 0;
  const healAmount = Math.max(55, Math.round(p.maxHp * 0.45));
  p.hp = Math.min(p.maxHp, p.hp + healAmount);
  state.toastText = `USED HEALING POTION (+${healAmount} HP)!`;
  addDamageIndicator(state, p.x + p.w / 2, p.y - 10, `+${healAmount} HP 🧪`, '#52b788');
  return true;
}

// Player Balanced Sword Combo Action (Light Attack)
export function playerSwordAttack(state: EngineState): boolean {
  if (!state.running || state.outcome !== 'NONE') return false;
  const p = state.player;
  if (p.attackCooldown > 0) return false;
  if (p.stamina < 12) {
    state.toastText = 'OUT OF STAMINA! WAIT TO RECOVER!';
    return false;
  }

  p.stamina = Math.max(0, p.stamina - 12);
  if (p.comboWindowTimer > 0) {
    p.comboStep = p.comboStep === 1 ? 2 : p.comboStep === 2 ? 3 : 1;
  } else {
    p.comboStep = 1;
  }

  p.attackTimer = 12;
  p.attackCooldown = 15;
  p.comboWindowTimer = 38;

  const comboMult = p.comboStep === 3 ? 1.35 : p.comboStep === 2 ? 1.15 : 1.0;
  const rawSwordDmg = Math.round(p.baseSwordDamage * comboMult);
  const reach = 74;

  for (const e of state.enemies) {
    if (e.aiState === 'DEAD') continue;
    const dx = e.x + e.w / 2 - (p.x + p.w / 2);
    const dy = Math.abs(e.y + e.h / 2 - (p.y + p.h / 2));
    const inFront = p.facing > 0 ? dx >= -14 && dx <= reach : dx <= 14 && dx >= -reach;

    if (inFront && dy < 64) {
      if (e.shieldActive) {
        addDamageIndicator(state, e.x + e.w / 2, e.y, 'DARK SHIELD!', '#c77dff');
        state.toastText = 'DARK SHIELD ACTIVE! USE ANCIENT STONE SKILL (🌀)!';
        continue;
      }

      // Skeleton Knight shield defense reduces light sword damage unless guard is broken
      let defenseMitigation = Math.round(e.defense * 0.65);
      if (e.monsterId === 'skeleton_knight' && !e.guardBroken && e.aiState === 'CHASE') {
        defenseMitigation += 8;
        addDamageIndicator(state, e.x + e.w / 2, e.y - 18, 'SHIELD GUARD', '#4cc9f0');
      }

      const finalDmg = Math.max(8, rawSwordDmg - defenseMitigation);
      e.hp = Math.max(0, e.hp - finalDmg);
      e.x += p.facing * (e.isBoss ? 6 : 14);

      addDamageIndicator(
        state,
        e.x + e.w / 2,
        e.y - 4,
        p.comboStep === 3 ? `-${finalDmg}!` : `-${finalDmg}`,
        p.comboStep === 3 ? '#ffd152' : '#ffffff'
      );

      if (e.hp <= 0) {
        e.aiState = 'DEAD';
        e.stateTimer = 18;
      } else if (!e.isBoss || e.aiState !== 'ATTACK') {
        e.aiState = 'HURT';
        e.stateTimer = 10;
      }
    }
  }

  return true;
}

// Player Heavy Attack Action (Guard Breaker + High Impact)
export function playerHeavyAttack(state: EngineState): boolean {
  if (!state.running || state.outcome !== 'NONE') return false;
  const p = state.player;
  if (p.attackCooldown > 0) return false;
  if (p.stamina < 20) {
    state.toastText = 'NEED 20 STAMINA FOR HEAVY CLEAVE!';
    return false;
  }

  p.stamina = Math.max(0, p.stamina - 20);
  p.heavyAttackTimer = 16;
  p.attackTimer = 16;
  p.attackCooldown = 24;

  const rawHeavyDmg = Math.round(p.baseSwordDamage * 1.65);
  const reach = 86;

  for (const e of state.enemies) {
    if (e.aiState === 'DEAD') continue;
    const dx = e.x + e.w / 2 - (p.x + p.w / 2);
    const dy = Math.abs(e.y + e.h / 2 - (p.y + p.h / 2));
    const inFront = p.facing > 0 ? dx >= -16 && dx <= reach : dx <= 16 && dx >= -reach;

    if (inFront && dy < 70) {
      if (e.shieldActive) {
        addDamageIndicator(state, e.x + e.w / 2, e.y, 'DARK SHIELD!', '#c77dff');
        state.toastText = 'ONLY THE ANCIENT STONE SKILL (🌀) CAN PIERCE THE WITCH SHIELD!';
        continue;
      }

      if (e.monsterId === 'skeleton_knight' && !e.guardBroken) {
        e.guardBroken = true;
        addDamageIndicator(state, e.x + e.w / 2, e.y - 18, 'GUARD BROKEN!', '#ffd152');
      }

      const defenseMitigation = Math.round(e.defense * 0.45);
      const finalDmg = Math.max(14, rawHeavyDmg - defenseMitigation);
      e.hp = Math.max(0, e.hp - finalDmg);
      e.x += p.facing * (e.isBoss ? 12 : 22);

      addDamageIndicator(state, e.x + e.w / 2, e.y - 6, `-${finalDmg}!!`, '#ff70a6');

      if (e.hp <= 0) {
        e.aiState = 'DEAD';
        e.stateTimer = 18;
      } else {
        e.aiState = 'HURT';
        e.stateTimer = 14;
      }
    }
  }

  return true;
}

// Player Ancient Stone Special Skill (with cooldown & stamina check)
export function playerStoneSkill(state: EngineState): boolean {
  if (!state.running || state.outcome !== 'NONE') return false;
  const p = state.player;
  if (p.skillCooldown > 0) {
    const sec = (p.skillCooldown / 60).toFixed(1);
    state.toastText = `STONE SKILL COOLDOWN (${sec}s)`;
    return false;
  }
  if (p.stamina < 28) {
    state.toastText = 'NEED 28 STAMINA FOR ANCIENT STONE SKILL!';
    return false;
  }

  p.stamina -= 28;
  p.skillCooldown = p.skillMaxCooldown;
  p.stoneFlashTimer = 16;
  p.rootTimer = 0;

  const rawSkillDmg = Math.round(p.baseSwordDamage * p.skillDamageMult);

  for (const e of state.enemies) {
    if (e.aiState === 'DEAD') continue;
    const dist = Math.abs(e.x + e.w / 2 - (p.x + p.w / 2));
    if (dist <= 200) {
      if (e.shieldActive) {
        e.shieldActive = false;
        state.toastText = "ANCIENT STONE SHATTERED THE WITCH QUEEN'S DARK SHIELD!";
        addDamageIndicator(state, e.x + e.w / 2, e.y - 16, 'SHIELD BROKEN!', '#38e4ae');
      }
      e.guardBroken = true;
      const finalDmg = Math.max(16, rawSkillDmg - Math.round(e.defense * 0.4));
      e.hp = Math.max(0, e.hp - finalDmg);
      addDamageIndicator(state, e.x + e.w / 2, e.y - 4, `-${finalDmg} 💎`, '#38e4ae');

      if (e.hp <= 0) {
        e.aiState = 'DEAD';
        e.stateTimer = 18;
      } else {
        e.aiState = 'HURT';
        e.stateTimer = 14;
      }
    }
  }

  return true;
}

export function applyDamageToPlayer(
  state: EngineState,
  rawEnemyAttack: number,
  sourceX: number,
  effect?: 'poison' | 'freeze' | 'root' | 'fire'
): void {
  const p = state.player;
  if (state.outcome !== 'NONE') return;

  // Dodge Roll i-frames
  if (p.dodgeTimer > 0) {
    if (p.invulnTimer <= 0) {
      addDamageIndicator(state, p.x + p.w / 2, p.y - 8, 'DODGED!', '#38e4ae');
      p.invulnTimer = 10;
    }
    return;
  }

  if (p.invulnTimer > 0) return;

  const mitigated = Math.max(5, rawEnemyAttack - p.defense);

  // Shield Block mitigation
  if (p.blocking && p.stamina >= 12) {
    const blockedDmg = Math.max(2, Math.round(mitigated * 0.25));
    p.stamina = Math.max(0, p.stamina - 14);
    p.hp = Math.max(0, p.hp - blockedDmg);
    p.invulnTimer = 18;
    addDamageIndicator(state, p.x + p.w / 2, p.y - 8, `BLOCKED -${blockedDmg}`, '#4cc9f0');
  } else {
    p.hp = Math.max(0, p.hp - mitigated);
    p.invulnTimer = 28;
    p.vx = sourceX > p.x ? -4.5 : 4.5;
    addDamageIndicator(state, p.x + p.w / 2, p.y - 8, `-${mitigated}`, '#ff4d6d');

    if (effect === 'poison') {
      p.poisonTimer = 180;
      state.toastText = 'POISONED BY VENOM! USE A POTION (🧪) OR HEAL!';
      addDamageIndicator(state, p.x + p.w / 2, p.y - 20, 'POISONED!', '#80ed99');
    } else if (effect === 'root') {
      p.rootTimer = 45;
      state.toastText = 'SNARED BY ROOTS! PRESS DODGE (💨) TO BREAK FREE!';
      addDamageIndicator(state, p.x + p.w / 2, p.y - 20, 'ROOTED!', '#52b788');
    } else if (effect === 'freeze') {
      p.stamina = Math.max(0, p.stamina - 16);
      addDamageIndicator(state, p.x + p.w / 2, p.y - 20, 'FROST CHILL!', '#90e0ef');
    }
  }

  if (p.hp <= 0) {
    state.running = false;
    state.outcome = 'DEFEAT';
  }
}

function executeMonsterAttackPattern(state: EngineState, e: ActiveEnemy): void {
  const p = state.player;
  const dir = p.x >= e.x ? 1 : -1;
  e.facing = dir;

  switch (e.attackPattern) {
    case 'goblin_rush':
      e.x += dir * (e.moveSpeed * 1.9);
      break;

    case 'wolf_pounce':
      if (e.stateTimer === e.attackFrames - 1 && e.y + e.h >= GROUND_Y - 2) {
        e.vy = -5.8;
      }
      e.x += dir * (e.moveSpeed * 2.35);
      break;

    case 'tree_root_smash':
    case 'golem_freeze':
      e.x += dir * (e.moveSpeed * 1.15);
      break;

    case 'skeleton_shield':
      e.x += dir * (e.moveSpeed * 1.7);
      break;

    case 'assassin_blink':
      // On first frame of attack, Shadow Assassin blinks behind the warrior
      if (e.stateTimer === e.attackFrames) {
        const behindOffset = p.facing > 0 ? -48 : 48;
        e.x = Math.max(24, Math.min(state.level.length - 60, p.x + behindOffset));
        e.facing = p.x >= e.x ? 1 : -1;
        addDamageIndicator(state, e.x + e.w / 2, e.y - 10, 'SHADOW BLINK!', '#c77dff');
      }
      e.x += e.facing * (e.moveSpeed * 1.9);
      break;

    case 'wyvern_aerial':
    case 'dragon_inferno':
      e.x += dir * (e.moveSpeed * 2.1);
      e.y = GROUND_Y - e.h - 6;
      if (!e.hasDealtDamageThisAttack && e.stateTimer === Math.floor(e.attackFrames / 2)) {
        state.projectiles.push({
          id: nextUid('proj'),
          x: e.x + e.w / 2,
          y: e.y + e.h * 0.5,
          vx: dir * 5.2,
          vy: 0,
          radius: 9,
          damage: e.attack,
          color: e.attackPattern === 'wyvern_aerial' ? '#90e0ef' : '#f77f00',
          ownerId: e.id,
          effect: e.attackPattern === 'wyvern_aerial' ? 'freeze' : 'fire',
        });
      }
      break;

    case 'beast_tri_storm':
      e.x += dir * (e.moveSpeed * 1.65);
      if (!e.hasDealtDamageThisAttack && e.bossPhase === 2) {
        state.projectiles.push({
          id: nextUid('proj'),
          x: e.x + e.w / 2,
          y: e.y + e.h * 0.45,
          vx: dir * 5.4,
          vy: 0,
          radius: 10,
          damage: e.attack,
          color: '#00b4d8',
          ownerId: e.id,
          effect: 'freeze',
        });
      }
      break;

    case 'demon_shockwave':
      e.x += dir * (e.moveSpeed * 1.35);
      if (!e.hasDealtDamageThisAttack) {
        state.projectiles.push({
          id: nextUid('proj'),
          x: e.x + e.w / 2,
          y: GROUND_Y - 14,
          vx: dir * 5.5,
          vy: 0,
          radius: 10,
          damage: e.attack,
          color: '#f77f00',
          ownerId: e.id,
          effect: 'fire',
        });
      }
      break;

    case 'spider_venom':
    case 'witch_curse':
    case 'witch_queen_final':
      if (!e.hasDealtDamageThisAttack) {
        e.hasDealtDamageThisAttack = true;
        const speed = e.bossPhase === 2 ? 5.8 : 4.7;
        const isSpider = e.attackPattern === 'spider_venom';
        state.projectiles.push({
          id: nextUid('proj'),
          x: e.x + e.w / 2,
          y: e.y + e.h * 0.45,
          vx: dir * speed,
          vy: 0,
          radius: 9,
          damage: e.attack,
          color: isSpider ? '#80ed99' : '#f72585',
          ownerId: e.id,
          effect: isSpider ? 'poison' : undefined,
        });
      }
      break;
  }

  // Melee / AoE hitbox check during active attack frames
  if (!e.hasDealtDamageThisAttack) {
    const dist = Math.abs(p.x + p.w / 2 - (e.x + e.w / 2));
    const dy = Math.abs(p.y + p.h / 2 - (e.y + e.h / 2));
    const effectiveRange =
      e.attackPattern === 'tree_root_smash' ||
      e.attackPattern === 'golem_freeze' ||
      e.attackPattern === 'beast_tri_storm'
        ? e.attackRange + 18
        : e.attackRange;

    if (dist <= effectiveRange && dy <= 62) {
      e.hasDealtDamageThisAttack = true;
      const statusEffect =
        e.attackPattern === 'tree_root_smash'
          ? 'root'
          : e.attackPattern === 'golem_freeze' || e.attackPattern === 'beast_tri_storm'
          ? 'freeze'
          : e.attackPattern === 'spider_venom'
          ? 'poison'
          : undefined;
      applyDamageToPlayer(state, e.attack, e.x, statusEffect);
    }
  }
}

export function stepEngineFrame(state: EngineState, viewportWidth = 640): void {
  if (!state.running || state.outcome !== 'NONE') return;
  const p = state.player;
  const lvl = state.level;

  // 1. Stamina, Status Effects & Cooldown Recovery
  p.blocking = state.controls.block && p.stamina >= 5;
  const staminaRegen = p.blocking ? 0.12 : 0.42;
  p.stamina = Math.min(p.maxStamina, p.stamina + staminaRegen);

  if (p.attackTimer > 0) p.attackTimer -= 1;
  if (p.heavyAttackTimer > 0) p.heavyAttackTimer -= 1;
  if (p.attackCooldown > 0) p.attackCooldown -= 1;
  if (p.comboWindowTimer > 0) p.comboWindowTimer -= 1;
  if (p.dodgeTimer > 0) p.dodgeTimer -= 1;
  if (p.dodgeCooldown > 0) p.dodgeCooldown -= 1;
  if (p.skillCooldown > 0) p.skillCooldown -= 1;
  if (p.potionCooldown > 0) p.potionCooldown -= 1;
  if (p.stoneFlashTimer > 0) p.stoneFlashTimer -= 1;
  if (p.invulnTimer > 0) p.invulnTimer -= 1;
  if (p.rootTimer > 0) p.rootTimer -= 1;
  if (state.bossIntroTimer > 0) state.bossIntroTimer -= 1;
  if (state.bossDefeatedTimer > 0) state.bossDefeatedTimer -= 1;

  // Poison DoT tick every 30 frames
  if (p.poisonTimer > 0) {
    p.poisonTimer -= 1;
    if (p.poisonTimer % 30 === 0) {
      p.hp = Math.max(1, p.hp - 2);
      addDamageIndicator(state, p.x + p.w / 2, p.y - 6, '-2 POISON', '#80ed99');
    }
  }

  // 2. Player Horizontal Movement & Wave Encounter Gate Lock
  if (p.dodgeTimer <= 0) {
    const moveFactor = p.rootTimer > 0 ? 0.15 : p.blocking ? 0.5 : 1.0;
    if (state.controls.left) {
      p.vx = -p.speed * moveFactor;
      p.facing = -1;
    } else if (state.controls.right) {
      p.vx = p.speed * moveFactor;
      p.facing = 1;
    } else {
      p.vx *= 0.72;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    }
  }

  const activeWaveDef = lvl.waves[state.currentWave - 1];
  const maxAllowedX =
    !state.allWavesCleared && activeWaveDef
      ? activeWaveDef.gateX
      : lvl.length - 40;

  const nextX = p.x + p.vx;
  if (nextX >= maxAllowedX && !state.allWavesCleared) {
    p.x = maxAllowedX;
    state.toastText = `WAVE ${state.currentWave}/${state.totalWaves} LOCKED — DEFEAT ALL FOES!`;
  } else {
    p.x = Math.max(16, Math.min(maxAllowedX, nextX));
  }

  // 3. Player Vertical Physics & Platforms
  p.vy += 0.56;
  p.y += p.vy;
  p.onGround = false;

  if (p.y + p.h >= GROUND_Y) {
    p.y = GROUND_Y - p.h;
    p.vy = 0;
    p.onGround = true;
    p.jumpsLeft = 2;
  }

  for (const plat of state.platforms) {
    if (
      p.x + p.w > plat.x &&
      p.x < plat.x + plat.w &&
      p.y + p.h >= plat.y &&
      p.y + p.h - p.vy <= plat.y + 12 &&
      p.vy >= 0
    ) {
      p.y = plat.y - p.h;
      p.vy = 0;
      p.onGround = true;
      p.jumpsLeft = 2;
    }
  }

  // 4. Mid-Level Checkpoint Activation
  if (!state.checkpointActivated && p.x >= state.checkpointX) {
    state.checkpointActivated = true;
    p.hp = Math.min(p.maxHp, p.hp + 35);
    p.stamina = p.maxStamina;
    state.toastText = 'CHECKPOINT REACHED! +35 HP RESTORED';
    addDamageIndicator(state, p.x + p.w / 2, p.y - 12, 'CHECKPOINT!', '#ffd152');
  }

  // 5. Collectibles
  for (const item of state.items) {
    if (
      !item.collected &&
      Math.abs(p.x + p.w / 2 - item.x) < 26 &&
      Math.abs(p.y + p.h / 2 - item.y) < 28
    ) {
      item.collected = true;
      if (item.type === 'coin') state.coinsCollected += 15;
      else if (item.type === 'gem') state.gemsCollected += 1;
      else if (item.type === 'potion') {
        state.potionsLeft += 1;
        addDamageIndicator(state, p.x + p.w / 2, p.y - 8, '+1 POTION 🧪', '#c77dff');
      } else {
        p.hp = Math.min(p.maxHp, p.hp + 30);
        addDamageIndicator(state, p.x + p.w / 2, p.y - 8, '+30 HP', '#52b788');
      }
    }
  }

  // 6. Update 9-State Enemy AI State Machine
  state.bossWarningText = '';

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    const cfg = MONSTERS_DATA[e.monsterId];

    // Boss Phase 2 Enrage at <= 50% HP
    if (e.isBoss && e.bossPhase === 1 && e.hp <= e.maxHp * 0.5 && e.hp > 0) {
      e.bossPhase = 2;
      e.attack = Math.round(e.attack * 1.2);
      e.moveSpeed = +(e.moveSpeed * 1.18).toFixed(2);
      state.toastText = `⚠️ ${e.name.toUpperCase()} ENTERED PHASE 2!`;
      addDamageIndicator(state, e.x + e.w / 2, e.y - 18, 'PHASE 2 ENRAGE!', '#ff2a55');
    }

    // Level 6 Dark Witch Story Encounter: Escapes at 35% HP
    if (e.isBoss && e.escapeThreshold > 0 && e.hp > 0 && e.hp <= e.maxHp * e.escapeThreshold) {
      state.enemiesDefeated += 1;
      state.coinsCollected += 60;
      state.bossDefeatedName = `${e.name} (Escaped)`;
      state.bossDefeatedTimer = 140;
      state.enemies.splice(i, 1);
      state.dialogueSpeaker = 'THE DARK WITCH';
      state.dialogueText =
        'My curse is too strong for you now! Journey to the Frozen Mountains to awaken the Stone!';
      state.toastText = 'THE DARK WITCH ESCAPED! ADVANCE TO THE PORTAL!';
      continue;
    }

    if (e.attackCooldown > 0) e.attackCooldown -= 1;

    // Altitude return for flying Wyverns / Dragons or gravity for ground monsters
    if (cfg.isFlying && e.aiState !== 'ATTACK') {
      e.y += (128 - e.y) * 0.12;
    } else if (e.y + e.h < GROUND_Y) {
      e.vy += 0.48;
      e.y = Math.min(GROUND_Y - e.h, e.y + e.vy);
    } else {
      e.vy = 0;
    }

    const distToPlayer = Math.abs(p.x + p.w / 2 - (e.x + e.w / 2));
    const dirToPlayer = p.x >= e.x ? 1 : -1;

    switch (e.aiState) {
      case 'IDLE': {
        e.stateTimer -= 1;
        if (distToPlayer <= e.detectRange) {
          e.aiState = 'DETECT';
          e.stateTimer = 10;
          e.facing = dirToPlayer;
        } else if (e.stateTimer <= 0) {
          e.aiState = 'PATROL';
          e.stateTimer = 90;
          e.vx = -e.moveSpeed * 0.7;
        }
        break;
      }

      case 'PATROL': {
        e.stateTimer -= 1;
        e.x += e.vx;
        e.facing = e.vx >= 0 ? 1 : -1;
        if (Math.abs(e.x - e.startX) > 85) {
          e.vx *= -1;
        }
        if (distToPlayer <= e.detectRange) {
          e.aiState = 'DETECT';
          e.stateTimer = 10;
          e.facing = dirToPlayer;
        } else if (e.stateTimer <= 0) {
          e.aiState = 'IDLE';
          e.stateTimer = 30;
        }
        break;
      }

      case 'DETECT': {
        e.facing = dirToPlayer;
        e.stateTimer -= 1;
        if (e.stateTimer <= 0) {
          e.aiState = 'CHASE';
        }
        break;
      }

      case 'CHASE': {
        e.facing = dirToPlayer;
        if (distToPlayer > e.detectRange * 1.35) {
          e.aiState = 'PATROL';
          e.stateTimer = 60;
          e.vx = -e.moveSpeed * 0.7;
        } else if (distToPlayer <= e.attackRange && e.attackCooldown <= 0) {
          e.aiState = 'PREPARE_ATTACK';
          e.stateTimer = e.windupFrames;
          e.hasDealtDamageThisAttack = false;
          const abIdx = e.bossPhase === 2 ? 2 : 0;
          e.telegraphAbilityName = cfg.abilities[abIdx]?.name || cfg.abilities[0].name;
        } else if (distToPlayer > e.attackRange * 0.75) {
          e.x += dirToPlayer * e.moveSpeed;
        }
        break;
      }

      case 'PREPARE_ATTACK': {
        e.facing = dirToPlayer;
        e.stateTimer -= 1;
        if (e.isBoss) {
          state.bossWarningText = `⚠️ ${e.name.toUpperCase()}: ${e.telegraphAbilityName.toUpperCase()} INCOMING!`;
        }
        if (e.stateTimer <= 0) {
          e.aiState = 'ATTACK';
          e.stateTimer = e.attackFrames;
          e.hasDealtDamageThisAttack = false;
        }
        break;
      }

      case 'ATTACK': {
        executeMonsterAttackPattern(state, e);
        e.stateTimer -= 1;
        if (e.stateTimer <= 0) {
          e.aiState = 'RECOVER';
          e.stateTimer = e.recoverFrames;
          e.attackCooldown = e.cooldownFrames;
        }
        break;
      }

      case 'RECOVER': {
        e.stateTimer -= 1;
        if (e.stateTimer <= 0) {
          e.aiState = distToPlayer <= e.detectRange ? 'CHASE' : 'IDLE';
          e.stateTimer = 20;
        }
        break;
      }

      case 'HURT': {
        e.stateTimer -= 1;
        if (e.stateTimer <= 0) {
          e.aiState = 'CHASE';
        }
        break;
      }

      case 'DEAD': {
        e.stateTimer -= 1;
        if (e.stateTimer <= 0) {
          state.enemiesDefeated += 1;
          state.coinsCollected += e.isBoss ? 85 : 22;
          if (e.isBoss) {
            state.bossDefeatedName = e.name;
            state.bossDefeatedTimer = 160;
            state.toastText = `👑 BOSS DEFEATED: ${e.name.toUpperCase()}!`;
          }
          state.enemies.splice(i, 1);
        }
        break;
      }
    }
  }

  // 7. Update Enemy Ranged Projectiles
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];
    proj.x += proj.vx;
    proj.y += proj.vy;

    if (
      Math.abs(p.x + p.w / 2 - proj.x) < p.w * 0.5 + proj.radius &&
      Math.abs(p.y + p.h / 2 - proj.y) < p.h * 0.5 + proj.radius
    ) {
      applyDamageToPlayer(state, proj.damage, proj.x, proj.effect);
      state.projectiles.splice(i, 1);
      continue;
    }

    if (Math.abs(proj.x - p.x) > 650) {
      state.projectiles.splice(i, 1);
    }
  }

  // 8. Update Floating Damage Indicators
  for (let i = state.damageIndicators.length - 1; i >= 0; i--) {
    const ind = state.damageIndicators[i];
    ind.y += ind.vy;
    ind.life -= 1;
    if (ind.life <= 0) {
      state.damageIndicators.splice(i, 1);
    }
  }

  // 9. Wave Progression & Required Encounter Completion Check
  if (state.enemies.length === 0 && !state.allWavesCleared) {
    if (state.currentWave < state.totalWaves) {
      state.currentWave += 1;
      const nextWaveDef = lvl.waves[state.currentWave - 1];
      if (nextWaveDef) {
        state.enemies = nextWaveDef.spawns.map((s) =>
          createEnemyFromMonster(
            s.monsterId,
            s.offsetX,
            state.currentWave,
            Boolean(s.isBoss)
          )
        );
      }
      if (state.currentWave === state.totalWaves) {
        state.bossIntroTimer = 180;
        const bossCfg = MONSTERS_DATA[lvl.monsterId];
        state.toastText = `⚠️ FINAL WAVE ${state.currentWave}/${state.totalWaves} — ${bossCfg.name.toUpperCase()} APPEARS!`;
      } else {
        state.toastText = `WAVE ${state.currentWave}/${state.totalWaves} SPAWNED!`;
      }
    } else {
      state.allWavesCleared = true;
      if (!state.toastText.includes('ESCAPED')) {
        state.toastText = 'ALL WAVES CLEARED! PORTAL UNLOCKED!';
      }
    }
  }

  // 10. Exit Portal Check (Requires all waves & boss defeated)
  if (Math.abs(p.x - state.portalX) < 38) {
    if (!state.allWavesCleared || state.enemies.length > 0) {
      state.toastText = `CLEAR WAVE ${state.currentWave}/${state.totalWaves} (${state.enemies.length} FOES LEFT)!`;
    } else {
      state.running = false;
      state.outcome = 'VICTORY';
    }
  }

  // Camera tracking
  const targetCam = p.x - viewportWidth * 0.26;
  state.cameraX = Math.max(0, Math.min(lvl.length - viewportWidth + 40, targetCam));
}
