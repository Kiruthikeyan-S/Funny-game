// ============================================================================
// THE CURSED KINGDOM — COMPLETE 13-LEVEL & 13-MONSTER PROGRESSION + UPGRADES
// ============================================================================

export type MonsterId =
  | 'forest_goblin'
  | 'shadow_wolf'
  | 'tree_guardian'
  | 'skeleton_knight'
  | 'spider_queen'
  | 'dark_witch'
  | 'ice_golem'
  | 'frost_wyvern'
  | 'three_headed_beast'
  | 'shadow_assassin'
  | 'demon_knight'
  | 'cursed_dragon'
  | 'witch_queen';

export type EnemyAIState =
  | 'IDLE'
  | 'PATROL'
  | 'DETECT'
  | 'CHASE'
  | 'PREPARE_ATTACK'
  | 'ATTACK'
  | 'RECOVER'
  | 'HURT'
  | 'DEAD';

export type MonsterDifficulty =
  | 'Easy'
  | 'Easy–Medium'
  | 'Medium'
  | 'Hard'
  | 'Very Hard'
  | 'Extreme'
  | 'Final Boss';

export type MonsterAttackPattern =
  | 'goblin_rush'       // Quick movement & short sword slash
  | 'wolf_pounce'       // Fast dash & jumping bite attack
  | 'tree_root_smash'   // Ground smash & root trap that snares warrior briefly
  | 'skeleton_shield'   // Blocks frontal attacks with shield & counterattacks
  | 'spider_venom'      // Shoots poison web projectiles that deal poison DoT
  | 'witch_curse'       // Teleports, fires dark fireballs, escapes at 35% HP
  | 'golem_freeze'      // Heavy ice punches that freeze the ground & drain stamina
  | 'wyvern_aerial'     // Flying strikes & aerial ice breath
  | 'beast_tri_storm'   // Three attack patterns: ice storm & multi-bite frenzy
  | 'assassin_blink'    // Disappears & strikes from behind with dual blades
  | 'demon_shockwave'   // Heavy flame sword & ground fire shockwaves
  | 'dragon_inferno'    // Multi-phase flying fire breath & meteor dive
  | 'witch_queen_final';// Dark magic, lightning, dark shield, teleports & curse storm

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
  difficulty: MonsterDifficulty;
  hearts: number;
  // Lore / Gallery display stats (matching specification table)
  health: number;
  attack: number;
  defense: number;
  speedLabel: 'Slow' | 'Medium' | 'Fast' | 'Very Fast';
  attackType: string;
  behaviourDesc: string;
  specialDesc: string;
  description: string;
  bossIntroText: string;
  // Balanced in-game combat stats
  combatHp: number;
  minionHp: number;
  combatAttack: number;
  combatDefense: number;
  moveSpeed: number;
  detectRange: number;
  attackRange: number;
  windupFrames: number;
  attackFrames: number;
  recoverFrames: number;
  cooldownFrames: number;
  attackPattern: MonsterAttackPattern;
  scale: number;
  isBoss: boolean;
  isFlying?: boolean;
  needsStone?: boolean;
  escapeThreshold?: number;
  themeColor: string;
  abilities: [MonsterAbility, MonsterAbility, MonsterAbility];
}

export interface WorldInfo {
  id: number;
  name: string;
  shortName: string;
  difficultyLabel: string;
  levelRange: string;
  badgeIcon: string;
  bgTop: string;
  bgBottom: string;
  groundColor: string;
  groundTop: string;
  accent: string;
  cardBorder: string;
}

export interface WaveDefinition {
  waveIndex: number;
  gateX: number;
  spawns: {
    monsterId: MonsterId;
    offsetX: number;
    isBoss?: boolean;
  }[];
}

export interface LevelInfo {
  level: number;
  world: number;
  name: string;
  subtitle: string;
  objective: string;
  length: number;
  monsterId: MonsterId;
  minionId: MonsterId;
  minionCount: number;
  checkpointX: number;
  waves: WaveDefinition[];
  gemsInLevel: number;
  introSpeaker: string;
  introDialogue: string;
  clearNote: string;
}

export interface UpgradeTierInfo {
  tier: number;
  name: string;
  icon: string;
  bonusLabel: string;
  cost: number;
}

export type UpgradeCategory = 'weapon' | 'armor' | 'health' | 'skill';

export const WARRIOR_UPGRADES: Record<UpgradeCategory, UpgradeTierInfo[]> = {
  weapon: [
    { tier: 1, name: 'Iron Broadsword', icon: '🗡️', bonusLabel: 'Base Sword ATK (+0)', cost: 0 },
    { tier: 2, name: 'Knight Claymore', icon: '⚔️', bonusLabel: '+6 Sword & Heavy ATK', cost: 120 },
    { tier: 3, name: 'Runic Greatsword', icon: '🔪', bonusLabel: '+13 Sword & Heavy ATK', cost: 240 },
    { tier: 4, name: 'Dragonbane Blade', icon: '🔥', bonusLabel: '+21 Sword & Heavy ATK', cost: 400 },
    { tier: 5, name: 'Ancient Sunblade', icon: '👑', bonusLabel: '+30 Sword & Heavy ATK', cost: 600 },
  ],
  armor: [
    { tier: 1, name: ' Squire Leather', icon: '🧥', bonusLabel: 'Base Armor DEF (+0)', cost: 0 },
    { tier: 2, name: 'Chainmail Hauberk', icon: '🛡️', bonusLabel: '+4 Defense & Block', cost: 110 },
    { tier: 3, name: 'Royal Paladin Plate', icon: '⚜️', bonusLabel: '+9 Defense & Block', cost: 220 },
    { tier: 4, name: 'Frostforged Armor', icon: '❄️', bonusLabel: '+15 Defense & Block', cost: 380 },
    { tier: 5, name: 'Aegis of the Kingdom', icon: '✨', bonusLabel: '+22 Defense & Block', cost: 550 },
  ],
  health: [
    { tier: 1, name: 'Warrior Vitality I', icon: '❤️', bonusLabel: 'Base Max HP (+0)', cost: 0 },
    { tier: 2, name: 'Forest Heart Crystal', icon: '💚', bonusLabel: '+25 Max Health', cost: 100 },
    { tier: 3, name: 'Cavern Ruby Core', icon: '❤️‍🔥', bonusLabel: '+55 Max Health', cost: 210 },
    { tier: 4, name: 'Glacier Life Vessel', icon: '💎', bonusLabel: '+90 Max Health', cost: 350 },
    { tier: 5, name: 'King’s Immortal Soul', icon: '👑', bonusLabel: '+135 Max Health', cost: 520 },
  ],
  skill: [
    { tier: 1, name: 'Dormant Stone', icon: '🪨', bonusLabel: 'Base Stone Skill (4.0s CD)', cost: 0 },
    { tier: 2, name: 'Glowing Rune Stone', icon: '🌀', bonusLabel: '+15% Skill DMG • 3.6s CD', cost: 130 },
    { tier: 3, name: 'Awakened Sacred Stone', icon: '🔮', bonusLabel: '+30% Skill DMG • 3.2s CD', cost: 260 },
    { tier: 4, name: 'Celestial Relic Stone', icon: '⚡', bonusLabel: '+50% Skill DMG • 2.8s CD', cost: 420 },
    { tier: 5, name: 'True Kingdom Stone', icon: '🌟', bonusLabel: '+75% Skill DMG • 2.4s CD', cost: 620 },
  ],
};

export const WORLDS_DATA: WorldInfo[] = [
  {
    id: 1,
    name: 'World 1 – The Forgotten Forest',
    shortName: 'The Forgotten Forest',
    difficultyLabel: 'Beginner',
    levelRange: '( Lv 1 - 3 )',
    badgeIcon: '🌲',
    bgTop: '#0d2622',
    bgBottom: '#1c4c3b',
    groundColor: '#2b4c3f',
    groundTop: '#52b788',
    accent: '#74c69d',
    cardBorder: '#ffd152',
  },
  {
    id: 2,
    name: 'World 2 – The Cursed Caves',
    shortName: 'The Cursed Caves',
    difficultyLabel: 'Medium',
    levelRange: '( Lv 4 - 6 )',
    badgeIcon: '🕸️',
    bgTop: '#120c2b',
    bgBottom: '#281852',
    groundColor: '#1f1638',
    groundTop: '#9d4edd',
    accent: '#c77dff',
    cardBorder: '#9d4edd',
  },
  {
    id: 3,
    name: 'World 3 – The Frozen Mountains',
    shortName: 'The Frozen Mountains',
    difficultyLabel: 'Hard',
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
    id: 4,
    name: 'World 4 – The Dark Kingdom',
    shortName: 'The Dark Kingdom',
    difficultyLabel: 'Very Hard',
    levelRange: '( Lv 10 - 12 )',
    badgeIcon: '🔥',
    bgTop: '#24070d',
    bgBottom: '#591124',
    groundColor: '#2b0912',
    groundTop: '#f77f00',
    accent: '#fcbf49',
    cardBorder: '#f77f00',
  },
  {
    id: 5,
    name: "World 5 – The Witch's Castle",
    shortName: "The Witch's Castle",
    difficultyLabel: 'Final Boss',
    levelRange: '( Lv 13 )',
    badgeIcon: '👑',
    bgTop: '#190524',
    bgBottom: '#480ca8',
    groundColor: '#240046',
    groundTop: '#f72585',
    accent: '#ff70a6',
    cardBorder: '#f72585',
  },
];

export const MONSTERS_DATA: Record<MonsterId, MonsterConfig> = {
  forest_goblin: {
    id: 'forest_goblin',
    name: 'Forest Goblin',
    level: 1,
    world: 1,
    difficulty: 'Easy',
    hearts: 2,
    health: 100,
    attack: 45,
    defense: 20,
    speedLabel: 'Fast',
    attackType: 'Short sword',
    behaviourDesc: 'Runs towards the warrior and attacks',
    specialDesc: 'Quick movement',
    description:
      'A nimble green-skinned goblin scout armed with a jagged short sword. Patrols the edges of the Forgotten Forest.',
    bossIntroText: 'The Goblin Ambush Leader blocks the forest trail with his short blade!',
    combatHp: 135,
    minionHp: 100,
    combatAttack: 15,
    combatDefense: 4,
    moveSpeed: 2.05,
    detectRange: 240,
    attackRange: 58,
    windupFrames: 22,
    attackFrames: 12,
    recoverFrames: 22,
    cooldownFrames: 46,
    attackPattern: 'goblin_rush',
    scale: 1.0,
    isBoss: false,
    themeColor: '#52b788',
    abilities: [
      { name: 'Short Sword Slash', icon: '🗡️', color: '#52b788' },
      { name: 'Quick Sprint', icon: '💨', color: '#74c69d' },
      { name: 'Goblin Leap', icon: '🟢', color: '#95d5b2' },
    ],
  },
  shadow_wolf: {
    id: 'shadow_wolf',
    name: 'Shadow Wolf',
    level: 2,
    world: 1,
    difficulty: 'Easy–Medium',
    hearts: 3,
    health: 180,
    attack: 75,
    defense: 35,
    speedLabel: 'Very Fast',
    attackType: 'Bite and jumping attack',
    behaviourDesc: 'Chases and jumps towards the warrior',
    specialDesc: 'Fast dash',
    description:
      'A dark-furred predator corrupted by the Witch’s shadow. Lunges from the mist with razor-sharp fangs.',
    bossIntroText: 'The Alpha Shadow Wolf emerges from the dark canopy, ready to pounce!',
    combatHp: 180,
    minionHp: 125,
    combatAttack: 20,
    combatDefense: 5,
    moveSpeed: 2.45,
    detectRange: 270,
    attackRange: 72,
    windupFrames: 19,
    attackFrames: 13,
    recoverFrames: 20,
    cooldownFrames: 44,
    attackPattern: 'wolf_pounce',
    scale: 1.08,
    isBoss: false,
    themeColor: '#adb5bd',
    abilities: [
      { name: 'Shadow Dash', icon: '🐾', color: '#ced4da' },
      { name: 'Jumping Fang Bite', icon: '🦷', color: '#e63946' },
      { name: 'Night Howl', icon: '🌙', color: '#ffd152' },
    ],
  },
  tree_guardian: {
    id: 'tree_guardian',
    name: 'Ancient Tree Guardian',
    level: 3,
    world: 1,
    difficulty: 'Medium',
    hearts: 4,
    health: 350,
    attack: 125,
    defense: 95,
    speedLabel: 'Slow',
    attackType: 'Ground smash and root attack',
    behaviourDesc: 'Slow and powerful',
    specialDesc: 'Roots trap the warrior temporarily',
    description:
      'First Major Boss. An ancient colossus of living oak and cursed vines that guards the Hidden Ruins of the forest.',
    bossIntroText: 'FIRST BOSS BATTLE — The Ancient Tree Guardian awakens! Watch out for its snaring roots!',
    combatHp: 350,
    minionHp: 165,
    combatAttack: 27,
    combatDefense: 10,
    moveSpeed: 1.35,
    detectRange: 270,
    attackRange: 80,
    windupFrames: 32,
    attackFrames: 16,
    recoverFrames: 28,
    cooldownFrames: 56,
    attackPattern: 'tree_root_smash',
    scale: 1.38,
    isBoss: true,
    themeColor: '#7f4f24',
    abilities: [
      { name: 'Ground Smash', icon: '🪵', color: '#9c6644' },
      { name: 'Entangling Roots', icon: '🌿', color: '#52b788' },
      { name: 'Oak Bark Armor', icon: '🛡️', color: '#d4a338' },
    ],
  },
  skeleton_knight: {
    id: 'skeleton_knight',
    name: 'Skeleton Knight',
    level: 4,
    world: 2,
    difficulty: 'Medium',
    hearts: 4,
    health: 400,
    attack: 150,
    defense: 120,
    speedLabel: 'Medium',
    attackType: 'Sword and shield',
    behaviourDesc: 'Blocks attacks and counterattacks',
    specialDesc: 'Shield defence',
    description:
      'Fallen royal knights raised by dark necromancy in the Cursed Caves. Uses a heavy iron shield to deflect frontal strikes.',
    bossIntroText: 'Captain of the Undead Watch raises his tower shield in the Cursed Caves!',
    combatHp: 400,
    minionHp: 185,
    combatAttack: 28,
    combatDefense: 12,
    moveSpeed: 1.85,
    detectRange: 260,
    attackRange: 66,
    windupFrames: 23,
    attackFrames: 14,
    recoverFrames: 22,
    cooldownFrames: 46,
    attackPattern: 'skeleton_shield',
    scale: 1.18,
    isBoss: false,
    themeColor: '#4895ef',
    abilities: [
      { name: 'Shield Defence', icon: '🛡️', color: '#4cc9f0' },
      { name: 'Bone Counterattack', icon: '⚔️', color: '#e9ecef' },
      { name: 'Crypt Slash', icon: '💀', color: '#4895ef' },
    ],
  },
  spider_queen: {
    id: 'spider_queen',
    name: 'Venom Spider Queen',
    level: 5,
    world: 2,
    difficulty: 'Medium',
    hearts: 4,
    health: 550,
    attack: 185,
    defense: 110,
    speedLabel: 'Fast',
    attackType: 'Poison and web shooting',
    behaviourDesc: 'Moves around the battlefield',
    specialDesc: 'Poison reduces health over time',
    description:
      'Monstrous arachnid matriarch of the Cursed Caves. Spits venomous webs that poison the warrior over time.',
    bossIntroText: 'CAVE BOSS — The Venom Spider Queen descends on silken threads dripping with poison!',
    combatHp: 520,
    minionHp: 200,
    combatAttack: 30,
    combatDefense: 11,
    moveSpeed: 2.2,
    detectRange: 310,
    attackRange: 145,
    windupFrames: 24,
    attackFrames: 15,
    recoverFrames: 22,
    cooldownFrames: 48,
    attackPattern: 'spider_venom',
    scale: 1.32,
    isBoss: true,
    themeColor: '#9d4edd',
    abilities: [
      { name: 'Venom Spit (DoT)', icon: '🧪', color: '#80ed99' },
      { name: 'Web Shot Snare', icon: '🕸️', color: '#e9ecef' },
      { name: 'Queen Fang Lunge', icon: '🕷️', color: '#c77dff' },
    ],
  },
  dark_witch: {
    id: 'dark_witch',
    name: 'The Dark Witch',
    level: 6,
    world: 2,
    difficulty: 'Hard',
    hearts: 5,
    health: 1000,
    attack: 250,
    defense: 150,
    speedLabel: 'Fast',
    attackType: 'Dark magic and fireballs',
    behaviourDesc: 'Teleports and summons monsters',
    specialDesc: 'Curse magic (Escapes when weakened)',
    description:
      'Story Encounter at the heart of the Cursed Caves. Her curse magic is overwhelming—she teleports and escapes when weakened.',
    bossIntroText: 'STORY BOSS — The Dark Witch appears! Survive her dark fireballs and force her to retreat!',
    combatHp: 620,
    minionHp: 210,
    combatAttack: 34,
    combatDefense: 14,
    moveSpeed: 2.35,
    detectRange: 350,
    attackRange: 175,
    windupFrames: 25,
    attackFrames: 16,
    recoverFrames: 24,
    cooldownFrames: 48,
    attackPattern: 'witch_curse',
    scale: 1.35,
    isBoss: true,
    escapeThreshold: 0.35,
    themeColor: '#f72585',
    abilities: [
      { name: 'Dark Fireball', icon: '🔮', color: '#f72585' },
      { name: 'Shadow Teleport', icon: '⚡', color: '#c77dff' },
      { name: 'Curse Escape', icon: '🌙', color: '#7209b7' },
    ],
  },
  ice_golem: {
    id: 'ice_golem',
    name: 'Ice Golem',
    level: 7,
    world: 3,
    difficulty: 'Hard',
    hearts: 5,
    health: 850,
    attack: 265,
    defense: 175,
    speedLabel: 'Slow',
    attackType: 'Ice punches',
    behaviourDesc: 'Advancing glacier juggernaut',
    specialDesc: 'Freezes the ground',
    description:
      'A towering construct of enchanted glacier ice in the Frozen Mountains. Its punches freeze the ground and sap stamina.',
    bossIntroText: 'The Ancient Ice Golem shatters the frozen ridge with glacier fists!',
    combatHp: 460,
    minionHp: 215,
    combatAttack: 33,
    combatDefense: 15,
    moveSpeed: 1.5,
    detectRange: 260,
    attackRange: 80,
    windupFrames: 30,
    attackFrames: 16,
    recoverFrames: 26,
    cooldownFrames: 52,
    attackPattern: 'golem_freeze',
    scale: 1.28,
    isBoss: false,
    themeColor: '#00b4d8',
    abilities: [
      { name: 'Ice Punch', icon: '🧊', color: '#00b4d8' },
      { name: 'Ground Freeze', icon: '❄️', color: '#90e0ef' },
      { name: 'Glacier Wall', icon: '🛡️', color: '#caf0f8' },
    ],
  },
  frost_wyvern: {
    id: 'frost_wyvern',
    name: 'Frost Wyvern',
    level: 8,
    world: 3,
    difficulty: 'Hard',
    hearts: 5,
    health: 1100,
    attack: 300,
    defense: 160,
    speedLabel: 'Very Fast',
    attackType: 'Flying strikes and ice breath',
    behaviourDesc: 'Swoops from the skies and breathes frost',
    specialDesc: 'Aerial attacks',
    description:
      'A winged ice drake soaring above the Frozen Mountains. Dives at high speed and exhales freezing blizzard breath.',
    bossIntroText: 'The Frost Wyvern descends from the blizzard peaks with razor wings!',
    combatHp: 520,
    minionHp: 230,
    combatAttack: 36,
    combatDefense: 14,
    moveSpeed: 2.55,
    detectRange: 320,
    attackRange: 135,
    windupFrames: 21,
    attackFrames: 15,
    recoverFrames: 22,
    cooldownFrames: 46,
    attackPattern: 'wyvern_aerial',
    scale: 1.32,
    isBoss: false,
    isFlying: true,
    themeColor: '#48cae4',
    abilities: [
      { name: 'Aerial Strike', icon: '🦅', color: '#48cae4' },
      { name: 'Ice Breath', icon: '❄️', color: '#caf0f8' },
      { name: 'Gale Wing Dive', icon: '💨', color: '#0077b6' },
    ],
  },
  three_headed_beast: {
    id: 'three_headed_beast',
    name: 'Three-Headed Frost Beast',
    level: 9,
    world: 3,
    difficulty: 'Very Hard',
    hearts: 6,
    health: 1600,
    attack: 360,
    defense: 200,
    speedLabel: 'Medium',
    attackType: 'Three different attack patterns',
    behaviourDesc: 'Major Boss that alternates savage bites and ice storms',
    specialDesc: 'Ice storm and multiple bites',
    description:
      'Major Boss of the Frozen Mountains. A ferocious three-headed polar chimera guarding the shrine that awakens the Ancient Stone.',
    bossIntroText: 'MAJOR BOSS BATTLE — The Three-Headed Frost Beast roars across the summit!',
    combatHp: 680,
    minionHp: 250,
    combatAttack: 40,
    combatDefense: 17,
    moveSpeed: 1.95,
    detectRange: 320,
    attackRange: 98,
    windupFrames: 28,
    attackFrames: 18,
    recoverFrames: 25,
    cooldownFrames: 50,
    attackPattern: 'beast_tri_storm',
    scale: 1.48,
    isBoss: true,
    themeColor: '#90e0ef',
    abilities: [
      { name: 'Triple Fang Bite', icon: '🐺', color: '#90e0ef' },
      { name: 'Blizzard Ice Storm', icon: '🌨️', color: '#00b4d8' },
      { name: 'Tri-Head Roar', icon: '💥', color: '#caf0f8' },
    ],
  },
  shadow_assassin: {
    id: 'shadow_assassin',
    name: 'Shadow Assassin',
    level: 10,
    world: 4,
    difficulty: 'Very Hard',
    hearts: 5,
    health: 1400,
    attack: 380,
    defense: 155,
    speedLabel: 'Very Fast',
    attackType: 'Dual blades',
    behaviourDesc: 'Vanishes into smoke and ambushes from behind',
    specialDesc: 'Disappears and attacks from behind',
    description:
      'Elite phantom killer of the Dark Kingdom. Uses shadow-step magic to blink behind the warrior for lethal dual-blade strikes.',
    bossIntroText: 'The Grand Shadow Assassin melts into the darkness, dual blades gleaming!',
    combatHp: 540,
    minionHp: 245,
    combatAttack: 38,
    combatDefense: 13,
    moveSpeed: 2.75,
    detectRange: 320,
    attackRange: 85,
    windupFrames: 18,
    attackFrames: 13,
    recoverFrames: 20,
    cooldownFrames: 42,
    attackPattern: 'assassin_blink',
    scale: 1.15,
    isBoss: false,
    themeColor: '#c77dff',
    abilities: [
      { name: 'Dual Blade Flurry', icon: '🗡️', color: '#c77dff' },
      { name: 'Shadow Blink', icon: '👤', color: '#7209b7' },
      { name: 'Backstab Ambush', icon: '🩸', color: '#f72585' },
    ],
  },
  demon_knight: {
    id: 'demon_knight',
    name: 'Demon Knight',
    level: 11,
    world: 4,
    difficulty: 'Very Hard',
    hearts: 6,
    health: 2000,
    attack: 430,
    defense: 230,
    speedLabel: 'Medium',
    attackType: 'Heavy sword and fire',
    behaviourDesc: 'Cleaves with hellfire and unleashes ground shockwaves',
    specialDesc: 'Powerful ground shockwaves',
    description:
      'Dread commander of the Dark Kingdom clad in molten obsidian armor. Every swing of his greatsword sends pillars of fire across the ground.',
    bossIntroText: 'The Demon Knight ignites his hellfire greatsword at the castle gates!',
    combatHp: 640,
    minionHp: 270,
    combatAttack: 42,
    combatDefense: 18,
    moveSpeed: 2.0,
    detectRange: 310,
    attackRange: 92,
    windupFrames: 26,
    attackFrames: 16,
    recoverFrames: 24,
    cooldownFrames: 48,
    attackPattern: 'demon_shockwave',
    scale: 1.35,
    isBoss: true,
    themeColor: '#f77f00',
    abilities: [
      { name: 'Hellfire Greatsword', icon: '⚔️', color: '#f77f00' },
      { name: 'Ground Shockwave', icon: '🌋', color: '#e63946' },
      { name: 'Demon Armor', icon: '🛡️', color: '#fcbf49' },
    ],
  },
  cursed_dragon: {
    id: 'cursed_dragon',
    name: 'Cursed Dragon',
    level: 12,
    world: 4,
    difficulty: 'Extreme',
    hearts: 6,
    health: 2800,
    attack: 490,
    defense: 260,
    speedLabel: 'Fast',
    attackType: 'Fire breath and flying attacks',
    behaviourDesc: 'Final Guardian before the Witch with multi-phase inferno attacks',
    specialDesc: 'Multiple combat phases',
    description:
      'Extreme Boss & Final Guardian before the Witch’s Castle. An ancient dragon bound in dark chains that rains cursed fire from above.',
    bossIntroText: 'FINAL GUARDIAN — The Cursed Dragon spreads its scorching wings before the throne room!',
    combatHp: 780,
    minionHp: 285,
    combatAttack: 45,
    combatDefense: 19,
    moveSpeed: 2.3,
    detectRange: 350,
    attackRange: 155,
    windupFrames: 25,
    attackFrames: 18,
    recoverFrames: 24,
    cooldownFrames: 46,
    attackPattern: 'dragon_inferno',
    scale: 1.52,
    isBoss: true,
    isFlying: true,
    themeColor: '#e63946',
    abilities: [
      { name: 'Cursed Fire Breath', icon: '🐉', color: '#e63946' },
      { name: 'Flying Meteor Dive', icon: '☄️', color: '#f77f00' },
      { name: 'Draconic Phase Fury', icon: '🔥', color: '#fcbf49' },
    ],
  },
  witch_queen: {
    id: 'witch_queen',
    name: 'The Witch Queen',
    level: 13,
    world: 5,
    difficulty: 'Final Boss',
    hearts: 7,
    health: 5000,
    attack: 560,
    defense: 300,
    speedLabel: 'Fast',
    attackType: 'Dark magic, fireballs and lightning',
    behaviourDesc: 'Creates a dark shield, teleports, summons monsters & unleashes full curse',
    specialDesc: 'Dark Shield + Teleport + Full Kingdom Curse',
    description:
      'Supreme ruler of the curse in Level 13. Protected by an impenetrable Dark Shield that only the awakened Ancient Stone can shatter!',
    bossIntroText: 'FINAL BOSS — The Witch Queen unleashes the full power of the Kingdom’s Curse! Use the Ancient Stone (🌀) to shatter her Dark Shield!',
    combatHp: 920,
    minionHp: 300,
    combatAttack: 48,
    combatDefense: 20,
    moveSpeed: 2.65,
    detectRange: 380,
    attackRange: 185,
    windupFrames: 24,
    attackFrames: 18,
    recoverFrames: 22,
    cooldownFrames: 44,
    attackPattern: 'witch_queen_final',
    scale: 1.55,
    isBoss: true,
    needsStone: true,
    themeColor: '#f72585',
    abilities: [
      { name: 'Dark Lightning & Fire', icon: '⚡', color: '#f72585' },
      { name: 'Dark Curse Shield', icon: '🔮', color: '#c77dff' },
      { name: 'Void Teleport & Summon', icon: '👑', color: '#7209b7' },
    ],
  },
};

export const MONSTER_GALLERY_LIST: MonsterConfig[] = Object.values(MONSTERS_DATA);

function buildWavesForLevel(
  length: number,
  minionId: MonsterId,
  mainId: MonsterId
): WaveDefinition[] {
  const w1Gate = Math.round(length * 0.34);
  const w2Gate = Math.round(length * 0.66);
  const w3Gate = length - 120;

  return [
    {
      waveIndex: 1,
      gateX: w1Gate,
      spawns: [
        { monsterId: minionId, offsetX: w1Gate - 190 },
        { monsterId: minionId, offsetX: w1Gate - 70 },
      ],
    },
    {
      waveIndex: 2,
      gateX: w2Gate,
      spawns: [
        { monsterId: minionId, offsetX: w2Gate - 210 },
        { monsterId: mainId, offsetX: w2Gate - 95 },
      ],
    },
    {
      waveIndex: 3,
      gateX: w3Gate,
      spawns: [
        { monsterId: minionId, offsetX: w3Gate - 260 },
        { monsterId: mainId, offsetX: w3Gate - 130, isBoss: true },
      ],
    },
  ];
}

export const LEVELS_DATA: LevelInfo[] = [
  // WORLD 1: THE FORGOTTEN FOREST (Levels 1-3)
  {
    level: 1,
    world: 1,
    name: 'The Forgotten Outpost',
    subtitle: 'Monster: Forest Goblin (Easy)',
    objective: 'Defeat all 3 Forest Goblin waves and advance through the forest',
    length: 1900,
    monsterId: 'forest_goblin',
    minionId: 'forest_goblin',
    minionCount: 5,
    checkpointX: 950,
    waves: buildWavesForLevel(1900, 'forest_goblin', 'forest_goblin'),
    gemsInLevel: 3,
    introSpeaker: 'THE KING',
    introDialogue: 'Brave warrior! Forest Goblins have overrun the outer woods. Clear all 3 waves to begin your quest!',
    clearNote: 'You defeated the Forest Goblin ambush and pressed deeper into the Forgotten Forest!',
  },
  {
    level: 2,
    world: 1,
    name: 'Shadow Wolf Den',
    subtitle: 'Monster: Shadow Wolf (Easy–Medium)',
    objective: 'Survive the fast-dashing Shadow Wolf pack across 3 combat waves',
    length: 2100,
    monsterId: 'shadow_wolf',
    minionId: 'forest_goblin',
    minionCount: 6,
    checkpointX: 1050,
    waves: buildWavesForLevel(2100, 'forest_goblin', 'shadow_wolf'),
    gemsInLevel: 3,
    introSpeaker: 'THE WARRIOR',
    introDialogue: 'Shadow Wolves prowl ahead! Watch their jumping bite and time your dodge or shield block.',
    clearNote: 'The Shadow Wolf pack is scattered! Ahead lies the Ancient Tree Guardian.',
  },
  {
    level: 3,
    world: 1,
    name: 'The Ancient Grove',
    subtitle: 'First Boss: Ancient Tree Guardian (Medium)',
    objective: 'Defeat the Ancient Tree Guardian and claim the dormant Ancient Stone',
    length: 2300,
    monsterId: 'tree_guardian',
    minionId: 'shadow_wolf',
    minionCount: 5,
    checkpointX: 1150,
    waves: buildWavesForLevel(2300, 'shadow_wolf', 'tree_guardian'),
    gemsInLevel: 3,
    introSpeaker: 'ANCIENT TREE GUARDIAN',
    introDialogue: 'My roots shall bind your feet and crush your bones, mortal warrior!',
    clearNote: 'FIRST BOSS DEFEATED! You toppled the Ancient Tree Guardian and recovered the dormant Ancient Stone!',
  },
  // WORLD 2: THE CURSED CAVES (Levels 4-6)
  {
    level: 4,
    world: 2,
    name: 'Crypt of the Shield',
    subtitle: 'Monster: Skeleton Knight (Medium)',
    objective: 'Break through the shield-blocking Skeleton Knights in the Cursed Caves',
    length: 2350,
    monsterId: 'skeleton_knight',
    minionId: 'skeleton_knight',
    minionCount: 6,
    checkpointX: 1175,
    waves: buildWavesForLevel(2350, 'skeleton_knight', 'skeleton_knight'),
    gemsInLevel: 3,
    introSpeaker: 'SKELETON KNIGHT',
    introDialogue: 'Our shields are unyielding! Use Heavy Attacks (⚒️) to break our guard!',
    clearNote: 'You shattered the Skeleton Knight phalanx and entered the Venom Cavern!',
  },
  {
    level: 5,
    world: 2,
    name: 'Lair of the Spider Queen',
    subtitle: 'Boss: Venom Spider Queen (Medium)',
    objective: 'Defeat the Venom Spider Queen and cure her poison with potions',
    length: 2500,
    monsterId: 'spider_queen',
    minionId: 'skeleton_knight',
    minionCount: 6,
    checkpointX: 1250,
    waves: buildWavesForLevel(2500, 'skeleton_knight', 'spider_queen'),
    gemsInLevel: 3,
    introSpeaker: 'VENOM SPIDER QUEEN',
    introDialogue: 'My venomous webs will drain your life drop by drop!',
    clearNote: 'Venom Spider Queen vanquished! The Dark Witch’s ritual chamber lies just ahead.',
  },
  {
    level: 6,
    world: 2,
    name: 'Altar of the Dark Witch',
    subtitle: 'Story Boss: The Dark Witch (Hard)',
    objective: 'Confront the Dark Witch and survive until she escapes at 35% HP',
    length: 2300,
    monsterId: 'dark_witch',
    minionId: 'skeleton_knight',
    minionCount: 4,
    checkpointX: 1150,
    waves: buildWavesForLevel(2300, 'skeleton_knight', 'dark_witch'),
    gemsInLevel: 3,
    introSpeaker: 'THE DARK WITCH',
    introDialogue: 'Foolish warrior! Your stone is still asleep. Witness the true terror of my curse!',
    clearNote: 'At 35% HP, the Dark Witch unleashed a curse storm and escaped! Ascend the Frozen Mountains to awaken the Stone.',
  },
  // WORLD 3: THE FROZEN MOUNTAINS (Levels 7-9)
  {
    level: 7,
    world: 3,
    name: 'Glacier Gorge',
    subtitle: 'Monster: Ice Golem (Hard)',
    objective: 'Shatter the Ice Golems before their freezing punches drain your stamina',
    length: 2450,
    monsterId: 'ice_golem',
    minionId: 'ice_golem',
    minionCount: 6,
    checkpointX: 1225,
    waves: buildWavesForLevel(2450, 'ice_golem', 'ice_golem'),
    gemsInLevel: 3,
    introSpeaker: 'THE WARRIOR',
    introDialogue: 'Colossal Ice Golems guard the mountain pass. Their ice punches freeze the ground!',
    clearNote: 'You smashed through the Ice Golems and reached the Wyvern Cliffs!',
  },
  {
    level: 8,
    world: 3,
    name: 'Wyvern Ridge',
    subtitle: 'Monster: Frost Wyvern (Hard)',
    objective: 'Defeat the flying Frost Wyverns and dodge their aerial ice breath',
    length: 2600,
    monsterId: 'frost_wyvern',
    minionId: 'ice_golem',
    minionCount: 7,
    checkpointX: 1300,
    waves: buildWavesForLevel(2600, 'ice_golem', 'frost_wyvern'),
    gemsInLevel: 3,
    introSpeaker: 'THE WARRIOR',
    introDialogue: 'Frost Wyverns strike from the sky! Time your jumps and upward slashes!',
    clearNote: 'The Frost Wyverns have fallen! The Three-Headed Frost Beast awaits at the summit.',
  },
  {
    level: 9,
    world: 3,
    name: 'Summit of the Frost Beast',
    subtitle: 'Major Boss: Three-Headed Frost Beast (Very Hard)',
    objective: 'Slay the Three-Headed Frost Beast to awaken the Ancient Stone',
    length: 2700,
    monsterId: 'three_headed_beast',
    minionId: 'frost_wyvern',
    minionCount: 5,
    checkpointX: 1350,
    waves: buildWavesForLevel(2700, 'frost_wyvern', 'three_headed_beast'),
    gemsInLevel: 3,
    introSpeaker: 'THREE-HEADED FROST BEAST',
    introDialogue: 'Three jaws of frost, one storm of death! None shall awaken the Stone!',
    clearNote: 'MAJOR BOSS DEFEATED! The Ancient Stone blazes with awakened golden light!',
  },
  // WORLD 4: THE DARK KINGDOM (Levels 10-12)
  {
    level: 10,
    world: 4,
    name: 'Streets of Shadow',
    subtitle: 'Monster: Shadow Assassin (Very Hard)',
    objective: 'Counter the teleporting Shadow Assassins in the Dark Kingdom',
    length: 2750,
    monsterId: 'shadow_assassin',
    minionId: 'shadow_assassin',
    minionCount: 8,
    checkpointX: 1375,
    waves: buildWavesForLevel(2750, 'shadow_assassin', 'shadow_assassin'),
    gemsInLevel: 3,
    introSpeaker: 'SHADOW ASSASSIN',
    introDialogue: 'You cannot strike what you cannot see. Prepare for blades in the dark!',
    clearNote: 'You outmaneuvered the Shadow Assassins and breached the Inner Citadel!',
  },
  {
    level: 11,
    world: 4,
    name: 'Citadel of Hellfire',
    subtitle: 'Boss: Demon Knight (Very Hard)',
    objective: 'Defeat the Demon Knight and leap over his fiery ground shockwaves',
    length: 2850,
    monsterId: 'demon_knight',
    minionId: 'shadow_assassin',
    minionCount: 8,
    checkpointX: 1425,
    waves: buildWavesForLevel(2850, 'shadow_assassin', 'demon_knight'),
    gemsInLevel: 3,
    introSpeaker: 'DEMON KNIGHT',
    introDialogue: 'My heavy flame blade will split the earth beneath your boots!',
    clearNote: 'Demon Knight defeated! Only the Cursed Dragon stands before the Witch’s Castle.',
  },
  {
    level: 12,
    world: 4,
    name: 'Dragon’s Gate',
    subtitle: 'Final Guardian: Cursed Dragon (Extreme)',
    objective: 'Vanquish the multi-phase Cursed Dragon guarding the castle bridge',
    length: 2950,
    monsterId: 'cursed_dragon',
    minionId: 'demon_knight',
    minionCount: 6,
    checkpointX: 1475,
    waves: buildWavesForLevel(2950, 'demon_knight', 'cursed_dragon'),
    gemsInLevel: 3,
    introSpeaker: 'CURSED DRAGON',
    introDialogue: 'I am the Final Guardian! My cursed flames will reduce you to ash!',
    clearNote: 'FINAL GUARDIAN DEFEATED! The gates of the Witch’s Castle swing open for Level 13!',
  },
  // WORLD 5: THE WITCH'S CASTLE (Level 13)
  {
    level: 13,
    world: 5,
    name: 'Throne of the Witch Queen',
    subtitle: 'Final Boss: The Witch Queen (Final Boss)',
    objective: 'Shatter the Witch Queen’s Dark Shield with the Ancient Stone (🌀) and break the curse!',
    length: 2600,
    monsterId: 'witch_queen',
    minionId: 'demon_knight',
    minionCount: 4,
    checkpointX: 1300,
    waves: buildWavesForLevel(2600, 'demon_knight', 'witch_queen'),
    gemsInLevel: 3,
    introSpeaker: 'THE WITCH QUEEN',
    introDialogue: 'Behold the full power of the Kingdom’s Curse! My Dark Shield is invincible to mortal steel!',
    clearNote: 'With the awakened Ancient Stone, you shattered the Witch Queen’s curse, saved the King, and restored the Kingdom!',
  },
];

export const STORY_CHAPTERS = [
  {
    title: 'The Cursed Kingdom',
    text: 'A peaceful kingdom ruled by a noble King has fallen under a terrible curse cast by the Witch Queen, who seized the royal castle.\n\nThe King sends his strongest warrior on a perilous quest to recover the Ancient Magical Stone—the only relic capable of breaking the curse.',
  },
  {
    title: '5 Worlds • 13 Deadly Monsters',
    text: 'Battle through The Forgotten Forest (Lv 1-3), The Cursed Caves (Lv 4-6), The Frozen Mountains (Lv 7-9), The Dark Kingdom (Lv 10-12), and The Witch’s Castle (Lv 13).\n\nFace Goblins, Shadow Wolves, the Ancient Tree Guardian, Venom Spider Queen, Three-Headed Frost Beast, and the Cursed Dragon!',
  },
  {
    title: 'Awaken the Stone & Save the Realm',
    text: 'At Level 6, you will confront the Dark Witch for the first time, but her curse is too strong and she escapes.\n\nUpgrade your Weapon, Armor, Health, and Stone Skill in the Armory, conquer Level 9 to awaken the Stone, and defeat the Witch Queen in Level 13!',
  },
];
