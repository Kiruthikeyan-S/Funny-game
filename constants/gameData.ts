// ============================================================================
// THE CURSED KINGDOM — EXPO MOBILE DATA (5 WORLDS, 13 LEVELS, STORY, UPGRADES)
// ============================================================================

export interface StorySlide {
  title: string;
  speaker: string;
  text: string;
  icon: string;
}

export interface WorldInfo {
  id: number;
  name: string;
  enemiesText: string;
  bgTop: string;
  bgBottom: string;
  groundColor: string;
  groundTop: string;
  accent: string;
  isBossWorld?: boolean;
}

export interface BossData {
  type: string;
  name: string;
  hp: number;
  damage: number;
  speed: number;
  needsStone: boolean;
  escapeThreshold?: number;
}

export interface LevelInfo {
  level: number;
  world: number;
  name: string;
  subtitle: string;
  length: number;
  enemyTypes: string[];
  enemyCount: number;
  boss: BossData | null;
  introSpeaker: string;
  introDialogue: string;
  clearNote: string;
}

export const STORY_SLIDES: StorySlide[] = [
  {
    title: 'CHAPTER I: THE PEACEFUL REALM FALLS',
    speaker: 'KING ALDRIC',
    icon: '👑',
    text: 'For centuries our kingdom prospered in peace—until the Dark Witch Morgana descended upon the royal castle and cast a dreadful shadow curse over the land.'
  },
  {
    title: 'CHAPTER II: THE ANCIENT MAGICAL STONE',
    speaker: 'KING ALDRIC',
    icon: '💎',
    text: 'In the royal archives, I uncovered our last hope: the Ancient Magical Stone. Only its crimson flame can shatter the Witch’s barrier and save our kingdom.'
  },
  {
    title: 'CHAPTER III: THE WARRIOR’S OATH',
    speaker: 'SIR KAEL (THE WARRIOR)',
    icon: '⚔️',
    text: 'By my sword and shield, Your Majesty, I will cross the Forgotten Forest, Dark Caves, and Frozen Mountains to awaken the Stone and defeat the Witch!'
  },
  {
    title: 'CHAPTER IV: THE 13 REALM TRIALS',
    speaker: 'ROYAL CHRONICLER',
    icon: '🧙‍♀️',
    text: 'At Level 6 you will face the Witch in her castle and witness her curse—only by awakening the Ancient Stone’s full power can you triumph at Level 13!'
  }
];

export const WORLDS_DATA: WorldInfo[] = [
  {
    id: 1,
    name: 'World 1 – The Forgotten Forest',
    enemiesText: 'Slimes, Forest Wolves & Moss Guards',
    bgTop: '#0d1f22',
    bgBottom: '#1f4e3d',
    groundColor: '#2d6a4f',
    groundTop: '#52b788',
    accent: '#95d5b2'
  },
  {
    id: 2,
    name: 'World 2 – The Dark Caves',
    enemiesText: 'Skeletons, Cave Bats & Bone Captain',
    bgTop: '#090814',
    bgBottom: '#1f1938',
    groundColor: '#2b2540',
    groundTop: '#5e548e',
    accent: '#9f86c0'
  },
  {
    id: 3,
    name: "World 3 – The Witch's Territory",
    enemiesText: 'Major Story Encounter – The Witch Morgana',
    bgTop: '#1a0626',
    bgBottom: '#480ca8',
    groundColor: '#240046',
    groundTop: '#9d4edd',
    accent: '#f72585',
    isBossWorld: true
  },
  {
    id: 4,
    name: 'World 4 – The Frozen Mountains',
    enemiesText: 'Ice Beasts, Frost Golems & Mountain Guardian',
    bgTop: '#081c2e',
    bgBottom: '#1d4e6e',
    groundColor: '#2c5364',
    groundTop: '#90e0ef',
    accent: '#caf0f8'
  },
  {
    id: 5,
    name: 'World 5 – The Cursed Kingdom',
    enemiesText: 'Shadow Knights, Guardians & The Witch (Final Boss)',
    bgTop: '#1f050d',
    bgBottom: '#4a0e2e',
    groundColor: '#2b0918',
    groundTop: '#e63946',
    accent: '#ffd152',
    isBossWorld: true
  }
];

export const LEVELS_DATA: LevelInfo[] = [
  {
    level: 1,
    world: 1,
    name: 'The Beginning',
    subtitle: 'King Aldric sends you into the Whispering Woods',
    length: 1800,
    enemyTypes: ['slime', 'slime', 'wolf'],
    enemyCount: 6,
    boss: null,
    introSpeaker: 'KING ALDRIC',
    introDialogue: 'Go forth, brave Warrior! Clear the Forgotten Forest and seek the Ancient Stone.',
    clearNote: 'You broke through the forest perimeter and found tracks leading deeper into the woods.'
  },
  {
    level: 2,
    world: 1,
    name: 'Forest Monsters',
    subtitle: 'Feral wolves and cursed slimes guard the bridge',
    length: 2000,
    enemyTypes: ['slime', 'wolf', 'wolf'],
    enemyCount: 8,
    boss: null,
    introSpeaker: 'SIR KAEL',
    introDialogue: "The Witch's curse has driven the forest beasts mad. Stay sharp!",
    clearNote: 'The feral pack has been driven back. The Hidden Ruins lie ahead.'
  },
  {
    level: 3,
    world: 1,
    name: 'The Hidden Ruins',
    subtitle: 'Recover the dormant Ancient Stone from the shrine',
    length: 2200,
    enemyTypes: ['slime', 'wolf', 'forest_guard'],
    enemyCount: 9,
    boss: null,
    introSpeaker: 'ANCIENT SHRINE',
    introDialogue: 'You found the dormant Ancient Stone! Tap STONE when full to unleash its shockwave.',
    clearNote: 'You recovered the Ancient Stone! Next: descend into the Dark Caves.'
  },
  {
    level: 4,
    world: 2,
    name: 'Underground Passage',
    subtitle: 'Echoing caverns swarming with bats and skeletons',
    length: 2200,
    enemyTypes: ['bat', 'skeleton', 'slime'],
    enemyCount: 10,
    boss: null,
    introSpeaker: 'SIR KAEL',
    introDialogue: 'The caverns are crawling with undead skeletons and cave bats!',
    clearNote: 'You crossed the Underground Passage and reached the Skeleton Fortress.'
  },
  {
    level: 5,
    world: 2,
    name: 'The Skeleton Fortress',
    subtitle: 'Defeat Bone Captain Vorg guarding the castle path',
    length: 2400,
    enemyTypes: ['skeleton', 'bat'],
    enemyCount: 9,
    boss: {
      type: 'bone_captain',
      name: 'BONE CAPTAIN VORG',
      hp: 240,
      damage: 16,
      speed: 2.2,
      needsStone: false
    },
    introSpeaker: 'BONE CAPTAIN VORG',
    introDialogue: 'No mortal leaves the Skeleton Fortress alive!',
    clearNote: "Bone Captain Vorg crumbled to dust! The Witch's Castle awaits at Level 6."
  },
  {
    level: 6,
    world: 3,
    name: "The Witch's Castle",
    subtitle: 'Major Story Encounter — Face the Witch Morgana!',
    length: 2100,
    enemyTypes: ['skeleton', 'shadow_knight'],
    enemyCount: 6,
    boss: {
      type: 'witch_encounter',
      name: 'THE WITCH MORGANA (CURSE REVEALED)',
      hp: 380,
      damage: 20,
      speed: 2.6,
      needsStone: false,
      escapeThreshold: 0.35
    },
    introSpeaker: 'THE WITCH MORGANA',
    introDialogue: 'Foolish warrior! That stone is still half-asleep. Witness the true power of my Dark Curse!',
    clearNote: 'At 35% HP, the Witch unleashed her overwhelming curse and escaped! Journey to the Frozen Mountains to awaken the Stone.'
  },
  {
    level: 7,
    world: 4,
    name: 'Frozen Valley',
    subtitle: 'Blinding blizzards and ferocious ice beasts',
    length: 2400,
    enemyTypes: ['ice_beast', 'wolf'],
    enemyCount: 10,
    boss: null,
    introSpeaker: 'SIR KAEL',
    introDialogue: 'I must climb the Frozen Mountains to awaken the Ancient Stone’s full power!',
    clearNote: "You survived the Frozen Valley and reached the Ice Monster's Cave."
  },
  {
    level: 8,
    world: 4,
    name: "Ice Monster's Cave",
    subtitle: 'Glacial caverns guarded by frost golems',
    length: 2500,
    enemyTypes: ['ice_beast', 'ice_golem'],
    enemyCount: 11,
    boss: null,
    introSpeaker: 'SIR KAEL',
    introDialogue: 'The Ancient Stone is resonating with the glacial crystals!',
    clearNote: 'Only the Mountain Guardian stands between you and the summit shrine.'
  },
  {
    level: 9,
    world: 4,
    name: 'The Mountain Guardian',
    subtitle: 'Defeat Frost Titan Ymir to awaken the Ancient Stone',
    length: 2600,
    enemyTypes: ['ice_beast', 'ice_golem'],
    enemyCount: 9,
    boss: {
      type: 'mountain_guardian',
      name: 'FROST TITAN YMIR',
      hp: 420,
      damage: 22,
      speed: 2.1,
      needsStone: false
    },
    introSpeaker: 'FROST TITAN YMIR',
    introDialogue: 'Prove your valor against the Guardian of the Frozen Peaks!',
    clearNote: 'The Ancient Stone is now fully AWAKENED with crimson flame!'
  },
  {
    level: 10,
    world: 5,
    name: 'The Burning Lands',
    subtitle: 'Return to the scorched outskirts of the Cursed Kingdom',
    length: 2600,
    enemyTypes: ['shadow_knight', 'bat'],
    enemyCount: 12,
    boss: null,
    introSpeaker: 'KING ALDRIC',
    introDialogue: 'You return with the awakened Stone! Hurry, Kael—save the capital!',
    clearNote: 'You crossed the Burning Lands and breached the Shadow Temple.'
  },
  {
    level: 11,
    world: 5,
    name: 'The Shadow Temple',
    subtitle: "Fight through the Witch's elite Shadow Knights",
    length: 2700,
    enemyTypes: ['shadow_knight', 'ice_golem'],
    enemyCount: 13,
    boss: null,
    introSpeaker: 'SIR KAEL',
    introDialogue: 'With the awakened Stone Power, no shadow creature can stop me!',
    clearNote: 'The Shadow Temple seals are broken! The Royal Citadel inner sanctum awaits.'
  },
  {
    level: 12,
    world: 5,
    name: 'The Final Guardian',
    subtitle: 'Vanquish Dread Arch-Knight Malak before the Throne Room',
    length: 2800,
    enemyTypes: ['shadow_knight', 'skeleton'],
    enemyCount: 11,
    boss: {
      type: 'final_guardian',
      name: 'DREAD ARCH-KNIGHT MALAK',
      hp: 520,
      damage: 25,
      speed: 2.5,
      needsStone: false
    },
    introSpeaker: 'DREAD ARCH-KNIGHT MALAK',
    introDialogue: "I am the Witch's final shield! None shall enter the cursed throne room!",
    clearNote: 'The Final Guardian has fallen! Prepare for Level 13: The Witch’s Final Battle!'
  },
  {
    level: 13,
    world: 5,
    name: "The Witch's Final Battle",
    subtitle: "FINAL BOSS — Use the Ancient Stone to shatter the Witch's Curse!",
    length: 2300,
    enemyTypes: ['shadow_knight', 'bat'],
    enemyCount: 6,
    boss: {
      type: 'witch_final',
      name: 'HIGH WITCH MORGANA, CURSE OF THE REALM',
      hp: 680,
      damage: 28,
      speed: 2.9,
      needsStone: true
    },
    introSpeaker: 'THE WITCH MORGANA',
    introDialogue: 'My Curse Barrier makes me invincible to mere steel! Wait... is that the Awakened Ancient Stone?!',
    clearNote: 'THE WITCH IS DEFEATED! The Ancient Stone shattered her dark curse and saved the Kingdom!'
  }
];

export const UPGRADES_DATA = [
  {
    id: 'sword',
    name: 'ROYAL GREATSWORD',
    desc: '+25% Sword Combo Attack Damage per tier',
    baseCost: 35,
    maxLevel: 5
  },
  {
    id: 'armor',
    name: 'PALADIN PLATE ARMOR',
    desc: '+25 Max Warrior HP & stronger Shield Block',
    baseCost: 30,
    maxLevel: 5
  },
  {
    id: 'stone',
    name: 'ANCIENT STONE RESONANCE',
    desc: 'Stronger Stone Shockwave & faster recharge',
    baseCost: 40,
    maxLevel: 5
  },
  {
    id: 'boots',
    name: 'WINGED GREAVES',
    desc: 'Faster Warrior movement & higher Jump',
    baseCost: 25,
    maxLevel: 5
  }
] as const;
