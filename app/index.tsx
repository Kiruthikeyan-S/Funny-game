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
  UpgradeCategory,
  WARRIOR_UPGRADES,
  WORLDS_DATA,
  WorldInfo,
} from '../constants/gameData';
import {
  ActiveEnemy,
  computePlayerDefense,
  computePlayerMaxHp,
  computePlayerSwordDamage,
  createInitialEngineState,
  DEFAULT_UPGRADES,
  EngineState,
  GROUND_Y,
  playerDodge,
  playerHeavyAttack,
  playerJump,
  playerStoneSkill,
  playerSwordAttack,
  playerUsePotion,
  PlayerUpgrades,
  STAGE_HEIGHT,
  stepEngineFrame,
} from '../engine/combatEngine';

type ScreenState =
  | 'MAIN_MENU'
  | 'STORY'
  | 'SELECT_WORLD'
  | 'LEVEL_SELECT'
  | 'LEVEL_MONSTER_PLAN'
  | 'ARMORY'
  | 'MONSTER_GALLERY'
  | 'MONSTER_DETAIL'
  | 'GAMEPLAY'
  | 'PAUSE'
  | 'SETTINGS'
  | 'LEVEL_COMPLETE'
  | 'GAME_OVER'
  | 'ENDING';

interface SaveData {
  unlockedLevel: number;
  coins: number;
  gems: number;
  potions: number;
  upgrades: PlayerUpgrades;
  defeatedMonsters: MonsterId[];
  stars: Record<number, number>;
  musicVol: number;
  sfxVol: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  vibration: boolean;
  screenShake: boolean;
  fullscreen: boolean;
}

const DEFAULT_SAVE: SaveData = {
  unlockedLevel: 1,
  coins: 250,
  gems: 3,
  potions: 3,
  upgrades: { ...DEFAULT_UPGRADES },
  defeatedMonsters: [],
  stars: {},
  musicVol: 80,
  sfxVol: 70,
  musicEnabled: true,
  sfxEnabled: true,
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
    MONSTERS_DATA.tree_guardian
  );
  const [settingsTab, setSettingsTab] = useState<
    'General' | 'Controls' | 'Audio' | 'Graphics'
  >('General');
  const [armoryNotice, setArmoryNotice] = useState<string>('');

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
    potionsLeft: 3,
    poisoned: false,
    rooted: false,
    lowHealth: false,
    coins: 250,
    gems: 3,
    currentWave: 1,
    totalWaves: 3,
    remainingEnemies: 2,
    targetEnemyName: 'Forest Goblin',
    targetEnemyId: 'forest_goblin' as MonsterId,
    targetEnemyHp: 100,
    targetEnemyMaxHp: 100,
    targetEnemyIsBoss: false,
    targetBossPhase: 1 as 1 | 2,
    targetHasShield: false,
    bossWarningText: '',
    bossIntroActive: false,
    bossDefeatedText: '',
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
          const parsed = JSON.parse(raw);
          setSave({
            ...DEFAULT_SAVE,
            ...parsed,
            upgrades: {
              ...DEFAULT_UPGRADES,
              ...(parsed.upgrades || {}),
            },
            defeatedMonsters: Array.isArray(parsed.defeatedMonsters)
              ? parsed.defeatedMonsters
              : [],
          });
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
    const state = createInitialEngineState(
      levelNumber,
      save.upgrades || DEFAULT_UPGRADES,
      save.potions ?? 3
    );
    engineRef.current = state;

    const lvl = state.level;
    const world = WORLDS_DATA.find((w) => w.id === lvl.world) || WORLDS_DATA[0];
    const firstEnemy = state.enemies[0];

    setCurrentLevel(lvl);
    setCurrentWorld(world);
    setSelectedWorldId(world.id);

    setHud({
      hearts: 4,
      maxHearts: 4,
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      stamina: state.player.stamina,
      maxStamina: state.player.maxStamina,
      skillCooldownFrames: 0,
      potionsLeft: state.potionsLeft,
      poisoned: false,
      rooted: false,
      lowHealth: false,
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
      bossIntroActive: false,
      bossDefeatedText: '',
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

  // PC Keyboard Support (Web / Desktop testing)
  useEffect(() => {
    if (Platform.OS !== 'web' || screen !== 'GAMEPLAY') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = engineRef.current;
      const key = e.key.toLowerCase();
      if (key === 'a' || e.key === 'ArrowLeft') state.controls.left = true;
      else if (key === 'd' || e.key === 'ArrowRight') state.controls.right = true;
      else if (key === 'w' || e.key === 'ArrowUp' || e.key === ' ') playerJump(state);
      else if (key === 'j') playerSwordAttack(state);
      else if (key === 'h') playerHeavyAttack(state);
      else if (key === 'k') state.controls.block = true;
      else if (key === 'l' || e.key === 'Shift') playerDodge(state);
      else if (key === 'u') playerStoneSkill(state);
      else if (key === 'i' || key === 'q') playerUsePotion(state);
      else if (e.key === 'Escape' || key === 'p') {
        state.running = false;
        setScreen('PAUSE');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const state = engineRef.current;
      const key = e.key.toLowerCase();
      if (key === 'a' || e.key === 'ArrowLeft') state.controls.left = false;
      else if (key === 'd' || e.key === 'ArrowRight') state.controls.right = false;
      else if (key === 'k') state.controls.block = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen]);

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
        potionsLeft: state.potionsLeft,
        poisoned: p.poisonTimer > 0,
        rooted: p.rootTimer > 0,
        lowHealth: p.hp / p.maxHp <= 0.3,
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
        bossIntroActive: state.bossIntroTimer > 0,
        bossDefeatedText:
          state.bossDefeatedTimer > 0 && state.bossDefeatedName
            ? `👑 BOSS DEFEATED: ${state.bossDefeatedName.toUpperCase()}!`
            : '',
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
      const earnedCoins = state.coinsCollected + 45 + currentLevel.level * 15;
      const earnedGems = Math.max(1, state.gemsCollected);

      const nextUnlocked =
        currentLevel.level >= save.unlockedLevel && currentLevel.level < 13
          ? currentLevel.level + 1
          : save.unlockedLevel;

      const updatedStars = { ...save.stars };
      if (stars > (updatedStars[currentLevel.level] || 0)) {
        updatedStars[currentLevel.level] = stars;
      }

      const defeatedSet = new Set<MonsterId>(save.defeatedMonsters || []);
      defeatedSet.add(currentLevel.monsterId);
      defeatedSet.add(currentLevel.minionId);

      updateSave({
        ...save,
        unlockedLevel: nextUnlocked,
        coins: save.coins + earnedCoins,
        gems: save.gems + earnedGems,
        potions: Math.max(1, state.potionsLeft),
        defeatedMonsters: Array.from(defeatedSet),
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
      updateSave({
        ...save,
        coins: save.coins + state.coinsCollected,
        potions: Math.max(1, state.potionsLeft),
      });

      setHud((prev) => ({
        ...prev,
        elapsedSec,
        victory: false,
        starsEarned: 0,
        levelCoinsEarned: state.coinsCollected,
        levelGemsEarned: state.gemsCollected,
      }));
      setScreen('GAME_OVER');
    }
  };

  const purchaseUpgrade = (category: UpgradeCategory) => {
    const currentTier = save.upgrades[category] || 1;
    const tiers = WARRIOR_UPGRADES[category];
    if (currentTier >= tiers.length) {
      setArmoryNotice('Already at Maximum Tier (Tier 5)!');
      return;
    }
    const nextTierObj = tiers[currentTier];
    if (save.coins < nextTierObj.cost) {
      setArmoryNotice(
        `Need ${nextTierObj.cost} Coins to unlock ${nextTierObj.name} (You have ${save.coins} 🪙)`
      );
      return;
    }

    const updatedUpgrades: PlayerUpgrades = {
      ...save.upgrades,
      [category]: currentTier + 1,
    };
    updateSave({
      ...save,
      coins: save.coins - nextTierObj.cost,
      upgrades: updatedUpgrades,
    });
    vibrate('medium');
    setArmoryNotice(`Upgraded to ${nextTierObj.name} (Tier ${currentTier + 1})!`);
  };

  const buyHealingPotion = () => {
    const potionCost = 60;
    if (save.coins < potionCost) {
      setArmoryNotice(`Need ${potionCost} 🪙 to buy a Healing Potion!`);
      return;
    }
    updateSave({
      ...save,
      coins: save.coins - potionCost,
      potions: (save.potions || 0) + 1,
    });
    vibrate('light');
    setArmoryNotice('Purchased +1 Healing Potion 🧪!');
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isMonsterDefeated = (m: MonsterConfig): boolean => {
    return (
      (save.defeatedMonsters && save.defeatedMonsters.includes(m.id)) ||
      Boolean(save.stars[m.level] && save.stars[m.level] > 0)
    );
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
            <Text style={styles.logoSmall}>2D DARK-FANTASY ACTION RPG</Text>
            <Text style={styles.logoMain}>THE CURSED{'\n'}KINGDOM</Text>
            <View style={styles.heroCliffBox}>
              <WarriorArt size={100} attacking />
            </View>
            <View style={styles.menuCurrencyPill}>
              <Text style={styles.currencyItem}>🪙 {save.coins}</Text>
              <Text style={styles.currencyItem}>💎 {save.gems}</Text>
              <Text style={styles.currencyItem}>🧪 {save.potions}</Text>
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
              <Text style={styles.menuBtnLabel}>Play Story</Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => launchLevel(save.unlockedLevel)}>
              <Text style={styles.menuBtnIcon}>⚔️</Text>
              <Text style={styles.menuBtnLabel}>
                Continue (Level {save.unlockedLevel})
              </Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => setScreen('SELECT_WORLD')}>
              <Text style={styles.menuBtnIcon}>🗺️</Text>
              <Text style={styles.menuBtnLabel}>Level Selection (13)</Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => {
                setArmoryNotice('');
                setScreen('ARMORY');
              }}>
              <Text style={styles.menuBtnIcon}>🛡️</Text>
              <Text style={styles.menuBtnLabel}>Warrior Upgrades</Text>
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
          <Pressable
            style={styles.unlockAllMiniBtn}
            onPress={() => launchLevel(save.unlockedLevel)}>
            <Text style={styles.unlockAllMiniText}>Skip ▶</Text>
          </Pressable>
        </View>

        <View style={styles.parchmentCard}>
          <View style={styles.storyArtBox}>
            <MonsterArt monsterId="witch_queen" size={76} />
            <Text style={styles.castleEmoji}>🏰</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 34 }}>🤴</Text>
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
  // 3. WARRIOR UPGRADE UI (ARMORY SCREEN)
  // ==========================================================================
  if (screen === 'ARMORY') {
    const categories: { key: UpgradeCategory; title: string; subtitle: string }[] = [
      { key: 'weapon', title: 'Weapon Upgrades', subtitle: 'Increases Light & Heavy Sword Damage' },
      { key: 'armor', title: 'Armor Upgrades', subtitle: 'Reduces Enemy Damage & Boosts Shield Block' },
      { key: 'health', title: 'Health Upgrades', subtitle: 'Increases Warrior Maximum HP' },
      { key: 'skill', title: 'Stone Skill Upgrades', subtitle: 'Boosts Ancient Stone Power & Reduces Cooldown' },
    ];

    const previewHp = computePlayerMaxHp(save.unlockedLevel, save.upgrades.health);
    const previewAtk = computePlayerSwordDamage(save.unlockedLevel, save.upgrades.weapon);
    const previewDef = computePlayerDefense(save.unlockedLevel, save.upgrades.armor);

    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.topHeaderRow}>
          <Pressable
            style={styles.backCircleBtn}
            onPress={() => setScreen('MAIN_MENU')}>
            <Text style={styles.backArrowText}>←</Text>
          </Pressable>
          <View style={styles.goldenRibbon}>
            <Text style={styles.ribbonTitle}>Warrior Upgrades & Armory</Text>
          </View>
          <View style={styles.currencyRow}>
            <Text style={styles.currencyItem}>🪙 {save.coins}</Text>
            <Text style={styles.currencyItem}>🧪 {save.potions}</Text>
          </View>
        </View>

        {/* Warrior Live Stat Summary + Potion Restock */}
        <View style={styles.armoryHeroBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <WarriorArt size={52} attacking />
            <View>
              <Text style={styles.armoryHeroTitle}>
                Royal Warrior (Lv {save.unlockedLevel})
              </Text>
              <Text style={styles.armoryHeroStats}>
                ❤️ Max HP: {previewHp} • ⚔️ Sword ATK: {previewAtk} • 🛡️ DEF: {previewDef}
              </Text>
            </View>
          </View>

          <Pressable style={styles.buyPotionBtn} onPress={buyHealingPotion}>
            <Text style={styles.buyPotionBtnText}>+1 Potion 🧪 (60 🪙)</Text>
          </Pressable>
        </View>

        {armoryNotice ? (
          <Text style={styles.armoryNoticeText}>{armoryNotice}</Text>
        ) : null}

        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.armoryGrid}>
          {categories.map((cat) => {
            const tierNum = save.upgrades[cat.key] || 1;
            const tiers = WARRIOR_UPGRADES[cat.key];
            const currentObj = tiers[tierNum - 1];
            const nextObj = tiers[tierNum];
            const canAfford = nextObj ? save.coins >= nextObj.cost : false;

            return (
              <View key={cat.key} style={styles.upgradeCard}>
                <View style={styles.upgradeCardHeader}>
                  <Text style={styles.upgradeIconBig}>{currentObj.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upgradeCatTitle}>{cat.title}</Text>
                    <Text style={styles.upgradeEquippedName}>
                      Equipped: {currentObj.name} (Tier {tierNum}/5)
                    </Text>
                    <Text style={styles.upgradeBonusText}>{currentObj.bonusLabel}</Text>
                  </View>
                </View>

                {/* Tier Progress Dots */}
                <View style={styles.tierBarsRow}>
                  {[1, 2, 3, 4, 5].map((t) => (
                    <View
                      key={t}
                      style={[
                        styles.tierSegment,
                        t <= tierNum && styles.tierSegmentFilled,
                      ]}
                    />
                  ))}
                </View>

                {nextObj ? (
                  <View style={styles.upgradeActionRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nextTierLabel}>
                        Next: {nextObj.name}
                      </Text>
                      <Text style={styles.nextTierBonus}>{nextObj.bonusLabel}</Text>
                    </View>
                    <Pressable
                      style={[
                        styles.upgradeBuyBtn,
                        !canAfford && styles.upgradeBuyBtnDisabled,
                      ]}
                      onPress={() => purchaseUpgrade(cat.key)}>
                      <Text style={styles.upgradeBuyBtnText}>
                        Upgrade ({nextObj.cost} 🪙)
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.maxTierBadge}>★ MAX TIER UNLOCKED ★</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 4. SELECT WORLD SCREEN (5 WORLDS MAP)
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
            <Text style={styles.ribbonTitle}>Kingdom World Map (5 Worlds)</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              style={styles.unlockAllMiniBtn}
              onPress={() => setScreen('LEVEL_MONSTER_PLAN')}>
              <Text style={styles.unlockAllMiniText}>All 13 Map</Text>
            </Pressable>
            <Pressable
              style={styles.unlockAllMiniBtn}
              onPress={() =>
                updateSave({
                  ...save,
                  unlockedLevel: 13,
                  coins: Math.max(save.coins, 1500),
                })
              }>
              <Text style={styles.unlockAllMiniText}>Unlock All</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.worldsHorizontalRow}>
          {WORLDS_DATA.map((w) => {
            const worldLevels = LEVELS_DATA.filter((l) => l.world === w.id);
            const firstLv = worldLevels[0]?.level || 1;
            const worldUnlocked = save.unlockedLevel >= firstLv;
            const representativeMonster: MonsterId =
              w.id === 1
                ? 'tree_guardian'
                : w.id === 2
                ? 'dark_witch'
                : w.id === 3
                ? 'three_headed_beast'
                : w.id === 4
                ? 'cursed_dragon'
                : 'witch_queen';

            return (
              <Pressable
                key={w.id}
                style={[
                  styles.worldPillarCard,
                  {
                    backgroundColor: w.bgBottom,
                    borderColor:
                      selectedWorldId === w.id ? '#ffd152' : w.cardBorder,
                    opacity: worldUnlocked ? 1 : 0.65,
                  },
                ]}
                onPress={() => {
                  setSelectedWorldId(w.id);
                  setScreen('LEVEL_SELECT');
                }}>
                <Text style={styles.worldBadgeEmoji}>{w.badgeIcon}</Text>
                <Text style={styles.worldDiffBadge}>{w.difficultyLabel}</Text>
                <View style={styles.worldPillarArt}>
                  <MonsterArt monsterId={representativeMonster} size={70} />
                </View>
                <Text style={styles.worldPillarTitle}>{w.shortName}</Text>
                <Text style={styles.worldPillarRange}>{w.levelRange}</Text>
                <Text style={styles.worldStatusTag}>
                  {worldUnlocked ? '⚔️ Enter World' : `🔒 Lv ${firstLv}`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 5. LEVEL SELECTION — WORLD LEVELS DETAIL
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
              {world.shortName} {world.levelRange}
            </Text>
          </View>
          <Pressable
            style={styles.unlockAllMiniBtn}
            onPress={() => setScreen('ARMORY')}>
            <Text style={styles.unlockAllMiniText}>🛡️ Armory</Text>
          </Pressable>
        </View>

        <Text style={styles.worldSubHeader}>
          {world.badgeIcon} {world.name} • Difficulty: {world.difficultyLabel}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelCardsCarousel}>
          {worldLevels.map((lvl) => {
            const monster = MONSTERS_DATA[lvl.monsterId];
            const unlocked = lvl.level <= save.unlockedLevel;
            const isCurrent = lvl.level === save.unlockedLevel;
            const stars = save.stars[lvl.level] || 0;

            return (
              <View
                key={lvl.level}
                style={[
                  styles.levelSquareCard,
                  unlocked && styles.levelSquareCardActive,
                  isCurrent && { borderColor: '#38e4ae', borderWidth: 3.5 },
                ]}>
                <Pressable
                  disabled={!unlocked}
                  style={[
                    styles.levelPreviewBox,
                    { backgroundColor: world.bgBottom },
                  ]}
                  onPress={() => launchLevel(lvl.level)}>
                  <MonsterArt monsterId={monster.id} size={74} />
                  <Text style={styles.levelMonsterTag}>
                    {monster.isBoss ? '👑 ' : ''}
                    {monster.name}
                  </Text>
                </Pressable>

                <Text style={styles.levelCardTitle}>
                  Level {lvl.level}: {lvl.name}
                </Text>

                <View style={styles.monsterMetaRow}>
                  <Text style={styles.monsterLvText}>
                    {monster.difficulty} • HP {monster.health}
                  </Text>
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
                        <Text style={styles.playLevelBtnText}>
                          {isCurrent ? '▶ Current' : '▶ Play'}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.infoMiniBtn}
                        onPress={() => {
                          setSelectedMonster(monster);
                          setScreen('MONSTER_DETAIL');
                        }}>
                        <Text style={styles.playLevelBtnText}>🔍 Lore</Text>
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
  // 6. FULL 13-LEVEL & MONSTER PROGRESSION MAP BOARD
  // ==========================================================================
  if (screen === 'LEVEL_MONSTER_PLAN') {
    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.topHeaderRow}>
          <Pressable
            style={styles.backCircleBtn}
            onPress={() => setScreen('SELECT_WORLD')}>
            <Text style={styles.backArrowText}>←</Text>
          </Pressable>
          <View style={styles.goldenRibbon}>
            <Text style={styles.ribbonTitle}>
              Complete 13-Level Monster Progression Map
            </Text>
          </View>
          <Pressable
            style={styles.unlockAllMiniBtn}
            onPress={() => setScreen('MONSTER_GALLERY')}>
            <Text style={styles.unlockAllMiniText}>Gallery (13)</Text>
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
                  {w.badgeIcon} {w.name} • {w.difficultyLabel} {w.levelRange}
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {lvls.map((lvl) => {
                      const m = MONSTERS_DATA[lvl.monsterId];
                      const unlocked = lvl.level <= save.unlockedLevel;
                      const stars = save.stars[lvl.level] || 0;
                      return (
                        <Pressable
                          key={lvl.level}
                          style={[
                            styles.planLevelCard,
                            {
                              backgroundColor: w.bgBottom,
                              borderColor: unlocked ? '#ffd152' : '#495057',
                            },
                          ]}
                          onPress={() => {
                            if (unlocked) launchLevel(lvl.level);
                          }}>
                          <Text style={styles.planLevelNum}>
                            Level {lvl.level} {unlocked ? '🔓' : '🔒'}
                          </Text>
                          <Text style={styles.planLevelSub}>{lvl.name}</Text>
                          <View style={{ marginVertical: 6 }}>
                            <MonsterArt monsterId={m.id} size={56} />
                          </View>
                          <Text style={styles.planMonsterName}>{m.name}</Text>
                          <Text style={styles.galleryMonsterLv}>
                            {m.difficulty} • HP {m.health}
                          </Text>
                          <Text style={{ color: '#ffd152', fontSize: 12 }}>
                            {'★'.repeat(stars)}
                            {'☆'.repeat(3 - stars)}
                          </Text>
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
  // 7. MONSTER GALLERY & MONSTER DETAIL UI (WITH DEFEATED / LOCKED STATUS)
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
          {MONSTER_GALLERY_LIST.map((m) => {
            const defeated = isMonsterDefeated(m);
            const encountered = m.level <= save.unlockedLevel;
            return (
              <Pressable
                key={m.id}
                style={[
                  styles.galleryItemCard,
                  {
                    borderColor: defeated
                      ? '#38e4ae'
                      : encountered
                      ? m.themeColor
                      : '#495057',
                  },
                ]}
                onPress={() => {
                  setSelectedMonster(m);
                  setScreen('MONSTER_DETAIL');
                }}>
                <MonsterArt monsterId={m.id} size={60} />
                <Text style={styles.galleryMonsterName}>{m.name}</Text>
                <Text style={styles.galleryMonsterLv}>
                  Lv {m.level} • {m.difficulty}
                </Text>
                <Text
                  style={[
                    styles.galleryStatusBadge,
                    {
                      color: defeated
                        ? '#38e4ae'
                        : encountered
                        ? '#ffd152'
                        : '#adb5bd',
                    },
                  ]}>
                  {defeated
                    ? '✅ Defeated'
                    : encountered
                    ? '⚔️ Unlocked'
                    : '🔒 Locked'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'MONSTER_DETAIL') {
    const m = selectedMonster;
    const defeated = isMonsterDefeated(m);
    const unlocked = m.level <= save.unlockedLevel;

    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.topHeaderRow}>
          <Pressable
            style={styles.backCircleBtn}
            onPress={() => setScreen('MONSTER_GALLERY')}>
            <Text style={styles.backArrowText}>←</Text>
          </Pressable>
          <View style={styles.goldenRibbon}>
            <Text style={styles.ribbonTitle}>
              Lv {m.level} — {m.name} ({m.difficulty})
            </Text>
          </View>
          {unlocked ? (
            <Pressable
              style={styles.unlockAllMiniBtn}
              onPress={() => launchLevel(m.level)}>
              <Text style={styles.unlockAllMiniText}>Fight Lv {m.level} ▶</Text>
            </Pressable>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        <View style={[styles.monsterDetailFrame, { borderColor: m.themeColor }]}>
          <View style={styles.monsterDetailTopRow}>
            <View style={styles.monsterDetailPortrait}>
              <MonsterArt monsterId={m.id} size={100} />
              <Text style={styles.monsterHeartsText}>
                {'❤️'.repeat(m.hearts)}
              </Text>
              <Text
                style={{
                  color: defeated ? '#38e4ae' : '#ffd152',
                  fontSize: 11,
                  fontWeight: '900',
                  marginTop: 4,
                }}>
                {defeated ? '✅ DEFEATED' : unlocked ? '⚔️ ENCOUNTERED' : '🔒 LOCKED'}
              </Text>
            </View>

            <View style={styles.monsterStatsCol}>
              <View style={styles.monsterRibbonBanner}>
                <Text style={styles.monsterRibbonText}>
                  {m.isBoss ? '👑 ' : ''}
                  {m.name}
                </Text>
              </View>

              <Text style={styles.monsterLoreDesc}>{m.description}</Text>

              <View style={styles.statLine}>
                <Text style={styles.statLabel}>❤️ Health</Text>
                <Text style={styles.statNumber}>
                  {m.health.toLocaleString()}
                </Text>
              </View>
              <View style={styles.statLine}>
                <Text style={styles.statLabel}>⚔️ Attack Type</Text>
                <Text style={styles.statNumber}>{m.attackType}</Text>
              </View>
              <View style={styles.statLine}>
                <Text style={styles.statLabel}>✨ Special</Text>
                <Text style={styles.statNumber}>{m.specialDesc}</Text>
              </View>
              <View style={styles.statLine}>
                <Text style={styles.statLabel}>💨 Speed</Text>
                <Text style={styles.statNumber}>{m.speedLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.abilitiesRow}>
            {m.abilities.map((ab, i) => (
              <View
                key={i}
                style={[styles.abilityBox, { borderColor: ab.color }]}>
                <Text style={{ fontSize: 18 }}>{ab.icon}</Text>
                <Text style={styles.abilityNameText}>{ab.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 8. SETTINGS SCREEN
  // ==========================================================================
  if (screen === 'SETTINGS') {
    const tabs: Array<'General' | 'Controls' | 'Audio' | 'Graphics'> = [
      'General',
      'Controls',
      'Audio',
      'Graphics',
    ];

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
            <Text style={styles.settingsHeading}>{settingsTab} Settings</Text>

            {settingsTab === 'Controls' ? (
              <View style={{ gap: 6 }}>
                <Text style={styles.controlsHelpText}>
                  📱 Android Touch: Bottom-left Move (◀ ▶) • Bottom-right Jump (↑), Light Sword (🗡️), Heavy Cleave (⚒️), Block (🛡️), Dodge (💨), Stone Skill (🌀), and Healing Potion (🧪).
                </Text>
                <Text style={styles.controlsHelpText}>
                  ⌨️ PC Keyboard: A/D or Arrows to Move • W/Space to Jump • J Light Attack • H Heavy Attack • K Block • L/Shift Dodge • U Stone Skill • I/Q Use Potion.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.settingControlRow}>
                  <Text style={styles.settingControlLabel}>🎵 Music Volume</Text>
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
                  <Text style={styles.settingControlLabel}>🔊 SFX Volume</Text>
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
                  <Text style={styles.settingControlLabel}>🎶 Music Enabled</Text>
                  <Switch
                    value={save.musicEnabled}
                    onValueChange={(v) =>
                      updateSave({ ...save, musicEnabled: v })
                    }
                  />
                </View>

                <View style={styles.settingControlRow}>
                  <Text style={styles.settingControlLabel}>🔔 Sound Effects</Text>
                  <Switch
                    value={save.sfxEnabled}
                    onValueChange={(v) => updateSave({ ...save, sfxEnabled: v })}
                  />
                </View>

                <View style={styles.settingControlRow}>
                  <Text style={styles.settingControlLabel}>📳 Vibration</Text>
                  <Switch
                    value={save.vibration}
                    onValueChange={(v) => updateSave({ ...save, vibration: v })}
                  />
                </View>

                <View style={styles.settingControlRow}>
                  <Text style={styles.settingControlLabel}>💥 Screen Shake</Text>
                  <Switch
                    value={save.screenShake}
                    onValueChange={(v) =>
                      updateSave({ ...save, screenShake: v })
                    }
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 9. PAUSED MODAL
  // ==========================================================================
  if (screen === 'PAUSE') {
    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.pausedDialog}>
          <View style={styles.goldenRibbon}>
            <Text style={styles.ribbonTitle}>
              Paused — Level {currentLevel.level}
            </Text>
          </View>

          <View style={{ width: '100%', gap: 10, marginTop: 14 }}>
            <Pressable
              style={[styles.ornateMenuBtn, styles.ornateMenuBtnPrimary]}
              onPress={() => {
                engineRef.current.running = true;
                setScreen('GAMEPLAY');
              }}>
              <Text style={styles.menuBtnIcon}>▶</Text>
              <Text style={styles.menuBtnLabel}>Resume Battle</Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => launchLevel(currentLevel.level)}>
              <Text style={styles.menuBtnIcon}>↻</Text>
              <Text style={styles.menuBtnLabel}>Restart Level</Text>
            </Pressable>

            <Pressable
              style={styles.ornateMenuBtn}
              onPress={() => {
                setArmoryNotice('');
                setScreen('ARMORY');
              }}>
              <Text style={styles.menuBtnIcon}>🛡️</Text>
              <Text style={styles.menuBtnLabel}>Warrior Upgrades</Text>
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
              <Text style={styles.menuBtnLabel}>Return to Main Menu</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 10. LEVEL COMPLETION (VICTORY) SCREEN
  // ==========================================================================
  if (screen === 'LEVEL_COMPLETE') {
    const defeatedMonster = MONSTERS_DATA[currentLevel.monsterId];
    return (
      <SafeAreaView style={styles.darkBackdrop}>
        <View style={styles.levelCompleteLayout}>
          <View style={styles.completeHeroCol}>
            <WarriorArt size={105} attacking />
            <Text style={styles.defeatedTagText}>
              Vanquished: {defeatedMonster.name}
            </Text>
          </View>

          <View style={styles.completeBox}>
            <Text style={styles.bigThreeStars}>
              {'★'.repeat(hud.starsEarned)}
              {'☆'.repeat(3 - hud.starsEarned)}
            </Text>

            <View style={styles.redVictoryRibbon}>
              <Text style={styles.ribbonTitle}>
                Level {currentLevel.level} Complete!
              </Text>
            </View>

            <Text style={styles.clearNoteText}>{currentLevel.clearNote}</Text>

            <View style={styles.completeStatsPanel}>
              <View style={styles.completeStatRow}>
                <Text style={styles.completeStatLabel}>🐉 Defeated Monster</Text>
                <Text style={styles.completeStatVal}>{defeatedMonster.name}</Text>
              </View>
              <View style={styles.completeStatRow}>
                <Text style={styles.completeStatLabel}>🪙 Coins Collected</Text>
                <Text style={styles.completeStatVal}>
                  +{hud.levelCoinsEarned}
                </Text>
              </View>
              <View style={styles.completeStatRow}>
                <Text style={styles.completeStatLabel}>💎 Gems Collected</Text>
                <Text style={styles.completeStatVal}>
                  +{hud.levelGemsEarned}
                </Text>
              </View>
              <View style={styles.completeStatRow}>
                <Text style={styles.completeStatLabel}>🕒 Completion Time</Text>
                <Text style={styles.completeStatVal}>
                  {formatTime(hud.elapsedSec)}
                </Text>
              </View>
            </View>

            <View style={styles.completeBtnsRow}>
              <Pressable
                style={styles.retryBtn}
                onPress={() => launchLevel(currentLevel.level)}>
                <Text style={styles.menuBtnLabel}>↻ Replay</Text>
              </Pressable>

              <Pressable
                style={styles.retryBtn}
                onPress={() => {
                  setArmoryNotice('');
                  setScreen('ARMORY');
                }}>
                <Text style={styles.menuBtnLabel}>🛡️ Upgrades</Text>
              </Pressable>

              {currentLevel.level < 13 ? (
                <Pressable
                  style={styles.nextLevelGoldBtn}
                  onPress={() => launchLevel(currentLevel.level + 1)}>
                  <Text style={styles.nextLevelGoldText}>Next Level &gt;</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.nextLevelGoldBtn}
                  onPress={() => setScreen('MAIN_MENU')}>
                  <Text style={styles.nextLevelGoldText}>Main Menu</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 11. DEDICATED GAME OVER (DEFEAT) SCREEN
  // ==========================================================================
  if (screen === 'GAME_OVER') {
    const monster = MONSTERS_DATA[currentLevel.monsterId];
    return (
      <SafeAreaView style={styles.gameOverBackdrop}>
        <View style={styles.levelCompleteLayout}>
          <View style={styles.completeHeroCol}>
            <WarriorArt size={95} defeated />
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <MonsterArt monsterId={monster.id} size={64} />
              <Text style={styles.gameOverSubText}>
                Felled by {monster.name}
              </Text>
            </View>
          </View>

          <View style={[styles.completeBox, { borderColor: '#e63946' }]}>
            <View style={[styles.redVictoryRibbon, { backgroundColor: '#660708' }]}>
              <Text style={[styles.ribbonTitle, { color: '#ffffff' }]}>
                💀 DEFEATED IN BATTLE
              </Text>
            </View>

            <Text style={styles.clearNoteText}>
              The darkness of Level {currentLevel.level} overwhelmed you! Upgrade your Weapon, Armor, and Health in the Armory or use Healing Potions (🧪) during combat.
            </Text>

            <View style={styles.completeStatsPanel}>
              <View style={styles.completeStatRow}>
                <Text style={styles.completeStatLabel}>🌊 Wave Reached</Text>
                <Text style={styles.completeStatVal}>
                  Wave {hud.currentWave}/{hud.totalWaves}
                </Text>
              </View>
              <View style={styles.completeStatRow}>
                <Text style={styles.completeStatLabel}>🪙 Coins Kept</Text>
                <Text style={styles.completeStatVal}>
                  +{hud.levelCoinsEarned}
                </Text>
              </View>
            </View>

            <View style={styles.completeBtnsRow}>
              <Pressable
                style={styles.nextLevelGoldBtn}
                onPress={() => launchLevel(currentLevel.level)}>
                <Text style={styles.nextLevelGoldText}>↻ Retry Level</Text>
              </Pressable>

              <Pressable
                style={styles.retryBtn}
                onPress={() => {
                  setArmoryNotice('');
                  setScreen('ARMORY');
                }}>
                <Text style={styles.menuBtnLabel}>🛡️ Armory</Text>
              </Pressable>

              <Pressable
                style={styles.retryBtn}
                onPress={() => setScreen('LEVEL_SELECT')}>
                <Text style={styles.menuBtnLabel}>🗺️ Levels</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // 12. THE KINGDOM IS SAVED! ENDING SCREEN
  // ==========================================================================
  if (screen === 'ENDING') {
    return (
      <SafeAreaView style={styles.endingSunlitBg}>
        <View style={styles.goldenRibbon}>
          <Text style={styles.ribbonTitle}>👑 The Kingdom is Saved!</Text>
        </View>

        <View style={styles.endingCastleScene}>
          <Text style={{ fontSize: 54 }}>🏰</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <WarriorArt size={76} attacking />
            <Text style={{ fontSize: 48 }}>🤴</Text>
          </View>
        </View>

        <View style={styles.endingParchmentBanner}>
          <Text style={styles.endingParchmentText}>
            With the awakened power of the Ancient Magical Stone, you shattered the Witch Queen’s dark shield and broke the curse across all five worlds!{'\n'}
            <Text style={{ fontWeight: '900' }}>
              The King is saved and peace returns to the realm. You are the legendary champion of the Kingdom!
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
  // 13. GAMEPLAY SCREEN + FULL DARK-FANTASY COMBAT HUD
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
  const stageBossMonster = MONSTERS_DATA[currentLevel.monsterId];

  return (
    <SafeAreaView
      style={[
        styles.gameplayWrapper,
        { backgroundColor: currentWorld.bgTop },
      ]}>
      {/* TOP GAMEPLAY HUD */}
      <View style={styles.hudTopContainer}>
        {/* Top-Left: Warrior Portrait + Health Bar + Numeric HP + Stamina Bar + Low-HP Warning */}
        <View style={styles.heroHudLeft}>
          <View
            style={[
              styles.heroAvatarCircle,
              hud.lowHealth && { borderColor: '#ff2a55' },
            ]}>
            <WarriorArt
              size={38}
              attacking={p.attackTimer > 0}
              heavyAttacking={p.heavyAttackTimer > 0}
              blocking={p.blocking}
            />
          </View>
          <View>
            <View style={styles.heartsRow}>
              {[1, 2, 3, 4].map((h) => (
                <Text
                  key={h}
                  style={{
                    fontSize: 11,
                    opacity: h <= hud.hearts ? 1 : 0.25,
                  }}>
                  ❤️
                </Text>
              ))}
              <Text style={styles.hudNumericText}>
                HP {Math.ceil(hud.hp)}/{hud.maxHp}
              </Text>
              {hud.lowHealth && (
                <Text style={styles.lowHpWarningBadge}>⚠️ LOW HP!</Text>
              )}
            </View>
            {/* Health Bar */}
            <View style={styles.greenBarTrack}>
              <View
                style={[
                  styles.greenBarFill,
                  {
                    width: `${hpPercent}%`,
                    backgroundColor: hud.lowHealth ? '#ff2a55' : '#52b788',
                  },
                ]}
              />
            </View>
            {/* Stamina Bar */}
            <View style={[styles.greenBarTrack, { height: 7, marginTop: 3 }]}>
              <View
                style={[styles.staminaBarFill, { width: `${staPercent}%` }]}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
              <Text style={styles.heroLvBadgeText}>
                STA {Math.floor(hud.stamina)}/{hud.maxStamina}
              </Text>
              {hud.poisoned && (
                <Text style={{ color: '#80ed99', fontSize: 9, fontWeight: '900' }}>
                  🧪 POISON
                </Text>
              )}
              {hud.rooted && (
                <Text style={{ color: '#52b788', fontSize: 9, fontWeight: '900' }}>
                  🌿 ROOTED
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Top-Center: World, Level Name, Wave Counter & Remaining Enemies */}
        <View style={styles.waveCounterPill}>
          <Text style={styles.levelHudTitleText}>
            W{currentWorld.id} • Lv {currentLevel.level}: {currentLevel.name}
          </Text>
          <Text style={styles.waveTitleText}>
            WAVE {hud.currentWave}/{hud.totalWaves} • FOES LEFT: {hud.remainingEnemies}
          </Text>
        </View>

        {/* Top-Right: Coins + Gems + Potions + Pause + Enemy / Boss HUD */}
        <View style={styles.hudTopRightCol}>
          <View style={styles.currencyRow}>
            <Text style={styles.currencyItem}>🪙 {hud.coins}</Text>
            <Text style={styles.currencyItem}>💎 {hud.gems}</Text>
            <Text style={styles.currencyItem}>🧪 {hud.potionsLeft}</Text>
            <Pressable
              style={styles.pauseCircleBtn}
              onPress={() => {
                state.running = false;
                setScreen('PAUSE');
              }}>
              <Text style={styles.pauseCircleText}>||</Text>
            </Pressable>
          </View>

          {/* In-Game Enemy / Boss Health Bar */}
          {hud.targetEnemyHp > 0 && (
            <View
              style={[
                styles.enemyHudFrame,
                hud.targetEnemyIsBoss && {
                  borderColor: '#ff2a55',
                  width: 215,
                },
              ]}>
              <View style={styles.enemyEmblemCircle}>
                <MonsterArt monsterId={hud.targetEnemyId} size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.enemyHudName}>
                  {hud.targetEnemyIsBoss ? '👑 BOSS: ' : ''}
                  {hud.targetEnemyName}
                  {hud.targetEnemyIsBoss ? ` [P${hud.targetBossPhase}]` : ''}
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
                  HP {hud.targetEnemyHp}/{hud.targetEnemyMaxHp}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* BOSS TELEGRAPHED ATTACK WARNING OR BOSS DEFEATED BANNER */}
      {hud.bossDefeatedText ? (
        <View style={styles.bossDefeatedBanner}>
          <Text style={styles.bossDefeatedBannerText}>{hud.bossDefeatedText}</Text>
        </View>
      ) : hud.bossWarningText ? (
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
            borderColor: hud.lowHealth ? '#ff2a55' : currentWorld.groundTop,
          },
        ]}>
        <View style={styles.ruinsArchBackdrop} />

        {p.stoneFlashTimer > 0 && <View style={styles.stoneFlashOverlay} />}
        {hud.lowHealth && <View style={styles.lowHealthVignette} />}

        {/* BOSS INTRODUCTION OVERLAY WHEN WAVE 3 STARTS */}
        {hud.bossIntroActive && (
          <View style={styles.bossIntroModal}>
            <MonsterArt monsterId={stageBossMonster.id} size={62} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bossIntroHeader}>
                👑 {stageBossMonster.name.toUpperCase()} ({stageBossMonster.difficulty})
              </Text>
              <Text style={styles.bossIntroDesc}>
                {stageBossMonster.bossIntroText}
              </Text>
            </View>
            <Pressable
              style={styles.bossIntroDismissBtn}
              onPress={() => {
                state.bossIntroTimer = 0;
              }}>
              <Text style={styles.bossIntroDismissText}>⚔️ FIGHT!</Text>
            </Pressable>
          </View>
        )}

        {hud.toast && !hud.bossIntroActive ? (
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

        {/* Active Wave Gate Barrier */}
        {!state.allWavesCleared && activeWaveDef && (
          <View
            style={[
              styles.waveGateBarrier,
              { left: activeWaveDef.gateX - state.cameraX + 36 },
            ]}
          />
        )}

        {/* Collectibles (Coins, Gems, Hearts, Potions) */}
        {state.items.map((it) => {
          if (it.collected) return null;
          const sx = it.x - state.cameraX;
          if (sx < -40 || sx > 900) return null;
          return (
            <View
              key={it.id}
              style={{ position: 'absolute', left: sx - 10, top: it.y - 10 }}>
              <Text style={{ fontSize: 16 }}>
                {it.type === 'coin'
                  ? '🪙'
                  : it.type === 'gem'
                  ? '💎'
                  : it.type === 'potion'
                  ? '🧪'
                  : '❤️'}
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

        {/* Level Monsters with AI State, Individual Health Bars & Telegraph Indicators */}
        {state.enemies.map((e) => {
          const sx = e.x - state.cameraX;
          if (sx < -90 || sx > 900) return null;
          const ePct = Math.max(0, Math.min(100, (e.hp / e.maxHp) * 100));
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
                opacity:
                  e.aiState === 'DEAD' ? 0.35 : e.aiState === 'HURT' ? 0.65 : 1,
              }}>
              {/* Mini overhead HP bar above every active monster */}
              <View style={styles.overheadHpTrack}>
                <View
                  style={[
                    styles.overheadHpFill,
                    {
                      width: `${ePct}%`,
                      backgroundColor: e.isBoss ? '#ff2a55' : '#e63946',
                    },
                  ]}
                />
              </View>
              {e.aiState === 'PREPARE_ATTACK' && (
                <Text style={styles.telegraphIcon}>⚠️</Text>
              )}
              {e.aiState === 'DETECT' && (
                <Text style={styles.telegraphIcon}>❗</Text>
              )}
              <View style={{ transform: [{ scaleX: e.facing < 0 ? 1 : -1 }] }}>
                <MonsterArt monsterId={e.monsterId} size={e.w} />
              </View>
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
            heavyAttacking={p.heavyAttackTimer > 0}
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
        {/* Bottom-Left: Move ( ◀ ) and ( ▶ ) */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
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

        {/* Bottom-Right: Potion (🧪), Dodge (💨), Block (🛡️), Skill (🌀), Heavy (⚒️), Attack (🗡️), Jump (↑) */}
        <View style={styles.rightCluster}>
          <Pressable
            style={[
              styles.roundTouchBtnSmall,
              { borderColor: '#52b788' },
              hud.potionsLeft <= 0 && { opacity: 0.45 },
            ]}
            onPressIn={() => {
              if (playerUsePotion(state)) vibrate('medium');
            }}>
            <Text style={styles.roundBtnSubLabel}>🧪</Text>
            <Text style={styles.roundBtnTinyText}>x{hud.potionsLeft}</Text>
          </Pressable>

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
              styles.roundTouchBtnSmall,
              { borderColor: '#38e4ae' },
              !skillReady && { opacity: 0.55 },
            ]}
            onPressIn={() => {
              if (playerStoneSkill(state)) vibrate('heavy');
            }}>
            <Text style={styles.roundBtnSubLabel}>🌀</Text>
            <Text style={styles.roundBtnTinyText}>
              {skillReady ? 'SKILL' : `${skillCooldownSec}s`}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.roundTouchBtnSmall, { borderColor: '#ff70a6' }]}
            onPressIn={() => {
              if (playerHeavyAttack(state)) vibrate('medium');
            }}>
            <Text style={styles.roundBtnSubLabel}>⚒️</Text>
            <Text style={styles.roundBtnTinyText}>HEAVY</Text>
          </Pressable>

          <Pressable
            style={[styles.roundTouchBtn, styles.roundSwordBtn]}
            onPressIn={() => {
              if (playerSwordAttack(state)) vibrate('light');
            }}>
            <Text style={{ fontSize: 20 }}>🗡️</Text>
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
    backgroundColor: '#160d24',
    justifyContent: 'center',
    padding: 14,
  },
  menuLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 14,
  },
  menuLeftCol: {
    alignItems: 'center',
  },
  crownIcon: {
    fontSize: 26,
    marginBottom: -4,
  },
  logoSmall: {
    color: '#ffd152',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  logoMain: {
    color: '#ffdd80',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: '#590d22',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 4,
  },
  heroCliffBox: {
    marginTop: 6,
    alignItems: 'center',
  },
  menuCurrencyPill: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#241734',
    borderWidth: 1.5,
    borderColor: '#d4a338',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 6,
  },
  menuRightCol: {
    width: 265,
    gap: 7,
  },
  ornateMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#241a29',
    borderWidth: 2,
    borderColor: '#b08946',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    fontSize: 14,
    fontWeight: '800',
  },
  darkBackdrop: {
    flex: 1,
    backgroundColor: '#0e0b1a',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  gameOverBackdrop: {
    flex: 1,
    backgroundColor: '#1f0812',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  topHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2b1e16',
    borderWidth: 2,
    borderColor: '#d4a338',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrowText: {
    color: '#ffd152',
    fontSize: 18,
    fontWeight: '900',
  },
  goldenRibbon: {
    backgroundColor: '#b88635',
    borderWidth: 2,
    borderColor: '#ffd152',
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 4,
  },
  ribbonTitle: {
    color: '#241405',
    fontSize: 15,
    fontWeight: '900',
  },
  unlockAllMiniBtn: {
    backgroundColor: '#48286b',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  storyArtBox: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#2d124d',
    borderWidth: 2,
    borderColor: '#7209b7',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  castleEmoji: {
    fontSize: 34,
    marginVertical: 4,
  },
  storyTextCol: {
    flex: 1.3,
    minWidth: 220,
    justifyContent: 'space-between',
  },
  parchmentBody: {
    color: '#2b1908',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  storyFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 6,
  },
  parchmentNextText: {
    color: '#ffd152',
    fontWeight: '900',
    fontSize: 13,
  },
  // Armory / Warrior Upgrades UI
  armoryHeroBanner: {
    width: '98%',
    backgroundColor: '#1c142b',
    borderWidth: 2,
    borderColor: '#d4a338',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  armoryHeroTitle: {
    color: '#ffd152',
    fontSize: 14,
    fontWeight: '900',
  },
  armoryHeroStats: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  buyPotionBtn: {
    backgroundColor: '#2d6a4f',
    borderWidth: 1.5,
    borderColor: '#80ed99',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buyPotionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  armoryNoticeText: {
    color: '#38e4ae',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  armoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 14,
  },
  upgradeCard: {
    width: 300,
    backgroundColor: '#191326',
    borderWidth: 2,
    borderColor: '#b08946',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  upgradeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upgradeIconBig: {
    fontSize: 28,
  },
  upgradeCatTitle: {
    color: '#ffd152',
    fontSize: 13,
    fontWeight: '900',
  },
  upgradeEquippedName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  upgradeBonusText: {
    color: '#38e4ae',
    fontSize: 10,
    fontWeight: '700',
  },
  tierBarsRow: {
    flexDirection: 'row',
    gap: 5,
    marginVertical: 2,
  },
  tierSegment: {
    flex: 1,
    height: 6,
    backgroundColor: '#342846',
    borderRadius: 3,
  },
  tierSegmentFilled: {
    backgroundColor: '#ffd152',
  },
  upgradeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  nextTierLabel: {
    color: '#ced4da',
    fontSize: 10,
    fontWeight: '700',
  },
  nextTierBonus: {
    color: '#ffd152',
    fontSize: 10,
    fontWeight: '800',
  },
  upgradeBuyBtn: {
    backgroundColor: '#9e3b18',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
  },
  upgradeBuyBtnDisabled: {
    backgroundColor: '#343a40',
    borderColor: '#6c757d',
    opacity: 0.65,
  },
  upgradeBuyBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  maxTierBadge: {
    color: '#ffd152',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },
  worldsHorizontalRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  worldPillarCard: {
    width: 145,
    height: 255,
    borderWidth: 3,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  worldBadgeEmoji: {
    fontSize: 22,
  },
  worldDiffBadge: {
    color: '#ffd152',
    fontSize: 10,
    fontWeight: '900',
  },
  worldPillarArt: {
    marginVertical: 4,
  },
  worldPillarTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  worldPillarRange: {
    color: '#ffd152',
    fontSize: 11,
    fontWeight: '800',
  },
  worldStatusTag: {
    color: '#38e4ae',
    fontSize: 10,
    fontWeight: '800',
  },
  worldSubHeader: {
    color: '#ffd152',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  levelCardsCarousel: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 10,
  },
  levelSquareCard: {
    width: 205,
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
    height: 105,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#495057',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  levelMonsterTag: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  levelCardTitle: {
    color: '#f8f4e6',
    fontSize: 13,
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
    fontSize: 10,
    fontWeight: '800',
  },
  monsterHeartsText: {
    fontSize: 10,
  },
  levelCardFooter: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  goldStarsText: {
    color: '#ffd152',
    fontSize: 18,
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
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  planWorldBox: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#141024',
  },
  planWorldHeader: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  planLevelCard: {
    width: 165,
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  planLevelNum: {
    color: '#ffd152',
    fontSize: 12,
    fontWeight: '900',
  },
  planLevelSub: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  planMonsterName: {
    color: '#f8f4e6',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 16,
  },
  galleryItemCard: {
    width: 132,
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
  galleryStatusBadge: {
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
  },
  monsterDetailFrame: {
    flex: 1,
    width: '96%',
    maxWidth: 640,
    backgroundColor: '#13192b',
    borderWidth: 3,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  monsterDetailTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  monsterDetailPortrait: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#0b2138',
    borderWidth: 2,
    borderColor: '#48cae4',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  monsterStatsCol: {
    flex: 1.5,
    minWidth: 210,
    gap: 4,
  },
  monsterRibbonBanner: {
    backgroundColor: '#7f3918',
    borderWidth: 2,
    borderColor: '#ffd152',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  monsterRibbonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  monsterLoreDesc: {
    color: '#ced4da',
    fontSize: 11,
    lineHeight: 15,
    marginVertical: 2,
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#2b3a55',
    paddingVertical: 3,
  },
  statLabel: {
    color: '#b5a8c9',
    fontSize: 12,
    fontWeight: '700',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  abilitiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
    marginTop: 6,
  },
  abilityBox: {
    flex: 1,
    backgroundColor: '#1a243b',
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },
  abilityNameText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
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
    width: 130,
    gap: 8,
  },
  settingsTabBtn: {
    backgroundColor: '#2b2036',
    borderWidth: 1.5,
    borderColor: '#7a5c38',
    borderRadius: 6,
    paddingVertical: 8,
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
    gap: 8,
  },
  settingsHeading: {
    color: '#ffd152',
    fontSize: 15,
    fontWeight: '900',
  },
  controlsHelpText: {
    color: '#f8f4e6',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  settingControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  settingControlLabel: {
    color: '#f8f4e6',
    fontSize: 12,
    fontWeight: '700',
    width: 125,
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
    width: 330,
    backgroundColor: '#1e1526',
    borderWidth: 3,
    borderColor: '#d4a338',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  levelCompleteLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  completeHeroCol: {
    alignItems: 'center',
  },
  defeatedTagText: {
    color: '#38e4ae',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 6,
  },
  gameOverSubText: {
    color: '#ff4d6d',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  completeBox: {
    width: 365,
    backgroundColor: '#211624',
    borderWidth: 3,
    borderColor: '#d4a338',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  bigThreeStars: {
    color: '#ffd152',
    fontSize: 34,
    marginTop: -24,
  },
  redVictoryRibbon: {
    backgroundColor: '#9e1f32',
    borderWidth: 2,
    borderColor: '#ffd152',
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 6,
    marginVertical: 6,
  },
  clearNoteText: {
    color: '#ced4da',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
  },
  completeStatsPanel: {
    width: '100%',
    backgroundColor: '#160f19',
    borderWidth: 1.5,
    borderColor: '#6e4e2e',
    borderRadius: 8,
    padding: 9,
    gap: 6,
    marginVertical: 6,
  },
  completeStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  completeStatLabel: {
    color: '#f8f4e6',
    fontSize: 12,
    fontWeight: '700',
  },
  completeStatVal: {
    color: '#ffd152',
    fontSize: 12,
    fontWeight: '900',
  },
  completeBtnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  retryBtn: {
    backgroundColor: '#382942',
    borderWidth: 2,
    borderColor: '#b08946',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  nextLevelGoldBtn: {
    backgroundColor: '#d49b27',
    borderWidth: 2,
    borderColor: '#fff3b0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  nextLevelGoldText: {
    color: '#241405',
    fontSize: 13,
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
    padding: 6,
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
    gap: 7,
  },
  heroAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
  lowHpWarningBadge: {
    color: '#ff2a55',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 4,
  },
  greenBarTrack: {
    width: 118,
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
    fontSize: 9,
    fontWeight: '900',
  },
  waveCounterPill: {
    backgroundColor: 'rgba(20, 14, 34, 0.92)',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  levelHudTitleText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  waveTitleText: {
    color: '#ffd152',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1,
  },
  hudTopRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyItem: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  pauseCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2b1e16',
    borderWidth: 2,
    borderColor: '#ffd152',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseCircleText: {
    color: '#ffd152',
    fontSize: 11,
    fontWeight: '900',
  },
  enemyHudFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 14, 32, 0.94)',
    borderWidth: 2,
    borderColor: '#d4a338',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    width: 190,
    gap: 6,
  },
  enemyEmblemCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2d3a2e',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyHudName: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
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
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
  },
  bossWarningBanner: {
    backgroundColor: 'rgba(138, 14, 38, 0.94)',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 10,
    alignSelf: 'center',
  },
  bossWarningText: {
    color: '#ffd152',
    fontSize: 10,
    fontWeight: '900',
  },
  bossDefeatedBanner: {
    backgroundColor: 'rgba(45, 106, 79, 0.95)',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  bossDefeatedBannerText: {
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
  lowHealthVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 4,
    borderColor: 'rgba(255, 42, 85, 0.65)',
    zIndex: 11,
  },
  bossIntroModal: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(22, 10, 38, 0.96)',
    borderWidth: 2,
    borderColor: '#ff2a55',
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 25,
  },
  bossIntroHeader: {
    color: '#ffd152',
    fontSize: 12,
    fontWeight: '900',
  },
  bossIntroDesc: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  bossIntroDismissBtn: {
    backgroundColor: '#9e1f32',
    borderWidth: 1.5,
    borderColor: '#ffd152',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bossIntroDismissText: {
    color: '#ffd152',
    fontSize: 10,
    fontWeight: '900',
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
  overheadHpTrack: {
    width: 34,
    height: 4,
    backgroundColor: '#2b1218',
    borderRadius: 2,
    marginBottom: 2,
    overflow: 'hidden',
  },
  overheadHpFill: {
    height: '100%',
  },
  telegraphIcon: {
    fontSize: 12,
    marginBottom: -2,
  },
  damageFloatText: {
    fontSize: 12,
    fontWeight: '900',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  circularControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roundTouchBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(28, 22, 42, 0.92)',
    borderWidth: 2,
    borderColor: '#9c89b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundTouchBtnSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(28, 22, 42, 0.92)',
    borderWidth: 2,
    borderColor: '#9c89b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundSwordBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(158, 59, 24, 0.92)',
    borderColor: '#ffd152',
  },
  roundJumpBtn: {
    borderColor: '#ffd152',
  },
  roundBtnIcon: {
    color: '#ffffff',
    fontSize: 18,
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
