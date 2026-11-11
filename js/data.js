// ============================================================================
// THE CURSED KINGDOM — GAME DATA, 5 WORLDS, 13 LEVELS, STORY & SAVE SYSTEM
// ============================================================================

const STORY_SLIDES = [
  {
    title: "CHAPTER I: THE PEACEFUL REALM FALLS",
    speaker: "THE KING ALDRIC",
    scene: "castle_curse",
    text: "For centuries our kingdom prospered in golden peace—until the Dark Witch Morgana descended upon the royal castle and cast a dreadful shadow curse over the entire land."
  },
  {
    title: "CHAPTER II: THE ANCIENT MAGICAL STONE",
    speaker: "THE KING ALDRIC",
    scene: "king_throne",
    text: "In the royal archives, I uncovered our last hope: the Ancient Magical Stone. Only its crimson flame can shatter the Witch's barrier and restore our kingdom."
  },
  {
    title: "CHAPTER III: THE WARRIOR'S OATH",
    speaker: "SIR KAEL (THE WARRIOR)",
    scene: "warrior_journey",
    text: "By my sword and shield, Your Majesty, I will cross the Forgotten Forest, the Dark Caves, and the Frozen Mountains to awaken the Stone and defeat the Witch!"
  },
  {
    title: "CHAPTER IV: THE TRIAL OF 13 REALMS",
    speaker: "THE ROYAL CHRONICLER",
    scene: "witch_encounter",
    text: "At Level 6 you will face the Witch in her fortress and witness the true terror of her curse—only by awakening the Ancient Stone's full power can you triumph at Level 13!"
  }
];

const WORLDS_DATA = [
  {
    id: 1,
    name: "World 1 – The Forgotten Forest",
    enemiesText: "Enemies: Slimes, Forest Wolves & Moss Creeps",
    theme: "forest",
    skyTop: "#0d1f22",
    skyBottom: "#1f4e3d",
    groundColor: "#2d6a4f",
    groundTop: "#52b788",
    accentColor: "#95d5b2"
  },
  {
    id: 2,
    name: "World 2 – The Dark Caves",
    enemiesText: "Enemies: Skeletons, Cave Bats & Bone Captain",
    theme: "cave",
    skyTop: "#090814",
    skyBottom: "#1f1938",
    groundColor: "#2b2540",
    groundTop: "#5e548e",
    accentColor: "#9f86c0"
  },
  {
    id: 3,
    name: "World 3 – The Witch's Territory",
    enemiesText: "Major Story Encounter – The Witch Morgana",
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
    name: "World 4 – The Frozen Mountains",
    enemiesText: "Enemies: Ice Beasts, Frost Wolves & Mountain Guardian",
    theme: "ice",
    skyTop: "#081c2e",
    skyBottom: "#1d4e6e",
    groundColor: "#2c5364",
    groundTop: "#90e0ef",
    accentColor: "#caf0f8"
  },
  {
    id: 5,
    name: "World 5 – The Cursed Kingdom",
    enemiesText: "Enemies: Shadow Knights, Guardians & The Witch (Final Boss)",
    theme: "cursed",
     isBossWorld: true,
    skyTop: "#1f050d",
    skyBottom: "#4a0e2e",
    groundColor: "#2b0918",
    groundTop: "#e63946",
    accentColor: "#ffd152"
  }
];

const LEVELS_DATA = [
  // WORLD 1: THE FORGOTTEN FOREST (Levels 1-3)
  {
    level: 1,
    world: 1,
    name: "The Beginning",
    subtitle: "King Aldric sends you into the Whispering Woods",
    length: 2600,
    enemyTypes: ["slime", "slime", "wolf"],
    enemyCount: 7,
    boss: null,
    introSpeaker: "THE KING ALDRIC",
    introDialogue: "Go forth, brave Warrior! Clear the Forgotten Forest and seek the trail of the Ancient Stone.",
    clearNote: "You broke through the forest perimeter and found tracks leading deeper into the woods."
  },
  {
    level: 2,
    world: 1,
    name: "Forest Monsters",
    subtitle: "Feral wolves and cursed slimes block the ancient bridge",
    length: 2900,
    enemyTypes: ["slime", "wolf", "wolf"],
    enemyCount: 10,
    boss: null,
    introSpeaker: "SIR KAEL",
    introDialogue: "The Witch's curse has driven the forest beasts mad. My blade must stay sharp!",
    clearNote: "The feral pack has been driven back. The Hidden Ruins lie just ahead."
  },
  {
    level: 3,
    world: 1,
    name: "The Hidden Ruins",
    subtitle: "Recover the dormant Ancient Stone from the Moss Shrine",
    length: 3200,
    enemyTypes: ["slime", "wolf", "forest_guard"],
    enemyCount: 12,
    boss: null,
    introSpeaker: "ANCIENT INSCRIPTION",
    introDialogue: "Within these ruins rests the dormant Ancient Stone. Press [U] or tap STONE to unleash its pulse!",
    clearNote: "You recovered the dormant Ancient Stone! Its inner ember flickers as you descend into the Dark Caves."
  },

  // WORLD 2: THE DARK CAVES (Levels 4-5)
  {
    level: 4,
    world: 2,
    name: "Underground Passage",
    subtitle: "Echoing caverns swarming with bats and risen skeletons",
    length: 3300,
    enemyTypes: ["bat", "skeleton", "slime"],
    enemyCount: 13,
    boss: null,
    introSpeaker: "SIR KAEL",
    introDialogue: "The caverns are crawling with undead skeletons and cave bats. Watch the ceiling and ledges!",
    clearNote: "You navigated the crystal abyss and reached the gates of the Skeleton Fortress."
  },
  {
    level: 5,
    world: 2,
    name: "The Skeleton Fortress",
    subtitle: "Defeat the Bone Captain guarding the castle ascent",
    length: 3500,
    enemyTypes: ["skeleton", "bat", "skeleton"],
    enemyCount: 12,
    boss: {
      type: "bone_captain",
      name: "BONE CAPTAIN VORG",
      hp: 260,
      damage: 18,
      speed: 2.2,
      needsStone: false
    },
    introSpeaker: "BONE CAPTAIN VORG",
    introDialogue: "No mortal passes the Skeleton Fortress alive! The Witch commands your doom!",
    clearNote: "Bone Captain Vorg crumbled to dust! The path to the Witch's Castle now stands open."
  },

  // WORLD 3: THE WITCH'S TERRITORY (Level 6 - Major Story Encounter)
  {
    level: 6,
    world: 3,
    name: "The Witch's Castle",
    subtitle: "Major Story Encounter — Face the Witch Morgana!",
    length: 2800,
    enemyTypes: ["skeleton", "bat", "shadow_knight"],
    enemyCount: 8,
    boss: {
      type: "witch_encounter",
      name: "THE WITCH MORGANA (CURSE REVEALED)",
      hp: 420,
      damage: 22,
      speed: 2.7,
      needsStone: false,
      escapeThreshold: 0.35
    },
    introSpeaker: "THE WITCH MORGANA",
    introDialogue: "Foolish warrior! That stone is still half-asleep. Witness the true power of my Dark Curse!",
    clearNote: "STORY ENCOUNTER: At 35% health, the Witch unleashed her overwhelming curse and escaped! You must journey through the Frozen Mountains to awaken the Stone's true power."
  },

  // WORLD 4: THE FROZEN MOUNTAINS (Levels 7-9)
  {
    level: 7,
    world: 4,
    name: "Frozen Valley",
    subtitle: "Blinding blizzards and ferocious ice beasts",
    length: 3500,
    enemyTypes: ["ice_beast", "wolf", "bat"],
    enemyCount: 14,
    boss: null,
    introSpeaker: "SIR KAEL",
    introDialogue: "The Witch's dark blast threw me to the Frozen Valley. I must climb the peaks to temper the Ancient Stone!",
    clearNote: "You survived the freezing winds and found the entrance to the Ice Monster's Cave."
  },
  {
    level: 8,
    world: 4,
    name: "Ice Monster's Cave",
    subtitle: "Glacial caverns guarded by hulking frost beasts",
    length: 3700,
    enemyTypes: ["ice_beast", "skeleton", "ice_golem"],
    enemyCount: 15,
    boss: null,
    introSpeaker: "SIR KAEL",
    introDialogue: "The Ancient Stone is resonating with the glacial crystals—my strength is growing!",
    clearNote: "The glacial caverns are clear. Only the Mountain Guardian blocks the summit shrine!"
  },
  {
    level: 9,
    world: 4,
    name: "The Mountain Guardian",
    subtitle: "Defeat the colossal Frost Guardian to awaken the Stone",
    length: 3800,
    enemyTypes: ["ice_beast", "ice_golem"],
    enemyCount: 12,
    boss: {
      type: "mountain_guardian",
      name: "FROST TITAN YMIR",
      hp: 460,
      damage: 24,
      speed: 2.0,
      needsStone: false
    },
    introSpeaker: "FROST TITAN YMIR",
    introDialogue: "To awaken the Ancient Stone, prove your valor against the Guardian of the Frozen Peaks!",
    clearNote: "Frost Titan Ymir salutes your strength! The Ancient Stone now blazes with crimson fire!"
  },

  // WORLD 5: THE CURSED KINGDOM (Levels 10-13)
  {
    level: 10,
    world: 5,
    name: "The Burning Lands",
    subtitle: "Return to the scorched outskirts of the Cursed Kingdom",
    length: 3900,
    enemyTypes: ["shadow_knight", "bat", "skeleton"],
    enemyCount: 16,
    boss: null,
    introSpeaker: "THE KING ALDRIC (SPIRIT MESSAGE)",
    introDialogue: "You return with the awakened Stone! Hurry, Kael—the Witch's curse is consuming the capital!",
    clearNote: "You crossed the Burning Lands and breached the outer walls of the Shadow Temple."
  },
  {
    level: 11,
    world: 5,
    name: "The Shadow Temple",
    subtitle: "Fight through the Witch's elite Shadow Knights",
    length: 4100,
    enemyTypes: ["shadow_knight", "ice_golem", "bat"],
    enemyCount: 18,
    boss: null,
    introSpeaker: "SIR KAEL",
    introDialogue: "With the awakened Stone Power [U], no shadow creature can stand in my path!",
    clearNote: "The Shadow Temple seals are broken! The Royal Citadel inner sanctum awaits."
  },
  {
    level: 12,
    world: 5,
    name: "The Final Guardian",
    subtitle: "Vanquish the Dread Arch-Knight before the Throne Room",
    length: 4200,
    enemyTypes: ["shadow_knight", "skeleton", "ice_golem"],
    enemyCount: 15,
    boss: {
      type: "final_guardian",
      name: "DREAD ARCH-KNIGHT MALAK",
      hp: 580,
      damage: 28,
      speed: 2.6,
      needsStone: false
    },
    introSpeaker: "DREAD ARCH-KNIGHT MALAK",
    introDialogue: "I am the Witch's final shield! None shall enter the cursed throne room!",
    clearNote: "The Final Guardian has fallen! The throne room doors swing open for the final battle!"
  },
  {
    level: 13,
    world: 5,
    name: "The Witch's Final Battle",
    subtitle: "FINAL BOSS — Use the Ancient Stone to shatter the Witch's Curse!",
    length: 3200,
    enemyTypes: ["shadow_knight", "bat"],
    enemyCount: 8,
    boss: {
      type: "witch_final",
      name: "HIGH WITCH MORGANA, CURSE OF THE REALM",
      hp: 750,
      damage: 30,
      speed: 3.0,
      needsStone: true
    },
    introSpeaker: "THE WITCH MORGANA",
    introDialogue: "You dare return?! My Curse Barrier makes me invincible to mere steel! Wait... is that the Awakened Ancient Stone?!",
    clearNote: "THE WITCH IS DEFEATED! The Ancient Stone shattered her dark curse and restored the entire Kingdom!"
  }
];

const UPGRADES_DATA = [
  {
    id: "sword",
    name: "ROYAL GREATSWORD",
    desc: "Increases sword attack and combo damage (+25% per tier).",
    baseCost: 35,
    maxLevel: 5
  },
  {
    id: "armor",
    name: "PALADIN PLATE ARMOR",
    desc: "Increases maximum Warrior HP (+25 HP per tier) and shield reduction.",
    baseCost: 30,
    maxLevel: 5
  },
  {
    id: "stone",
    name: "ANCIENT STONE RESONANCE",
    desc: "Increases Ancient Stone shockwave damage & recharge speed.",
    baseCost: 40,
    maxLevel: 5
  },
  {
    id: "boots",
    name: "WINGED GREAVES",
    desc: "Enhances movement agility, jump height, and air control.",
    baseCost: 25,
    maxLevel: 5
  }
];

const SAVE_STORAGE_KEY = "cursed_kingdom_save_v1";

function getDefaultSaveData() {
  return {
    unlockedLevel: 1,
    coins: 50,
    stars: {}, // { 1: 3, 2: 2, ... }
    upgrades: {
      sword: 1,
      armor: 1,
      stone: 1,
      boots: 1
    },
    settings: {
      sfx: true,
      touch: true,
      crt: true
    }
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
        this.data.upgrades = Object.assign(getDefaultSaveData().upgrades, parsed.upgrades || {});
        this.data.settings = Object.assign(getDefaultSaveData().settings, parsed.settings || {});
      }
    } catch (e) {
      this.data = getDefaultSaveData();
    }
    return this.data;
  },

  save() {
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      // ignore storage quota errors
    }
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
    if (earnedStars > prevStars) {
      this.data.stars[levelNum] = earnedStars;
    }
    if (levelNum >= this.data.unlockedLevel && levelNum < 13) {
      this.data.unlockedLevel = levelNum + 1;
    }
    this.save();
  }
};

SaveSystem.load();
