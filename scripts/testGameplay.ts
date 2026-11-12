import {
  LEVELS_DATA,
  MONSTERS_DATA,
  WARRIOR_UPGRADES,
  WORLDS_DATA,
} from '../constants/gameData';
import {
  applyDamageToPlayer,
  computePlayerDefense,
  computePlayerMaxHp,
  computePlayerSwordDamage,
  createEnemyFromMonster,
  createInitialEngineState,
  playerDodge,
  playerHeavyAttack,
  playerStoneSkill,
  playerSwordAttack,
  playerUsePotion,
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
  console.log('=== THE CURSED KINGDOM: AUTOMATED GAMEPLAY, UI DATA & 13-MONSTER VERIFICATION ===\n');

  // 1. Test Player HP, Sword Damage, Warrior Upgrades, Heavy Attack & Potion Usage
  {
    const lv1Hp = computePlayerMaxHp(1, 1);
    const lv13Hp = computePlayerMaxHp(13, 1);
    const lv1Sword = computePlayerSwordDamage(1, 1);
    const lv13Sword = computePlayerSwordDamage(13, 1);

    assertEqual(lv1Hp, 120, 'Lv1 Tier1 Player Max HP should be 120');
    assertEqual(lv13Hp, 216, 'Lv13 Tier1 Player Max HP should be 216');
    assertEqual(lv1Sword, 28, 'Lv1 Tier1 Base Sword Damage should be 28');
    assertEqual(lv13Sword, 64, 'Lv13 Tier1 Base Sword Damage should be 64');

    // Verify Warrior Upgrades scaling (Tier 5)
    assertEqual(computePlayerMaxHp(1, 5), 255, 'Tier 5 Health upgrade adds +135 Max HP');
    assertEqual(computePlayerSwordDamage(1, 5), 58, 'Tier 5 Weapon upgrade adds +30 Sword ATK');
    assertEqual(computePlayerDefense(1, 5), 26, 'Tier 5 Armor upgrade adds +22 DEF');
    assertEqual(WARRIOR_UPGRADES.weapon.length, 5, '5 Weapon upgrade tiers exist');
    assertEqual(WARRIOR_UPGRADES.armor.length, 5, '5 Armor upgrade tiers exist');

    const st = createInitialEngineState(1);
    const goblinMinion = st.enemies[0];
    assertEqual(goblinMinion.monsterId, 'forest_goblin', 'Lv1 spawns Forest Goblin');
    assertEqual(goblinMinion.maxHp, 100, 'Lv1 Forest Goblin minion HP should be 100');

    st.player.x = goblinMinion.x - 40;
    st.player.facing = 1;
    const swung = playerSwordAttack(st);
    assertEqual(swung, true, 'First light sword swing should execute');
    const hpAfterOneHit = goblinMinion.hp;
    const dmgDealt = 100 - hpAfterOneHit;
    assertTrue(dmgDealt >= 20 && dmgDealt <= 30, `Single Lv1 swing should deal ~25 dmg (dealt ${dmgDealt})`);
    assertTrue(hpAfterOneHit > 70, 'Forest Goblin survives multiple hits (requires ~4 swings)');

    const spamSwing = playerSwordAttack(st);
    assertEqual(spamSwing, false, 'Attack cooldown prevents frame-spamming sword attacks');

    // Test Heavy Attack & Potion usage
    st.player.attackCooldown = 0;
    st.player.stamina = 100;
    const heavySwung = playerHeavyAttack(st);
    assertEqual(heavySwung, true, 'Heavy Attack executes when stamina >= 20');
    assertTrue(goblinMinion.hp < hpAfterOneHit - 30, 'Heavy Attack deals high impact damage');

    st.player.hp = 40;
    st.player.poisonTimer = 90;
    const initialPotions = st.potionsLeft;
    const usedPotion = playerUsePotion(st);
    assertEqual(usedPotion, true, 'Healing Potion executes when HP < maxHp');
    assertEqual(st.potionsLeft, initialPotions - 1, 'Potion count decrements by 1');
    assertTrue(st.player.hp > 90, 'Healing Potion restores at least 55 HP');
    assertEqual(st.player.poisonTimer, 0, 'Healing Potion cures active poison');
    console.log('[PASS] 1. Player stats, Warrior Upgrades, Light/Heavy Attack, and Healing Potion verified.');
  }

  // 2. Test 9-State Enemy AI State Machine & Telegraphed Attack Cycle
  {
    const st = createInitialEngineState(2);
    const wolf = createEnemyFromMonster('shadow_wolf', 450, 1, false);
    st.enemies = [wolf];

    assertEqual(wolf.aiState, 'IDLE', 'Shadow Wolf starts in IDLE');

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

  // 3. Test Distinct Monster Attack Behaviours Across Worlds (Spider Venom, Assassin Blink, Skeleton Shield, Beast Telegraph)
  {
    // Venom Spider Queen poison projectile
    const st5 = createInitialEngineState(5);
    const spider = createEnemyFromMonster('spider_queen', 300, 3, true);
    spider.aiState = 'ATTACK';
    spider.stateTimer = spider.attackFrames;
    st5.enemies = [spider];
    st5.player.x = 180;
    stepEngineFrame(st5);
    assertEqual(st5.projectiles.length, 1, 'Venom Spider Queen spawns poison web projectile during ATTACK');
    assertEqual(st5.projectiles[0].effect, 'poison', 'Spider projectile carries poison effect');

    // Shadow Assassin blink behind player
    const st10 = createInitialEngineState(10);
    const assassin = createEnemyFromMonster('shadow_assassin', 420, 1, false);
    assassin.aiState = 'ATTACK';
    assassin.stateTimer = assassin.attackFrames;
    st10.enemies = [assassin];
    st10.player.x = 250;
    st10.player.facing = 1;
    stepEngineFrame(st10);
    assertTrue(assassin.x < st10.player.x, 'Shadow Assassin blinks behind the warrior on attack start');

    // Skeleton Knight shield guard broken by Heavy Attack
    const st4 = createInitialEngineState(4);
    const skel = createEnemyFromMonster('skeleton_knight', 240, 1, false);
    skel.aiState = 'CHASE';
    st4.enemies = [skel];
    st4.player.x = 200;
    st4.player.facing = 1;
    assertEqual(skel.guardBroken, false, 'Skeleton Knight starts with shield guard intact');
    playerHeavyAttack(st4);
    assertEqual(skel.guardBroken, true, 'Heavy Attack breaks Skeleton Knight shield guard');

    // Three-Headed Frost Beast Boss Telegraph Warning
    const st9 = createInitialEngineState(9);
    const beastBoss = createEnemyFromMonster('three_headed_beast', 200, 3, true);
    beastBoss.aiState = 'PREPARE_ATTACK';
    beastBoss.stateTimer = 5;
    st9.enemies = [beastBoss];
    st9.player.x = 150;
    stepEngineFrame(st9);
    assertTrue(
      st9.bossWarningText.includes('THREE-HEADED FROST BEAST'),
      `Boss telegraphed attack sets bossWarningText (${st9.bossWarningText})`
    );
    console.log('[PASS] 3. Distinct monster behaviours (Venom projectile, Shadow Blink, Shield Break, Boss Telegraph) verified.');
  }

  // 4. Test Dodge i-Frames, Root Break, Blocking Stamina Mitigation, Damage Indicators & Player Death
  {
    const st = createInitialEngineState(3);
    const initialHp = st.player.hp;

    // Root snare broken by Dodge
    st.player.rootTimer = 40;
    const dodged = playerDodge(st);
    assertEqual(dodged, true, 'Dodge executes when stamina is sufficient');
    assertEqual(st.player.rootTimer, 0, 'Dodging breaks Ancient Tree Guardian root snare');

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
    console.log('[PASS] 4. Dodge i-frames, Root break, Shield Block mitigation, Damage Indicators, and Player Death verified.');
  }

  // 5. Test Boss Phases, Level 6 Dark Witch Escape & Level 13 Witch Queen Dark Shield
  {
    const st6 = createInitialEngineState(6);
    st6.currentWave = 3;
    const witch6 = createEnemyFromMonster('dark_witch', 400, 3, true);
    witch6.hp = Math.floor(witch6.maxHp * 0.30);
    st6.enemies = [witch6];
    stepEngineFrame(st6);
    assertEqual(st6.enemies.length, 0, 'Level 6 Dark Witch escapes when HP drops below 35%');
    assertEqual(st6.allWavesCleared, true, 'Level 6 Wave 3 clears when Dark Witch escapes');
    assertTrue(st6.toastText.includes('ESCAPED'), 'HUD toast announces Dark Witch escape');

    const st13 = createInitialEngineState(13);
    const witch13 = createEnemyFromMonster('witch_queen', 400, 3, true);
    st13.enemies = [witch13];
    st13.player.x = 360;
    st13.player.facing = 1;

    assertEqual(witch13.shieldActive, true, 'Level 13 Witch Queen starts with Dark Shield active');
    playerSwordAttack(st13);
    assertEqual(witch13.hp, witch13.maxHp, 'Normal sword attack cannot damage Witch Queen while Dark Shield is active');

    const usedSkill = playerStoneSkill(st13);
    assertEqual(usedSkill, true, 'Ancient Stone Skill executes');
    assertEqual(witch13.shieldActive, false, 'Ancient Stone Skill shatters the Witch Queen Dark Shield');
    assertTrue(witch13.hp < witch13.maxHp, 'Ancient Stone Skill deals damage after breaking shield');

    witch13.hp = Math.floor(witch13.maxHp * 0.45);
    witch13.aiState = 'CHASE';
    stepEngineFrame(st13);
    assertEqual(witch13.bossPhase, 2, 'Boss enters Phase 2 when HP <= 50%');
    console.log('[PASS] 5. Boss Phase 2 enrage, Level 6 Dark Witch escape, and Level 13 Witch Queen Dark Shield verified.');
  }

  // 6. Test Anti-Bypass Wave Gate, Boss Intro Trigger, & Multi-Wave Progression + Level Completion
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
    assertTrue(st.bossIntroTimer > 0, 'Wave 3 triggers Boss Introduction banner timer');

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
    console.log('[PASS] 6. Anti-bypass wave gates, Boss Intro trigger, 3-wave progression, checkpoints, and victory verified.');
  }

  // 7. Test All 13 Levels, 5 Worlds & Exact Monster Progression Table
  {
    const expectedProgression: [number, string, string, number][] = [
      [1, 'forest_goblin', 'Forest Goblin', 100],
      [2, 'shadow_wolf', 'Shadow Wolf', 180],
      [3, 'tree_guardian', 'Ancient Tree Guardian', 350],
      [4, 'skeleton_knight', 'Skeleton Knight', 400],
      [5, 'spider_queen', 'Venom Spider Queen', 550],
      [6, 'dark_witch', 'The Dark Witch', 1000],
      [7, 'ice_golem', 'Ice Golem', 850],
      [8, 'frost_wyvern', 'Frost Wyvern', 1100],
      [9, 'three_headed_beast', 'Three-Headed Frost Beast', 1600],
      [10, 'shadow_assassin', 'Shadow Assassin', 1400],
      [11, 'demon_knight', 'Demon Knight', 2000],
      [12, 'cursed_dragon', 'Cursed Dragon', 2800],
      [13, 'witch_queen', 'The Witch Queen', 5000],
    ];

    assertEqual(WORLDS_DATA.length, 5, '5 Worlds exist');
    assertEqual(LEVELS_DATA.length, 13, '13 Levels exist');

    for (const [lv, expectedId, expectedName, expectedHealth] of expectedProgression) {
      const s = createInitialEngineState(lv);
      assertEqual(s.level.level, lv, `Level ${lv} matches`);
      assertEqual(s.level.monsterId, expectedId, `Level ${lv} monsterId is ${expectedId}`);
      const mCfg = MONSTERS_DATA[s.level.monsterId];
      assertEqual(mCfg.name, expectedName, `Level ${lv} monster name is ${expectedName}`);
      assertEqual(mCfg.health, expectedHealth, `Level ${lv} monster lore health is ${expectedHealth}`);
      assertEqual(s.totalWaves, 3, `Level ${lv} has 3 combat waves`);
      assertTrue(s.enemies.length >= 2, `Level ${lv} Wave 1 spawns enemies`);
    }
    console.log('[PASS] 7. All 13 Monsters across 5 Worlds match the exact Monster Progression Table.');
  }

  console.log('\nALL AUTOMATED GAMEPLAY & UI VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runGameplayVerificationSuite();
