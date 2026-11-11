import React from 'react';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import { MonsterId } from '../constants/gameData';

interface MonsterArtProps {
  monsterId: MonsterId;
  size?: number;
}

export const MonsterArt: React.FC<MonsterArtProps> = ({ monsterId, size = 72 }) => {
  switch (monsterId) {
    case 'forest_slime':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect x="6" y="14" width="20" height="12" fill="#38b000" />
          <Rect x="8" y="10" width="16" height="6" fill="#70e000" />
          <Rect x="10" y="8" width="12" height="3" fill="#9ef01a" />
          <Rect x="4" y="22" width="24" height="4" fill="#2b9348" />
          {/* Eyes & Highlight */}
          <Rect x="10" y="13" width="3" height="3" fill="#ffffff" />
          <Rect x="11" y="16" width="3" height="3" fill="#111111" />
          <Rect x="18" y="16" width="3" height="3" fill="#111111" />
          <Rect x="12" y="16" width="1" height="1" fill="#ffd152" />
          <Rect x="19" y="16" width="1" height="1" fill="#ffd152" />
        </Svg>
      );

    case 'wild_wolf':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Body & Tail */}
          <Rect x="8" y="14" width="16" height="8" fill="#6c757d" />
          <Rect x="22" y="11" width="6" height="5" fill="#495057" />
          {/* Head & Ears */}
          <Rect x="4" y="10" width="10" height="8" fill="#adb5bd" />
          <Rect x="6" y="6" width="3" height="4" fill="#495057" />
          <Rect x="11" y="6" width="3" height="4" fill="#495057" />
          {/* Snout, Fangs & Eye */}
          <Rect x="2" y="13" width="4" height="4" fill="#dee2e6" />
          <Rect x="3" y="17" width="2" height="2" fill="#ffffff" />
          <Rect x="6" y="12" width="3" height="2" fill="#ff2a55" />
          {/* Legs */}
          <Rect x="8" y="22" width="3" height="6" fill="#495057" />
          <Rect x="13" y="22" width="3" height="6" fill="#343a40" />
          <Rect x="19" y="22" width="3" height="6" fill="#495057" />
        </Svg>
      );

    case 'wood_golem':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Mossy Canopy Top */}
          <Rect x="6" y="3" width="20" height="7" fill="#38b000" />
          <Rect x="4" y="6" width="24" height="5" fill="#2d6a4f" />
          {/* Bark Torso & Head */}
          <Rect x="8" y="10" width="16" height="14" fill="#7f4f24" />
          <Rect x="10" y="12" width="12" height="10" fill="#9c6644" />
          {/* Glowing Eyes & Mouth */}
          <Rect x="11" y="13" width="3" height="3" fill="#ffd152" />
          <Rect x="18" y="13" width="3" height="3" fill="#ffd152" />
          <Rect x="12" y="18" width="8" height="2" fill="#3d2210" />
          {/* Massive Wood Arms & Legs */}
          <Rect x="3" y="11" width="5" height="13" fill="#582f0e" />
          <Rect x="24" y="11" width="5" height="13" fill="#582f0e" />
          <Rect x="9" y="24" width="5" height="6" fill="#582f0e" />
          <Rect x="18" y="24" width="5" height="6" fill="#582f0e" />
        </Svg>
      );

    case 'cave_bat':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Wings */}
          <Polygon points="2,10 12,14 10,22 2,18" fill="#7209b7" />
          <Polygon points="30,10 20,14 22,22 30,18" fill="#7209b7" />
          {/* Body & Ears */}
          <Rect x="11" y="11" width="10" height="10" fill="#3c096c" />
          <Rect x="11" y="7" width="3" height="4" fill="#5a189a" />
          <Rect x="18" y="7" width="3" height="4" fill="#5a189a" />
          {/* Glowing Eyes & Fangs */}
          <Rect x="12" y="14" width="2" height="2" fill="#ff2a55" />
          <Rect x="18" y="14" width="2" height="2" fill="#ff2a55" />
          <Rect x="14" y="18" width="1" height="2" fill="#ffffff" />
          <Rect x="17" y="18" width="1" height="2" fill="#ffffff" />
        </Svg>
      );

    case 'skeleton_warrior':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Skull & Ribs */}
          <Rect x="11" y="5" width="10" height="9" fill="#f8f9fa" />
          <Rect x="12" y="8" width="3" height="3" fill="#e63946" />
          <Rect x="17" y="8" width="3" height="3" fill="#e63946" />
          <Rect x="11" y="15" width="10" height="9" fill="#dee2e6" />
          <Rect x="12" y="17" width="8" height="2" fill="#495057" />
          <Rect x="12" y="20" width="8" height="2" fill="#495057" />
          {/* Sword (Left) & Shield (Right) */}
          <Rect x="4" y="8" width="3" height="14" fill="#adb5bd" />
          <Rect x="3" y="19" width="5" height="2" fill="#ffd152" />
          <Circle cx="24" cy="18" r="5" fill="#9c6644" stroke="#ffd152" strokeWidth="1.5" />
          {/* Bone Legs */}
          <Rect x="12" y="24" width="3" height="6" fill="#f8f9fa" />
          <Rect x="17" y="24" width="3" height="6" fill="#f8f9fa" />
        </Svg>
      );

    case 'witch_encounter':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Pointed Witch Hat */}
          <Polygon points="16,2 10,11 22,11" fill="#3c096c" />
          <Rect x="7" y="10" width="18" height="3" fill="#5a189a" />
          {/* Face & Hair */}
          <Rect x="11" y="13" width="10" height="6" fill="#f3d5b5" />
          <Rect x="12" y="15" width="2" height="2" fill="#f72585" />
          <Rect x="18" y="15" width="2" height="2" fill="#f72585" />
          {/* Purple Cloak */}
          <Polygon points="10,19 22,19 25,30 7,30" fill="#7209b7" />
          <Rect x="14" y="19" width="4" height="11" fill="#f72585" />
          {/* Magic Staff & Glowing Orb */}
          <Rect x="25" y="9" width="2" height="21" fill="#ffd152" />
          <Circle cx="26" cy="8" r="3.5" fill="#f72585" />
        </Svg>
      );

    case 'ice_wolf':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect x="8" y="14" width="16" height="8" fill="#48cae4" />
          <Polygon points="10,14 13,9 16,14 19,8 22,14" fill="#caf0f8" />
          <Rect x="4" y="10" width="10" height="8" fill="#90e0ef" />
          <Rect x="6" y="6" width="3" height="4" fill="#0077b6" />
          <Rect x="11" y="6" width="3" height="4" fill="#0077b6" />
          <Rect x="6" y="12" width="3" height="2" fill="#ffffff" />
          <Rect x="8" y="22" width="3" height="6" fill="#0096c7" />
          <Rect x="19" y="22" width="3" height="6" fill="#0096c7" />
        </Svg>
      );

    case 'ice_golem':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect x="7" y="7" width="18" height="17" fill="#0077b6" />
          <Rect x="9" y="9" width="14" height="12" fill="#00b4d8" />
          <Rect x="3" y="9" width="5" height="14" fill="#48cae4" />
          <Rect x="24" y="9" width="5" height="14" fill="#48cae4" />
          <Rect x="11" y="12" width="3" height="3" fill="#caf0f8" />
          <Rect x="18" y="12" width="3" height="3" fill="#caf0f8" />
          <Rect x="9" y="24" width="5" height="6" fill="#023e8a" />
          <Rect x="18" y="24" width="5" height="6" fill="#023e8a" />
        </Svg>
      );

    case 'frost_guardian':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Ice Crown Spikes */}
          <Polygon points="8,8 11,2 14,8 16,1 18,8 21,2 24,8" fill="#90e0ef" />
          {/* Colossal Yeti/Frost Body */}
          <Rect x="5" y="7" width="22" height="18" fill="#caf0f8" />
          <Rect x="8" y="10" width="16" height="12" fill="#48cae4" />
          <Rect x="10" y="12" width="4" height="3" fill="#ffffff" />
          <Rect x="18" y="12" width="4" height="3" fill="#ffffff" />
          <Rect x="11" y="17" width="10" height="3" fill="#03045e" />
          {/* Giant Frost Fists */}
          <Rect x="1" y="10" width="5" height="15" fill="#90e0ef" />
          <Rect x="26" y="10" width="5" height="15" fill="#90e0ef" />
          <Rect x="8" y="25" width="6" height="6" fill="#0077b6" />
          <Rect x="18" y="25" width="6" height="6" fill="#0077b6" />
        </Svg>
      );

    case 'fire_hound':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Flame Mane */}
          <Polygon points="8,14 11,7 15,14 19,6 23,14" fill="#fcbf49" />
          <Rect x="7" y="14" width="17" height="8" fill="#d62828" />
          <Rect x="3" y="10" width="10" height="8" fill="#f77f00" />
          <Rect x="5" y="12" width="3" height="2" fill="#fcbf49" />
          <Rect x="8" y="22" width="3" height="6" fill="#9b2226" />
          <Rect x="19" y="22" width="3" height="6" fill="#9b2226" />
        </Svg>
      );

    case 'shadow_mage':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Polygon points="16,3 8,14 24,14" fill="#240046" />
          <Polygon points="9,13 23,13 26,29 6,29" fill="#3c096c" />
          <Rect x="12" y="10" width="8" height="6" fill="#10002b" />
          <Rect x="13" y="12" width="2" height="2" fill="#f72585" />
          <Rect x="17" y="12" width="2" height="2" fill="#f72585" />
          <Circle cx="7" cy="18" r="3" fill="#c77dff" />
          <Circle cx="25" cy="18" r="3" fill="#f72585" />
        </Svg>
      );

    case 'cursed_knight':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect x="7" y="6" width="18" height="18" fill="#343a40" />
          <Rect x="9" y="8" width="14" height="14" fill="#f77f00" />
          <Rect x="11" y="10" width="10" height="10" fill="#212529" />
          <Rect x="11" y="11" width="3" height="3" fill="#fcbf49" />
          <Rect x="18" y="11" width="3" height="3" fill="#fcbf49" />
          <Rect x="2" y="9" width="5" height="14" fill="#495057" />
          <Rect x="25" y="9" width="5" height="14" fill="#495057" />
          <Rect x="9" y="24" width="5" height="6" fill="#212529" />
          <Rect x="18" y="24" width="5" height="6" fill="#212529" />
        </Svg>
      );

    case 'witch_final':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          {/* Giant Purple Dragon/Bat Wings */}
          <Polygon points="1,6 12,13 10,25 1,20" fill="#7209b7" />
          <Polygon points="31,6 20,13 22,25 31,20" fill="#7209b7" />
          <Polygon points="3,9 11,14 9,22 3,18" fill="#f72585" />
          <Polygon points="29,9 21,14 23,22 29,18" fill="#f72585" />
          {/* Witch Hat & Final Form Body */}
          <Polygon points="16,1 10,10 22,10" fill="#240046" />
          <Rect x="8" y="9" width="16" height="3" fill="#c77dff" />
          <Rect x="12" y="12" width="8" height="5" fill="#e0aaff" />
          <Rect x="13" y="14" width="2" height="2" fill="#ff0055" />
          <Rect x="17" y="14" width="2" height="2" fill="#ff0055" />
          <Polygon points="10,17 22,17 25,30 7,30" fill="#3c096c" />
          <Circle cx="5" cy="14" r="2.5" fill="#ff0055" />
          <Circle cx="27" cy="14" r="2.5" fill="#ff0055" />
        </Svg>
      );
  }
};

export const WarriorArt: React.FC<{ size?: number; attacking?: boolean; blocking?: boolean }> = ({
  size = 56,
  attacking = false,
  blocking = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    {/* Flowing Crimson Cape */}
    <Polygon points="10,12 3,26 12,26 14,14" fill="#c9184a" />
    {/* Brown Hero Hair & Face */}
    <Rect x="11" y="4" width="9" height="5" fill="#582f0e" />
    <Rect x="12" y="8" width="8" height="6" fill="#f3d5b5" />
    <Rect x="17" y="10" width="2" height="2" fill="#1d3557" />
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
    {attacking ? (
      <Path d="M 22 8 L 31 14 L 22 22 Z" fill="#ffd152" />
    ) : (
      <Rect x="22" y="7" width="3" height="12" fill="#e9ecef" />
    )}
  </Svg>
);
