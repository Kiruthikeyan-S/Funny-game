import { ImageSourcePropType } from 'react-native';
import { MonsterId } from './gameData';

export const WORLD_BACKGROUNDS: Record<number, ImageSourcePropType> = {
  1: require('../assets/backgrounds/world1.jpg'),
  2: require('../assets/backgrounds/world2.jpg'),
  3: require('../assets/backgrounds/world3.jpg'),
  4: require('../assets/backgrounds/world4.jpg'),
  5: require('../assets/backgrounds/world5.jpg'),
};

export const MONSTER_SPRITES: Record<MonsterId, ImageSourcePropType> = {
  forest_goblin: require('../assets/monsters/sprites/forest_goblin.png'),
  shadow_wolf: require('../assets/monsters/sprites/shadow_wolf.png'),
  tree_guardian: require('../assets/monsters/sprites/tree_guardian.png'),
  skeleton_knight: require('../assets/monsters/sprites/skeleton_knight.png'),
  spider_queen: require('../assets/monsters/sprites/spider_queen.png'),
  dark_witch: require('../assets/monsters/sprites/dark_witch.png'),
  ice_golem: require('../assets/monsters/sprites/ice_golem.png'),
  frost_wyvern: require('../assets/monsters/sprites/frost_wyvern.png'),
  three_headed_beast: require('../assets/monsters/sprites/three_headed_beast.png'),
  shadow_assassin: require('../assets/monsters/sprites/shadow_assassin.png'),
  demon_knight: require('../assets/monsters/sprites/demon_knight.png'),
  cursed_dragon: require('../assets/monsters/sprites/cursed_dragon.png'),
  witch_queen: require('../assets/monsters/sprites/witch_queen.png'),
};

export const MONSTER_ANIMATIONS: Partial<
  Record<
    MonsterId,
    Partial<Record<'idle' | 'attack' | 'hurt' | 'dead' | 'fly' | 'run', ImageSourcePropType>>
  >
> = {
  cursed_dragon: {
    idle: require('../assets/monsters/sprites/cursed_dragon.png'),
    fly: require('../assets/monsters/sprites/cursed_dragon_fly.png'),
    attack: require('../assets/monsters/sprites/cursed_dragon_attack.png'),
    hurt: require('../assets/monsters/sprites/cursed_dragon_hurt.png'),
  },
  witch_queen: {
    idle: require('../assets/monsters/sprites/witch_queen.png'),
    attack: require('../assets/monsters/sprites/witch_queen_attack.png'),
  },
  demon_knight: {
    idle: require('../assets/monsters/sprites/demon_knight.png'),
    run: require('../assets/monsters/sprites/demon_knight_run.png'),
    attack: require('../assets/monsters/sprites/demon_knight_attack.png'),
    hurt: require('../assets/monsters/sprites/demon_knight_hurt.png'),
    dead: require('../assets/monsters/sprites/demon_knight_dead.png'),
  },
  forest_goblin: {
    idle: require('../assets/monsters/sprites/forest_goblin.png'),
    attack: require('../assets/monsters/sprites/forest_goblin_attack.png'),
    hurt: require('../assets/monsters/sprites/forest_goblin_hurt.png'),
    dead: require('../assets/monsters/sprites/forest_goblin_dead.png'),
  },
  dark_witch: {
    idle: require('../assets/monsters/sprites/dark_witch.png'),
    attack: require('../assets/monsters/sprites/dark_witch_attack.png'),
  },
};

export const MONSTER_CARDS: Record<MonsterId, ImageSourcePropType> = {
  forest_goblin: require('../assets/monsters/cards/forest_goblin.jpg'),
  shadow_wolf: require('../assets/monsters/cards/shadow_wolf.jpg'),
  tree_guardian: require('../assets/monsters/cards/tree_guardian.jpg'),
  skeleton_knight: require('../assets/monsters/cards/skeleton_knight.jpg'),
  spider_queen: require('../assets/monsters/cards/spider_queen.jpg'),
  dark_witch: require('../assets/monsters/cards/dark_witch.jpg'),
  ice_golem: require('../assets/monsters/cards/ice_golem.jpg'),
  frost_wyvern: require('../assets/monsters/cards/frost_wyvern.jpg'),
  three_headed_beast: require('../assets/monsters/cards/three_headed_beast.jpg'),
  shadow_assassin: require('../assets/monsters/cards/shadow_assassin.jpg'),
  demon_knight: require('../assets/monsters/cards/demon_knight.jpg'),
  cursed_dragon: require('../assets/monsters/cards/cursed_dragon.jpg'),
  witch_queen: require('../assets/monsters/cards/witch_queen.jpg'),
};

export const WARRIOR_SPRITE: ImageSourcePropType = require('../assets/warrior/warrior.png');

export const WARRIOR_ANIMATIONS: Record<
  'idle' | 'walk' | 'run' | 'attack' | 'hurt' | 'dead',
  ImageSourcePropType
> = {
  idle: require('../assets/warrior/warrior_idle.png'),
  walk: require('../assets/warrior/warrior_walk.png'),
  run: require('../assets/warrior/warrior_run.png'),
  attack: require('../assets/warrior/warrior_attack.png'),
  hurt: require('../assets/warrior/warrior_hurt.png'),
  dead: require('../assets/warrior/warrior_dead.png'),
};
