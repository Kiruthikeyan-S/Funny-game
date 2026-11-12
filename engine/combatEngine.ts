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
  escapeThreshold: number;
  telegraphAbilityName: string;
}

export interface CollectibleItem {
  id: string;
  x: number;
  y: number;
  type: 'coin' | 'gem' | 'heart';
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
  comboStep: 1 | 2 | 3;
  comboWindowTimer: number;
  attackTimer: number;
  attackCooldown: number;
  blocking: boolean;
  dodgeTimer: number;
  dodgeCooldown: number;
  skillCooldown: number; // frames remaining (0 = ready)
  skillMaxCooldown: number;
  stoneFlashTimer: number;
  invulnTimer: number;
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

export function computePlayerMaxHp(levelNum: number): number {
  // Balanced Warrior HP: 120 at Lv 1 up to 216 at Lv 13
  return 120 + (levelNum - 1) * 8;
}

export function computePlayerSwordDamage(levelNum: number): number {
  // Balanced Sword Damage: 28 at Lv 1 up to 64 at Lv 13
  return 28 + (levelNum - 1) * 3;
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
  const size = isBoss ? Math.round(52 * Math.min(1.25, cfg.scale)) : 44;
  const isFlying = monsterId === 'cave_bat';

  return {
    id: nextUid(monsterId),
    monsterId,
    name: cfg.name,
    waveIndex,
    x,
    y: isFlying ? 132 : GROUND_Y - size,
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
    escapeThreshold: isBoss ? cfg.escapeThreshold || 0 : 0,
    telegraphAbilityName: cfg.abilities[0].name,
  };
}

export function createInitialEngineState(levelNumber: number): EngineState {
  const lvl = LEVELS_DATA.find((l) => l.level === levelNumber) || LEVELS_DATA[0];
  const maxHp = computePlayerMaxHp(lvl.level);
  const baseSword = computePlayerSwordDamage(lvl.level);

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
    } else if (i % 2 === 0) {
      items.push({ id: `heart_${i}`, x: px + 88, y: py - 24, type: 'heart', collected: false });
    }
  }

  // Spawn Wave 1 enemies initially; subsequent waves spawn as waves progress
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
      defense: 4 + Math.floor(lvl.level / 2),
      baseSwordDamage: baseSword,
      comboStep: 1,
      comboWindowTimer: 0,
      attackTimer: 0,
      attackCooldown: 0,
      blocking: false,
      dodgeTimer: 0,
      dodgeCooldown: 0,
      skillCooldown: 0,
      skillMaxCooldown: 240, // 4 seconds at 60fps
      stoneFlashTimer: 0,
      invulnTimer: 0,
    },
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
    toastText: `WAVE 1/${lvl.waves.length} — DEFEAT ALL FOES TO ADVANCE!`,
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
  if (p.jumpsLeft > 0 && p.stamina >= 8) {
    p.vy = p.jumpForce;
    p.jumpsLeft -= 1;
    p.onGround = false;
    p.stamina = Math.max(0, p.stamina - 8);
    return true;
  }
  return false;
}

// Player Dodge Roll Action (with i-frames & stamina cost)
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
  p.dodgeTimer = 16;
  p.dodgeCooldown = 36;
  p.vx = p.facing * 8.2;
  addDamageIndicator(state, p.x + p.w / 2, p.y - 6, 'DODGE!', '#38e4ae');
  return true;
}

// Player Balanced Sword Combo Action
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
  const reach = 72;

  for (const e of state.enemies) {
    if (e.aiState === 'DEAD') continue;
    const dx = e.x + e.w / 2 - (p.x + p.w / 2);
    const dy = Math.abs(e.y + e.h / 2 - (p.y + p.h / 2));
    const inFront = p.facing > 0 ? dx >= -14 && dx <= reach : dx <= 14 && dx >= -reach;

    if (inFront && dy < 56) {
      if (e.shieldActive) {
        addDamageIndicator(state, e.x + e.w / 2, e.y, 'BARRIER!', '#c77dff');
        state.toastText = 'CURSE BARRIER ACTIVE! USE ANCIENT STONE SKILL (🌀)!';
        continue;
      }

      // Skeleton Warrior blocks 50% of frontal hits while in IDLE/CHASE unless staggered
      let defenseMitigation = Math.round(e.defense * 0.65);
      if (e.monsterId === 'skeleton_warrior' && e.aiState === 'CHASE') {
        defenseMitigation += 6;
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
        // Hit reaction / stagger
        e.aiState = 'HURT';
        e.stateTimer = 10;
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

  // Balanced Stone Skill damage (roughly 2.2x a sword swing)
  const rawSkillDmg = Math.round(p.baseSwordDamage * 2.2);

  for (const e of state.enemies) {
    if (e.aiState === 'DEAD') continue;
    const dist = Math.abs(e.x + e.w / 2 - (p.x + p.w / 2));
    if (dist <= 195) {
      if (e.shieldActive) {
        e.shieldActive = false;
        state.toastText = "ANCIENT STONE SHATTERED THE WITCH'S CURSE BARRIER!";
        addDamageIndicator(state, e.x + e.w / 2, e.y - 16, 'SHIELD BROKEN!', '#38e4ae');
      }
      const finalDmg = Math.max(14, rawSkillDmg - Math.round(e.defense * 0.4));
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
  sourceX: number
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

  // Movement during ATTACK frame window based on distinct monster pattern
  switch (e.attackPattern) {
    case 'slime_hop':
      if (e.stateTimer === e.attackFrames - 1) {
        e.vy = -6.5;
      }
      e.x += dir * (e.moveSpeed * 1.6);
      break;

    case 'wolf_pounce':
    case 'ice_dash':
    case 'fire_breath':
      e.x += dir * (e.moveSpeed * 2.4);
      break;

    case 'bat_swoop':
      e.x += dir * (e.moveSpeed * 2.2);
      e.y = GROUND_Y - e.h - 4;
      break;

    case 'golem_slam':
    case 'frost_stomp':
    case 'knight_cleave':
      e.x += dir * (e.moveSpeed * 1.15);
      break;

    case 'skeleton_combo':
      e.x += dir * (e.moveSpeed * 1.7);
      break;

    case 'mage_volley':
    case 'witch_orb':
    case 'witch_apocalypse':
      // Spawn ranged dark/void projectiles on first attack frame
      if (!e.hasDealtDamageThisAttack) {
        e.hasDealtDamageThisAttack = true;
        const speed = e.bossPhase === 2 ? 5.8 : 4.6;
        state.projectiles.push({
          id: nextUid('proj'),
          x: e.x + e.w / 2,
          y: e.y + e.h * 0.45,
          vx: dir * speed,
          vy: 0,
          radius: 9,
          damage: e.attack,
          color: e.monsterId.includes('witch') ? '#f72585' : '#c77dff',
          ownerId: e.id,
        });
      }
      break;
  }

  // Melee / AoE hitbox check during active attack frames
  if (!e.hasDealtDamageThisAttack) {
    const dist = Math.abs(p.x + p.w / 2 - (e.x + e.w / 2));
    const dy = Math.abs(p.y + p.h / 2 - (e.y + e.h / 2));
    const effectiveRange =
      e.attackPattern === 'frost_stomp' || e.attackPattern === 'golem_slam'
        ? e.attackRange + 18
        : e.attackRange;

    if (dist <= effectiveRange && dy <= 58) {
      e.hasDealtDamageThisAttack = true;
      applyDamageToPlayer(state, e.attack, e.x);
      if (e.attackPattern === 'ice_dash' || e.attackPattern === 'frost_stomp') {
        // Frost chill drains stamina
        p.stamina = Math.max(0, p.stamina - 15);
      }
    }
  }
}

export function stepEngineFrame(state: EngineState, viewportWidth = 640): void {
  if (!state.running || state.outcome !== 'NONE') return;
  const p = state.player;
  const lvl = state.level;

  // 1. Stamina & Cooldown Recovery
  p.blocking = state.controls.block && p.stamina >= 5;
  const staminaRegen = p.blocking ? 0.12 : 0.42;
  p.stamina = Math.min(p.maxStamina, p.stamina + staminaRegen);

  if (p.attackTimer > 0) p.attackTimer -= 1;
  if (p.attackCooldown > 0) p.attackCooldown -= 1;
  if (p.comboWindowTimer > 0) p.comboWindowTimer -= 1;
  if (p.dodgeTimer > 0) p.dodgeTimer -= 1;
  if (p.dodgeCooldown > 0) p.dodgeCooldown -= 1;
  if (p.skillCooldown > 0) p.skillCooldown -= 1;
  if (p.stoneFlashTimer > 0) p.stoneFlashTimer -= 1;
  if (p.invulnTimer > 0) p.invulnTimer -= 1;

  // 2. Player Horizontal Movement & Wave Encounter Gate Lock
  if (p.dodgeTimer <= 0) {
    const moveFactor = p.blocking ? 0.5 : 1.0;
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

  // Enforce Wave Gate Boundary so players cannot bypass combat encounters!
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
      else {
        p.hp = Math.min(p.maxHp, p.hp + 30);
        addDamageIndicator(state, p.x + p.w / 2, p.y - 8, '+30 HP', '#52b788');
      }
    }
  }

  // 6. Update 9-State Enemy AI State Machine
  state.bossWarningText = '';

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];

    // Boss Phase 2 Enrage at <= 50% HP
    if (e.isBoss && e.bossPhase === 1 && e.hp <= e.maxHp * 0.5 && e.hp > 0) {
      e.bossPhase = 2;
      e.attack = Math.round(e.attack * 1.2);
      e.moveSpeed = +(e.moveSpeed * 1.18).toFixed(2);
      state.toastText = `⚠️ ${e.name.toUpperCase()} ENTERED PHASE 2!`;
    }

    // Level 6 Witch Story Encounter: Escapes at 35% HP
    if (e.isBoss && e.escapeThreshold > 0 && e.hp > 0 && e.hp <= e.maxHp * e.escapeThreshold) {
      state.enemiesDefeated += 1;
      state.coinsCollected += 60;
      state.enemies.splice(i, 1);
      state.dialogueSpeaker = 'THE WITCH';
      state.dialogueText =
        'My curse is too strong for you now! Journey to the Frozen Mountains to awaken the Stone!';
      state.toastText = 'THE WITCH ESCAPED! ADVANCE TO THE PORTAL!';
      continue;
    }

    if (e.attackCooldown > 0) e.attackCooldown -= 1;

    // Gravity for jumping slimes / swooping bats returning to altitude
    if (e.monsterId === 'cave_bat' && e.aiState !== 'ATTACK') {
      e.y += (132 - e.y) * 0.12;
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
          const cfg = MONSTERS_DATA[e.monsterId];
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
          state.coinsCollected += e.isBoss ? 75 : 20;
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
      applyDamageToPlayer(state, proj.damage, proj.x);
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
      state.toastText = `WAVE ${state.currentWave}/${state.totalWaves} SPAWNED!`;
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
