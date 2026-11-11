// ============================================================================
// THE CURSED KINGDOM — COMPLETE 13-LEVEL & 13-MONSTER PLAN (MATCHING UI DESIGN)
// ============================================================================

export type MonsterId =
  | 'forest_slime'
  | 'wild_wolf'
  | 'wood_golem'
  | 'cave_bat'
  | 'skeleton_warrior'
  | 'witch_encounter'
  | 'ice_wolf'
  | 'ice_golem'
  | 'frost_guardian'
  | 'fire_hound'
  | 'shadow_mage'
  | 'cursed_knight'
  | 'witch_final';

export interface MonsterAbility {
  name: string;
  icon: string;
  color: string;
}

export interface MonsterConfig {
  id: MonsterId;
  name: string;
  level: number;
  world: number;
  hearts: number;
  health: number;
  attack: number;
  defense: number;
  speedLabel: 'Slow' | 'Medium' | 'Fast' | 'Very Fast';
  moveSpeed: number;
  scale: number;
  isBoss: boolean;
  needsStone?: boolean;
  escapeThreshold?: number;
  themeColor: string;
  abilities: [MonsterAbility, MonsterAbility, MonsterAbility];
}

export interface WorldInfo {
  id: number;
  name: string;
  shortName: string;
  levelRange: string;
  badgeIcon: string;
  bgTop: string;
  bgBottom: string;
  groundColor: string;
  groundTop: string;
  accent: string;
  cardBorder: string;
}

export interface LevelInfo {
  level: number;
  world: number;
  name: string;
  subtitle: string;
  length: number;
  monsterId: MonsterId;
  minionId: MonsterId;
  minionCount: number;
  gemsInLevel: number;
  introSpeaker: string;
  introDialogue: string;
  clearNote: string;
}

export const WORLDS_DATA: WorldInfo[] = [
  {
    id: 1,
    name: 'World 1 – The Forgotten Forest',
    shortName: 'The Forgotten Forest',
    levelRange: '( Lv 1 - 3 )',
    badgeIcon: '🌿',
    bgTop: '#0d2622',
    bgBottom: '#1c4c3b',
    groundColor: '#2b4c3f',
    groundTop: '#52b788',
    accent: '#74c69d',
    cardBorder: '#ffd152',
  },
  {
    id: 2,
    name: 'World 2 – The Dark Caves',
    shortName: 'The Dark Caves',
    levelRange: '( Lv 4 - 5 )',
    badgeIcon: '💎',
    bgTop: '#091326',
    bgBottom: '#162f59',
    groundColor: '#1d2d44',
    groundTop: '#4895ef',
    accent: '#4cc9f0',
    cardBorder: '#4895ef',
  },
  {
    id: 3,
    name: "World 3 – The Witch's Territory",
    shortName: "The Witch's Territory",
    levelRange: '( Lv 6 )',
    badgeIcon: '🧙‍♀️',
    bgTop: '#1d092b',
    bgBottom: '#480ca8',
    groundColor: '#240046',
    groundTop: '#b5179e',
    accent: '#f72585',
    cardBorder: '#b5179e',
  },
  {
    id: 4,
    name: 'World 4 – The Frozen Mountains',
    shortName: 'The Frozen Mountains',
    levelRange: '( Lv 7 - 9 )',
    badgeIcon: '❄️',
    bgTop: '#08203e',
    bgBottom: '#1d5c96',
    groundColor: '#1b3b5c',
    groundTop: '#90e0ef',
    accent: '#caf0f8',
    cardBorder: '#00b4d8',
  },
  {
    id: 5,
    name: 'World 5 – The Cursed Kingdom',
    shortName: 'The Cursed Kingdom',
    levelRange: '( Lv 10 - 13 )',
    badgeIcon: '🔥',
    bgTop: '#24070d',
    bgBottom: '#591124',
    groundColor: '#2b0912',
    groundTop: '#f77f00',
    accent: '#fcbf49',
    cardBorder: '#f77f00',
  },
];

export const MONSTERS_DATA: Record<MonsterId, MonsterConfig> = {
  forest_slime: {
    id: 'forest_slime',
    name: 'Forest Slime',
    level: 1,
    world: 1,
    hearts: 2,
    health: 400,
    attack: 65,
    defense: 30,
    speedLabel: 'Slow',
    moveSpeed: 1.3,
    scale: 1.0,
    isBoss: false,
    themeColor: '#52b788',
    abilities: [
      { name: 'Slime Bounce', icon: '🟢', color: '#52b788' },
      { name: 'Acid Splash', icon: '💧', color: '#74c69d' },
      { name: 'Gel Split', icon: '✨', color: '#95d5b2' },
    ],
  },
  wild_wolf: {
    id: 'wild_wolf',
    name: 'Wild Wolf',
    level: 2,
    world: 1,
    hearts: 3,
    health: 750,
    attack: 110,
    defense: 55,
    speedLabel: 'Fast',
    moveSpeed: 2.3,
    scale: 1.05,
    isBoss: false,
    themeColor: '#adb5bd',
    abilities: [
      { name: 'Feral Pounce', icon: '🐾', color: '#ced4da' },
      { name: 'Savage Bite', icon: '🦷', color: '#e63946' },
      { name: 'Pack Howl', icon: '🌙', color: '#ffd152' },
    ],
  },
  wood_golem: {
    id: 'wood_golem',
    name: 'Wood Golem',
    level: 3,
    world: 1,
    hearts: 4,
    health: 1200,
    attack: 150,
    defense: 110,
    speedLabel: 'Slow',
    moveSpeed: 1.4,
    scale: 1.35,
    isBoss: true,
    themeColor: '#7f4f24',
    abilities: [
      { name: 'Root Smash', icon: '🌿', color: '#52b788' },
      { name: 'Bark Shield', icon: '🛡️', color: '#a68a64' },
      { name: 'Boulder Toss', icon: '🪨', color: '#d4a338' },
    ],
  },
  cave_bat: {
    id: 'cave_bat',
    name: 'Cave Bat',
    level: 4,
    world: 2,
    hearts: 3,
    health: 950,
    attack: 140,
    defense: 60,
    speedLabel: 'Very Fast',
    moveSpeed: 2.6,
    scale: 1.0,
    isBoss: false,
    themeColor: '#9d4edd',
    abilities: [
      { name: 'Sonic Screech', icon: '🦇', color: '#c77dff' },
      { name: 'Fang Dive', icon: '🩸', color: '#e63946' },
      { name: 'Echo Wing', icon: '🌀', color: '#4895ef' },
    ],
  },
  skeleton_warrior: {
    id: 'skeleton_warrior',
    name: 'Skeleton Warrior',
    level: 5,
    world: 2,
    hearts: 4,
    health: 1500,
    attack: 195,
    defense: 130,
    speedLabel: 'Medium',
    moveSpeed: 1.9,
    scale: 1.25,
    isBoss: true,
    themeColor: '#4895ef',
    abilities: [
      { name: 'Bone Slash', icon: '⚔️', color: '#e9ecef' },
      { name: 'Shield Bash', icon: '🛡️', color: '#d4a338' },
      { name: 'Undying Fury', icon: '💀', color: '#4cc9f0' },
    ],
  },
  witch_encounter: {
    id: 'witch_encounter',
    name: 'The Witch (First Encounter)',
    level: 6,
    world: 3,
    hearts: 5,
    health: 2200,
    attack: 260,
    defense: 160,
    speedLabel: 'Fast',
    moveSpeed: 2.4,
    scale: 1.35,
    isBoss: true,
    escapeThreshold: 0.35,
    themeColor: '#c77dff',
    abilities: [
      { name: 'Dark Curse Orb', icon: '🔮', color: '#f72585' },
      { name: 'Shadow Wave', icon: '⚡', color: '#c77dff' },
      { name: 'Mystic Escape', icon: '🌙', color: '#7209b7' },
    ],
  },
  ice_wolf: {
    id: 'ice_wolf',
    name: 'Ice Wolf',
    level: 7,
    world: 4,
    hearts: 4,
    health: 1800,
    attack: 230,
    defense: 120,
    speedLabel: 'Fast',
    moveSpeed: 2.5,
    scale: 1.1,
    isBoss: false,
    themeColor: '#48cae4',
    abilities: [
      { name: 'Frost Bite', icon: '❄️', color: '#90e0ef' },
      { name: 'Blizzard Dash', icon: '💨', color: '#00b4d8' },
      { name: 'Glacial Howl', icon: '🐺', color: '#caf0f8' },
    ],
  },
  ice_golem: {
    id: 'ice_golem',
    name: 'Ice Golem',
    level: 8,
    world: 4,
    hearts: 5,
    health: 2400,
    attack: 280,
    defense: 165,
    speedLabel: 'Slow',
    moveSpeed: 1.5,
    scale: 1.3,
    isBoss: false,
    themeColor: '#00b4d8',
    abilities: [
      { name: 'Glacier Punch', icon: '🧊', color: '#00b4d8' },
      { name: 'Ice Spikes', icon: '💎', color: '#90e0ef' },
      { name: 'Frost Armor', icon: '🛡️', color: '#caf0f8' },
    ],
  },
  frost_guardian: {
    id: 'frost_guardian',
    name: 'Frost Guardian',
    level: 9,
    world: 4,
    hearts: 6,
    health: 2800,
    attack: 320,
    defense: 180,
    speedLabel: 'Medium',
    moveSpeed: 1.8,
    scale: 1.45,
    isBoss: true,
    themeColor: '#90e0ef',
    abilities: [
      { name: 'Ice Smash', icon: '❄️', color: '#48cae4' },
      { name: 'Freeze Wave', icon: '🌊', color: '#90e0ef' },
      { name: 'Ground Stomp', icon: '💥', color: '#0077b6' },
    ],
  },
  fire_hound: {
    id: 'fire_hound',
    name: 'Fire Hound',
    level: 10,
    world: 5,
    hearts: 5,
    health: 2600,
    attack: 340,
    defense: 150,
    speedLabel: 'Fast',
    moveSpeed: 2.6,
    scale: 1.15,
    isBoss: false,
    themeColor: '#f77f00',
    abilities: [
      { name: 'Flame Breath', icon: '🔥', color: '#f77f00' },
      { name: 'Magma Leap', icon: '☄️', color: '#e63946' },
      { name: 'Scorch Fang', icon: '⚡', color: '#fcbf49' },
    ],
  },
  shadow_mage: {
    id: 'shadow_mage',
    name: 'Shadow Mage',
    level: 11,
    world: 5,
    hearts: 5,
    health: 2900,
    attack: 390,
    defense: 170,
    speedLabel: 'Medium',
    moveSpeed: 2.0,
    scale: 1.2,
    isBoss: false,
    themeColor: '#9d4edd',
    abilities: [
      { name: 'Void Bolt', icon: '🔮', color: '#c77dff' },
      { name: 'Dark Hex', icon: '✨', color: '#f72585' },
      { name: 'Soul Drain', icon: '👻', color: '#7209b7' },
    ],
  },
  cursed_knight: {
    id: 'cursed_knight',
    name: 'Cursed Knight',
    level: 12,
    world: 5,
    hearts: 6,
    health: 3600,
    attack: 440,
    defense: 240,
    speedLabel: 'Medium',
    moveSpeed: 2.1,
    scale: 1.4,
    isBoss: true,
    themeColor: '#fcbf49',
    abilities: [
      { name: 'Hellfire Cleave', icon: '⚔️', color: '#f77f00' },
      { name: 'Iron Fortress', icon: '🛡️', color: '#fcbf49' },
      { name: 'Dread Charge', icon: '🔥', color: '#e63946' },
    ],
  },
  witch_final: {
    id: 'witch_final',
    name: 'The Witch (Final Form)',
    level: 13,
    world: 5,
    hearts: 7,
    health: 5000,
    attack: 520,
    defense: 280,
    speedLabel: 'Fast',
    moveSpeed: 2.6,
    scale: 1.5,
    isBoss: true,
    needsStone: true,
    themeColor: '#f72585',
    abilities: [
      { name: 'Winged Void Storm', icon: '🦇', color: '#f72585' },
      { name: 'Curse Barrier', icon: '🔮', color: '#c77dff' },
      { name: 'Darkness Nova', icon: '💥', color: '#7209b7' },
    ],
  },
};

export const MONSTER_GALLERY_LIST: MonsterConfig[] = Object.values(MONSTERS_DATA);

export const LEVELS_DATA: LevelInfo[] = [
  {
    level: 1,
    world: 1,
    name: 'The Beginning',
    subtitle: 'Featured Monster: Forest Slime',
    length: 1900,
    monsterId: 'forest_slime',
    minionId: 'forest_slime',
    minionCount: 5,
    gemsInLevel: 3,
    introSpeaker: 'THE KING',
    introDialogue: 'Brave warrior! Cross the Forgotten Forest, find the Ancient Stone, and lift the curse!',
    clearNote: 'You defeated the Forest Slimes and advanced deeper into the Forgotten Forest!',
  },
  {
    level: 2,
    world: 1,
    name: 'Forest Monsters',
    subtitle: 'Featured Monster: Wild Wolf',
    length: 2100,
    monsterId: 'wild_wolf',
    minionId: 'forest_slime',
    minionCount: 6,
    gemsInLevel: 3,
    introSpeaker: 'THE WARRIOR',
    introDialogue: 'Wild Wolves prowl these woods. Stay alert and strike with precision!',
    clearNote: 'The Wild Wolf pack has been driven back! The Hidden Ruins lie ahead.',
  },
  {
    level: 3,
    world: 1,
    name: 'The Hidden Ruins',
    subtitle: 'Boss Monster: Wood Golem',
    length: 2300,
    monsterId: 'wood_golem',
    minionId: 'wild_wolf',
    minionCount: 5,
    gemsInLevel: 3,
    introSpeaker: 'WOOD GOLEM',
    introDialogue: 'None shall claim the Ancient Stone from the Hidden Ruins!',
    clearNote: 'You toppled the giant Wood Golem and recovered the dormant Ancient Stone!',
  },
  {
    level: 4,
    world: 2,
    name: 'Underground Passage',
    subtitle: 'Featured Monster: Cave Bat',
    length: 2300,
    monsterId: 'cave_bat',
    minionId: 'cave_bat',
    minionCount: 7,
    gemsInLevel: 3,
    introSpeaker: 'THE WARRIOR',
    introDialogue: 'Swarms of Cave Bats echo through the glowing crystal caverns!',
    clearNote: 'You fought through the Underground Passage and reached the Skeleton Fortress.',
  },
  {
    level: 5,
    world: 2,
    name: 'The Skeleton Fortress',
    subtitle: 'Boss Monster: Skeleton Warrior',
    length: 2500,
    monsterId: 'skeleton_warrior',
    minionId: 'cave_bat',
    minionCount: 6,
    gemsInLevel: 3,
    introSpeaker: 'SKELETON WARRIOR',
    introDialogue: 'By the Witch’s command, my sword and shield will guard this fortress forever!',
    clearNote: 'The Skeleton Warrior has fallen! The gates to the Witch’s Castle open before you.',
  },
  {
    level: 6,
    world: 3,
    name: "The Witch's Castle",
    subtitle: 'Story Boss: The Witch (First Encounter)',
    length: 2200,
    monsterId: 'witch_encounter',
    minionId: 'skeleton_warrior',
    minionCount: 4,
    gemsInLevel: 3,
    introSpeaker: 'THE WITCH',
    introDialogue: 'Foolish warrior! Your stone is not yet awakened. Witness the true power of my curse!',
    clearNote: 'At low health, the Witch unleashed her dark curse and escaped! Journey to the Frozen Mountains to awaken the Stone.',
  },
  {
    level: 7,
    world: 4,
    name: 'Frozen Valley',
    subtitle: 'Featured Monster: Ice Wolf',
    length: 2400,
    monsterId: 'ice_wolf',
    minionId: 'ice_wolf',
    minionCount: 7,
    gemsInLevel: 3,
    introSpeaker: 'THE WARRIOR',
    introDialogue: 'Fierce Ice Wolves stalk the Frozen Valley. Keep moving!',
    clearNote: 'You crossed the Frozen Valley and reached the Ice Monster’s Cave.',
  },
  {
    level: 8,
    world: 4,
    name: "Ice Monster's Cave",
    subtitle: 'Featured Monster: Ice Golem',
    length: 2600,
    monsterId: 'ice_golem',
    minionId: 'ice_wolf',
    minionCount: 7,
    gemsInLevel: 3,
    introSpeaker: 'THE WARRIOR',
    introDialogue: 'Colossal Ice Golems guard the glacier heart!',
    clearNote: 'You shattered the Ice Golems! Only the Frost Guardian remains on the mountain peak.',
  },
  {
    level: 9,
    world: 4,
    name: 'The Mountain Guardian',
    subtitle: 'Boss Monster: Frost Guardian',
    length: 2700,
    monsterId: 'frost_guardian',
    minionId: 'ice_golem',
    minionCount: 5,
    gemsInLevel: 3,
    introSpeaker: 'FROST GUARDIAN',
    introDialogue: 'Face my Ice Smash and Freeze Wave to awaken the Ancient Stone!',
    clearNote: 'Frost Guardian defeated! The Ancient Stone awakens with blazing power!',
  },
  {
    level: 10,
    world: 5,
    name: 'The Burning Lands',
    subtitle: 'Featured Monster: Fire Hound',
    length: 2700,
    monsterId: 'fire_hound',
    minionId: 'fire_hound',
    minionCount: 8,
    gemsInLevel: 3,
    introSpeaker: 'THE WARRIOR',
    introDialogue: 'The Cursed Kingdom burns! Watch out for the blazing Fire Hounds!',
    clearNote: 'You crossed the Burning Lands and arrived at the Shadow Temple.',
  },
  {
    level: 11,
    world: 5,
    name: 'The Shadow Temple',
    subtitle: 'Featured Monster: Shadow Mage',
    length: 2800,
    monsterId: 'shadow_mage',
    minionId: 'fire_hound',
    minionCount: 8,
    gemsInLevel: 3,
    introSpeaker: 'SHADOW MAGE',
    introDialogue: 'Our dark magic will consume your soul within the Shadow Temple!',
    clearNote: 'The Shadow Mages are vanquished! The Final Guardian stands before the throne.',
  },
  {
    level: 12,
    world: 5,
    name: 'The Final Guardian',
    subtitle: 'Boss Monster: Cursed Knight',
    length: 2900,
    monsterId: 'cursed_knight',
    minionId: 'shadow_mage',
    minionCount: 6,
    gemsInLevel: 3,
    introSpeaker: 'CURSED KNIGHT',
    introDialogue: 'My magma armor is unbreakable! None shall pass into the Witch’s sanctum!',
    clearNote: 'Cursed Knight defeated! Enter Level 13 for the Witch’s Final Battle!',
  },
  {
    level: 13,
    world: 5,
    name: "The Witch's Final Battle",
    subtitle: 'Final Boss: The Witch (Final Form)',
    length: 2500,
    monsterId: 'witch_final',
    minionId: 'cursed_knight',
    minionCount: 4,
    gemsInLevel: 3,
    introSpeaker: 'THE WITCH (FINAL FORM)',
    introDialogue: 'Behold my winged final form! Only the Ancient Stone can pierce my dark curse barrier!',
    clearNote: 'With the power of the Ancient Stone, the witch’s curse is broken, and peace returns to the kingdom!',
  },
];

export const STORY_CHAPTERS = [
  {
    title: 'The Story',
    text: 'A powerful witch has cursed our kingdom and taken control of the castle. Only the Ancient Stone can break the curse.\n\nYou, our bravest warrior, must find it, defeat the witch, and save the kingdom!',
  },
  {
    title: '5 Worlds • 13 Dangerous Levels',
    text: 'Journey across The Forgotten Forest (Lv 1-3), The Dark Caves (Lv 4-5), The Witch’s Territory (Lv 6), The Frozen Mountains (Lv 7-9), and The Cursed Kingdom (Lv 10-13).',
  },
  {
    title: 'Awaken the Ancient Stone',
    text: 'At Level 6, you will confront the Witch for the first time. Temper your strength against the Frost Guardian at Level 9, and unleash the Ancient Stone at Level 13 to save the realm!',
  },
];
