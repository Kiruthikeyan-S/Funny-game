import React, { useState } from 'react';
import { Image, View } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import { MonsterId } from '../constants/gameData';
import { MONSTER_SPRITES, WARRIOR_SPRITE } from '../constants/gameAssets';

interface MonsterArtProps {
  monsterId: MonsterId;
  size?: number;
}

export const MonsterArt: React.FC<MonsterArtProps> = ({ monsterId, size = 72 }) => {
  const [loadError, setLoadError] = useState(false);
  const spriteSrc = MONSTER_SPRITES[monsterId];

  if (spriteSrc && !loadError) {
    return (
      <Image
        source={spriteSrc}
        resizeMode="contain"
        style={{ width: size, height: size }}
        onError={() => setLoadError(true)}
      />
    );
  }

  return <MonsterArtSvg monsterId={monsterId} size={size} />;
};

export const MonsterArtSvg: React.FC<MonsterArtProps> = ({ monsterId, size = 72 }) => {
  switch (monsterId) {
    case 'forest_goblin':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Pointed Goblin Ears & Head */}
          <Polygon points="4,10 10,8 10,13" fill="#52b788" />
          <Polygon points="28,10 22,8 22,13" fill="#52b788" />
          <Rect x="10" y="6" width="12" height="10" fill="#74c69d" />
          {/* Glowing Yellow Eyes & Grin */}
          <Rect x="12" y="9" width="3" height="2" fill="#ffd152" />
          <Rect x="17" y="9" width="3" height="2" fill="#ffd152" />
          <Rect x="13" y="13" width="6" height="2" fill="#1b4332" />
          {/* Leather Tunic & Belt */}
          <Rect x="10" y="16" width="12" height="8" fill="#7f4f24" />
          <Rect x="10" y="21" width="12" height="2" fill="#ffd152" />
          {/* Short Sword (Left Hand) */}
          <Rect x="4" y="11" width="3" height="10" fill="#dee2e6" />
          <Rect x="3" y="19" width="5" height="2" fill="#d4a338" />
          {/* Nimble Legs */}
          <Rect x="11" y="24" width="4" height="6" fill="#40916c" />
          <Rect x="17" y="24" width="4" height="6" fill="#40916c" />
        </Svg>
      );

    case 'shadow_wolf':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Dark Shadow Fur Body & Tail */}
          <Rect x="8" y="14" width="16" height="8" fill="#343a40" />
          <Polygon points="24,14 31,10 28,19 24,18" fill="#212529" />
          {/* Wolf Head & Pointed Ears */}
          <Rect x="4" y="10" width="10" height="8" fill="#495057" />
          <Polygon points="6,10 8,4 10,10" fill="#212529" />
          <Polygon points="11,10 13,4 15,10" fill="#212529" />
          {/* Snout, Fangs & Crimson Shadow Eye */}
          <Rect x="1" y="13" width="4" height="4" fill="#6c757d" />
          <Rect x="2" y="17" width="2" height="2" fill="#ffffff" />
          <Rect x="6" y="12" width="3" height="2" fill="#ff2a55" />
          {/* Shadow Aura Spikes */}
          <Polygon points="11,14 14,9 17,14 20,8 23,14" fill="#7209b7" />
          {/* Legs */}
          <Rect x="8" y="22" width="3" height="6" fill="#212529" />
          <Rect x="13" y="22" width="3" height="6" fill="#495057" />
          <Rect x="19" y="22" width="3" height="6" fill="#212529" />
        </Svg>
      );

    case 'tree_guardian':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Lush Ancient Leaf Crown */}
          <Rect x="5" y="2" width="22" height="6" fill="#2d6a4f" />
          <Rect x="3" y="5" width="26" height="5" fill="#52b788" />
          {/* Massive Oak Trunk Torso */}
          <Rect x="7" y="10" width="18" height="14" fill="#7f4f24" />
          <Rect x="9" y="12" width="14" height="10" fill="#9c6644" />
          {/* Glowing Amber Eyes & Hollow Mouth */}
          <Rect x="11" y="13" width="3" height="3" fill="#ffd152" />
          <Rect x="18" y="13" width="3" height="3" fill="#ffd152" />
          <Rect x="12" y="18" width="8" height="3" fill="#3d2210" />
          {/* Heavy Root-Smashing Arms & Root Base */}
          <Rect x="2" y="11" width="5" height="14" fill="#582f0e" />
          <Rect x="25" y="11" width="5" height="14" fill="#582f0e" />
          <Polygon points="4,28 9,24 14,30" fill="#40916c" />
          <Polygon points="28,28 23,24 18,30" fill="#40916c" />
          <Rect x="9" y="24" width="5" height="6" fill="#582f0e" />
          <Rect x="18" y="24" width="5" height="6" fill="#582f0e" />
        </Svg>
      );

    case 'skeleton_knight':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Knight Helmet Plume & Skull */}
          <Polygon points="14,1 20,1 17,5" fill="#e63946" />
          <Rect x="11" y="5" width="10" height="9" fill="#f8f9fa" />
          <Rect x="12" y="8" width="3" height="3" fill="#4895ef" />
          <Rect x="17" y="8" width="3" height="3" fill="#4895ef" />
          {/* Armored Ribcage */}
          <Rect x="10" y="14" width="12" height="10" fill="#adb5bd" />
          <Rect x="12" y="16" width="8" height="2" fill="#343a40" />
          <Rect x="12" y="19" width="8" height="2" fill="#343a40" />
          {/* Broadsword (Left) & Tower Shield (Right) */}
          <Rect x="4" y="6" width="3" height="15" fill="#e9ecef" />
          <Rect x="2" y="18" width="7" height="2" fill="#ffd152" />
          <Rect x="21" y="11" width="8" height="13" fill="#1d3557" stroke="#ffd152" strokeWidth="1.5" />
          {/* Bone Legs */}
          <Rect x="11" y="24" width="4" height="6" fill="#dee2e6" />
          <Rect x="17" y="24" width="4" height="6" fill="#dee2e6" />
        </Svg>
      );

    case 'spider_queen':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Queen Crown & Abdomen */}
          <Polygon points="11,4 14,1 16,4 18,1 21,4" fill="#ffd152" />
          <Circle cx="16" cy="14" r="8" fill="#5a189a" />
          <Circle cx="16" cy="12" r="5" fill="#9d4edd" />
          {/* 8 Spider Legs */}
          <Path d="M 8 11 L 2 7 L 1 14" stroke="#c77dff" strokeWidth="2" fill="none" />
          <Path d="M 8 14 L 1 15 L 1 21" stroke="#c77dff" strokeWidth="2" fill="none" />
          <Path d="M 9 18 L 3 23 L 4 29" stroke="#c77dff" strokeWidth="2" fill="none" />
          <Path d="M 24 11 L 30 7 L 31 14" stroke="#c77dff" strokeWidth="2" fill="none" />
          <Path d="M 24 14 L 31 15 L 31 21" stroke="#c77dff" strokeWidth="2" fill="none" />
          <Path d="M 23 18 L 29 23 L 28 29" stroke="#c77dff" strokeWidth="2" fill="none" />
          {/* Multiple Venom Green Eyes & Fangs */}
          <Rect x="12" y="13" width="2" height="2" fill="#80ed99" />
          <Rect x="15" y="12" width="2" height="2" fill="#80ed99" />
          <Rect x="18" y="13" width="2" height="2" fill="#80ed99" />
          <Polygon points="13,19 15,19 14,24" fill="#80ed99" />
          <Polygon points="17,19 19,19 18,24" fill="#80ed99" />
        </Svg>
      );

    case 'dark_witch':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Pointed Dark Witch Hat */}
          <Polygon points="16,2 9,11 23,11" fill="#240046" />
          <Rect x="6" y="10" width="20" height="3" fill="#7209b7" />
          {/* Face & Glowing Magenta Eyes */}
          <Rect x="11" y="13" width="10" height="6" fill="#f3d5b5" />
          <Rect x="12" y="15" width="2" height="2" fill="#f72585" />
          <Rect x="18" y="15" width="2" height="2" fill="#f72585" />
          {/* Dark Curse Robe */}
          <Polygon points="10,19 22,19 26,30 6,30" fill="#5a189a" />
          <Rect x="14" y="19" width="4" height="11" fill="#f72585" />
          {/* Curse Staff & Fireball */}
          <Rect x="25" y="8" width="2" height="22" fill="#ffd152" />
          <Circle cx="26" cy="7" r="3.5" fill="#f72585" />
          <Circle cx="6" cy="16" r="3" fill="#ff70a6" />
        </Svg>
      );

    case 'ice_golem':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Polygon points="9,7 12,2 15,7 18,2 22,7" fill="#caf0f8" />
          <Rect x="7" y="7" width="18" height="17" fill="#0077b6" />
          <Rect x="9" y="9" width="14" height="12" fill="#00b4d8" />
          {/* Giant Ice Punch Fists */}
          <Rect x="2" y="9" width="5" height="15" fill="#90e0ef" />
          <Rect x="25" y="9" width="5" height="15" fill="#90e0ef" />
          <Rect x="11" y="12" width="3" height="3" fill="#ffffff" />
          <Rect x="18" y="12" width="3" height="3" fill="#ffffff" />
          <Rect x="9" y="24" width="5" height="6" fill="#023e8a" />
          <Rect x="18" y="24" width="5" height="6" fill="#023e8a" />
        </Svg>
      );

    case 'frost_wyvern':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Expansive Ice Wyvern Wings */}
          <Polygon points="1,5 13,12 10,22 1,16" fill="#00b4d8" />
          <Polygon points="31,5 19,12 22,22 31,16" fill="#00b4d8" />
          <Polygon points="3,8 12,13 9,19 3,14" fill="#90e0ef" />
          <Polygon points="29,8 20,13 23,19 29,14" fill="#90e0ef" />
          {/* Wyvern Head, Horns & Tail */}
          <Polygon points="12,4 14,9 10,9" fill="#caf0f8" />
          <Polygon points="20,4 18,9 22,9" fill="#caf0f8" />
          <Rect x="11" y="8" width="10" height="12" fill="#0077b6" />
          <Rect x="12" y="10" width="2" height="2" fill="#ffffff" />
          <Rect x="18" y="10" width="2" height="2" fill="#ffffff" />
          <Polygon points="14,20 18,20 16,30" fill="#48cae4" />
        </Svg>
      );

    case 'three_headed_beast':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Left Head */}
          <Rect x="2" y="6" width="8" height="7" fill="#90e0ef" />
          <Rect x="3" y="8" width="2" height="2" fill="#ff2a55" />
          {/* Center Head */}
          <Polygon points="13,1 16,5 19,1" fill="#caf0f8" />
          <Rect x="11" y="4" width="10" height="8" fill="#caf0f8" />
          <Rect x="13" y="6" width="2" height="2" fill="#ff2a55" />
          <Rect x="17" y="6" width="2" height="2" fill="#ff2a55" />
          {/* Right Head */}
          <Rect x="22" y="6" width="8" height="7" fill="#90e0ef" />
          <Rect x="27" y="8" width="2" height="2" fill="#ff2a55" />
          {/* Colossal Frost Beast Body & Claws */}
          <Rect x="6" y="12" width="20" height="13" fill="#0077b6" />
          <Rect x="9" y="14" width="14" height="9" fill="#00b4d8" />
          <Rect x="7" y="25" width="6" height="6" fill="#03045e" />
          <Rect x="19" y="25" width="6" height="6" fill="#03045e" />
        </Svg>
      );

    case 'shadow_assassin':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Stealth Hood & Mask */}
          <Polygon points="16,3 9,11 23,11" fill="#10002b" />
          <Rect x="11" y="9" width="10" height="7" fill="#240046" />
          <Rect x="12" y="11" width="3" height="2" fill="#f72585" />
          <Rect x="17" y="11" width="3" height="2" fill="#f72585" />
          {/* Shadow Cloak */}
          <Polygon points="10,16 22,16 24,26 8,26" fill="#3c096c" />
          {/* Dual Glowing Blades */}
          <Polygon points="2,10 9,16 7,19 1,13" fill="#c77dff" />
          <Polygon points="30,10 23,16 25,19 31,13" fill="#c77dff" />
          {/* Boots */}
          <Rect x="11" y="26" width="3" height="5" fill="#10002b" />
          <Rect x="18" y="26" width="3" height="5" fill="#10002b" />
        </Svg>
      );

    case 'demon_knight':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Curved Demon Horns */}
          <Polygon points="6,2 12,8 8,9" fill="#e63946" />
          <Polygon points="26,2 20,8 24,9" fill="#e63946" />
          {/* Obsidian & Hellfire Armor */}
          <Rect x="8" y="7" width="16" height="17" fill="#212529" />
          <Rect x="10" y="9" width="12" height="13" fill="#d62828" />
          <Rect x="11" y="11" width="3" height="3" fill="#fcbf49" />
          <Rect x="18" y="11" width="3" height="3" fill="#fcbf49" />
          {/* Heavy Flame Sword */}
          <Rect x="2" y="4" width="4" height="20" fill="#f77f00" />
          <Rect x="3" y="5" width="2" height="16" fill="#fcbf49" />
          <Rect x="9" y="24" width="5" height="6" fill="#212529" />
          <Rect x="18" y="24" width="5" height="6" fill="#212529" />
        </Svg>
      );

    case 'cursed_dragon':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Dragon Wings */}
          <Polygon points="1,4 12,12 9,23 1,18" fill="#9b2226" />
          <Polygon points="31,4 20,12 23,23 31,18" fill="#9b2226" />
          <Polygon points="3,7 11,13 8,20 3,16" fill="#f77f00" />
          <Polygon points="29,7 21,13 24,20 29,16" fill="#f77f00" />
          {/* Dragon Horns, Head & Fire Core */}
          <Polygon points="11,2 14,8 9,8" fill="#fcbf49" />
          <Polygon points="21,2 18,8 23,8" fill="#fcbf49" />
          <Rect x="10" y="7" width="12" height="15" fill="#ae2012" />
          <Rect x="12" y="10" width="3" height="2" fill="#fcbf49" />
          <Rect x="17" y="10" width="3" height="2" fill="#fcbf49" />
          <Rect x="13" y="15" width="6" height="6" fill="#fcbf49" />
          <Rect x="10" y="22" width="4" height="7" fill="#660708" />
          <Rect x="18" y="22" width="4" height="7" fill="#660708" />
        </Svg>
      );

    case 'witch_queen':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Supreme Winged Curse Aura */}
          <Polygon points="1,5 12,13 10,25 1,20" fill="#7209b7" />
          <Polygon points="31,5 20,13 22,25 31,20" fill="#7209b7" />
          <Polygon points="3,8 11,14 9,22 3,18" fill="#f72585" />
          <Polygon points="29,8 21,14 23,22 29,18" fill="#f72585" />
          {/* Royal Witch Crown & Hat */}
          <Polygon points="11,4 14,1 16,4 18,1 21,4" fill="#ffd152" />
          <Polygon points="16,3 10,10 22,10" fill="#240046" />
          <Rect x="8" y="9" width="16" height="3" fill="#c77dff" />
          <Rect x="12" y="12" width="8" height="5" fill="#e0aaff" />
          <Rect x="13" y="14" width="2" height="2" fill="#ff0055" />
          <Rect x="17" y="14" width="2" height="2" fill="#ff0055" />
          <Polygon points="10,17 22,17 26,30 6,30" fill="#3c096c" />
          <Circle cx="5" cy="14" r="2.5" fill="#ff0055" />
          <Circle cx="27" cy="14" r="2.5" fill="#ff0055" />
        </Svg>
      );
  }
};

export const WarriorArt: React.FC<{
  size?: number;
  attacking?: boolean;
  heavyAttacking?: boolean;
  blocking?: boolean;
  defeated?: boolean;
}> = ({
  size = 56,
  attacking = false,
  heavyAttacking = false,
  blocking = false,
  defeated = false,
}) => {
  const [loadError, setLoadError] = useState(false);

  if (!loadError && WARRIOR_SPRITE) {
    return (
      <View
        style={[
          { width: size, height: size, justifyContent: 'center', alignItems: 'center' },
          defeated && { transform: [{ rotate: '-75deg' }] },
        ]}>
        <Image
          source={WARRIOR_SPRITE}
          resizeMode="contain"
          style={{ width: size, height: size }}
          onError={() => setLoadError(true)}
        />
        {blocking && (
          <View
            style={{
              position: 'absolute',
              right: 2,
              top: size * 0.2,
              width: size * 0.35,
              height: size * 0.6,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: '#38e4ae',
              backgroundColor: 'rgba(56,228,174,0.3)',
            }}
          />
        )}
        {heavyAttacking && (
          <View
            style={{
              position: 'absolute',
              right: -size * 0.2,
              top: size * 0.1,
              width: size * 0.6,
              height: size * 0.8,
              borderRadius: size * 0.3,
              borderWidth: 3,
              borderColor: '#ff70a6',
              backgroundColor: 'rgba(255,112,166,0.35)',
            }}
          />
        )}
        {attacking && !heavyAttacking && (
          <View
            style={{
              position: 'absolute',
              right: -size * 0.15,
              top: size * 0.2,
              width: size * 0.45,
              height: size * 0.6,
              borderRadius: size * 0.25,
              borderWidth: 2,
              borderColor: '#ffd152',
              backgroundColor: 'rgba(255,209,82,0.35)',
            }}
          />
        )}
      </View>
    );
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={defeated ? { transform: [{ rotate: '-75deg' }] } : undefined}>
      {/* Flowing Crimson Cape */}
      <Polygon points="10,12 3,26 12,26 14,14" fill="#c9184a" />
      {/* Brown Hero Hair & Face */}
      <Rect x="11" y="4" width="9" height="5" fill="#582f0e" />
      <Rect x="12" y="8" width="8" height="6" fill="#f3d5b5" />
      <Rect x="17" y="10" width="2" height="2" fill={defeated ? '#6c757d' : '#1d3557'} />
      {/* Silver/Blue Paladin Armor */}
      <Rect x="10" y="14" width="11" height="10" fill="#3a506b" />
      <Rect x="12" y="15" width="7" height="8" fill="#adb5bd" />
      <Rect x="14" y="17" width="3" height="3" fill="#ffd152" />
      {/* Boots */}
      <Rect x="11" y="24" width="4" height="6" fill="#495057" />
      <Rect x="17" y="24" width="4" height="6" fill="#343a40" />
      {/* Shield or Glowing Sword */}
      {blocking ? (
        <Rect x="20" y="11" width="5" height="14" fill="#38e4ae" stroke="#ffd152" strokeWidth="1" />
      ) : null}
      <Rect x="20" y="16" width="3" height="3" fill="#ffd152" />
      {heavyAttacking ? (
        <Path d="M 20 3 L 32 14 L 20 26 Z" fill="#ff70a6" stroke="#ffd152" strokeWidth="1" />
      ) : attacking ? (
        <Path d="M 22 8 L 31 14 L 22 22 Z" fill="#ffd152" />
      ) : (
        <Rect x="22" y="7" width="3" height="12" fill="#e9ecef" />
      )}
    </Svg>
  );
};
