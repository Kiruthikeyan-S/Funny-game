import { LEVELS_DATA, MONSTERS_DATA, WORLDS_DATA } from '../constants/gameData';
import {
  applyDamageToPlayer,
  computePlayerMaxHp,
  computePlayerSwordDamage,
  createEnemyFromMonster,
  createInitialEngineState,
  playerDodge,
  playerStoneSkill,
  playerSwordAttack,
  stepEngineFrame,
} from '../engine/combatEngine';

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`ASSERTION FAILED: ${message} (expected ${expected}, got ${actual})`);
  }
}

function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

export function runGameplayVerificationSuite(): void {
  console.log('=== THE CURSED KINGDOM: AUTOMATED GAMEPLAY & AI VERIFICATION ===\n');

  // 1. Test Player HP, Minion HP & Sword Damage Balance
  {
    const lv1Hp = computePlayerMaxHp(1);
    const lv13Hp = computePlayerMaxHp(13);
    const lv1Sword = computePlayerSwordDamage(1);
    const lv13Sword = computePlayerSwordDamage(13);

    assertEqual(lv1Hp, 120, 'Lv1 Player Max HP should be balanced at 120');
    assertEqual(lv13Hp, 216, 'Lv13 Player Max HP should be balanced at 216');
    assertEqual(lv1Sword, 28, 'Lv1 Base Sword Damage should be 28');
    assertEqual(lv13Sword, 64, 'Lv13 Base Sword Damage should be 64');

    const st = createInitialEngineState(1);
    const slimeMinion = st.enemies[0];
    assertEqual(slimeMinion.maxHp, 115, 'Lv1 Forest Slime minion HP should be 115');

    st.player.x = slimeMinion.x - 40;
    st.player.facing = 1;
    const swung = playerSwordAttack(st);
    assertEqual(swung, true, 'First sword swing should execute');
    const hpAfterOneHit = slimeMinion.hp;
    const dmgDealt = 115 - hpAfterOneHit;
    assertTrue(dmgDealt >= 20 && dmgDealt <= 30, `Single Lv1 swing should deal ~26 dmg (dealt ${dmgDealt})`);
    assertTrue(hpAfterOneHit > 80, 'Minion must survive multiple hits (requires ~5 swings)');

    const spamSwing = playerSwordAttack(st);
    assertEqual(spamSwing, false, 'Attack cooldown must prevent frame-spamming sword attacks');
    console.log('[PASS] 1. Sword damage, attack cooldown, player HP, and minion HP balance verified.');
  }

  // 2. Test 9-State Enemy AI State Machine & Telegraphed Attack Cycle
  {
    const st = createInitialEngineState(2);
    const wolf = createEnemyFromMonster('wild_wolf', 450, 1, false);
    st.enemies = [wolf];

    assertEqual(wolf.aiState, 'IDLE', 'Enemy starts in IDLE');

    st.player.x = 20;
    for (let i = 0; i < 30; i++) stepEngineFrame(st);
    assertEqual(wolf.aiState, 'PATROL', 'Enemy transitions from IDLE to PATROL when player is far');

    st.player.x = wolf.x - 150;
    stepEngineFrame(st);
    assertEqual(wolf.aiState, 'DETECT', 'Enemy transitions to DETECT when player enters detectRange');

    for (let i = 0; i < 12; i++) stepEngineFrame(st);
    assertEqual(wolf.aiState, 'CHASE', 'Enemy transitions from DETECT to CHASE');

    wolf.attackCooldown = 0;
    st.player.x = wolf.x - 40;
    stepEngineFrame(st);
    assertEqual(wolf.aiState, 'PREPARE_ATTACK', 'Enemy enters telegraphed PREPARE_ATTACK state');

    for (let i = 0; i < wolf.windupFrames; i++) stepEngineFrame(st);
    assertEqual(wolf.aiState, 'ATTACK', 'Enemy transitions from PREPARE_ATTACK to ATTACK');

    for (let i = 0; i < wolf.attackFrames; i++) stepEngineFrame(st);
    assertEqual(wolf.aiState, 'RECOVER', 'Enemy transitions from ATTACK to RECOVER');
    assertTrue(wolf.attackCooldown > 0, 'Enemy sets attackCooldown upon entering RECOVER');

    for (let i = 0; i < wolf.recoverFrames; i++) stepEngineFrame(st);
    assertEqual(wolf.aiState, 'CHASE', 'Enemy returns to CHASE after recovery');
    console.log('[PASS] 2. Enemy 9-State AI (IDLE -> PATROL -> DETECT -> CHASE -> PREPARE_ATTACK -> ATTACK -> RECOVER) verified.');
  }

  // 3. Test Distinct Monster Attack Behaviours (Ranged Mage/Witch Projectiles & Boss Telegraph Warning)
  {
    const st = createInitialEngineState(11);
    const mage = createEnemyFromMonster('shadow_mage', 300, 1, false);
    mage.aiState = 'ATTACK';
    mage.stateTimer = mage.attackFrames;
    st.enemies = [mage];
    st.player.x = 180;

    stepEngineFrame(st);
    assertEqual(st.projectiles.length, 1, 'Shadow Mage spawns Void Bolt projectile during ATTACK state');

    const frostSt = createInitialEngineState(9);
    const frostBoss = createEnemyFromMonster('frost_guardian', 200, 3, true);
    frostBoss.aiState = 'PREPARE_ATTACK';
    frostBoss.stateTimer = 5;
    frostSt.enemies = [frostBoss];
    frostSt.player.x = 150;
    stepEngineFrame(frostSt);
    assertTrue(
      frostSt.bossWarningText.includes('FROST GUARDIAN'),
      `Boss telegraphed attack sets bossWarningText (${frostSt.bossWarningText})`
    );
    console.log('[PASS] 3. Distinct monster behaviours, projectiles, and boss telegraph warnings verified.');
  }

  // 4. Test Dodge i-Frames, Blocking Stamina Mitigation, Damage Indicators & Player Death
  {
    const st = createInitialEngineState(5);
    const initialHp = st.player.hp;

    const dodged = playerDodge(st);
    assertEqual(dodged, true, 'Dodge executes when stamina is sufficient');
    applyDamageToPlayer(st, 35, st.player.x + 30);
    assertEqual(st.player.hp, initialHp, 'Player takes 0 damage during Dodge Roll i-frames');
    assertTrue(
      st.damageIndicators.some((d) => d.text === 'DODGED!'),
      'DODGED! floating indicator spawned'
    );

    st.player.dodgeTimer = 0;
    st.player.invulnTimer = 0;
    st.player.blocking = true;
    st.player.stamina = 100;
    applyDamageToPlayer(st, 36, st.player.x + 30);
    const blockedLoss = initialHp - st.player.hp;
    assertTrue(blockedLoss > 0 && blockedLoss <= 10, `Shield block reduces damage by 75% (lost ${blockedLoss} HP)`);
    assertTrue(st.player.stamina < 100, 'Blocking an attack consumes stamina');

    st.player.blocking = false;
    st.player.invulnTimer = 0;
    st.player.hp = 15;
    applyDamageToPlayer(st, 45, st.player.x + 30);
    assertEqual(st.player.hp, 0, 'Player HP reaches 0 on fatal hit');
    assertEqual(st.outcome, 'DEFEAT', 'Engine transitions to DEFEAT when player dies');
    console.log('[PASS] 4. Dodge i-frames, Shield Block mitigation, Stamina drain, Damage Indicators, and Player Death verified.');
  }

  // 5. Test Boss Phases, Level 6 Witch Escape & Level 13 Curse Barrier
  {
    const st6 = createInitialEngineState(6);
    st6.currentWave = 3;
    const witch6 = createEnemyFromMonster('witch_encounter', 400, 3, true);
    witch6.hp = Math.floor(witch6.maxHp * 0.30);
    st6.enemies = [witch6];
    stepEngineFrame(st6);
    assertEqual(st6.enemies.length, 0, 'Level 6 Witch escapes when HP drops below 35%');
    assertEqual(st6.allWavesCleared, true, 'Level 6 Wave 3 clears when Witch escapes');
    assertTrue(st6.toastText.includes('ESCAPED'), 'HUD toast announces Witch escape');

    const st13 = createInitialEngineState(13);
    const witch13 = createEnemyFromMonster('witch_final', 400, 3, true);
    st13.enemies = [witch13];
    st13.player.x = 360;
    st13.player.facing = 1;

    assertEqual(witch13.shieldActive, true, 'Level 13 Witch starts with Curse Barrier active');
    playerSwordAttack(st13);
    assertEqual(witch13.hp, witch13.maxHp, 'Normal sword attack cannot damage Witch while Curse Barrier is active');

    const usedSkill = playerStoneSkill(st13);
    assertEqual(usedSkill, true, 'Ancient Stone Skill executes');
    assertEqual(witch13.shieldActive, false, 'Ancient Stone Skill shatters the Witch Curse Barrier');
    assertTrue(witch13.hp < witch13.maxHp, 'Ancient Stone Skill deals damage after breaking barrier');

    witch13.hp = Math.floor(witch13.maxHp * 0.45);
    witch13.aiState = 'CHASE';
    stepEngineFrame(st13);
    assertEqual(witch13.bossPhase, 2, 'Boss enters Phase 2 when HP <= 50%');
    console.log('[PASS] 5. Boss Phase 2 enrage, Level 6 Witch escape, and Level 13 Curse Barrier + Stone Skill verified.');
  }

  // 6. Test Anti-Bypass Wave Gate & Multi-Wave Progression + Level Completion
  {
    const st = createInitialEngineState(1);
    const wave1GateX = st.level.waves[0].gateX;

    st.controls.right = true;
    st.enemies.forEach((e) => {
      e.x = 60;
      e.attackCooldown = 9999;
    });
    for (let i = 0; i < 300; i++) stepEngineFrame(st);

    assertTrue(
      st.player.x <= wave1GateX,
      `Player cannot bypass Wave 1 gateX (${st.player.x} <= ${wave1GateX})`
    );
    assertEqual(st.outcome, 'NONE', 'Player cannot complete level by running right');

    st.enemies = [];
    stepEngineFrame(st);
    assertEqual(st.currentWave, 2, 'Clearing Wave 1 spawns Wave 2');
    assertTrue(st.enemies.length > 0, 'Wave 2 enemies spawned');

    st.enemies = [];
    stepEngineFrame(st);
    assertEqual(st.currentWave, 3, 'Clearing Wave 2 spawns Wave 3');
    assertTrue(st.enemies.some((e) => e.isBoss), 'Wave 3 includes the Stage Boss/Champion');

    st.enemies = [];
    stepEngineFrame(st);
    assertEqual(st.allWavesCleared, true, 'Clearing all 3 waves sets allWavesCleared = true');

    st.controls.right = true;
    for (let i = 0; i < 400; i++) {
      stepEngineFrame(st);
      if (st.outcome === 'VICTORY') break;
    }
    assertEqual(st.outcome, 'VICTORY', 'Reaching portal after clearing all waves triggers VICTORY');
    assertEqual(st.checkpointActivated, true, 'Mid-level checkpoint was activated along the way');
    console.log('[PASS] 6. Anti-bypass wave gates, 3-wave progression, checkpoints, and victory conditions verified.');
  }

  // 7. Test All 13 Levels & 5 Worlds Initialization
  {
    assertEqual(WORLDS_DATA.length, 5, '5 Worlds exist');
    assertEqual(LEVELS_DATA.length, 13, '13 Levels exist');
    for (let lv = 1; lv <= 13; lv++) {
      const s = createInitialEngineState(lv);
      assertEqual(s.level.level, lv, `Level ${lv} matches`);
      assertEqual(s.totalWaves, 3, `Level ${lv} has 3 combat waves`);
      assertTrue(s.enemies.length >= 2, `Level ${lv} Wave 1 spawns enemies`);
      assertTrue(Boolean(MONSTERS_DATA[s.level.monsterId]), `Level ${lv} has a valid primary monster`);
    }
    console.log('[PASS] 7. All 13 Levels across 5 Worlds initialize with valid 3-wave combat encounters.');
  }

  console.log('\nALL AUTOMATED GAMEPLAY TESTS PASSED SUCCESSFULLY!');
}

runGameplayVerificationSuite();
