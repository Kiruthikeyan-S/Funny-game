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
import { MonsterArt, WarriorArt } from '../components/MonsterSprites';
import {
  LEVELS_DATA,
  LevelInfo,
  MONSTER_GALLERY_LIST,
  MONSTERS_DATA,
  MonsterConfig,
  MonsterId,
  STORY_CHAPTERS,
  WORLDS_DATA,
  WorldInfo,
} from '../constants/gameData';

type ScreenState =
  | 'MAIN_MENU'
  | 'STORY'
  | 'SELECT_WORLD'
  | 'LEVEL_SELECT'
  | 'LEVEL_MONSTER_PLAN'
  | 'MONSTER_GALLERY'
  | 'MONSTER_DETAIL'
  | 'GAMEPLAY'
  | 'PAUSE'
  | 'SETTINGS'
  | 'LEVEL_COMPLETE'
  | 'ENDING';

interface SaveData {
  unlockedLevel: number;
  coins: number;
  gems: number;
  stars: Record<number, number>;
  musicVol: number;
  sfxVol: number;
  vibration: boolean;
  screenShake: boolean;
  fullscreen: boolean;
}

const DEFAULT_SAVE: SaveData = {
  unlockedLevel: 1,
  coins: 230,
  gems: 3,
  stars: { 1: 3, 2: 2 },
  musicVol: 80,
  sfxVol: 70,
  vibration: true,
  screenShake: true,
  fullscreen: false,
};

const STORAGE_KEY = 'cursed_kingdom_v2_save';
const STAGE_HEIGHT = 250;
const GROUND_Y = 204;

interface ActiveEnemy {
  id: string;
  monsterId: MonsterId;
  name: string;
  x: number;
  y: number;
  startX: number;
  w: number;
  h: number;
  vx: number;
  hp: number;
  maxHp: number;
  attack: number;
  isBoss: boolean;
  shieldActive: boolean;
  escapeThreshold: number;
}

interface Collectible {
  id: string;
  x: number;
  y: number;
  type: 'coin' | 'gem' | 'heart';
  collected: boolean;
}

export default function CursedKingdomGame() {
  const [screen, setScreen] = useState<ScreenState>('MAIN_MENU');
  const [save, setSave] = useState<SaveData>(DEFAULT_SAVE);
  const [storyStep, setStoryStep] = useState(0);
  const [selectedWorldId, setSelectedWorldId] = useState<number>(1);
  const [selectedMonster, setSelectedMonster] = useState<MonsterConfig>(
    MONSTERS_DATA.frost_guardian
  );
  const [settingsTab, setSettingsTab] = useState<
    'General' | 'Controls' | 'Audio' | 'Graphics' | 'Language'
  >('General');

  const [currentLevel, setCurrentLevel] = useState<LevelInfo>(LEVELS_DATA[0]);
  const [currentWorld, setCurrentWorld] = useState<WorldInfo>(WORLDS_DATA[0]);

  const [hud, setHud] = useState({
    hearts: 4,
    maxHearts: 4,
    hp: 100,
    maxHp: 100,
    stoneCharge: 100,
    coins: 230,
    gems: 3,
    targetEnemyName: 'Forest Slime',
    targetEnemyId: 'forest_slime' as MonsterId,
    targetEnemyHp: 400,
    targetEnemyMaxHp: 400,
    targetHasShield: false,
    dialogueSpeaker: '',
    dialogueText: '',
    toast: '',
    elapsedSec: 0,
    victory: true,
    starsEarned: 3,
    levelCoinsEarned: 45,
    levelGemsEarned: 3,
  });

  const [, setTick] = useState(0);

  const gameRef = useRef({
    running: false,
    startTimeMs: 0,
    cameraX: 0,
    controls: { left: false, right: false },
    player: {
      x: 70,
      y: GROUND_Y - 48,
      w: 38,
      h: 48,
      vx: 0,
      vy: 0,
      speed: 4.6,
      jumpForce: -10.8,
      facing: 1,
      onGround: true,
      jumpsLeft: 2,
      hp: 400,
      maxHp: 400,
      stoneCharge: 100,
      attackTimer: 0,
      spinTimer: 0,
      invulnTimer: 0,
    },
    platforms: [] as { x: number; y: number; w: number; h: number }[],
    enemies: [] as ActiveEnemy[],
    items: [] as Collectible[],
    portalX: 1750,
    coinsCollected: 0,
    gemsCollected: 0,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          setSave({ ...DEFAULT_SAVE, ...JSON.parse(raw) });
        }
      })
      .catch(() => {});
  }, []);

  const updateSave = (next: SaveData) => {
    setSave(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const vibrate = (kind: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!save.vibration || Platform.OS === 'web') return;
    const style =
      kind === 'heavy'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : kind === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style).catch(() => {});
  };

  // Start any of the 13 Levels with its signature Monster
  const launchLevel = (levelNumber: number) => {
    const lvl = LEVELS_DATA.find((l) => l.level === levelNumber) || LEVELS_DATA[0];
    const world = WORLDS_DATA.find((w) => w.id === lvl.world) || WORLDS_DATA[0];
    const mainMonster = MONSTERS_DATA[lvl.monsterId];
    const minionMonster = MONSTERS_DATA[lvl.minionId];

    setCurrentLevel(lvl);
    setCurrentWorld(world);

    const g = gameRef.current;
    const playerMaxHp = 360 + lvl.level * 40;

    g.player = {
      x: 68,
      y: GROUND_Y - 48,
      w: 38,
      h: 48,
      vx: 0,
      vy: 0,
      speed: 4.8,
      jumpForce: -11.0,
      facing: 1,
      onGround: true,
      jumpsLeft: 2,
      hp: playerMaxHp,
      maxHp: playerMaxHp,
      stoneCharge: 100,
      attackTimer: 0,
      spinTimer: 0,
      invulnTimer: 0,
    };

    g.cameraX = 0;
    g.coinsCollected = 0;
    g.gemsCollected = 0;
    g.startTimeMs = Date.now();
    g.controls = { left: false, right: false };

    // Build Platforms & Collectibles
    const plats: { x: number; y: number; w: number; h: number }[] = [];
    const items: Collectible[] = [];
    const count = Math.floor(lvl.length / 250);
    for (let i = 1; i < count; i++) {
      const px = i * 240;
      const py = i % 2 === 0 ? 142 : 108;
      plats.push({ x: px, y: py, w: 112, h: 14 });
      items.push({ id: `coin_${i}_a`, x: px + 24, y: py - 24, type: 'coin', collected: false });
      items.push({ id: `coin_${i}_b`, x: px + 60, y: py - 24, type: 'coin', collected: false });
      if (i <= lvl.gemsInLevel) {
        items.push({ id: `gem_${i}`, x: px + 88, y: py - 26, type: 'gem', collected: false });
      } else if (i % 3 === 0) {
        items.push({ id: `heart_${i}`, x: px + 88, y: py - 24, type: 'heart', collected: false });
      }
    }
    g.platforms = plats;
    g.items = items;

    // Spawn Minions + Featured Level Monster / Boss
    const enemies: ActiveEnemy[] = [];
    const spacing = Math.floor((lvl.length - 480) / Math.max(1, lvl.minionCount));
    for (let i = 0; i < lvl.minionCount; i++) {
      const mCfg = i % 2 === 0 ? minionMonster : mainMonster;
      const ex = 280 + i * spacing;
      const isFlying = mCfg.id === 'cave_bat';
      const hp = Math.round(mCfg.health * 0.35);
      enemies.push({
        id: `minion_${i}`,
        monsterId: mCfg.id,
        name: mCfg.name,
        x: ex,
        y: isFlying ? 125 : GROUND_Y - 46,
        startX: ex,
        w: 44,
        h: 46,
        vx: -mCfg.moveSpeed,
        hp,
        maxHp: hp,
        attack: Math.round(mCfg.attack * 0.22),
        isBoss: false,
        shieldActive: false,
        escapeThreshold: 0,
      });
    }

    // Featured Level Boss / Champion Monster at the end of the stage
    const bossSize = Math.round(54 * Math.min(1.25, mainMonster.scale));
    enemies.push({
      id: 'stage_champion',
      monsterId: mainMonster.id,
      name: mainMonster.name,
      x: lvl.length - 230,
      y: GROUND_Y - bossSize,
      startX: lvl.length - 250,
      w: bossSize,
      h: bossSize,
      vx: -mainMonster.moveSpeed,
      hp: mainMonster.health,
      maxHp: mainMonster.health,
      attack: Math.round(mainMonster.attack * 0.28),
      isBoss: true,
      shieldActive: Boolean(mainMonster.needsStone),
      escapeThreshold: mainMonster.escapeThreshold || 0,
    });

    g.enemies = enemies;
    g.portalX = lvl.length - 85;
    g.running = true;

    setHud({
      hearts: 4,
      maxHearts: 4,
      hp: playerMaxHp,
      maxHp: playerMaxHp,
      stoneCharge: 100,
      coins: save.coins,
      gems: save.gems,
      targetEnemyName: mainMonster.name,
      targetEnemyId: mainMonster.id,
      targetEnemyHp: mainMonster.health,
      targetEnemyMaxHp: mainMonster.health,
      targetHasShield: Boolean(mainMonster.needsStone),
      dialogueSpeaker: lvl.introSpeaker,
      dialogueText: lvl.introDialogue,
      toast: `Level ${lvl.level}: ${lvl.name} — ${mainMonster.name}`,
      elapsedSec: 0,
      victory: false,
      starsEarned: 0,
      levelCoinsEarned: 0,
      levelGemsEarned: 0,
    });

    setScreen('GAMEPLAY');
  };

  // 60FPS Real-Time Gameplay Loop
  useEffect(() => {
    if (screen !== 'GAMEPLAY') return;

    const timer = setInterval(() => {
      const g = gameRef.current;
      if (!g.running) return;
      const p = g.player;

      p.stoneCharge = Math.min(100, p.stoneCharge + 0.22);

      if (g.controls.left) {
        p.vx = -p.speed;
        p.facing = -1;
      } else if (g.controls.right) {
        p.vx = p.speed;
        p.facing = 1;
      } else {
        p.vx *= 0.7;
        if (Math.abs(p.vx) < 0.1) p.vx = 0;
      }

      if (p.attackTimer > 0) p.attackTimer--;
      if (p.spinTimer > 0) p.spinTimer--;
      if (p.invulnTimer > 0) p.invulnTimer--;

      p.x = Math.max(16, Math.min(currentLevel.length - 40, p.x + p.vx));
      p.vy += 0.56;
      p.y += p.vy;
      p.onGround = false;

      if (p.y + p.h >= GROUND_Y) {
        p.y = GROUND_Y - p.h;
        p.vy = 0;
        p.onGround = true;
        p.jumpsLeft = 2;
      }

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

      const winW = Dimensions.get('window').width;
      const targetCam = p.x - winW * 0.26;
      g.cameraX = Math.max(0, Math.min(currentLevel.length - winW + 40, targetCam));

      // Collectibles
      for (const item of g.items) {
        if (
          !item.collected &&
          Math.abs(p.x + p.w / 2 - item.x) < 26 &&
          Math.abs(p.y + p.h / 2 - item.y) < 28
        ) {
          item.collected = true;
          if (item.type === 'coin') g.coinsCollected += 15;
          else if (item.type === 'gem') g.gemsCollected += 1;
          else p.hp = Math.min(p.maxHp, p.hp + 90);
          vibrate('light');
        }
      }

      // Enemies & In-Game Enemy HUD target
      let closestEnemy: ActiveEnemy | null = null;
      let minDist = 99999;

      for (let i = g.enemies.length - 1; i >= 0; i--) {
        const e = g.enemies[i];

        // Level 6 Witch Escape Check
        if (e.isBoss && e.escapeThreshold > 0 && e.hp <= e.maxHp * e.escapeThreshold) {
          g.enemies.splice(i, 1);
          setHud((prev) => ({
            ...prev,
            dialogueSpeaker: 'THE WITCH',
            dialogueText:
              'My curse is too strong for you now! Journey to the Frozen Mountains if you dare!',
            toast: 'THE WITCH ESCAPED! ENTER THE PORTAL!',
          }));
          continue;
        }

        if (e.hp <= 0) {
          g.coinsCollected += e.isBoss ? 80 : 20;
          g.enemies.splice(i, 1);
          continue;
        }

        const dist = p.x - e.x;
        if (Math.abs(dist) < minDist) {
          minDist = Math.abs(dist);
          closestEnemy = e;
        }

        if (Math.abs(dist) < 240) {
          e.x += (dist > 0 ? 1 : -1) * Math.abs(e.vx);
        } else {
          e.x += e.vx;
          if (Math.abs(e.x - e.startX) > 105) e.vx *= -1;
        }

        // Contact damage
        if (
          Math.abs(p.x + p.w / 2 - (e.x + e.w / 2)) < (p.w + e.w) * 0.4 &&
          Math.abs(p.y + p.h / 2 - (e.y + e.h / 2)) < (p.h + e.h) * 0.4
        ) {
          if (p.invulnTimer <= 0) {
            p.hp = Math.max(0, p.hp - e.attack);
            p.invulnTimer = 32;
            vibrate('medium');
            if (p.hp <= 0) {
              endStage(false);
              return;
            }
          }
        }
      }

      // Check portal
      const bossAlive = g.enemies.some((e) => e.isBoss);
      if (Math.abs(p.x - g.portalX) < 36) {
        if (bossAlive) {
          setHud((prev) => ({
            ...prev,
            toast: `DEFEAT ${MONSTERS_DATA[currentLevel.monsterId].name.toUpperCase()} FIRST!`,
          }));
        } else {
          endStage(true);
          return;
        }
      }

      const heartsLeft = Math.max(1, Math.ceil((p.hp / p.maxHp) * 4));
      setHud((prev) => ({
        ...prev,
        hearts: p.hp > 0 ? heartsLeft : 0,
        hp: p.hp,
        maxHp: p.maxHp,
        stoneCharge: p.stoneCharge,
        coins: save.coins + g.coinsCollected,
        gems: save.gems + g.gemsCollected,
        targetEnemyName: closestEnemy ? closestEnemy.name : '',
        targetEnemyId: closestEnemy ? closestEnemy.monsterId : currentLevel.monsterId,
        targetEnemyHp: closestEnemy ? closestEnemy.hp : 0,
        targetEnemyMaxHp: closestEnemy ? closestEnemy.maxHp : 1,
        targetHasShield: Boolean(closestEnemy?.shieldActive),
      }));

      setTick((t) => (t + 1) % 10000);
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [screen, currentLevel, save]);

  const onJumpPress = () => {
    const g = gameRef.current;
    if (!g.running) return;
    if (g.player.jumpsLeft > 0) {
      g.player.vy = g.player.jumpForce;
      g.player.jumpsLeft--;
      g.player.onGround = false;
      vibrate('light');
    }
  };

  const onSwordPress = () => {
    const g = gameRef.current;
    if (!g.running) return;
    const p = g.player;
    p.attackTimer = 12;
    vibrate('light');

    const dmg = 110 + currentLevel.level * 25;
    g.enemies.forEach((e) => {
      const dx = e.x + e.w / 2 - (p.x + p.w / 2);
      const dy = Math.abs(e.y + e.h / 2 - (p.y + p.h / 2));
      const inFront = p.facing > 0 ? dx >= -16 && dx <= 76 : dx <= 16 && dx >= -76;
      if (inFront && dy < 56) {
        if (e.shieldActive) {
          setHud((prev) => ({
            ...prev,
            toast: 'CURSE BARRIER! TAP THE SPIN/STONE BUTTON TO BREAK IT!',
          }));
          return;
        }
        e.hp -= dmg;
        e.x += p.facing * (e.isBoss ? 10 : 20);
        p.stoneCharge = Math.min(100, p.stoneCharge + 14);
      }
    });
  };

  const onSpecialSpinPress = () => {
    const g = gameRef.current;
    if (!g.running) return;
    const p = g.player;
    if (p.stoneCharge < 40) {
      setHud((prev) => ({
        ...prev,
        toast: `SPECIAL CHARGING (${Math.floor(p.stoneCharge)}%)`,
      }));
      return;
    }

    p.stoneCharge = Math.max(0, p.stoneCharge - 50);
    p.spinTimer = 16;
    vibrate('heavy');

    const specialDmg = 240 + currentLevel.level * 45;
    g.enemies.forEach((e) => {
      if (Math.abs(e.x - p.x) < 210) {
        if (e.shieldActive) {
          e.shieldActive = false;
          setHud((prev) => ({
            ...prev,
            toast: 'ANCIENT STONE SHATTERED THE WITCH’S CURSE BARRIER!',
          }));
        }
        e.hp -= specialDmg;
      }
    });
  };

  const endStage = (victory: boolean) => {
    const g = gameRef.current;
    g.running = false;
    const elapsedSec = Math.max(12, Math.round((Date.now() - g.startTimeMs) / 1000));
    vibrate(victory ? 'heavy' : 'medium');

    if (victory) {
      const hpRatio = g.player.hp / g.player.maxHp;
      const stars = hpRatio >= 0.65 ? 3 : hpRatio >= 0.35 ? 2 : 1;
      const earnedCoins = g.coinsCollected + 50 + currentLevel.level * 15;
      const earnedGems = Math.max(1, g.gemsCollected);

      const nextUnlocked =
        currentLevel.level >= save.unlockedLevel && currentLevel.level < 13
          ? currentLevel.level + 1
          : save.unlockedLevel;

      const updatedStars = { ...save.stars };
      if (stars > (updatedStars[currentLevel.level] || 0)) {
        updatedStars[currentLevel.level] = stars;
      }

      updateSave({
        ...save,
        unlockedLevel: nextUnlocked,
        coins: save.coins + earnedCoins,
        gems: save.gems + earnedGems,
        stars: updatedStars,
      });

      setHud((prev) => ({
        ...prev,
        elapsedSec,
        victory: true,
        starsEarned: stars,
        levelCoinsEarned: earnedCoins,
        levelGemsEarned: earnedGems,
      }));

      if (currentLevel.level === 13) {
        setScreen('ENDING');
      } else {
        setScreen('LEVEL_COMPLETE');
      }
    } else {
      setHud((prev) => ({
        ...prev,
        elapsedSec,
        victory: false,
        starsEarned: 0,
        levelCoinsEarned: g.coinsCollected,
        levelGemsEarned: g.gemsCollected,
      }));
      setScreen('LEVEL_COMPLETE');
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ==========================================================================
  // 1. MAIN MENU SCREEN (Matches Image 1 Top-Left)
  // ==========================================================================
  if (screen === 'MAIN_MENU') {
    return (
      <SafeAreaView style={styles.menuScreenBg}>
        <View style={styles.menuLayout}>
          {/* Left Hero & Kingdom Logo */}
          <View style={styles.menuLeftCol}>
            <Text style={styles.crownIcon}>👑</Text>
            <Text style={styles.logoSmall}>THE</Text>
            <Text style={styles.logoMain}>CURSED{'\n'}KINGDOM</Text>
            <View style={styles.heroCliffBox}>
              <WarriorArt size={105} attacking />
            </View>
          </View>

          {/* Right Ornate Menu Buttons */}
          <View style={styles.menuRightCol}>
            <Pressable
              style={[styles.ornateMenuBtn, styles.ornateMenuBtnPrimary]}
              onPress={() => {
                setStoryStep(0);
                setScreen('STORY');
              }}>
              <Text style={styles.menuBtnIcon}>▶</Text>
              <Text style={styles.menuBtnLabel}>New Game</Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => launchLevel(save.unlockedLevel)}>
              <Text style={styles.menuBtnIcon}>📁</Text>
              <Text style={styles.menuBtnLabel}>
                Continue (Lv {save.unlockedLevel})
              </Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => setScreen('SELECT_WORLD')}>
              <Text style={styles.menuBtnIcon}>📖</Text>
              <Text style={styles.menuBtnLabel}>Level Selection</Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => setScreen('LEVEL_MONSTER_PLAN')}>
              <Text style={styles.menuBtnIcon}>⚔️</Text>
              <Text style={styles.menuBtnLabel}>13-Level & Monster Plan</Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => setScreen('MONSTER_GALLERY')}>
              <Text style={styles.menuBtnIcon}>🐉</Text>
              <Text style={styles.menuBtnLabel}>Monster Gallery (13)</Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => setScreen('SETTINGS')}>
              <Text style={styles.menuBtnIcon}>⚙️</Text>
              <Text style={styles.menuBtnLabel}>Settings</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 2. THE STORY SCREEN (Matches Image 1 Top-Center Parchment Scroll)
  // ==========================================================================
  if (screen === 'STORY') {
    const ch = STORY_CHAPTERS[storyStep] || STORY_CHAPTERS[0];
    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.topHeaderRow}>
          <Pressable
            style={styles.backCircleBtn}
            onPress={() => setScreen('MAIN_MENU')}>
            <Text style={styles.backArrowText}>←</Text>
          </Pressable>
          <View style={styles.goldenRibbon}>
            <Text style={styles.ribbonTitle}>{ch.title}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.parchmentCard}>
          {/* Left: King & Witch over Castle Illustration */}
          <View style={styles.storyArtBox}>
            <MonsterArt monsterId="witch_final" size={76} />
            <Text style={styles.castleEmoji}>🏰</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 36 }}>🤴</Text>
              <WarriorArt size={56} />
            </View>
          </View>

          {/* Right: Parchment Story Text */}
          <View style={styles.storyTextCol}>
            <Text style={styles.parchmentBody}>{ch.text}</Text>

            <View style={styles.storyFooterRow}>
              <View style={styles.dotsRow}>
                {STORY_CHAPTERS.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.pageDot,
                      idx === storyStep && styles.pageDotActive,
                    ]}
                  />
                ))}
              </View>

              <Pressable
                style={styles.parchmentNextBtn}
                onPress={() => {
                  if (storyStep < STORY_CHAPTERS.length - 1) {
                    setStoryStep(storyStep + 1);
                  } else {
                    launchLevel(1);
                  }
                }}>
                <Text style={styles.parchmentNextText}>
                  {storyStep === STORY_CHAPTERS.length - 1 ? 'Start Lv 1 >' : 'Next >'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 3. SELECT WORLD SCREEN (Matches Image 1 Top-Right 5 Vertical World Cards)
  // ==========================================================================
  if (screen === 'SELECT_WORLD') {
    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.topHeaderRow}>
          <Pressable
            style={styles.backCircleBtn}
            onPress={() => setScreen('MAIN_MENU')}>
            <Text style={styles.backArrowText}>←</Text>
          </Pressable>
          <View style={styles.goldenRibbon}>
            <Text style={styles.ribbonTitle}>Select World</Text>
          </View>
          <Pressable
            style={styles.unlockAllMiniBtn}
            onPress={() =>
              updateSave({
                ...save,
                unlockedLevel: 13,
                coins: Math.max(save.coins, 999),
              })
            }>
            <Text style={styles.unlockAllMiniText}>Unlock All 13</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.worldsHorizontalRow}>
          {WORLDS_DATA.map((w) => {
            const representativeMonster: MonsterId =
              w.id === 1
                ? 'wood_golem'
                : w.id === 2
                ? 'skeleton_warrior'
                : w.id === 3
                ? 'witch_encounter'
                : w.id === 4
                ? 'frost_guardian'
                : 'witch_final';

            return (
              <Pressable
                key={w.id}
                style={[
                  styles.worldPillarCard,
                  {
                    backgroundColor: w.bgBottom,
                    borderColor:
                      selectedWorldId === w.id ? '#ffd152' : w.cardBorder,
                  },
                ]}
                onPress={() => {
                  setSelectedWorldId(w.id);
                  setScreen('LEVEL_SELECT');
                }}>
                <Text style={styles.worldBadgeEmoji}>{w.badgeIcon}</Text>
                <View style={styles.worldPillarArt}>
                  <MonsterArt monsterId={representativeMonster} size={74} />
                </View>
                <Text style={styles.worldPillarTitle}>{w.shortName}</Text>
                <Text style={styles.worldPillarRange}>{w.levelRange}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 4. LEVEL SELECTION — WORLD DETAIL (Matches Image 1 Middle-Left)
  // ==========================================================================
  if (screen === 'LEVEL_SELECT') {
    const world =
      WORLDS_DATA.find((w) => w.id === selectedWorldId) || WORLDS_DATA[0];
    const worldLevels = LEVELS_DATA.filter((l) => l.world === world.id);

    return (
      <SafeAreaView
        style={[styles.darkBackdrop, { backgroundColor: world.bgTop }]}>
        <View style={styles.topHeaderRow}>
          <Pressable
            style={styles.backCircleBtn}
            onPress={() => setScreen('SELECT_WORLD')}>
            <Text style={styles.backArrowText}>←</Text>
          </Pressable>
          <View style={styles.goldenRibbon}>
            <Text style={styles.ribbonTitle}>
              Level Selection – {world.shortName}
            </Text>
          </View>
          <Pressable
            style={styles.unlockAllMiniBtn}
            onPress={() => setScreen('LEVEL_MONSTER_PLAN')}>
            <Text style={styles.unlockAllMiniText}>All 13 Plan</Text>
          </Pressable>
        </View>

        <Text style={styles.worldSubHeader}>
          {world.badgeIcon} {world.shortName} • {world.levelRange}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelCardsCarousel}>
          {worldLevels.map((lvl) => {
            const monster = MONSTERS_DATA[lvl.monsterId];
            const unlocked = lvl.level <= save.unlockedLevel;
            const stars = save.stars[lvl.level] || 0;

            return (
              <View
                key={lvl.level}
                style={[
                  styles.levelSquareCard,
                  unlocked && styles.levelSquareCardActive,
                ]}>
                {/* Level Art + Featured Monster */}
                <Pressable
                  disabled={!unlocked}
                  style={[
                    styles.levelPreviewBox,
                    { backgroundColor: world.bgBottom },
                  ]}
                  onPress={() => launchLevel(lvl.level)}>
                  <MonsterArt monsterId={monster.id} size={78} />
                  <Text style={styles.levelMonsterTag}>{monster.name}</Text>
                </Pressable>

                <Text style={styles.levelCardTitle}>
                  Level {lvl.level}: {lvl.name}
                </Text>

                {/* Monster Level & Hearts Row (Matching Image 2) */}
                <View style={styles.monsterMetaRow}>
                  <Text style={styles.monsterLvText}>⚔️ Lv {lvl.level}</Text>
                  <Text style={styles.monsterHeartsText}>
                    {'❤️'.repeat(Math.min(5, monster.hearts))}
                  </Text>
                </View>

                {/* Stars or Lock Icon */}
                {unlocked ? (
                  <View style={styles.levelCardFooter}>
                    <Text style={styles.goldStarsText}>
                      {'★'.repeat(stars)}
                      {'☆'.repeat(3 - stars)}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Pressable
                        style={styles.playLevelBtn}
                        onPress={() => launchLevel(lvl.level)}>
                        <Text style={styles.playLevelBtnText}>▶ Play</Text>
                      </Pressable>
                      <Pressable
                        style={styles.infoMiniBtn}
                        onPress={() => {
                          setSelectedMonster(monster);
                          setScreen('MONSTER_DETAIL');
                        }}>
                        <Text style={styles.playLevelBtnText}>🔍 Stat</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.lockIconText}>🔒 Locked</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 5. FULL 13-LEVEL & MONSTER PLAN BOARD (Matches Image 2 Top Half)
  // ==========================================================================
  if (screen === 'LEVEL_MONSTER_PLAN') {
    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.topHeaderRow}>
          <Pressable
            style={styles.backCircleBtn}
            onPress={() => setScreen('MAIN_MENU')}>
            <Text style={styles.backArrowText}>←</Text>
          </Pressable>
          <View style={styles.goldenRibbon}>
            <Text style={styles.ribbonTitle}>
              The Cursed Kingdom — 13-Level & Monster Plan
            </Text>
          </View>
          <Pressable
            style={styles.unlockAllMiniBtn}
            onPress={() => setScreen('MONSTER_GALLERY')}>
            <Text style={styles.unlockAllMiniText}>Monster Gallery</Text>
          </Pressable>
        </View>

        <ScrollView style={{ width: '100%' }}>
          {WORLDS_DATA.map((w) => {
            const lvls = LEVELS_DATA.filter((l) => l.world === w.id);
            return (
              <View
                key={w.id}
                style={[styles.planWorldBox, { borderColor: w.cardBorder }]}>
                <Text style={[styles.planWorldHeader, { color: w.accent }]}>
                  {w.badgeIcon} {w.name} {w.levelRange}
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {lvls.map((lvl) => {
                      const m = MONSTERS_DATA[lvl.monsterId];
                      return (
                        <Pressable
                          key={lvl.level}
                          style={[
                            styles.planLevelCard,
                            { backgroundColor: w.bgBottom },
                          ]}
                          onPress={() => launchLevel(lvl.level)}>
                          <Text style={styles.planLevelNum}>
                            Level {lvl.level}
                          </Text>
                          <Text style={styles.planLevelSub}>{lvl.name}</Text>
                          <View style={{ marginVertical: 6 }}>
                            <MonsterArt monsterId={m.id} size={58} />
                          </View>
                          <Text style={styles.planMonsterName}>{m.name}</Text>
                          <View style={styles.monsterMetaRow}>
                            <Text style={styles.monsterLvText}>
                              ⚔️ Lv {lvl.level}
                            </Text>
                            <Text style={styles.monsterHeartsText}>
                              {'❤️'.repeat(Math.min(5, m.hearts))}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 6. MONSTER GALLERY & MONSTER DETAIL UI (Matches Image 2 Bottom Half)
  // ==========================================================================
  if (screen === 'MONSTER_GALLERY') {
    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.topHeaderRow}>
          <Pressable
            style={styles.backCircleBtn}
            onPress={() => setScreen('MAIN_MENU')}>
            <Text style={styles.backArrowText}>←</Text>
          </Pressable>
          <View style={styles.goldenRibbon}>
            <Text style={styles.ribbonTitle}>Monster Gallery (All 13)</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.galleryGrid}>
          {MONSTER_GALLERY_LIST.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.galleryItemCard, { borderColor: m.themeColor }]}
              onPress={() => {
                setSelectedMonster(m);
                setScreen('MONSTER_DETAIL');
              }}>
              <MonsterArt monsterId={m.id} size={64} />
              <Text style={styles.galleryMonsterName}>{m.name}</Text>
              <Text style={styles.galleryMonsterLv}>
                Lv {m.level} • {'❤️'.repeat(Math.min(5, m.hearts))}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'MONSTER_DETAIL') {
    const m = selectedMonster;
    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.topHeaderRow}>
          <Pressable
            style={styles.backCircleBtn}
            onPress={() => setScreen('MONSTER_GALLERY')}>
            <Text style={styles.backArrowText}>←</Text>
          </Pressable>
          <View style={styles.goldenRibbon}>
            <Text style={styles.ribbonTitle}>Monster Detail — {m.name}</Text>
          </View>
          <Pressable
            style={styles.unlockAllMiniBtn}
            onPress={() => launchLevel(m.level)}>
            <Text style={styles.unlockAllMiniText}>Fight Lv {m.level} ▶</Text>
          </Pressable>
        </View>

        <View style={[styles.monsterDetailFrame, { borderColor: m.themeColor }]}>
          <View style={styles.monsterDetailTopRow}>
            {/* Left Portrait Box */}
            <View style={styles.monsterDetailPortrait}>
              <MonsterArt monsterId={m.id} size={115} />
              <Text style={styles.monsterHeartsText}>
                {'❤️'.repeat(m.hearts)}
              </Text>
            </View>

            {/* Right Stats Table */}
            <View style={styles.monsterStatsCol}>
              <View style={styles.monsterRibbonBanner}>
                <Text style={styles.monsterRibbonText}>{m.name}</Text>
              </View>

              <View style={styles.statLine}>
                <Text style={styles.statLabel}>❤️ Health</Text>
                <Text style={styles.statNumber}>
                  {m.health.toLocaleString()}
                </Text>
              </View>
              <View style={styles.statLine}>
                <Text style={styles.statLabel}>⚔️ Attack</Text>
                <Text style={styles.statNumber}>{m.attack}</Text>
              </View>
              <View style={styles.statLine}>
                <Text style={styles.statLabel}>🛡️ Defense</Text>
                <Text style={styles.statNumber}>{m.defense}</Text>
              </View>
              <View style={styles.statLine}>
                <Text style={styles.statLabel}>💨 Speed</Text>
                <Text style={styles.statNumber}>{m.speedLabel}</Text>
              </View>
            </View>
          </View>

          {/* Bottom 3 Abilities Bar */}
          <Text style={styles.abilitiesTitle}>Abilities</Text>
          <View style={styles.abilitiesRow}>
            {m.abilities.map((ab, i) => (
              <View
                key={i}
                style={[styles.abilityBox, { borderColor: ab.color }]}>
                <Text style={{ fontSize: 22 }}>{ab.icon}</Text>
                <Text style={styles.abilityNameText}>{ab.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 7. SETTINGS SCREEN (Matches Image 1 Bottom-Left with 5 Sidebar Tabs)
  // ==========================================================================
  if (screen === 'SETTINGS') {
    const tabs: Array<'General' | 'Controls' | 'Audio' | 'Graphics' | 'Language'> =
      ['General', 'Controls', 'Audio', 'Graphics', 'Language'];

    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.topHeaderRow}>
          <Pressable
            style={styles.backCircleBtn}
            onPress={() => setScreen('MAIN_MENU')}>
            <Text style={styles.backArrowText}>←</Text>
          </Pressable>
          <View style={styles.goldenRibbon}>
            <Text style={styles.ribbonTitle}>Settings</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.settingsFrame}>
          {/* Left Tabs */}
          <View style={styles.settingsSidebar}>
            {tabs.map((tab) => (
              <Pressable
                key={tab}
                style={[
                  styles.settingsTabBtn,
                  settingsTab === tab && styles.settingsTabBtnActive,
                ]}
                onPress={() => setSettingsTab(tab)}>
                <Text style={styles.settingsTabText}>{tab}</Text>
              </Pressable>
            ))}
          </View>

          {/* Right Panel */}
          <View style={styles.settingsContentCol}>
            <Text style={styles.settingsHeading}>{settingsTab}</Text>

            <View style={styles.settingControlRow}>
              <Text style={styles.settingControlLabel}>🎵 Music</Text>
              <View style={styles.sliderTrack}>
                <View
                  style={[styles.sliderFill, { width: `${save.musicVol}%` }]}
                />
              </View>
              <Pressable
                onPress={() =>
                  updateSave({
                    ...save,
                    musicVol: save.musicVol >= 100 ? 0 : save.musicVol + 20,
                  })
                }>
                <Text style={styles.settingValueText}>{save.musicVol}%</Text>
              </Pressable>
            </View>

            <View style={styles.settingControlRow}>
              <Text style={styles.settingControlLabel}>🔊 SFX</Text>
              <View style={styles.sliderTrack}>
                <View
                  style={[styles.sliderFill, { width: `${save.sfxVol}%` }]}
                />
              </View>
              <Pressable
                onPress={() =>
                  updateSave({
                    ...save,
                    sfxVol: save.sfxVol >= 100 ? 0 : save.sfxVol + 20,
                  })
                }>
                <Text style={styles.settingValueText}>{save.sfxVol}%</Text>
              </Pressable>
            </View>

            <View style={styles.settingControlRow}>
              <Text style={styles.settingControlLabel}>📳 Vibration</Text>
              <Switch
                value={save.vibration}
                onValueChange={(v) => updateSave({ ...save, vibration: v })}
              />
            </View>

            <View style={styles.settingControlRow}>
              <Text style={styles.settingControlLabel}>☀️ Screen Shake</Text>
              <Switch
                value={save.screenShake}
                onValueChange={(v) => updateSave({ ...save, screenShake: v })}
              />
            </View>

            <View style={styles.settingControlRow}>
              <Text style={styles.settingControlLabel}>📺 Fullscreen</Text>
              <Switch
                value={save.fullscreen}
                onValueChange={(v) => updateSave({ ...save, fullscreen: v })}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 8. PAUSED MODAL (Matches Image 1 Middle-Right)
  // ==========================================================================
  if (screen === 'PAUSE') {
    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.pausedDialog}>
          <View style={styles.goldenRibbon}>
            <Text style={styles.ribbonTitle}>Paused</Text>
          </View>

          <View style={{ width: '100%', gap: 10, marginTop: 14 }}>
            <Pressable
              style={[styles.ornateMenuBtn, styles.ornateMenuBtnPrimary]}
              onPress={() => {
                gameRef.current.running = true;
                setScreen('GAMEPLAY');
              }}>
              <Text style={styles.menuBtnIcon}>▶</Text>
              <Text style={styles.menuBtnLabel}>Resume</Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => launchLevel(currentLevel.level)}>
              <Text style={styles.menuBtnIcon}>↻</Text>
              <Text style={styles.menuBtnLabel}>Restart Level</Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => setScreen('SETTINGS')}>
              <Text style={styles.menuBtnIcon}>⚙️</Text>
              <Text style={styles.menuBtnLabel}>Settings</Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => setScreen('MAIN_MENU')}>
              <Text style={styles.menuBtnIcon}>🏠</Text>
              <Text style={styles.menuBtnLabel}>Main Menu</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 9. LEVEL COMPLETE! SCREEN (Matches Image 1 Bottom-Center)
  // ==========================================================================
  if (screen === 'LEVEL_COMPLETE') {
    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.levelCompleteLayout}>
          {/* Left Hero Portrait */}
          <View style={styles.completeHeroCol}>
            <WarriorArt size={120} />
          </View>

          {/* Right Ornate Summary Box */}
          <View style={styles.completeBox}>
            <Text style={styles.bigThreeStars}>
              {'★'.repeat(hud.starsEarned)}
              {'☆'.repeat(3 - hud.starsEarned)}
            </Text>

            <View style={styles.redVictoryRibbon}>
              <Text style={styles.ribbonTitle}>
                {hud.victory ? 'Level Complete!' : 'Level Failed'}
              </Text>
            </View>

            <View style={styles.completeStatsPanel}>
              <View style={styles.completeStatRow}>
                <Text style={styles.completeStatLabel}>🪙 Coins Collected</Text>
                <Text style={styles.completeStatVal}>
                  × {hud.levelCoinsEarned}
                </Text>
              </View>
              <View style={styles.completeStatRow}>
                <Text style={styles.completeStatLabel}>💎 Gems Collected</Text>
                <Text style={styles.completeStatVal}>
                  × {hud.levelGemsEarned}
                </Text>
              </View>
              <View style={styles.completeStatRow}>
                <Text style={styles.completeStatLabel}>🕒 Time</Text>
                <Text style={styles.completeStatVal}>
                  {formatTime(hud.elapsedSec)}
                </Text>
              </View>
            </View>

            <View style={styles.completeBtnsRow}>
              <Pressable
                style={styles.retryBtn}
                onPress={() => launchLevel(currentLevel.level)}>
                <Text style={styles.menuBtnLabel}>↻ Retry</Text>
              </Pressable>

              {hud.victory && currentLevel.level < 13 ? (
                <Pressable
                  style={styles.nextLevelGoldBtn}
                  onPress={() => launchLevel(currentLevel.level + 1)}>
                  <Text style={styles.nextLevelGoldText}>Next Level &gt;</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.nextLevelGoldBtn}
                  onPress={() => setScreen('SELECT_WORLD')}>
                  <Text style={styles.nextLevelGoldText}>World Map &gt;</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 10. THE KINGDOM IS SAVED! ENDING SCREEN (Matches Image 1 Bottom-Right)
  // ==========================================================================
  if (screen === 'ENDING') {
    return (
      <SafeAreaView style={styles.endingSunlitBg}>
        <View style={styles.goldenRibbon}>
          <Text style={styles.ribbonTitle}>The Kingdom is Saved!</Text>
        </View>

        <View style={styles.endingCastleScene}>
          <Text style={{ fontSize: 56 }}>🏰</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <WarriorArt size={76} />
            <Text style={{ fontSize: 48 }}>🤴</Text>
          </View>
        </View>

        <View style={styles.endingParchmentBanner}>
          <Text style={styles.endingParchmentText}>
            With the power of the Ancient Stone, the witch’s curse is broken,
            and peace returns to the kingdom.{'\n'}
            <Text style={{ fontWeight: '900' }}>
              You have saved your people. You are the true hero of the kingdom!
            </Text>
          </Text>
        </View>

        <Pressable
          style={[styles.nextLevelGoldBtn, { marginTop: 10 }]}
          onPress={() => setScreen('MAIN_MENU')}>
          <Text style={styles.nextLevelGoldText}>Return to Main Menu</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 11. GAMEPLAY SCREEN + IN-GAME ENEMY HUD (Matches Image 1 Center & Image 2 Bottom-Right)
  // ==========================================================================
  const g = gameRef.current;
  const p = g.player;
  const hpPercent = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const enemyHpPercent = Math.max(
    0,
    Math.min(100, (hud.targetEnemyHp / hud.targetEnemyMaxHp) * 100)
  );

  return (
    <SafeAreaView
      style={[
        styles.gameplayWrapper,
        { backgroundColor: currentWorld.bgTop },
      ]}>
      {/* TOP GAMEPLAY HUD */}
      <View style={styles.hudTopContainer}>
        {/* Top-Left: Circular Hero Portrait + 4 Red Hearts + Green Bar + Lv */}
        <View style={styles.heroHudLeft}>
          <View style={styles.heroAvatarCircle}>
            <WarriorArt size={38} />
          </View>
          <View>
            <View style={styles.heartsRow}>
              {[1, 2, 3, 4].map((h) => (
                <Text
                  key={h}
                  style={{
                    fontSize: 14,
                    opacity: h <= hud.hearts ? 1 : 0.25,
                  }}>
                  ❤️
                </Text>
              ))}
            </View>
            <View style={styles.greenBarTrack}>
              <View
                style={[styles.greenBarFill, { width: `${hpPercent}%` }]}
              />
            </View>
            <Text style={styles.heroLvBadgeText}>Lv {currentLevel.level}</Text>
          </View>
        </View>

        {/* Top-Right: Coins + Gems + Pause + In-Game Enemy Health Bar */}
        <View style={styles.hudTopRightCol}>
          <View style={styles.currencyRow}>
            <Text style={styles.currencyItem}>🪙 {hud.coins}</Text>
            <Text style={styles.currencyItem}>💎 {hud.gems}</Text>
            <Pressable
              style={styles.pauseCircleBtn}
              onPress={() => {
                g.running = false;
                setScreen('PAUSE');
              }}>
              <Text style={styles.pauseCircleText}>||</Text>
            </Pressable>
          </View>

          {/* In-Game Enemy HUD (Matches Image 2 Bottom-Right) */}
          {hud.targetEnemyHp > 0 && (
            <View style={styles.enemyHudFrame}>
              <View style={styles.enemyEmblemCircle}>
                <MonsterArt monsterId={hud.targetEnemyId} size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.enemyHudName}>
                  {hud.targetEnemyName}
                  {hud.targetHasShield ? ' 🛡️' : ''}
                </Text>
                <View style={styles.enemyRedTrack}>
                  <View
                    style={[
                      styles.enemyRedFill,
                      { width: `${enemyHpPercent}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 2D PIXEL-ART STAGE VIEWPORT */}
      <View
        style={[
          styles.stageViewport,
          {
            backgroundColor: currentWorld.bgBottom,
            borderColor: currentWorld.groundTop,
          },
        ]}>
        {/* Decorative Castle Ruins & Trees Backdrop */}
        <View style={styles.ruinsArchBackdrop} />

        {hud.toast ? (
          <View style={styles.stageToast}>
            <Text style={styles.stageToastText}>{hud.toast}</Text>
          </View>
        ) : null}

        {/* Ground Floor */}
        <View
          style={[
            styles.stageGround,
            {
              backgroundColor: currentWorld.groundColor,
              borderTopColor: currentWorld.groundTop,
            },
          ]}
        />

        {/* Platforms */}
        {g.platforms.map((pl, idx) => {
          const sx = pl.x - g.cameraX;
          if (sx < -140 || sx > 900) return null;
          return (
            <View
              key={idx}
              style={[
                styles.stagePlatform,
                {
                  left: sx,
                  top: pl.y,
                  width: pl.w,
                  height: pl.h,
                  backgroundColor: currentWorld.groundColor,
                  borderTopColor: currentWorld.groundTop,
                },
              ]}
            />
          );
        })}

        {/* Collectibles (Coins, Gems, Hearts) */}
        {g.items.map((it) => {
          if (it.collected) return null;
          const sx = it.x - g.cameraX;
          if (sx < -40 || sx > 900) return null;
          return (
            <View
              key={it.id}
              style={{ position: 'absolute', left: sx - 10, top: it.y - 10 }}>
              <Text style={{ fontSize: 16 }}>
                {it.type === 'coin' ? '🪙' : it.type === 'gem' ? '💎' : '❤️'}
              </Text>
            </View>
          );
        })}

        {/* Goal Portal */}
        <View
          style={{
            position: 'absolute',
            left: g.portalX - g.cameraX,
            top: GROUND_Y - 56,
          }}>
          <Text style={{ fontSize: 34 }}>⛩️</Text>
        </View>

        {/* Level Monsters (Custom Pixel-Art SVG per Monster!) */}
        {g.enemies.map((e) => {
          const sx = e.x - g.cameraX;
          if (sx < -90 || sx > 900) return null;
          return (
            <View
              key={e.id}
              style={{
                position: 'absolute',
                left: sx,
                top: e.y,
                width: e.w,
                height: e.h,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <MonsterArt monsterId={e.monsterId} size={e.w} />
            </View>
          );
        })}

        {/* Playable Warrior */}
        <View
          style={{
            position: 'absolute',
            left: p.x - g.cameraX,
            top: p.y,
            width: p.w,
            height: p.h,
            transform: [{ scaleX: p.facing }],
          }}>
          <WarriorArt
            size={48}
            attacking={p.attackTimer > 0}
            blocking={p.spinTimer > 0}
          />
        </View>
      </View>

      {/* BOTTOM CIRCULAR TOUCH CONTROLS (Matches Image 1 & Image 2 Gameplay Screen) */}
      <View style={styles.circularControlsRow}>
        {/* Bottom-Left: ( ◀ ) and ( ▶ ) */}
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Pressable
            style={styles.roundTouchBtn}
            onPressIn={() => {
              g.controls.left = true;
            }}
            onPressOut={() => {
              g.controls.left = false;
            }}>
            <Text style={styles.roundBtnIcon}>◀</Text>
          </Pressable>

          <Pressable
            style={styles.roundTouchBtn}
            onPressIn={() => {
              g.controls.right = true;
            }}
            onPressOut={() => {
              g.controls.right = false;
            }}>
            <Text style={styles.roundBtnIcon}>▶</Text>
          </Pressable>
        </View>

        {/* Bottom-Right: Special Spin/Stone ( 🌀 ), Sword Attack ( ⚔️ ), and Jump ( ⬆️ ) */}
        <View style={styles.rightCluster}>
          <Pressable
            style={styles.roundTouchBtn}
            onPressIn={onSpecialSpinPress}>
            <Text style={styles.roundBtnIcon}>🌀</Text>
          </Pressable>

          <Pressable
            style={[styles.roundTouchBtn, styles.roundSwordBtn]}
            onPressIn={onSwordPress}>
            <Text style={{ fontSize: 24 }}>🗡️</Text>
          </Pressable>

          <Pressable
            style={[styles.roundTouchBtn, styles.roundJumpBtn]}
            onPressIn={onJumpPress}>
            <Text style={styles.roundBtnIcon}>↑</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  menuScreenBg: {
    flex: 1,
    backgroundColor: '#1a1026',
    justifyContent: 'center',
    padding: 16,
  },
  menuLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 16,
  },
  menuLeftCol: {
    alignItems: 'center',
  },
  crownIcon: {
    fontSize: 28,
    marginBottom: -4,
  },
  logoSmall: {
    color: '#ffd152',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
  },
  logoMain: {
    color: '#ffdd80',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: '#590d22',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 4,
  },
  heroCliffBox: {
    marginTop: 8,
    alignItems: 'center',
  },
  menuRightCol: {
    width: 270,
    gap: 8,
  },
  ornateMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#241a29',
    borderWidth: 2,
    borderColor: '#b08946',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  ornateMenuBtnPrimary: {
    backgroundColor: '#9e3b18',
    borderColor: '#ffd152',
  },
  menuBtnIcon: {
    color: '#ffd152',
    fontSize: 15,
    width: 22,
    textAlign: 'center',
  },
  menuBtnLabel: {
    color: '#f8f4e6',
    fontSize: 15,
    fontWeight: '800',
  },
  darkBackdrop: {
    flex: 1,
    backgroundColor: '#0e0b1a',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  topHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2b1e16',
    borderWidth: 2,
    borderColor: '#d4a338',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrowText: {
    color: '#ffd152',
    fontSize: 20,
    fontWeight: '900',
  },
  goldenRibbon: {
    backgroundColor: '#b88635',
    borderWidth: 2,
    borderColor: '#ffd152',
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 4,
  },
  ribbonTitle: {
    color: '#241405',
    fontSize: 16,
    fontWeight: '900',
  },
  unlockAllMiniBtn: {
    backgroundColor: '#48286b',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unlockAllMiniText: {
    color: '#ffd152',
    fontSize: 11,
    fontWeight: '800',
  },
  // Story Parchment
  parchmentCard: {
    flex: 1,
    width: '96%',
    maxWidth: 680,
    backgroundColor: '#d9b982',
    borderWidth: 4,
    borderColor: '#6e471b',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  storyArtBox: {
    flex: 1,
    minWidth: 190,
    backgroundColor: '#2d124d',
    borderWidth: 2,
    borderColor: '#7209b7',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  castleEmoji: {
    fontSize: 38,
    marginVertical: 4,
  },
  storyTextCol: {
    flex: 1.3,
    minWidth: 220,
    justifyContent: 'space-between',
  },
  parchmentBody: {
    color: '#2b1908',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  storyFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9c7a49',
  },
  pageDotActive: {
    backgroundColor: '#592e08',
  },
  parchmentNextBtn: {
    backgroundColor: '#6e2614',
    borderWidth: 2,
    borderColor: '#d4a338',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 6,
  },
  parchmentNextText: {
    color: '#ffd152',
    fontWeight: '900',
    fontSize: 14,
  },
  // Select World 5 Pillars
  worldsHorizontalRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  worldPillarCard: {
    width: 140,
    height: 250,
    borderWidth: 3,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  worldBadgeEmoji: {
    fontSize: 22,
  },
  worldPillarArt: {
    marginVertical: 8,
  },
  worldPillarTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  worldPillarRange: {
    color: '#ffd152',
    fontSize: 12,
    fontWeight: '800',
  },
  worldSubHeader: {
    color: '#ffd152',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  // Level Selection Cards
  levelCardsCarousel: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 10,
  },
  levelSquareCard: {
    width: 195,
    backgroundColor: '#1a1528',
    borderWidth: 3,
    borderColor: '#6c584c',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  levelSquareCardActive: {
    borderColor: '#ffd152',
  },
  levelPreviewBox: {
    width: '100%',
    height: 110,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#495057',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  levelMonsterTag: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  levelCardTitle: {
    color: '#f8f4e6',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  monsterMetaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  monsterLvText: {
    color: '#ffd152',
    fontSize: 11,
    fontWeight: '800',
  },
  monsterHeartsText: {
    fontSize: 10,
  },
  levelCardFooter: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  goldStarsText: {
    color: '#ffd152',
    fontSize: 20,
  },
  playLevelBtn: {
    backgroundColor: '#9e3b18',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 5,
  },
  infoMiniBtn: {
    backgroundColor: '#2c2247',
    borderWidth: 1.5,
    borderColor: '#9d4edd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  playLevelBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  lockIconText: {
    color: '#adb5bd',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },
  // 13-Level & Monster Plan Board
  planWorldBox: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#141024',
  },
  planWorldHeader: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  planLevelCard: {
    width: 155,
    borderWidth: 2,
    borderColor: '#d4a338',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  planLevelNum: {
    color: '#ffd152',
    fontSize: 13,
    fontWeight: '900',
  },
  planLevelSub: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  planMonsterName: {
    color: '#f8f4e6',
    fontSize: 12,
    fontWeight: '900',
  },
  // Monster Gallery & Detail UI
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 16,
  },
  galleryItemCard: {
    width: 125,
    backgroundColor: '#18122b',
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  galleryMonsterName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  galleryMonsterLv: {
    color: '#ffd152',
    fontSize: 10,
    marginTop: 2,
  },
  monsterDetailFrame: {
    flex: 1,
    width: '96%',
    maxWidth: 620,
    backgroundColor: '#13192b',
    borderWidth: 3,
    borderRadius: 12,
    padding: 14,
    justifyContent: 'space-between',
  },
  monsterDetailTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    alignItems: 'center',
  },
  monsterDetailPortrait: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#0b2138',
    borderWidth: 2,
    borderColor: '#48cae4',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  monsterStatsCol: {
    flex: 1.3,
    minWidth: 200,
    gap: 6,
  },
  monsterRibbonBanner: {
    backgroundColor: '#7f3918',
    borderWidth: 2,
    borderColor: '#ffd152',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  monsterRibbonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#2b3a55',
    paddingVertical: 4,
  },
  statLabel: {
    color: '#b5a8c9',
    fontSize: 14,
    fontWeight: '700',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  abilitiesTitle: {
    color: '#ffd152',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  abilitiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  abilityBox: {
    flex: 1,
    backgroundColor: '#1a243b',
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  abilityNameText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  // Settings Screen
  settingsFrame: {
    flex: 1,
    width: '96%',
    maxWidth: 650,
    backgroundColor: '#1d1524',
    borderWidth: 3,
    borderColor: '#d4a338',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 14,
  },
  settingsSidebar: {
    width: 135,
    gap: 8,
  },
  settingsTabBtn: {
    backgroundColor: '#2b2036',
    borderWidth: 1.5,
    borderColor: '#7a5c38',
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  settingsTabBtnActive: {
    backgroundColor: '#a84219',
    borderColor: '#ffd152',
  },
  settingsTabText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  settingsContentCol: {
    flex: 1,
    gap: 10,
  },
  settingsHeading: {
    color: '#ffd152',
    fontSize: 15,
    fontWeight: '900',
  },
  settingControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  settingControlLabel: {
    color: '#f8f4e6',
    fontSize: 13,
    fontWeight: '700',
    width: 115,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#3a2c47',
    borderRadius: 4,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#ffd152',
    borderRadius: 4,
  },
  settingValueText: {
    color: '#ffd152',
    fontSize: 12,
    fontWeight: '800',
    width: 38,
    textAlign: 'right',
  },
  // Paused Dialog
  pausedDialog: {
    width: 320,
    backgroundColor: '#1e1526',
    borderWidth: 3,
    borderColor: '#d4a338',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  // Level Complete
  levelCompleteLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  completeHeroCol: {
    alignItems: 'center',
  },
  completeBox: {
    width: 340,
    backgroundColor: '#211624',
    borderWidth: 3,
    borderColor: '#d4a338',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  bigThreeStars: {
    color: '#ffd152',
    fontSize: 38,
    marginTop: -28,
  },
  redVictoryRibbon: {
    backgroundColor: '#9e1f32',
    borderWidth: 2,
    borderColor: '#ffd152',
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 6,
    marginVertical: 8,
  },
  completeStatsPanel: {
    width: '100%',
    backgroundColor: '#160f19',
    borderWidth: 1.5,
    borderColor: '#6e4e2e',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginVertical: 8,
  },
  completeStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  completeStatLabel: {
    color: '#f8f4e6',
    fontSize: 13,
    fontWeight: '700',
  },
  completeStatVal: {
    color: '#ffd152',
    fontSize: 13,
    fontWeight: '900',
  },
  completeBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  retryBtn: {
    backgroundColor: '#382942',
    borderWidth: 2,
    borderColor: '#b08946',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 6,
  },
  nextLevelGoldBtn: {
    backgroundColor: '#d49b27',
    borderWidth: 2,
    borderColor: '#fff3b0',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 6,
  },
  nextLevelGoldText: {
    color: '#241405',
    fontSize: 14,
    fontWeight: '900',
  },
  // Ending Screen
  endingSunlitBg: {
    flex: 1,
    backgroundColor: '#1f3a52',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 14,
  },
  endingCastleScene: {
    alignItems: 'center',
  },
  endingParchmentBanner: {
    width: '94%',
    maxWidth: 620,
    backgroundColor: '#dfc28d',
    borderWidth: 3,
    borderColor: '#6e471b',
    borderRadius: 10,
    padding: 14,
  },
  endingParchmentText: {
    color: '#2b1908',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  // Gameplay HUD & Controls
  gameplayWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 8,
  },
  hudTopContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroHudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2b1d38',
    borderWidth: 2.5,
    borderColor: '#ffd152',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heartsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  greenBarTrack: {
    width: 110,
    height: 10,
    backgroundColor: '#1f2421',
    borderWidth: 1.5,
    borderColor: '#d4a338',
    borderRadius: 5,
    marginTop: 2,
    overflow: 'hidden',
  },
  greenBarFill: {
    height: '100%',
    backgroundColor: '#52b788',
  },
  heroLvBadgeText: {
    color: '#ffd152',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },
  hudTopRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyItem: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  pauseCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2b1e16',
    borderWidth: 2,
    borderColor: '#ffd152',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseCircleText: {
    color: '#ffd152',
    fontSize: 13,
    fontWeight: '900',
  },
  enemyHudFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 14, 32, 0.9)',
    borderWidth: 2,
    borderColor: '#d4a338',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 195,
    gap: 6,
  },
  enemyEmblemCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2d3a2e',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyHudName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  enemyRedTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#2b1218',
    borderWidth: 1,
    borderColor: '#adb5bd',
    borderRadius: 4,
    marginTop: 2,
    overflow: 'hidden',
  },
  enemyRedFill: {
    height: '100%',
    backgroundColor: '#e63946',
  },
  stageViewport: {
    width: '100%',
    height: STAGE_HEIGHT,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  ruinsArchBackdrop: {
    position: 'absolute',
    left: 60,
    top: 20,
    width: 80,
    height: 184,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  stageToast: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(18, 12, 34, 0.88)',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 20,
  },
  stageToastText: {
    color: '#ffd152',
    fontSize: 11,
    fontWeight: '800',
  },
  stageGround: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: GROUND_Y,
    height: STAGE_HEIGHT - GROUND_Y,
    borderTopWidth: 5,
  },
  stagePlatform: {
    position: 'absolute',
    borderTopWidth: 4,
    borderRadius: 3,
  },
  circularControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  roundTouchBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(20, 24, 38, 0.78)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundSwordBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderColor: '#ffd152',
    backgroundColor: 'rgba(44, 30, 56, 0.88)',
  },
  roundJumpBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roundBtnIcon: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
});
