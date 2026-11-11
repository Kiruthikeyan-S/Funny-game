import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  LEVELS_DATA,
  LevelInfo,
  STORY_SLIDES,
  UPGRADES_DATA,
  WORLDS_DATA,
  WorldInfo,
} from '../constants/gameData';

type ScreenType =
  | 'MAIN_MENU'
  | 'STORY'
  | 'LEVEL_SELECT'
  | 'ARMORY'
  | 'GAMEPLAY'
  | 'PAUSE'
  | 'LEVEL_COMPLETE'
  | 'ENDING'
  | 'SETTINGS';

interface SaveState {
  unlockedLevel: number;
  coins: number;
  stars: Record<number, number>;
  upgrades: {
    sword: number;
    armor: number;
    stone: number;
    boots: number;
  };
  hapticsEnabled: boolean;
}

const DEFAULT_SAVE: SaveState = {
  unlockedLevel: 1,
  coins: 60,
  stars: {},
  upgrades: { sword: 1, armor: 1, stone: 1, boots: 1 },
  hapticsEnabled: true,
};

const STORAGE_KEY = 'cursed_kingdom_expo_save_v1';
const VIEWPORT_H = 260;
const GROUND_Y = 212;

interface EnemyEntity {
  id: string;
  type: string;
  name?: string;
  x: number;
  y: number;
  startX: number;
  w: number;
  h: number;
  vx: number;
  hp: number;
  maxHp: number;
  damage: number;
  isBoss: boolean;
  shieldActive: boolean;
  escapeThreshold: number;
}

interface CoinEntity {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  isPotion: boolean;
}

interface PlatformEntity {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function CursedKingdomApp() {
  const [screen, setScreen] = useState<ScreenType>('MAIN_MENU');
  const [save, setSave] = useState<SaveState>(DEFAULT_SAVE);
  const [storyIdx, setStoryIdx] = useState(0);
  const [launchAfterStory, setLaunchAfterStory] = useState(false);

  // Gameplay HUD & Result state
  const [currentLevel, setCurrentLevel] = useState<LevelInfo>(LEVELS_DATA[0]);
  const [currentWorld, setCurrentWorld] = useState<WorldInfo>(WORLDS_DATA[0]);
  const [hudState, setHudState] = useState({
    hp: 100,
    maxHp: 100,
    stoneEnergy: 100,
    coinsEarned: 0,
    enemiesDefeated: 0,
    progress: 0,
    bossName: '',
    bossHp: 0,
    bossMaxHp: 1,
    bossShield: false,
    dialogueSpeaker: '',
    dialogueText: '',
    toast: '',
    victory: false,
    starsEarned: 0,
  });

  // Render tick for 60fps game loop
  const [, setFrameTick] = useState(0);

  // Mutable ref for real-time 60fps physics
  const gameRef = useRef({
    running: false,
    cameraX: 0,
    controls: { left: false, right: false, block: false },
    player: {
      x: 80,
      y: GROUND_Y - 40,
      w: 32,
      h: 40,
      vx: 0,
      vy: 0,
      speed: 4.4,
      jumpForce: -10.5,
      facing: 1,
      onGround: true,
      jumpsLeft: 2,
      hp: 100,
      maxHp: 100,
      stoneEnergy: 100,
      attackDamage: 26,
      attackTimer: 0,
      comboStep: 1,
      blocking: false,
      invulnTimer: 0,
      stoneFlashTimer: 0,
    },
    checkpointX: 80,
    platforms: [] as PlatformEntity[],
    enemies: [] as EnemyEntity[],
    coins: [] as CoinEntity[],
    portalX: 1700,
    coinsEarned: 0,
    enemiesDefeated: 0,
  });

  // Load saved progress
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          setSave({
            ...DEFAULT_SAVE,
            ...parsed,
            upgrades: { ...DEFAULT_SAVE.upgrades, ...(parsed.upgrades || {}) },
          });
        }
      })
      .catch(() => {});
  }, []);

  const persistSave = (next: SaveState) => {
    setSave(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!save.hapticsEnabled || Platform.OS === 'web') return;
    const style =
      type === 'heavy'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : type === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style).catch(() => {});
  };

  // Start any of the 13 Levels
  const startLevel = (levelNum: number) => {
    const lvl = LEVELS_DATA.find((l) => l.level === levelNum) || LEVELS_DATA[0];
    const world = WORLDS_DATA.find((w) => w.id === lvl.world) || WORLDS_DATA[0];
    setCurrentLevel(lvl);
    setCurrentWorld(world);

    const upg = save.upgrades;
    const maxHp = 100 + (upg.armor - 1) * 25;
    const g = gameRef.current;

    g.player = {
      x: 70,
      y: GROUND_Y - 40,
      w: 32,
      h: 40,
      vx: 0,
      vy: 0,
      speed: 4.5 + (upg.boots - 1) * 0.35,
      jumpForce: -10.6 - (upg.boots - 1) * 0.35,
      facing: 1,
      onGround: true,
      jumpsLeft: 2,
      hp: maxHp,
      maxHp,
      stoneEnergy: 100,
      attackDamage: 26 + (upg.sword - 1) * 8,
      attackTimer: 0,
      comboStep: 1,
      blocking: false,
      invulnTimer: 0,
      stoneFlashTimer: 0,
    };

    g.cameraX = 0;
    g.checkpointX = 70;
    g.coinsEarned = 0;
    g.enemiesDefeated = 0;
    g.controls = { left: false, right: false, block: false };

    // Build platforms & coins
    const plats: PlatformEntity[] = [];
    const coins: CoinEntity[] = [];
    const steps = Math.floor(lvl.length / 240);
    for (let i = 1; i < steps; i++) {
      const px = i * 230;
      const py = i % 2 === 0 ? 148 : 112;
      plats.push({ x: px, y: py, w: 105, h: 12 });
      coins.push({
        id: `c_${i}_1`,
        x: px + 22,
        y: py - 24,
        collected: false,
        isPotion: false,
      });
      coins.push({
        id: `c_${i}_2`,
        x: px + 62,
        y: py - 24,
        collected: false,
        isPotion: i % 3 === 0,
      });
    }
    g.platforms = plats;
    g.coins = coins;

    // Build Enemies
    const enemies: EnemyEntity[] = [];
    const spacing = Math.floor((lvl.length - 450) / Math.max(1, lvl.enemyCount));
    for (let i = 0; i < lvl.enemyCount; i++) {
      const etype = lvl.enemyTypes[i % lvl.enemyTypes.length];
      const ex = 300 + i * spacing;
      const isBat = etype === 'bat';
      const baseHp = 40 + lvl.level * 10;
      enemies.push({
        id: `e_${i}`,
        type: etype,
        x: ex,
        y: isBat ? 135 : GROUND_Y - 36,
        startX: ex,
        w: 32,
        h: 36,
        vx: -1.4 - lvl.world * 0.15,
        hp: baseHp,
        maxHp: baseHp,
        damage: 9 + lvl.world * 2,
        isBoss: false,
        shieldActive: false,
        escapeThreshold: 0,
      });
    }

    // Spawn Boss at end of Level 5, 6, 9, 12, 13
    if (lvl.boss) {
      const b = lvl.boss;
      enemies.push({
        id: 'boss_main',
        type: b.type,
        name: b.name,
        x: lvl.length - 220,
        y: GROUND_Y - 54,
        startX: lvl.length - 240,
        w: 46,
        h: 54,
        vx: -b.speed * 0.75,
        hp: b.hp,
        maxHp: b.hp,
        damage: b.damage,
        isBoss: true,
        shieldActive: b.needsStone,
        escapeThreshold: b.escapeThreshold || 0,
      });
    }

    g.enemies = enemies;
    g.portalX = lvl.length - 80;
    g.running = true;

    setHudState({
      hp: maxHp,
      maxHp,
      stoneEnergy: 100,
      coinsEarned: 0,
      enemiesDefeated: 0,
      progress: 0,
      bossName: lvl.boss ? lvl.boss.name : '',
      bossHp: lvl.boss ? lvl.boss.hp : 0,
      bossMaxHp: lvl.boss ? lvl.boss.hp : 1,
      bossShield: Boolean(lvl.boss?.needsStone),
      dialogueSpeaker: lvl.introSpeaker,
      dialogueText: lvl.introDialogue,
      toast: `WORLD ${lvl.world} • LEVEL ${lvl.level}`,
      victory: false,
      starsEarned: 0,
    });

    setScreen('GAMEPLAY');
  };

  // 60FPS Game Loop during GAMEPLAY
  useEffect(() => {
    if (screen !== 'GAMEPLAY') return;

    const interval = setInterval(() => {
      const g = gameRef.current;
      if (!g.running) return;
      const p = g.player;

      // Recharge Ancient Stone
      const stoneTier = save.upgrades.stone || 1;
      p.stoneEnergy = Math.min(100, p.stoneEnergy + 0.16 + stoneTier * 0.05);

      p.blocking = g.controls.block;
      const moveFactor = p.blocking ? 0.45 : 1;

      if (g.controls.left) {
        p.vx = -p.speed * moveFactor;
        p.facing = -1;
      } else if (g.controls.right) {
        p.vx = p.speed * moveFactor;
        p.facing = 1;
      } else {
        p.vx *= 0.7;
        if (Math.abs(p.vx) < 0.1) p.vx = 0;
      }

      if (p.attackTimer > 0) p.attackTimer--;
      if (p.invulnTimer > 0) p.invulnTimer--;
      if (p.stoneFlashTimer > 0) p.stoneFlashTimer--;

      p.x = Math.max(16, Math.min(currentLevel.length - 36, p.x + p.vx));
      p.vy += 0.55;
      p.y += p.vy;
      p.onGround = false;

      // Ground collision
      if (p.y + p.h >= GROUND_Y) {
        p.y = GROUND_Y - p.h;
        p.vy = 0;
        p.onGround = true;
        p.jumpsLeft = 2;
      }

      // Elevated platform collisions
      for (const plat of g.platforms) {
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

      // Camera follow
      const screenW = Dimensions.get('window').width;
      const targetCam = p.x - screenW * 0.28;
      g.cameraX = Math.max(0, Math.min(currentLevel.length - screenW + 40, targetCam));

      // Collect coins & potions
      for (const c of g.coins) {
        if (
          !c.collected &&
          Math.abs(p.x + p.w / 2 - c.x) < 24 &&
          Math.abs(p.y + p.h / 2 - c.y) < 26
        ) {
          c.collected = true;
          if (c.isPotion) {
            p.hp = Math.min(p.maxHp, p.hp + 25);
          } else {
            g.coinsEarned += 5;
          }
          triggerHaptic('light');
        }
      }

      // Update Enemies & Bosses
      let activeBoss: EnemyEntity | null = null;
      for (let i = g.enemies.length - 1; i >= 0; i--) {
        const e = g.enemies[i];

        // Level 6 Witch Story Encounter: escapes at 35% HP!
        if (e.isBoss && e.escapeThreshold > 0 && e.hp <= e.maxHp * e.escapeThreshold) {
          g.enemies.splice(i, 1);
          setHudState((prev) => ({
            ...prev,
            dialogueSpeaker: 'THE WITCH MORGANA',
            dialogueText:
              'Taste my Dark Curse! Without the awakened Stone from the Frozen Mountains, you can never defeat me!',
            toast: 'THE WITCH ESCAPED! REACH THE PORTAL!',
          }));
          continue;
        }

        if (e.hp <= 0) {
          g.enemiesDefeated++;
          g.coinsEarned += e.isBoss ? 50 : 8;
          g.enemies.splice(i, 1);
          continue;
        }

        if (e.isBoss) activeBoss = e;

        // Patrol / Chase
        const dist = p.x - e.x;
        if (Math.abs(dist) < 220) {
          e.x += (dist > 0 ? 1 : -1) * Math.abs(e.vx);
        } else {
          e.x += e.vx;
          if (Math.abs(e.x - e.startX) > 100) e.vx *= -1;
        }

        // Contact damage with Warrior
        if (
          Math.abs(p.x + p.w / 2 - (e.x + e.w / 2)) < (p.w + e.w) * 0.42 &&
          Math.abs(p.y + p.h / 2 - (e.y + e.h / 2)) < (p.h + e.h) * 0.42
        ) {
          if (p.invulnTimer <= 0) {
            const dmg = p.blocking ? Math.max(2, Math.round(e.damage * 0.2)) : e.damage;
            p.hp = Math.max(0, p.hp - dmg);
            p.invulnTimer = 30;
            triggerHaptic('medium');
            if (p.hp <= 0) {
              finishLevel(false);
              return;
            }
          }
        }
      }

      // Goal Portal Check
      if (Math.abs(p.x - g.portalX) < 34) {
        if (activeBoss) {
          setHudState((prev) => ({
            ...prev,
            toast: 'DEFEAT THE BOSS TO UNLOCK THE PORTAL!',
          }));
        } else {
          finishLevel(true);
          return;
        }
      }

      setHudState((prev) => ({
        ...prev,
        hp: p.hp,
        maxHp: p.maxHp,
        stoneEnergy: p.stoneEnergy,
        coinsEarned: g.coinsEarned,
        enemiesDefeated: g.enemiesDefeated,
        progress: Math.min(100, Math.round((p.x / currentLevel.length) * 100)),
        bossName: activeBoss ? activeBoss.name || 'BOSS' : '',
        bossHp: activeBoss ? activeBoss.hp : 0,
        bossMaxHp: activeBoss ? activeBoss.maxHp : 1,
        bossShield: Boolean(activeBoss?.shieldActive),
      }));

      setFrameTick((t) => (t + 1) % 10000);
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [screen, currentLevel, save]);

  const handleJump = () => {
    const g = gameRef.current;
    if (!g.running) return;
    if (g.player.jumpsLeft > 0) {
      g.player.vy = g.player.jumpForce;
      g.player.jumpsLeft--;
      g.player.onGround = false;
      triggerHaptic('light');
    }
  };

  const handleSwordAttack = () => {
    const g = gameRef.current;
    if (!g.running) return;
    const p = g.player;
    p.attackTimer = 12;
    p.comboStep = (p.comboStep % 3) + 1;
    triggerHaptic('light');

    const reach = 64;
    const mult = p.comboStep === 3 ? 1.5 : p.comboStep === 2 ? 1.2 : 1.0;
    const dmg = Math.round(p.attackDamage * mult);

    g.enemies.forEach((e) => {
      const dx = e.x + e.w / 2 - (p.x + p.w / 2);
      const dy = Math.abs(e.y + e.h / 2 - (p.y + p.h / 2));
      const inFront = p.facing > 0 ? dx >= -12 && dx <= reach : dx <= 12 && dx >= -reach;
      if (inFront && dy < 48) {
        if (e.shieldActive) {
          setHudState((prev) => ({
            ...prev,
            toast: 'CURSE BARRIER ACTIVE! TAP [STONE] TO SHATTER IT!',
          }));
          return;
        }
        e.hp -= dmg;
        e.x += p.facing * (e.isBoss ? 8 : 18);
        p.stoneEnergy = Math.min(100, p.stoneEnergy + 12);
      }
    });
  };

  const handleStonePower = () => {
    const g = gameRef.current;
    if (!g.running) return;
    const p = g.player;
    if (p.stoneEnergy < 100) {
      setHudState((prev) => ({
        ...prev,
        toast: `ANCIENT STONE CHARGING (${Math.floor(p.stoneEnergy)}%)`,
      }));
      return;
    }

    p.stoneEnergy = 0;
    p.stoneFlashTimer = 18;
    triggerHaptic('heavy');

    const stoneDmg = 85 + (save.upgrades.stone || 1) * 25;
    g.enemies.forEach((e) => {
      if (Math.abs(e.x - p.x) < 240) {
        if (e.shieldActive) {
          e.shieldActive = false;
          setHudState((prev) => ({
            ...prev,
            toast: "ANCIENT STONE SHATTERED THE WITCH'S CURSE BARRIER!",
          }));
        }
        e.hp -= stoneDmg;
      }
    });
  };

  const finishLevel = (victory: boolean) => {
    const g = gameRef.current;
    g.running = false;
    triggerHaptic(victory ? 'heavy' : 'medium');

    if (victory) {
      const hpRatio = g.player.hp / g.player.maxHp;
      const stars = hpRatio >= 0.7 ? 3 : hpRatio >= 0.35 ? 2 : 1;
      const bonus = 20 + currentLevel.level * 5;
      const totalEarned = g.coinsEarned + bonus;

      const nextUnlocked =
        currentLevel.level >= save.unlockedLevel && currentLevel.level < 13
          ? currentLevel.level + 1
          : save.unlockedLevel;

      const nextStars = { ...save.stars };
      if (stars > (nextStars[currentLevel.level] || 0)) {
        nextStars[currentLevel.level] = stars;
      }

      persistSave({
        ...save,
        unlockedLevel: nextUnlocked,
        coins: save.coins + totalEarned,
        stars: nextStars,
      });

      setHudState((prev) => ({
        ...prev,
        coinsEarned: totalEarned,
        victory: true,
        starsEarned: stars,
      }));

      if (currentLevel.level === 13) {
        setScreen('ENDING');
      } else {
        setScreen('LEVEL_COMPLETE');
      }
    } else {
      setHudState((prev) => ({
        ...prev,
        victory: false,
        starsEarned: 0,
      }));
      setScreen('LEVEL_COMPLETE');
    }
  };

  const totalStars = Object.values(save.stars).reduce((a, b) => a + (b || 0), 0);

  // ==========================================================================
  // RENDER SCREENS
  // ==========================================================================

  // SCREEN 1: MAIN MENU
  if (screen === 'MAIN_MENU') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.centerScroll}>
          <View style={styles.panelBox}>
            <View style={styles.stoneBadge}>
              <Text style={styles.stoneEmoji}>💎</Text>
            </View>
            <Text style={styles.badgeText}>2D PIXEL-ART ACTION ADVENTURE</Text>
            <Text style={styles.mainTitle}>THE CURSED{'\n'}KINGDOM</Text>
            <Text style={styles.subtitle}>
              Recover the Ancient Stone • Survive 13 Levels • Defeat the Witch
            </Text>

            <View style={styles.buttonStack}>
              <Pressable
                style={[styles.pixelBtn, styles.btnPrimary]}
                onPress={() => {
                  setStoryIdx(0);
                  setLaunchAfterStory(true);
                  setScreen('STORY');
                }}>
                <Text style={styles.btnText}>⚔️ NEW GAME (STORY INTRO)</Text>
              </Pressable>

              <Pressable
                style={[styles.pixelBtn, styles.btnGold]}
                onPress={() => startLevel(save.unlockedLevel)}>
                <Text style={styles.btnText}>
                  ▶️ CONTINUE (LEVEL {save.unlockedLevel})
                </Text>
              </Pressable>

              <Pressable
                style={styles.pixelBtn}
                onPress={() => setScreen('LEVEL_SELECT')}>
                <Text style={styles.btnText}>🗺️ LEVEL SELECTION (13 LEVELS)</Text>
              </Pressable>

              <Pressable
                style={styles.pixelBtn}
                onPress={() => setScreen('ARMORY')}>
                <Text style={styles.btnText}>🛡️ ROYAL ARMORY & UPGRADES</Text>
              </Pressable>

              <Pressable
                style={styles.pixelBtn}
                onPress={() => setScreen('SETTINGS')}>
                <Text style={styles.btnText}>⚙️ SETTINGS</Text>
              </Pressable>
            </View>

            <Text style={styles.footerHint}>
              ★ {totalStars}/39 Stars • 🪙 {save.coins} Coins
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // STORY CUTSCENE SCREEN
  if (screen === 'STORY') {
    const slide = STORY_SLIDES[storyIdx] || STORY_SLIDES[0];
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.panelBox, { maxWidth: 520 }]}>
          <Text style={styles.badgeText}>{slide.title}</Text>
          <View style={styles.storyIllustration}>
            <Text style={{ fontSize: 54 }}>{slide.icon}</Text>
            <Text style={styles.speakerBadge}>{slide.speaker}</Text>
          </View>
          <Text style={styles.storyBody}>{slide.text}</Text>

          <View style={styles.rowBetween}>
            <Pressable
              style={[styles.pixelBtn, styles.btnSmall]}
              onPress={() =>
                launchAfterStory ? startLevel(1) : setScreen('MAIN_MENU')
              }>
              <Text style={styles.btnTextSmall}>SKIP »</Text>
            </Pressable>

            <Pressable
              style={[styles.pixelBtn, styles.btnPrimary, styles.btnSmall]}
              onPress={() => {
                if (storyIdx < STORY_SLIDES.length - 1) {
                  setStoryIdx(storyIdx + 1);
                } else if (launchAfterStory) {
                  startLevel(1);
                } else {
                  setScreen('MAIN_MENU');
                }
              }}>
              <Text style={styles.btnTextSmall}>
                {storyIdx === STORY_SLIDES.length - 1 ? 'START QUEST »' : 'NEXT »'}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // SCREEN 2: 13-LEVEL SELECTION (5 WORLDS)
  if (screen === 'LEVEL_SELECT') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.panelBox, { flex: 1, width: '96%', maxWidth: 680 }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>REALM MAP (13 LEVELS)</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                style={[styles.pixelBtn, styles.btnSmall, styles.btnGold]}
                onPress={() =>
                  persistSave({
                    ...save,
                    unlockedLevel: 13,
                    coins: Math.max(save.coins, 500),
                  })
                }>
                <Text style={styles.btnTextSmall}>UNLOCK ALL 13</Text>
              </Pressable>
              <Pressable
                style={[styles.pixelBtn, styles.btnSmall]}
                onPress={() => setScreen('MAIN_MENU')}>
                <Text style={styles.btnTextSmall}>« MENU</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView style={{ marginTop: 10 }}>
            {WORLDS_DATA.map((world) => {
              const worldLevels = LEVELS_DATA.filter((l) => l.world === world.id);
              return (
                <View key={world.id} style={styles.worldCard}>
                  <Text style={[styles.worldTitle, { color: world.accent }]}>
                    {world.name}
                  </Text>
                  <Text style={styles.worldSub}>{world.enemiesText}</Text>

                  {worldLevels.map((lvl) => {
                    const unlocked = lvl.level <= save.unlockedLevel;
                    const earned = save.stars[lvl.level] || 0;
                    return (
                      <Pressable
                        key={lvl.level}
                        disabled={!unlocked}
                        onPress={() => startLevel(lvl.level)}
                        style={[
                          styles.levelRowCard,
                          !unlocked && { opacity: 0.45 },
                          lvl.boss && { borderColor: '#e63946' },
                        ]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.levelNameText}>
                            LV {lvl.level}: {lvl.name} {lvl.boss ? '💀' : ''}
                          </Text>
                          <Text style={styles.levelSubText}>{lvl.subtitle}</Text>
                        </View>
                        <Text style={styles.starsText}>
                          {unlocked
                            ? `${'★'.repeat(earned)}${'☆'.repeat(3 - earned)}`
                            : '🔒'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ROYAL ARMORY / UPGRADES
  if (screen === 'ARMORY') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.panelBox, { width: '95%', maxWidth: 560 }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>ROYAL ARMORY</Text>
            <Text style={styles.goldPill}>🪙 {save.coins} COINS</Text>
          </View>

          <ScrollView style={{ maxHeight: 380, marginVertical: 10 }}>
            {UPGRADES_DATA.map((u) => {
              const tier = save.upgrades[u.id];
              const isMax = tier >= u.maxLevel;
              const cost = u.baseCost * tier;
              return (
                <View key={u.id} style={styles.upgradeCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.levelNameText}>
                      {u.name} (LV {tier}/{u.maxLevel})
                    </Text>
                    <Text style={styles.levelSubText}>{u.desc}</Text>
                  </View>
                  <Pressable
                    disabled={isMax || save.coins < cost}
                    onPress={() => {
                      if (save.coins >= cost && !isMax) {
                        triggerHaptic('medium');
                        persistSave({
                          ...save,
                          coins: save.coins - cost,
                          upgrades: { ...save.upgrades, [u.id]: tier + 1 },
                        });
                      }
                    }}
                    style={[
                      styles.pixelBtn,
                      styles.btnSmall,
                      !isMax && save.coins >= cost && styles.btnGold,
                      (isMax || save.coins < cost) && { opacity: 0.5 },
                    ]}>
                    <Text style={styles.btnTextSmall}>
                      {isMax ? 'MAX' : `${cost} 🪙`}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>

          <Pressable
            style={styles.pixelBtn}
            onPress={() => setScreen('MAIN_MENU')}>
            <Text style={styles.btnText}>« BACK TO MENU</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // SETTINGS SCREEN
  if (screen === 'SETTINGS') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.panelBox}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={[styles.rowBetween, { marginVertical: 16 }]}>
            <Text style={styles.btnText}>PHONE VIBRATION / HAPTICS</Text>
            <Switch
              value={save.hapticsEnabled}
              onValueChange={(val) =>
                persistSave({ ...save, hapticsEnabled: val })
              }
            />
          </View>

          <Pressable
            style={[styles.pixelBtn, { backgroundColor: '#691420', marginBottom: 12 }]}
            onPress={() => persistSave(DEFAULT_SAVE)}>
            <Text style={styles.btnText}>RESET ALL PROGRESS</Text>
          </Pressable>

          <Pressable
            style={styles.pixelBtn}
            onPress={() => setScreen('MAIN_MENU')}>
            <Text style={styles.btnText}>« BACK</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // SCREEN 4: PAUSE MENU
  if (screen === 'PAUSE') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.panelBox}>
          <Text style={styles.sectionTitle}>GAME PAUSED</Text>
          <Text style={styles.subtitle}>
            Level {currentLevel.level}: {currentLevel.name}
          </Text>
          <View style={styles.buttonStack}>
            <Pressable
              style={[styles.pixelBtn, styles.btnPrimary]}
              onPress={() => {
                gameRef.current.running = true;
                setScreen('GAMEPLAY');
              }}>
              <Text style={styles.btnText}>RESUME</Text>
            </Pressable>
            <Pressable
              style={styles.pixelBtn}
              onPress={() => startLevel(currentLevel.level)}>
              <Text style={styles.btnText}>RESTART LEVEL</Text>
            </Pressable>
            <Pressable
              style={styles.pixelBtn}
              onPress={() => setScreen('LEVEL_SELECT')}>
              <Text style={styles.btnText}>LEVEL SELECTION</Text>
            </Pressable>
            <Pressable
              style={styles.pixelBtn}
              onPress={() => setScreen('MAIN_MENU')}>
              <Text style={styles.btnText}>MAIN MENU</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // SCREEN 5: LEVEL COMPLETION
  if (screen === 'LEVEL_COMPLETE') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.panelBox}>
          <Text style={styles.badgeText}>
            {hudState.victory
              ? `LEVEL ${currentLevel.level} CLEARED`
              : `LEVEL ${currentLevel.level} FAILED`}
          </Text>
          <Text style={styles.mainTitle}>
            {hudState.victory ? 'VICTORY!' : 'DEFEATED'}
          </Text>
          <Text style={styles.starsLarge}>
            {'★'.repeat(hudState.starsEarned)}
            {'☆'.repeat(3 - hudState.starsEarned)}
          </Text>
          <Text style={styles.storyBody}>
            {hudState.victory
              ? currentLevel.clearNote
              : 'The monsters overwhelmed you. Upgrade your Warrior in the Royal Armory and try again!'}
          </Text>
          <Text style={styles.goldPill}>
            🪙 +{hudState.coinsEarned} Coins • ⚔️ {hudState.enemiesDefeated} Foes Defeated
          </Text>

          <View style={[styles.buttonStack, { marginTop: 12 }]}>
            {hudState.victory && currentLevel.level < 13 && (
              <Pressable
                style={[styles.pixelBtn, styles.btnPrimary]}
                onPress={() => startLevel(currentLevel.level + 1)}>
                <Text style={styles.btnText}>
                  NEXT: LEVEL {currentLevel.level + 1} »
                </Text>
              </Pressable>
            )}
            <Pressable
              style={styles.pixelBtn}
              onPress={() => startLevel(currentLevel.level)}>
              <Text style={styles.btnText}>REPLAY LEVEL</Text>
            </Pressable>
            <Pressable
              style={[styles.pixelBtn, styles.btnGold]}
              onPress={() => setScreen('ARMORY')}>
              <Text style={styles.btnText}>UPGRADE WARRIOR</Text>
            </Pressable>
            <Pressable
              style={styles.pixelBtn}
              onPress={() => setScreen('LEVEL_SELECT')}>
              <Text style={styles.btnText}>LEVEL SELECTION</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // SCREEN 6: FINAL ENDING (LEVEL 13 VICTORY)
  if (screen === 'ENDING') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.panelBox}>
          <View style={styles.stoneBadge}>
            <Text style={styles.stoneEmoji}>👑</Text>
          </View>
          <Text style={styles.badgeText}>
            THE CURSE IS BROKEN • ALL 13 LEVELS COMPLETED
          </Text>
          <Text style={styles.mainTitle}>THE KINGDOM IS RESTORED!</Text>
          <Text style={styles.storyBody}>
            With the blazing power of the Awakened Ancient Stone, Sir Kael shattered the Witch Morgana’s dark barrier and lifted the curse from the castle. King Aldric and the entire realm celebrate your legendary triumph!
          </Text>
          <Text style={styles.goldPill}>
            ★ {totalStars}/39 Stars • 🪙 {save.coins} Coins
          </Text>

          <View style={[styles.buttonStack, { marginTop: 14 }]}>
            <Pressable
              style={[styles.pixelBtn, styles.btnPrimary]}
              onPress={() => setScreen('MAIN_MENU')}>
              <Text style={styles.btnText}>RETURN TO MAIN MENU</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // SCREEN 3: GAMEPLAY SCREEN & TOUCH CONTROLS
  // ==========================================================================
  const g = gameRef.current;
  const p = g.player;
  const hpPct = Math.max(0, Math.min(100, (hudState.hp / hudState.maxHp) * 100));
  const stonePct = Math.max(0, Math.min(100, hudState.stoneEnergy));

  return (
    <SafeAreaView style={styles.gameScreenContainer}>
      {/* TOP HUD BAR */}
      <View style={styles.hudTopBar}>
        {/* Top-Left: Health & Stone Power */}
        <View style={styles.hudStatusBox}>
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>HP</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${hpPct}%`, backgroundColor: '#ff4d6d' },
                ]}
              />
            </View>
            <Text style={styles.barVal}>{Math.ceil(hudState.hp)}</Text>
          </View>
          <View style={styles.barRow}>
            <Text style={[styles.barLabel, { color: '#38e4ae' }]}>STONE</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${stonePct}%`, backgroundColor: '#38e4ae' },
                ]}
              />
            </View>
            <Text style={styles.barVal}>
              {stonePct >= 100 ? 'READY' : `${Math.floor(stonePct)}%`}
            </Text>
          </View>
        </View>

        {/* Top-Right: Level Progress, Coins & Pause */}
        <View style={styles.hudRightBox}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.hudLevelTitle}>
              LV {currentLevel.level}: {currentLevel.name}
            </Text>
            <Text style={styles.hudCoinsText}>
              🪙 {save.coins + hudState.coinsEarned} • {hudState.progress}%
            </Text>
          </View>
          <Pressable
            style={[styles.pixelBtn, styles.btnSmall]}
            onPress={() => {
              g.running = false;
              setScreen('PAUSE');
            }}>
            <Text style={styles.btnTextSmall}>| |</Text>
          </Pressable>
        </View>
      </View>

      {/* Boss Bar (if active) */}
      {hudState.bossHp > 0 && (
        <View style={styles.bossHudBar}>
          <Text style={styles.bossHudText}>
            💀 {hudState.bossName}{' '}
            {hudState.bossShield ? ' [CURSE BARRIER - TAP STONE!]' : ''}
          </Text>
          <View style={[styles.barTrack, { width: '100%', height: 10 }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.max(
                    0,
                    (hudState.bossHp / hudState.bossMaxHp) * 100
                  )}%`,
                  backgroundColor: '#f72585',
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* 2D PIXEL-ART GAME VIEWPORT */}
      <View
        style={[
          styles.viewport,
          { backgroundColor: currentWorld.bgBottom, borderColor: currentWorld.groundTop },
        ]}>
        {/* Ancient Stone Shockwave Flash */}
        {p.stoneFlashTimer > 0 && <View style={styles.stoneFlashOverlay} />}

        {/* Toast / Story Banner */}
        {hudState.toast ? (
          <View style={styles.toastBanner}>
            <Text style={styles.toastText}>{hudState.toast}</Text>
          </View>
        ) : null}

        {/* Ground Floor */}
        <View
          style={[
            styles.groundStrip,
            {
              backgroundColor: currentWorld.groundColor,
              borderTopColor: currentWorld.groundTop,
            },
          ]}
        />

        {/* Platforms */}
        {g.platforms.map((plat, idx) => {
          const sx = plat.x - g.cameraX;
          if (sx < -150 || sx > 900) return null;
          return (
            <View
              key={idx}
              style={[
                styles.platformBlock,
                {
                  left: sx,
                  top: plat.y,
                  width: plat.w,
                  height: plat.h,
                  backgroundColor: currentWorld.groundColor,
                  borderTopColor: currentWorld.groundTop,
                },
              ]}
            />
          );
        })}

        {/* Coins & Potions */}
        {g.coins.map((c) => {
          if (c.collected) return null;
          const sx = c.x - g.cameraX;
          if (sx < -40 || sx > 900) return null;
          return (
            <View
              key={c.id}
              style={{
                position: 'absolute',
                left: sx - 10,
                top: c.y - 10,
              }}>
              <Text style={{ fontSize: 16 }}>{c.isPotion ? '🧪' : '🪙'}</Text>
            </View>
          );
        })}

        {/* Goal Portal */}
        <View
          style={[
            styles.portalSprite,
            { left: g.portalX - g.cameraX, top: GROUND_Y - 58 },
          ]}>
          <Text style={{ fontSize: 26 }}>⛩️</Text>
        </View>

        {/* Enemies & Bosses */}
        {g.enemies.map((e) => {
          const sx = e.x - g.cameraX;
          if (sx < -80 || sx > 900) return null;
          const icon =
            e.type.includes('witch')
              ? '🧙‍♀️'
              : e.type === 'slime'
              ? '🟢'
              : e.type === 'wolf'
              ? '🐺'
              : e.type === 'bat'
              ? '🦇'
              : e.type.includes('skeleton') || e.type === 'bone_captain'
              ? '💀'
              : e.type.includes('ice') || e.type === 'mountain_guardian'
              ? '🧊'
              : '😈';
          return (
            <View
              key={e.id}
              style={[
                styles.enemySprite,
                {
                  left: sx,
                  top: e.y,
                  width: e.w,
                  height: e.h,
                  borderColor: e.shieldActive ? '#f72585' : 'transparent',
                  borderWidth: e.shieldActive ? 2 : 0,
                },
              ]}>
              <Text style={{ fontSize: e.isBoss ? 30 : 22 }}>{icon}</Text>
            </View>
          );
        })}

        {/* Playable Warrior (Sir Kael) */}
        <View
          style={[
            styles.warriorSprite,
            {
              left: p.x - g.cameraX,
              top: p.y,
              width: p.w,
              height: p.h,
              transform: [{ scaleX: p.facing }],
            },
          ]}>
          <View style={styles.warriorHelm} />
          <View style={styles.warriorArmor} />
          {p.blocking && <View style={styles.warriorShield} />}
          {p.attackTimer > 0 && <View style={styles.swordSlashArc} />}
        </View>
      </View>

      {/* Dialogue Banner */}
      {hudState.dialogueText ? (
        <Pressable
          style={styles.dialogueBox}
          onPress={() =>
            setHudState((prev) => ({ ...prev, dialogueText: '' }))
          }>
          <Text style={styles.dialogueSpeaker}>{hudState.dialogueSpeaker}</Text>
          <Text style={styles.dialogueLine}>{hudState.dialogueText}</Text>
        </Pressable>
      ) : null}

      {/* BOTTOM TOUCH GAMEPAD CONTROLS */}
      <View style={styles.touchGamepadBar}>
        {/* Left-Bottom: Movement Controls */}
        <View style={styles.dpadGroup}>
          <Pressable
            style={styles.dpadBtn}
            onPressIn={() => {
              g.controls.left = true;
            }}
            onPressOut={() => {
              g.controls.left = false;
            }}>
            <Text style={styles.gamepadBtnText}>◀ LEFT</Text>
          </Pressable>

          <Pressable
            style={styles.dpadBtn}
            onPressIn={() => {
              g.controls.right = true;
            }}
            onPressOut={() => {
              g.controls.right = false;
            }}>
            <Text style={styles.gamepadBtnText}>RIGHT ▶</Text>
          </Pressable>
        </View>

        {/* Right-Bottom: Attack, Jump, Shield & Ancient Stone Power */}
        <View style={styles.actionGroup}>
          <Pressable
            style={[styles.actionBtn, styles.stoneBtn]}
            onPressIn={handleStonePower}>
            <Text style={styles.gamepadBtnText}>💎 STONE</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.shieldBtn]}
            onPressIn={() => {
              g.controls.block = true;
            }}
            onPressOut={() => {
              g.controls.block = false;
            }}>
            <Text style={styles.gamepadBtnText}>🛡️ SHIELD</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.attackBtn]}
            onPressIn={handleSwordAttack}>
            <Text style={styles.gamepadBtnText}>⚔️ SWORD</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.jumpBtn]}
            onPressIn={handleJump}>
            <Text style={styles.gamepadBtnText}>⬆️ JUMP</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0914',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  centerScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  panelBox: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#161129',
    borderWidth: 3,
    borderColor: '#d4a338',
    padding: 20,
    alignItems: 'center',
  },
  stoneBadge: {
    width: 56,
    height: 56,
    backgroundColor: '#2d163b',
    borderWidth: 3,
    borderColor: '#ffd152',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stoneEmoji: { fontSize: 28 },
  badgeText: {
    color: '#ffd152',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  mainTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#ffd152',
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: '#b5a8c9',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonStack: {
    width: '100%',
    gap: 10,
  },
  pixelBtn: {
    backgroundColor: '#2c2247',
    borderWidth: 2,
    borderColor: '#8a73b8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#9e1f32',
    borderColor: '#ff8fa3',
  },
  btnGold: {
    backgroundColor: '#875c12',
    borderColor: '#ffd152',
  },
  btnSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.8,
  },
  btnTextSmall: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  footerHint: {
    color: '#ffd152',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
  },
  rowBetween: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyIllustration: {
    width: '100%',
    backgroundColor: '#0e0a1c',
    borderWidth: 2,
    borderColor: '#4a3970',
    padding: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  speakerBadge: {
    color: '#ffd152',
    fontWeight: '800',
    fontSize: 13,
    marginTop: 8,
  },
  storyBody: {
    color: '#f8f4e6',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  worldCard: {
    backgroundColor: '#110d20',
    borderWidth: 2,
    borderColor: '#453769',
    padding: 12,
    marginBottom: 12,
  },
  worldTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  worldSub: {
    color: '#b5a8c9',
    fontSize: 12,
    marginBottom: 8,
  },
  levelRowCard: {
    backgroundColor: '#1d1633',
    borderWidth: 2,
    borderColor: '#63518f',
    padding: 10,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelNameText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  levelSubText: {
    color: '#b5a8c9',
    fontSize: 12,
    marginTop: 2,
  },
  starsText: {
    color: '#ffd152',
    fontSize: 16,
    fontWeight: '900',
  },
  starsLarge: {
    color: '#ffd152',
    fontSize: 36,
    marginVertical: 8,
  },
  goldPill: {
    color: '#ffd152',
    fontWeight: '800',
    fontSize: 14,
  },
  upgradeCard: {
    backgroundColor: '#1b1430',
    borderWidth: 2,
    borderColor: '#624f8f',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Gameplay styles
  gameScreenContainer: {
    flex: 1,
    backgroundColor: '#090712',
    justifyContent: 'space-between',
    padding: 8,
  },
  hudTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#140f26',
    borderWidth: 2,
    borderColor: '#d4a338',
    padding: 8,
  },
  hudStatusBox: {
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    color: '#ff8fa3',
    fontSize: 10,
    fontWeight: '900',
    width: 42,
  },
  barTrack: {
    width: 90,
    height: 10,
    backgroundColor: '#251c3d',
    borderWidth: 1,
    borderColor: '#6c589c',
  },
  barFill: {
    height: '100%',
  },
  barVal: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  hudRightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hudLevelTitle: {
    color: '#ffd152',
    fontSize: 12,
    fontWeight: '900',
  },
  hudCoinsText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  bossHudBar: {
    backgroundColor: '#2b0928',
    borderWidth: 2,
    borderColor: '#e63946',
    padding: 6,
  },
  bossHudText: {
    color: '#ffccd5',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },
  viewport: {
    width: '100%',
    height: VIEWPORT_H,
    borderWidth: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  stoneFlashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 209, 82, 0.35)',
    zIndex: 10,
  },
  toastBanner: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(18, 12, 34, 0.9)',
    borderWidth: 1,
    borderColor: '#ffd152',
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 15,
  },
  toastText: {
    color: '#ffd152',
    fontSize: 11,
    fontWeight: '800',
  },
  groundStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: GROUND_Y,
    height: VIEWPORT_H - GROUND_Y,
    borderTopWidth: 4,
  },
  platformBlock: {
    position: 'absolute',
    borderTopWidth: 3,
  },
  portalSprite: {
    position: 'absolute',
    width: 44,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemySprite: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warriorSprite: {
    position: 'absolute',
    alignItems: 'center',
  },
  warriorHelm: {
    width: 20,
    height: 14,
    backgroundColor: '#e9ecef',
    borderWidth: 2,
    borderColor: '#e63946',
  },
  warriorArmor: {
    width: 24,
    height: 24,
    backgroundColor: '#3a506b',
    borderWidth: 2,
    borderColor: '#ffd152',
  },
  warriorShield: {
    position: 'absolute',
    right: -6,
    top: 4,
    width: 8,
    height: 28,
    backgroundColor: '#38e4ae',
  },
  swordSlashArc: {
    position: 'absolute',
    right: -34,
    top: 2,
    width: 36,
    height: 10,
    backgroundColor: '#ffd152',
  },
  dialogueBox: {
    backgroundColor: '#191230',
    borderWidth: 2,
    borderColor: '#ffd152',
    padding: 8,
  },
  dialogueSpeaker: {
    color: '#ffd152',
    fontWeight: '900',
    fontSize: 11,
  },
  dialogueLine: {
    color: '#ffffff',
    fontSize: 13,
  },
  touchGamepadBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  dpadGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  dpadBtn: {
    width: 72,
    height: 60,
    backgroundColor: '#251c42',
    borderWidth: 2,
    borderColor: '#ffd152',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    flex: 1,
  },
  actionBtn: {
    minWidth: 68,
    height: 56,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attackBtn: {
    backgroundColor: '#8a1834',
    borderColor: '#ff6b8b',
  },
  jumpBtn: {
    backgroundColor: '#185c7a',
    borderColor: '#64dfdf',
  },
  shieldBtn: {
    backgroundColor: '#2d3748',
    borderColor: '#cbd5e0',
  },
  stoneBtn: {
    backgroundColor: '#5e1787',
    borderColor: '#38e4ae',
  },
  gamepadBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 11,
  },
});
