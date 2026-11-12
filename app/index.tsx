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
import {
  ActiveEnemy,
  createInitialEngineState,
  EngineState,
  GROUND_Y,
  playerDodge,
  playerJump,
  playerStoneSkill,
  playerSwordAttack,
  STAGE_HEIGHT,
  stepEngineFrame,
} from '../engine/combatEngine';

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
    hp: 120,
    maxHp: 120,
    stamina: 100,
    maxStamina: 100,
    skillCooldownFrames: 0,
    coins: 230,
    gems: 3,
    currentWave: 1,
    totalWaves: 3,
    remainingEnemies: 2,
    targetEnemyName: 'Forest Slime',
    targetEnemyId: 'forest_slime' as MonsterId,
    targetEnemyHp: 115,
    targetEnemyMaxHp: 115,
    targetEnemyIsBoss: false,
    targetBossPhase: 1 as 1 | 2,
    targetHasShield: false,
    bossWarningText: '',
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

  const engineRef = useRef<EngineState>(createInitialEngineState(1));

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

  // Start any of the 13 Levels using the unified Combat & Wave Engine
  const launchLevel = (levelNumber: number) => {
    const state = createInitialEngineState(levelNumber);
    engineRef.current = state;

    const lvl = state.level;
    const world = WORLDS_DATA.find((w) => w.id === lvl.world) || WORLDS_DATA[0];
    const firstEnemy = state.enemies[0];

    setCurrentLevel(lvl);
    setCurrentWorld(world);

    setHud({
      hearts: 4,
      maxHearts: 4,
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      stamina: state.player.stamina,
      maxStamina: state.player.maxStamina,
      skillCooldownFrames: 0,
      coins: save.coins,
      gems: save.gems,
      currentWave: state.currentWave,
      totalWaves: state.totalWaves,
      remainingEnemies: state.enemies.length,
      targetEnemyName: firstEnemy ? firstEnemy.name : MONSTERS_DATA[lvl.monsterId].name,
      targetEnemyId: firstEnemy ? firstEnemy.monsterId : lvl.monsterId,
      targetEnemyHp: firstEnemy ? firstEnemy.hp : 0,
      targetEnemyMaxHp: firstEnemy ? firstEnemy.maxHp : 1,
      targetEnemyIsBoss: Boolean(firstEnemy?.isBoss),
      targetBossPhase: firstEnemy ? firstEnemy.bossPhase : 1,
      targetHasShield: Boolean(firstEnemy?.shieldActive),
      bossWarningText: '',
      dialogueSpeaker: state.dialogueSpeaker,
      dialogueText: state.dialogueText,
      toast: state.toastText,
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
      const state = engineRef.current;
      if (!state.running) return;

      const winW = Dimensions.get('window').width;
      stepEngineFrame(state, winW);

      if (state.outcome === 'VICTORY') {
        finishStage(true);
        return;
      }
      if (state.outcome === 'DEFEAT') {
        finishStage(false);
        return;
      }

      const p = state.player;
      // Pick closest living enemy (prioritizing Boss if present in current wave)
      let focusEnemy: ActiveEnemy | null = null;
      let bestDist = 99999;
      for (const e of state.enemies) {
        if (e.aiState === 'DEAD') continue;
        const d = Math.abs(e.x - p.x);
        if (e.isBoss || d < bestDist) {
          bestDist = d;
          focusEnemy = e;
          if (e.isBoss) break;
        }
      }

      const heartsLeft = p.hp > 0 ? Math.max(1, Math.ceil((p.hp / p.maxHp) * 4)) : 0;

      setHud((prev) => ({
        ...prev,
        hearts: heartsLeft,
        hp: p.hp,
        maxHp: p.maxHp,
        stamina: p.stamina,
        maxStamina: p.maxStamina,
        skillCooldownFrames: p.skillCooldown,
        coins: save.coins + state.coinsCollected,
        gems: save.gems + state.gemsCollected,
        currentWave: state.currentWave,
        totalWaves: state.totalWaves,
        remainingEnemies: state.enemies.filter((e) => e.aiState !== 'DEAD').length,
        targetEnemyName: focusEnemy ? focusEnemy.name : '',
        targetEnemyId: focusEnemy ? focusEnemy.monsterId : currentLevel.monsterId,
        targetEnemyHp: focusEnemy ? focusEnemy.hp : 0,
        targetEnemyMaxHp: focusEnemy ? focusEnemy.maxHp : 1,
        targetEnemyIsBoss: Boolean(focusEnemy?.isBoss),
        targetBossPhase: focusEnemy ? focusEnemy.bossPhase : 1,
        targetHasShield: Boolean(focusEnemy?.shieldActive),
        bossWarningText: state.bossWarningText,
        dialogueSpeaker: state.dialogueSpeaker,
        dialogueText: state.dialogueText,
        toast: state.toastText,
      }));

      setTick((t) => (t + 1) % 10000);
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [screen, currentLevel, save]);

  const finishStage = (victory: boolean) => {
    const state = engineRef.current;
    state.running = false;
    const elapsedSec = Math.max(10, Math.round((Date.now() - state.startTimeMs) / 1000));
    vibrate(victory ? 'heavy' : 'medium');

    if (victory) {
      const hpRatio = state.player.hp / state.player.maxHp;
      const stars = hpRatio >= 0.65 ? 3 : hpRatio >= 0.35 ? 2 : 1;
      const earnedCoins = state.coinsCollected + 40 + currentLevel.level * 12;
      const earnedGems = Math.max(1, state.gemsCollected);

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
        levelCoinsEarned: state.coinsCollected,
        levelGemsEarned: state.gemsCollected,
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
  // 1. MAIN MENU SCREEN
  // ==========================================================================
  if (screen === 'MAIN_MENU') {
    return (
      <SafeAreaView style={styles.menuScreenBg}>
        <View style={styles.menuLayout}>
          <View style={styles.menuLeftCol}>
            <Text style={styles.crownIcon}>👑</Text>
            <Text style={styles.logoSmall}>THE</Text>
            <Text style={styles.logoMain}>CURSED{'\n'}KINGDOM</Text>
            <View style={styles.heroCliffBox}>
              <WarriorArt size={105} attacking />
            </View>
          </View>

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
  // 2. THE STORY SCREEN
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
          <View style={styles.storyArtBox}>
            <MonsterArt monsterId="witch_final" size={76} />
            <Text style={styles.castleEmoji}>🏰</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 36 }}>🤴</Text>
              <WarriorArt size={56} />
            </View>
          </View>

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
  // 3. SELECT WORLD SCREEN
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
  // 4. LEVEL SELECTION — WORLD DETAIL
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

                <View style={styles.monsterMetaRow}>
                  <Text style={styles.monsterLvText}>⚔️ Lv {lvl.level}</Text>
                  <Text style={styles.monsterHeartsText}>
                    {'❤️'.repeat(Math.min(5, monster.hearts))}
                  </Text>
                </View>

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
  // 5. FULL 13-LEVEL & MONSTER PLAN BOARD
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
  // 6. MONSTER GALLERY & MONSTER DETAIL UI
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
            <View style={styles.monsterDetailPortrait}>
              <MonsterArt monsterId={m.id} size={115} />
              <Text style={styles.monsterHeartsText}>
                {'❤️'.repeat(m.hearts)}
              </Text>
            </View>

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
  // 7. SETTINGS SCREEN
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
  // 8. PAUSED MODAL
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
                engineRef.current.running = true;
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
  // 9. LEVEL COMPLETE! SCREEN
  // ==========================================================================
  if (screen === 'LEVEL_COMPLETE') {
    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.levelCompleteLayout}>
          <View style={styles.completeHeroCol}>
            <WarriorArt size={120} />
          </View>

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
  // 10. THE KINGDOM IS SAVED! ENDING SCREEN
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
  // 11. GAMEPLAY SCREEN + FULL COMBAT HUD
  // ==========================================================================
  const state = engineRef.current;
  const p = state.player;
  const hpPercent = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const staPercent = Math.max(0, Math.min(100, (hud.stamina / hud.maxStamina) * 100));
  const enemyHpPercent = Math.max(
    0,
    Math.min(100, (hud.targetEnemyHp / hud.targetEnemyMaxHp) * 100)
  );
  const skillReady = hud.skillCooldownFrames <= 0;
  const skillCooldownSec = (hud.skillCooldownFrames / 60).toFixed(1);
  const activeWaveDef = state.level.waves[state.currentWave - 1];

  return (
    <SafeAreaView
      style={[
        styles.gameplayWrapper,
        { backgroundColor: currentWorld.bgTop },
      ]}>
      {/* TOP GAMEPLAY HUD */}
      <View style={styles.hudTopContainer}>
        {/* Top-Left: Circular Hero Portrait + 4 Red Hearts + HP Bar + Stamina Bar + Lv */}
        <View style={styles.heroHudLeft}>
          <View style={styles.heroAvatarCircle}>
            <WarriorArt size={38} attacking={p.attackTimer > 0} blocking={p.blocking} />
          </View>
          <View>
            <View style={styles.heartsRow}>
              {[1, 2, 3, 4].map((h) => (
                <Text
                  key={h}
                  style={{
                    fontSize: 12,
                    opacity: h <= hud.hearts ? 1 : 0.25,
                  }}>
                  ❤️
                </Text>
              ))}
              <Text style={styles.hudNumericText}>
                HP {Math.ceil(hud.hp)}/{hud.maxHp}
              </Text>
            </View>
            {/* HP Bar */}
            <View style={styles.greenBarTrack}>
              <View
                style={[styles.greenBarFill, { width: `${hpPercent}%` }]}
              />
            </View>
            {/* Stamina Bar */}
            <View style={[styles.greenBarTrack, { height: 7, marginTop: 3 }]}>
              <View
                style={[styles.staminaBarFill, { width: `${staPercent}%` }]}
              />
            </View>
            <Text style={styles.heroLvBadgeText}>
              Lv {currentLevel.level} • STA {Math.floor(hud.stamina)}
            </Text>
          </View>
        </View>

        {/* Top-Center: Wave Counter & Remaining Enemies */}
        <View style={styles.waveCounterPill}>
          <Text style={styles.waveTitleText}>
            WAVE {hud.currentWave}/{hud.totalWaves}
          </Text>
          <Text style={styles.waveSubText}>
            FOES LEFT: {hud.remainingEnemies}
          </Text>
        </View>

        {/* Top-Right: Coins + Gems + Pause + In-Game Enemy / Boss HUD */}
        <View style={styles.hudTopRightCol}>
          <View style={styles.currencyRow}>
            <Text style={styles.currencyItem}>🪙 {hud.coins}</Text>
            <Text style={styles.currencyItem}>💎 {hud.gems}</Text>
            <Pressable
              style={styles.pauseCircleBtn}
              onPress={() => {
                state.running = false;
                setScreen('PAUSE');
              }}>
              <Text style={styles.pauseCircleText}>||</Text>
            </Pressable>
          </View>

          {/* In-Game Enemy / Boss HUD */}
          {hud.targetEnemyHp > 0 && (
            <View
              style={[
                styles.enemyHudFrame,
                hud.targetEnemyIsBoss && { borderColor: '#ff2a55' },
              ]}>
              <View style={styles.enemyEmblemCircle}>
                <MonsterArt monsterId={hud.targetEnemyId} size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.enemyHudName}>
                  {hud.targetEnemyIsBoss ? '👑 ' : ''}
                  {hud.targetEnemyName}
                  {hud.targetBossPhase === 2 ? ' [P2]' : ''}
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
                <Text style={styles.enemyHpNumText}>
                  {hud.targetEnemyHp}/{hud.targetEnemyMaxHp}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* BOSS TELEGRAPHED ATTACK WARNING BANNER */}
      {hud.bossWarningText ? (
        <View style={styles.bossWarningBanner}>
          <Text style={styles.bossWarningText}>{hud.bossWarningText}</Text>
        </View>
      ) : null}

      {/* 2D PIXEL-ART STAGE VIEWPORT */}
      <View
        style={[
          styles.stageViewport,
          {
            backgroundColor: currentWorld.bgBottom,
            borderColor: currentWorld.groundTop,
          },
        ]}>
        <View style={styles.ruinsArchBackdrop} />

        {p.stoneFlashTimer > 0 && <View style={styles.stoneFlashOverlay} />}

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
        {state.platforms.map((pl, idx) => {
          const sx = pl.x - state.cameraX;
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

        {/* Mid-Level Checkpoint Flag */}
        <View
          style={{
            position: 'absolute',
            left: state.checkpointX - state.cameraX,
            top: GROUND_Y - 40,
          }}>
          <Text style={{ fontSize: 24 }}>
            {state.checkpointActivated ? '✨' : '🚩'}
          </Text>
        </View>

        {/* Active Wave Gate Barrier (Prevents Bypassing Required Encounters) */}
        {!state.allWavesCleared && activeWaveDef && (
          <View
            style={[
              styles.waveGateBarrier,
              { left: activeWaveDef.gateX - state.cameraX + 36 },
            ]}
          />
        )}

        {/* Collectibles (Coins, Gems, Hearts) */}
        {state.items.map((it) => {
          if (it.collected) return null;
          const sx = it.x - state.cameraX;
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
            left: state.portalX - state.cameraX,
            top: GROUND_Y - 56,
            opacity: state.allWavesCleared ? 1 : 0.45,
          }}>
          <Text style={{ fontSize: 34 }}>⛩️</Text>
        </View>

        {/* Enemy Ranged Projectiles */}
        {state.projectiles.map((proj) => {
          const sx = proj.x - state.cameraX;
          if (sx < -30 || sx > 900) return null;
          return (
            <View
              key={proj.id}
              style={{
                position: 'absolute',
                left: sx - proj.radius,
                top: proj.y - proj.radius,
                width: proj.radius * 2,
                height: proj.radius * 2,
                borderRadius: proj.radius,
                backgroundColor: proj.color,
                borderWidth: 1.5,
                borderColor: '#ffffff',
              }}
            />
          );
        })}

        {/* Level Monsters with AI State & Telegraph Indicators */}
        {state.enemies.map((e) => {
          const sx = e.x - state.cameraX;
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
                opacity: e.aiState === 'DEAD' ? 0.35 : e.aiState === 'HURT' ? 0.65 : 1,
                transform: [{ scaleX: e.facing < 0 ? 1 : -1 }],
              }}>
              {/* Telegraphed Attack / Detect State Badge */}
              {e.aiState === 'PREPARE_ATTACK' && (
                <Text style={styles.telegraphIcon}>⚠️</Text>
              )}
              {e.aiState === 'DETECT' && (
                <Text style={styles.telegraphIcon}>❗</Text>
              )}
              <MonsterArt monsterId={e.monsterId} size={e.w} />
            </View>
          );
        })}

        {/* Playable Warrior */}
        <View
          style={{
            position: 'absolute',
            left: p.x - state.cameraX,
            top: p.y,
            width: p.w,
            height: p.h,
            opacity: p.dodgeTimer > 0 ? 0.6 : 1,
            transform: [{ scaleX: p.facing }],
          }}>
          <WarriorArt
            size={48}
            attacking={p.attackTimer > 0}
            blocking={p.blocking}
          />
        </View>

        {/* Floating Damage & Status Indicators */}
        {state.damageIndicators.map((ind) => {
          const sx = ind.x - state.cameraX;
          return (
            <View
              key={ind.id}
              style={{
                position: 'absolute',
                left: sx - 28,
                top: ind.y,
                zIndex: 30,
              }}>
              <Text style={[styles.damageFloatText, { color: ind.color }]}>
                {ind.text}
              </Text>
            </View>
          );
        })}
      </View>

      {/* BOTTOM ANDROID TOUCH CONTROLS */}
      <View style={styles.circularControlsRow}>
        {/* Bottom-Left: ( ◀ ) and ( ▶ ) */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            style={styles.roundTouchBtn}
            onPressIn={() => {
              state.controls.left = true;
            }}
            onPressOut={() => {
              state.controls.left = false;
            }}>
            <Text style={styles.roundBtnIcon}>◀</Text>
          </Pressable>

          <Pressable
            style={styles.roundTouchBtn}
            onPressIn={() => {
              state.controls.right = true;
            }}
            onPressOut={() => {
              state.controls.right = false;
            }}>
            <Text style={styles.roundBtnIcon}>▶</Text>
          </Pressable>
        </View>

        {/* Bottom-Right: Dodge (💨), Block (🛡️), Skill w/ Cooldown (🌀), Sword (🗡️), Jump (↑) */}
        <View style={styles.rightCluster}>
          <Pressable
            style={styles.roundTouchBtnSmall}
            onPressIn={() => {
              if (playerDodge(state)) vibrate('light');
            }}>
            <Text style={styles.roundBtnSubLabel}>💨</Text>
            <Text style={styles.roundBtnTinyText}>DODGE</Text>
          </Pressable>

          <Pressable
            style={[
              styles.roundTouchBtnSmall,
              p.blocking && { borderColor: '#38e4ae' },
            ]}
            onPressIn={() => {
              state.controls.block = true;
            }}
            onPressOut={() => {
              state.controls.block = false;
            }}>
            <Text style={styles.roundBtnSubLabel}>🛡️</Text>
            <Text style={styles.roundBtnTinyText}>BLOCK</Text>
          </Pressable>

          <Pressable
            style={[
              styles.roundTouchBtn,
              !skillReady && { opacity: 0.55 },
            ]}
            onPressIn={() => {
              if (playerStoneSkill(state)) vibrate('heavy');
            }}>
            <Text style={styles.roundBtnIcon}>🌀</Text>
            <Text style={styles.roundBtnTinyText}>
              {skillReady ? 'READY' : `${skillCooldownSec}s`}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.roundTouchBtn, styles.roundSwordBtn]}
            onPressIn={() => {
              if (playerSwordAttack(state)) vibrate('light');
            }}>
            <Text style={{ fontSize: 22 }}>🗡️</Text>
            <Text style={styles.roundBtnTinyText}>C{p.comboStep}</Text>
          </Pressable>

          <Pressable
            style={[styles.roundTouchBtn, styles.roundJumpBtn]}
            onPressIn={() => {
              if (playerJump(state)) vibrate('light');
            }}>
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
  pausedDialog: {
    width: 320,
    backgroundColor: '#1e1526',
    borderWidth: 3,
    borderColor: '#d4a338',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
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
    gap: 6,
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
    alignItems: 'center',
    gap: 2,
  },
  hudNumericText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  greenBarTrack: {
    width: 115,
    height: 9,
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
  staminaBarFill: {
    height: '100%',
    backgroundColor: '#38e4ae',
  },
  heroLvBadgeText: {
    color: '#ffd152',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
  },
  waveCounterPill: {
    backgroundColor: 'rgba(20, 14, 34, 0.9)',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  waveTitleText: {
    color: '#ffd152',
    fontSize: 11,
    fontWeight: '900',
  },
  waveSubText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  hudTopRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencyItem: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  pauseCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2b1e16',
    borderWidth: 2,
    borderColor: '#ffd152',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseCircleText: {
    color: '#ffd152',
    fontSize: 12,
    fontWeight: '900',
  },
  enemyHudFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 14, 32, 0.92)',
    borderWidth: 2,
    borderColor: '#d4a338',
    borderRadius: 14,
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
    fontSize: 10,
    fontWeight: '800',
  },
  enemyRedTrack: {
    width: '100%',
    height: 7,
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
  enemyHpNumText: {
    color: '#ffccd5',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  bossWarningBanner: {
    backgroundColor: 'rgba(138, 14, 38, 0.94)',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: 'center',
  },
  bossWarningText: {
    color: '#ffd152',
    fontSize: 11,
    fontWeight: '900',
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
  stoneFlashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(56, 228, 174, 0.3)',
    zIndex: 12,
  },
  stageToast: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(18, 12, 34, 0.88)',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 20,
  },
  stageToastText: {
    color: '#ffd152',
    fontSize: 10,
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
  waveGateBarrier: {
    position: 'absolute',
    top: 0,
    height: GROUND_Y,
    width: 4,
    backgroundColor: 'rgba(247, 37, 133, 0.65)',
  },
  telegraphIcon: {
    position: 'absolute',
    top: -16,
    fontSize: 14,
  },
  damageFloatText: {
    fontSize: 11,
    fontWeight: '900',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  circularControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  roundTouchBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(20, 24, 38, 0.82)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundTouchBtnSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(28, 34, 54, 0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 209, 82, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundSwordBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderColor: '#ffd152',
    backgroundColor: 'rgba(138, 24, 52, 0.88)',
  },
  roundJumpBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundBtnIcon: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
  },
  roundBtnSubLabel: {
    fontSize: 14,
  },
  roundBtnTinyText: {
    color: '#ffd152',
    fontSize: 8,
    fontWeight: '900',
  },
});
