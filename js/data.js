// ============================================================================
// THE CURSED KINGDOM — GAME DATA, 5 WORLDS, 13 LEVELS & 13 MONSTERS
// ============================================================================

const STORY_SLIDES = [
  {
    title: "THE STORY",
    speaker: "THE KING",
    scene: "castle_curse",
    text: "A powerful witch has cursed our kingdom and taken control of the castle. Only the Ancient Stone can break the curse. You, our bravest warrior, must find it, defeat the witch, and save the kingdom!"
  },
  {
    title: "5 WORLDS • 13 MONSTER LEVELS",
    speaker: "ROYAL CHRONICLER",
    scene: "king_throne",
    text: "Battle Forest Slimes, Wild Wolves, and the Wood Golem in World 1; Cave Bats and the Skeleton Warrior in World 2; and confront The Witch at Level 6!"
  },
  {
    title: "THE FROZEN PEAKS & CURSED KINGDOM",
    speaker: "THE WARRIOR",
    scene: "warrior_journey",
    text: "Conquer Ice Wolves, Ice Golems, and the Frost Guardian in World 4 to awaken the Ancient Stone—then defeat Fire Hounds, Shadow Mages, the Cursed Knight, and The Witch's Final Form at Level 13!"
  }
];

const WORLDS_DATA = [
  {
    id: 1,
    name: "World 1 – The Forgotten Forest (Levels 1 – 3)",
    enemiesText: "Lv 1: Forest Slime • Lv 2: Wild Wolf • Lv 3: Wood Golem",
    theme: "forest",
    skyTop: "#0d1f22",
    skyBottom: "#1f4e3d",
    groundColor: "#2d6a4f",
    groundTop: "#52b788",
    accentColor: "#95d5b2"
  },
  {
    id: 2,
    name: "World 2 – The Dark Caves (Levels 4 – 5)",
    enemiesText: "Lv 4: Cave Bat • Lv 5: Skeleton Warrior",
    theme: "cave",
    skyTop: "#090814",
    skyBottom: "#162f59",
    groundColor: "#1d2d44",
    groundTop: "#4895ef",
    accentColor: "#4cc9f0"
  },
  {
    id: 3,
    name: "World 3 – The Witch's Territory (Level 6)",
    enemiesText: "Lv 6: The Witch (First Encounter)",
    theme: "witch_castle",
    isBossWorld: true,
    skyTop: "#1a0626",
    skyBottom: "#480ca8",
    groundColor: "#240046",
    groundTop: "#9d4edd",
    accentColor: "#f72585"
  },
  {
    id: 4,
    name: "World 4 – The Frozen Mountains (Levels 7 – 9)",
    enemiesText: "Lv 7: Ice Wolf • Lv 8: Ice Golem • Lv 9: Frost Guardian",
    theme: "ice",
    skyTop: "#081c2e",
    skyBottom: "#1d4e6e",
    groundColor: "#2c5364",
    groundTop: "#90e0ef",
    accentColor: "#caf0f8"
  },
  {
    id: 5,
    name: "World 5 – The Cursed Kingdom (Levels 10 – 13)",
    enemiesText: "Lv 10: Fire Hound • Lv 11: Shadow Mage • Lv 12: Cursed Knight • Lv 13: The Witch (Final Form)",
    theme: "cursed",
    isBossWorld: true,
    skyTop: "#1f050d",
    skyBottom: "#591124",
    groundColor: "#2b0918",
    groundTop: "#f77f00",
    accentColor: "#ffd152"
  }
];

const LEVELS_DATA = [
  {
    level: 1,
    world: 1,
    name: "The Beginning",
    subtitle: "Monster: Forest Slime (Lv 1 • ❤️❤️)",
    length: 2500,
    enemyTypes: ["slime"],
    enemyCount: 7,
    boss: { type: "slime", name: "FOREST SLIME", hp: 180, damage: 12, speed: 1.6, needsStone: false },
    introSpeaker: "THE KING",
    introDialogue: "A powerful witch has cursed our kingdom! Defeat the Forest Slimes and begin your quest!",
    clearNote: "You cleared Level 1 (Forest Slime) and advanced into the Forgotten Forest!"
  },
  {
    level: 2,
    world: 1,
    name: "Forest Monsters",
    subtitle: "Monster: Wild Wolf (Lv 2 • ❤️❤️❤️)",
    length: 2700,
    enemyTypes: ["slime", "wolf"],
    enemyCount: 9,
    boss: { type: "wolf", name: "WILD WOLF ALPHA", hp: 230, damage: 15, speed: 2.3, needsStone: false },
    introSpeaker: "THE WARRIOR",
    introDialogue: "Wild Wolves prowl the forest path. Watch their fast pounce!",
    clearNote: "You defeated the Wild Wolves! The Hidden Ruins await at Level 3."
  },
  {
    level: 3,
    world: 1,
    name: "The Hidden Ruins",
    subtitle: "Monster: Wood Golem (Lv 3 • ❤️❤️❤️❤️)",
    length: 2900,
    enemyTypes: ["wolf", "forest_guard"],
    enemyCount: 10,
    boss: { type: "forest_guard", name: "WOOD GOLEM", hp: 310, damage: 18, speed: 1.7, needsStone: false },
    introSpeaker: "WOOD GOLEM",
    introDialogue: "None shall pass the Hidden Ruins or claim the Ancient Stone!",
    clearNote: "You toppled the Wood Golem and recovered the dormant Ancient Stone!"
  },
  {
    level: 4,
    world: 2,
    name: "Underground Passage",
    subtitle: "Monster: Cave Bat (Lv 4 • ❤️❤️❤️)",
    length: 3000,
    enemyTypes: ["bat"],
    enemyCount: 11,
    boss: { type: "bat", name: "GIANT CAVE BAT", hp: 290, damage: 17, speed: 2.6, needsStone: false },
    introSpeaker: "THE WARRIOR",
    introDialogue: "The Dark Caves swarm with razor-fanged Cave Bats!",
    clearNote: "You cleared the Underground Passage and reached the Skeleton Fortress."
  },
  {
    level: 5,
    world: 2,
    name: "The Skeleton Fortress",
    subtitle: "Monster: Skeleton Warrior (Lv 5 • ❤️❤️❤️❤️)",
    length: 3200,
    enemyTypes: ["bat", "skeleton"],
    enemyCount: 11,
    boss: { type: "bone_captain", name: "SKELETON WARRIOR", hp: 360, damage: 20, speed: 2.1, needsStone: false },
    introSpeaker: "SKELETON WARRIOR",
    introDialogue: "My sword and shield guard this fortress for the Witch!",
    clearNote: "The Skeleton Warrior crumbled! Enter World 3: The Witch's Territory."
  },
  {
    level: 6,
    world: 3,
    name: "The Witch's Castle",
    subtitle: "Monster: The Witch (First Encounter • Lv 6 • ❤️❤️❤️❤️❤️)",
    length: 2800,
    enemyTypes: ["skeleton", "shadow_knight"],
    enemyCount: 8,
    boss: {
      type: "witch_encounter",
      name: "THE WITCH (FIRST ENCOUNTER)",
      hp: 440,
      damage: 23,
      speed: 2.6,
      needsStone: false,
      escapeThreshold: 0.35
    },
    introSpeaker: "THE WITCH",
    introDialogue: "Foolish warrior! Your stone is not yet awakened. Witness the true power of my curse!",
    clearNote: "At 35% health, the Witch unleashed her curse and escaped! Journey to the Frozen Mountains."
  },
  {
    level: 7,
    world: 4,
    name: "Frozen Valley",
    subtitle: "Monster: Ice Wolf (Lv 7 • ❤️❤️❤️❤️)",
    length: 3300,
    enemyTypes: ["ice_beast", "wolf"],
    enemyCount: 12,
    boss: { type: "wolf", name: "ICE WOLF PACKLEADER", hp: 400, damage: 22, speed: 2.5, needsStone: false },
    introSpeaker: "THE WARRIOR",
    introDialogue: "Ice Wolves stalk the Frozen Valley!",
    clearNote: "You survived the Frozen Valley and reached the Ice Monster's Cave."
  },
  {
    level: 8,
    world: 4,
    name: "Ice Monster's Cave",
    subtitle: "Monster: Ice Golem (Lv 8 • ❤️❤️❤️❤️❤️)",
    length: 3500,
    enemyTypes: ["ice_beast", "ice_golem"],
    enemyCount: 13,
    boss: { type: "ice_golem", name: "ICE GOLEM", hp: 460, damage: 24, speed: 1.8, needsStone: false },
    introSpeaker: "THE WARRIOR",
    introDialogue: "Towering Ice Golems block the glacial cavern!",
    clearNote: "You shattered the Ice Golem! Next: The Mountain Guardian at Level 9."
  },
  {
    level: 9,
    world: 4,
    name: "The Mountain Guardian",
    subtitle: "Monster: Frost Guardian (Lv 9 • ❤️❤️❤️❤️❤️❤️)",
    length: 3600,
    enemyTypes: ["ice_beast", "ice_golem"],
    enemyCount: 12,
    boss: { type: "mountain_guardian", name: "FROST GUARDIAN", hp: 540, damage: 26, speed: 2.0, needsStone: false },
    introSpeaker: "FROST GUARDIAN",
    introDialogue: "Withstand my Ice Smash, Freeze Wave, and Ground Stomp to awaken the Ancient Stone!",
    clearNote: "Frost Guardian defeated! The Ancient Stone is now fully AWAKENED!"
  },
  {
    level: 10,
    world: 5,
    name: "The Burning Lands",
    subtitle: "Monster: Fire Hound (Lv 10 • ❤️❤️❤️❤️❤️)",
    length: 3700,
    enemyTypes: ["wolf", "shadow_knight"],
    enemyCount: 14,
    boss: { type: "wolf", name: "FIRE HOUND", hp: 520, damage: 27, speed: 2.6, needsStone: false },
    introSpeaker: "THE WARRIOR",
    introDialogue: "Blazing Fire Hounds prowl the Burning Lands of the Cursed Kingdom!",
    clearNote: "You defeated the Fire Hounds and reached the Shadow Temple."
  },
  {
    level: 11,
    world: 5,
    name: "The Shadow Temple",
    subtitle: "Monster: Shadow Mage (Lv 11 • ❤️❤️❤️❤️❤️)",
    length: 3900,
    enemyTypes: ["shadow_knight", "bat"],
    enemyCount: 15,
    boss: { type: "shadow_knight", name: "SHADOW MAGE", hp: 580, damage: 28, speed: 2.3, needsStone: false },
    introSpeaker: "SHADOW MAGE",
    introDialogue: "Our dark spells guard the Witch's sanctum!",
    clearNote: "The Shadow Mage has fallen! Only the Final Guardian stands before the Witch."
  },
  {
    level: 12,
    world: 5,
    name: "The Final Guardian",
    subtitle: "Monster: Cursed Knight (Lv 12 • ❤️❤️❤️❤️❤️❤️)",
    length: 4000,
    enemyTypes: ["shadow_knight", "skeleton"],
    enemyCount: 15,
    boss: { type: "final_guardian", name: "CURSED KNIGHT", hp: 650, damage: 30, speed: 2.4, needsStone: false },
    introSpeaker: "CURSED KNIGHT",
    introDialogue: "My magma-forged armor will crush you before the throne room!",
    clearNote: "Cursed Knight defeated! Prepare for Level 13: The Witch's Final Battle!"
  },
  {
    level: 13,
    world: 5,
    name: "The Witch's Final Battle",
    subtitle: "Monster: The Witch (Final Form • Lv 13 • ❤️❤️❤️❤️❤️❤️❤️)",
    length: 3200,
    enemyTypes: ["shadow_knight", "bat"],
    enemyCount: 8,
    boss: {
      type: "witch_final",
      name: "THE WITCH (FINAL FORM)",
      hp: 780,
      damage: 32,
      speed: 2.9,
      needsStone: true
    },
    introSpeaker: "THE WITCH (FINAL FORM)",
    introDialogue: "Behold my winged Final Form! Press [U] / STONE to shatter my Curse Barrier!",
    clearNote: "With the power of the Ancient Stone, the witch's curse is broken, and peace returns to the kingdom!"
  }
];

const UPGRADES_DATA = [
  { id: "sword", name: "ROYAL GREATSWORD", desc: "Increases sword attack and combo damage (+25% per tier).", baseCost: 35, maxLevel: 5 },
  { id: "armor", name: "PALADIN PLATE ARMOR", desc: "Increases maximum Warrior HP (+25 HP per tier) and shield reduction.", baseCost: 30, maxLevel: 5 },
  { id: "stone", name: "ANCIENT STONE RESONANCE", desc: "Increases Ancient Stone shockwave damage & recharge speed.", baseCost: 40, maxLevel: 5 },
  { id: "boots", name: "WINGED GREAVES", desc: "Enhances movement agility, jump height, and air control.", baseCost: 25, maxLevel: 5 }
];

const SAVE_STORAGE_KEY = "cursed_kingdom_save_v1";

function getDefaultSaveData() {
  return {
    unlockedLevel: 1,
    coins: 230,
    stars: {},
    upgrades: { sword: 1, armor: 1, stone: 1, boots: 1 },
    settings: { sfx: true, touch: true, crt: true }
  };
}

const SaveSystem = {
  data: getDefaultSaveData(),
  load() {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = Object.assign(getDefaultSaveData(), parsed);
      }
    } catch (e) {
      this.data = getDefaultSaveData();
    }
    return this.data;
  },
  save() {
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {}
  },
  reset() {
    this.data = getDefaultSaveData();
    this.save();
  },
  unlockAll() {
    this.data.unlockedLevel = 13;
    this.data.coins = Math.max(this.data.coins, 500);
    this.save();
  },
  getTotalStars() {
    return Object.values(this.data.stars).reduce((acc, s) => acc + (s || 0), 0);
  },
  recordLevelWin(levelNum, earnedStars, coinsCollected) {
    this.data.coins += coinsCollected;
    const prevStars = this.data.stars[levelNum] || 0;
    if (earnedStars > prevStars) this.data.stars[levelNum] = earnedStars;
    if (levelNum >= this.data.unlockedLevel && levelNum < 13) {
      this.data.unlockedLevel = levelNum + 1;
    }
    this.save();
  }
};

SaveSystem.load();
