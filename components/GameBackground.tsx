import React from 'react';
import { Image, Text, View } from 'react-native';
import { WORLD_BACKGROUNDS } from '../constants/gameAssets';

interface Theme {
  skyTop: string;
  skyBottom: string;
  far: string;
  farKind: 'mountain' | 'spire' | 'stalactite';
  mid: string;
  midAccent: string;
  midKind: 'tree' | 'crystal' | 'pine' | 'tower';
  mist: string;
  orb: string | null;
  particle: string;
  particleMode: 'firefly' | 'dust' | 'snow' | 'ember' | 'spark';
  decorEmoji: string;
}

const THEMES: Record<number, Theme> = {
  1: {
    skyTop: '#0f3a30', skyBottom: '#4c9a76', far: '#2d6f5a', farKind: 'mountain',
    mid: '#1d5a44', midAccent: '#3b2a1a', midKind: 'tree', mist: 'rgba(190,240,210,0.18)',
    orb: '#fff3b0', particle: '#d9f99d', particleMode: 'firefly', decorEmoji: '🍄',
  },
  2: {
    skyTop: '#0b0920', skyBottom: '#2d2260', far: '#1b1545', farKind: 'stalactite',
    mid: '#5b3bbd', midAccent: '#c77dff', midKind: 'crystal', mist: 'rgba(140,100,255,0.15)',
    orb: null, particle: '#c77dff', particleMode: 'dust', decorEmoji: '🔥',
  },
  3: {
    skyTop: '#0b2c4d', skyBottom: '#76bde3', far: '#5890bd', farKind: 'mountain',
    mid: '#2c6a8f', midAccent: '#e8f7ff', midKind: 'pine', mist: 'rgba(230,248,255,0.22)',
    orb: '#e8f7ff', particle: '#ffffff', particleMode: 'snow', decorEmoji: '❄️',
  },
  4: {
    skyTop: '#2a0710', skyBottom: '#85202c', far: '#431019', farKind: 'spire',
    mid: '#1c0509', midAccent: '#ff9f1c', midKind: 'tower', mist: 'rgba(255,90,60,0.15)',
    orb: '#ff4d4d', particle: '#ff9f1c', particleMode: 'ember', decorEmoji: '🔥',
  },
  5: {
    skyTop: '#130320', skyBottom: '#5e1b92', far: '#2b0d47', farKind: 'spire',
    mid: '#12031c', midAccent: '#f72585', midKind: 'tower', mist: 'rgba(224,170,255,0.16)',
    orb: '#e0aaff', particle: '#e0aaff', particleMode: 'spark', decorEmoji: '🔮',
  },
};

function hex(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}
function rnd(i: number, salt = 0): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const T = 'transparent';
const tri = (key: string, x: number, w: number, hh: number, bottom: number, color: string) => (
  <View
    key={key}
    style={{
      position: 'absolute', left: x, top: bottom - hh, width: 0, height: 0,
      borderLeftWidth: w / 2, borderRightWidth: w / 2, borderBottomWidth: hh,
      borderLeftColor: T, borderRightColor: T, borderBottomColor: color,
    }}
  />
);
const invTri = (key: string, x: number, w: number, hh: number, color: string) => (
  <View
    key={key}
    style={{
      position: 'absolute', left: x, top: 0, width: 0, height: 0,
      borderLeftWidth: w / 2, borderRightWidth: w / 2, borderTopWidth: hh,
      borderLeftColor: T, borderRightColor: T, borderTopColor: color,
    }}
  />
);
const box = (key: string, x: number, y: number, w: number, h: number, color: string, r = 0) => (
  <View key={key} style={{ position: 'absolute', left: x, top: y, width: w, height: h, backgroundColor: color, borderRadius: r }} />
);

const PERIOD = 520;

function farContent(th: Theme, h: number, horizon: number) {
  const els: React.ReactElement[] = [];
  const xs = [-30, 150, 330, 440];
  xs.forEach((x, i) => {
    const hh = Math.min(h * (0.34 + rnd(i, 1) * 0.22), horizon - 10);
    const w = 190 + rnd(i, 2) * 120;
    if (th.farKind === 'stalactite') {
      els.push(invTri(`f${i}`, x, w * 0.5, hh * 0.9, th.far));
      els.push(invTri(`g${i}`, x + 90, w * 0.35, hh * 0.6, th.far));
    } else if (th.farKind === 'spire') {
      els.push(tri(`f${i}`, x, w * 0.55, hh * 1.1, horizon, th.far));
    } else {
      els.push(tri(`f${i}`, x, w, hh, horizon, th.far));
      els.push(tri(`c${i}`, x + w * 0.37, w * 0.26, hh * 0.24, horizon - hh * 0.76, 'rgba(255,255,255,0.22)'));
    }
  });
  return els;
}

function midContent(th: Theme, h: number, horizon: number) {
  const els: React.ReactElement[] = [];
  const xs = [10, 105, 205, 300, 395, 470];
  xs.forEach((x, i) => {
    const hh = Math.min(h * (0.36 + rnd(i, 5) * 0.2), horizon - 16);
    if (th.midKind === 'tree') {
      const tw = Math.max(8, hh * 0.09);
      els.push(box(`t${i}`, x + 20, horizon - hh * 0.55, tw, hh * 0.55, th.midAccent));
      const c = hh * 0.5;
      els.push(box(`a${i}`, x - 2, horizon - hh * 0.95, c, c, th.mid, c / 2));
      els.push(box(`b${i}`, x + c * 0.55, horizon - hh * 1.05, c * 0.9, c * 0.9, mix(th.mid, '#2f8a5f', 0.35), c / 2));
      els.push(box(`d${i}`, x + c * 0.2, horizon - hh * 0.78, c * 0.9, c * 0.8, th.mid, c / 2));
    } else if (th.midKind === 'pine') {
      const w = hh * 0.5;
      els.push(box(`t${i}`, x + w / 2 - 3, horizon - hh * 0.2, 6, hh * 0.2, '#3b2a1a'));
      els.push(tri(`p1${i}`, x, w, hh * 0.45, horizon - hh * 0.15, th.mid));
      els.push(tri(`p2${i}`, x + w * 0.1, w * 0.8, hh * 0.4, horizon - hh * 0.4, th.mid));
      els.push(tri(`p3${i}`, x + w * 0.2, w * 0.6, hh * 0.35, horizon - hh * 0.65, mix(th.mid, th.midAccent, 0.5)));
    } else if (th.midKind === 'crystal') {
      const s = hh * 0.28;
      els.push(
        <View key={`cr${i}`} style={{ position: 'absolute', left: x, top: horizon - s * 1.2, width: s, height: s * 1.8, backgroundColor: th.mid, borderColor: th.midAccent, borderWidth: 1.5, transform: [{ rotate: '8deg' }], borderRadius: 3 }} />
      );
      els.push(box(`cs${i}`, x + s * 0.9, horizon - s * 0.6, s * 0.5, s, th.midAccent, 2));
    } else {
      const w = 34 + rnd(i, 7) * 22;
      els.push(box(`tw${i}`, x, horizon - hh * 0.9, w, hh * 0.9, th.mid));
      els.push(tri(`rf${i}`, x - 4, w + 8, hh * 0.25, horizon - hh * 0.9, th.mid));
      els.push(box(`w1${i}`, x + w * 0.35, horizon - hh * 0.7, 5, 9, th.midAccent, 1));
      els.push(box(`w2${i}`, x + w * 0.35, horizon - hh * 0.45, 5, 9, th.midAccent, 1));
    }
  });
  return els;
}

interface BgProps {
  worldId: number;
  cameraX: number;
  width: number;
  height: number;
  horizonY: number;
  t: number;
}

function tiles(width: number, cam: number, factor: number, content: React.ReactElement[], key: string) {
  const shift = (cam * factor) % PERIOD;
  const count = Math.ceil(width / PERIOD) + 2;
  const out: React.ReactElement[] = [];
  for (let k = 0; k < count; k++) {
    out.push(
      <View key={`${key}${k}`} style={{ position: 'absolute', left: k * PERIOD - shift, top: 0, width: PERIOD, height: '100%' }}>
        {content}
      </View>
    );
  }
  return out;
}

const BackgroundImpl: React.FC<BgProps> = ({ worldId, cameraX, width, height, horizonY, t }) => {
  const th = THEMES[worldId] || THEMES[1];
  const bgImg = WORLD_BACKGROUNDS[worldId];
  const parts: React.ReactElement[] = [];

  if (bgImg) {
    const bgWidth = Math.max(width * 1.5, 960);
    const bgShift = (cameraX * 0.12) % (bgWidth - width);
    parts.push(
      <Image
        key="bgImg"
        source={bgImg}
        resizeMode="cover"
        style={{
          position: 'absolute',
          left: -bgShift,
          top: 0,
          width: bgWidth,
          height: height,
        }}
      />
    );
  } else {
    const bands = 9;
    for (let i = 0; i < bands; i++) {
      parts.push(
        <View key={`s${i}`} style={{ position: 'absolute', left: 0, right: 0, top: (height / bands) * i, height: height / bands + 1, backgroundColor: mix(th.skyTop, th.skyBottom, i / (bands - 1)) }} />
      );
    }
    if (th.orb) {
      parts.push(
        <View key="orb" style={{ position: 'absolute', left: width * 0.74 - ((cameraX * 0.02) % 40), top: height * 0.1, width: 46, height: 46, borderRadius: 23, backgroundColor: th.orb, opacity: 0.55 }} />
      );
    }
    parts.push(...tiles(width, cameraX, 0.12, farContent(th, height, horizonY), 'far'));
    parts.push(<View key="mist1" style={{ position: 'absolute', left: 0, right: 0, top: horizonY - 56, height: 56, backgroundColor: th.mist }} />);
    parts.push(...tiles(width, cameraX, 0.32, midContent(th, height, horizonY), 'mid'));
    parts.push(<View key="mist2" style={{ position: 'absolute', left: 0, right: 0, top: horizonY - 24, height: 24, backgroundColor: th.mist }} />);
  }

  // Atmospheric particles
  for (let i = 0; i < 16; i++) {
    const sx = rnd(i, 11) * width;
    const sy = rnd(i, 12) * horizonY;
    const size = 2 + rnd(i, 13) * 2.5;
    let x = sx;
    let y = sy;
    if (th.particleMode === 'snow') {
      y = (sy + t * (0.9 + rnd(i, 14))) % horizonY;
      x = (sx + Math.sin(t / 8 + i) * 8 + width) % width;
    } else if (th.particleMode === 'ember') {
      y = horizonY - ((horizonY - sy + t * (0.8 + rnd(i, 14))) % horizonY);
      x = (sx + Math.sin(t / 6 + i) * 6 + width) % width;
    } else if (th.particleMode === 'dust') {
      x = (sx + t * 0.3 + width) % width;
      y = sy + Math.sin(t / 10 + i) * 6;
    } else {
      x = (sx + Math.sin(t / 12 + i) * 14 + width) % width;
      y = sy + Math.cos(t / 9 + i) * 10;
    }
    const blink = th.particleMode === 'firefly' || th.particleMode === 'spark' ? 0.4 + 0.6 * Math.abs(Math.sin(t / 5 + i)) : 0.8;
    parts.push(
      <View key={`pt${i}`} style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size, backgroundColor: th.particle, opacity: blink }} />
    );
  }

  if (worldId === 5 && t % 70 < 2) {
    parts.push(<View key="flash" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.22)' }} />);
  }
  return <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>{parts}</View>;
};

export const ParallaxBackground = React.memo(BackgroundImpl);

// ---------------------------------------------------------------------------
// Foreground: ground texture + decorations, drawn in LOGICAL stage coordinates
// ---------------------------------------------------------------------------
interface DecorProps {
  worldId: number;
  levelLength: number;
  cameraX: number;
  viewW: number;
  groundY: number;
  stageH: number;
  groundColor: string;
  groundTop: string;
}

const DecorImpl: React.FC<DecorProps> = ({ worldId, levelLength, cameraX, viewW, groundY, stageH, groundColor, groundTop }) => {
  const th = THEMES[worldId] || THEMES[1];
  const els: React.ReactElement[] = [];
  const dark = mix('#000000', groundColor.length === 7 ? groundColor : '#2b4c3f', 0.55);
  const light = mix(groundColor.length === 7 ? groundColor : '#2b4c3f', '#ffffff', 0.12);

  // Ground body
  els.push(<View key="gb" style={{ position: 'absolute', left: 0, top: groundY, width: viewW, height: stageH - groundY, backgroundColor: groundColor }} />);
  // Bricks
  const bw = 34;
  const first = Math.floor(cameraX / bw) - 1;
  const n = Math.ceil(viewW / bw) + 3;
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < n; i++) {
      const idx = first + i;
      const x = idx * bw - cameraX + (r % 2 ? bw / 2 : 0);
      const shade = rnd(idx + r * 91, 3) > 0.5 ? dark : light;
      els.push(<View key={`br${r}_${i}`} style={{ position: 'absolute', left: x, top: groundY + 10 + r * 13, width: bw - 3, height: 10, backgroundColor: shade, borderRadius: 2, opacity: 0.55 }} />);
    }
  }
  // Grass top strip + tufts
  els.push(<View key="gt" style={{ position: 'absolute', left: 0, top: groundY - 2, width: viewW, height: 7, backgroundColor: groundTop }} />);
  const tf = Math.floor(cameraX / 14) - 1;
  const tn = Math.ceil(viewW / 14) + 3;
  for (let i = 0; i < tn; i++) {
    const idx = tf + i;
    const hh = 3 + Math.floor(rnd(idx, 4) * 6);
    els.push(<View key={`tuft${i}`} style={{ position: 'absolute', left: idx * 14 - cameraX, top: groundY - 2 - hh, width: 3, height: hh, backgroundColor: groundTop }} />);
  }

  // Decorations
  const step = 150;
  const i0 = Math.max(0, Math.floor((cameraX - 80) / step));
  const i1 = Math.min(Math.floor(levelLength / step), Math.ceil((cameraX + viewW + 80) / step));
  for (let i = i0; i <= i1; i++) {
    const r = rnd(i, 21);
    if (r > 0.82 || i < 1) continue;
    const x = i * step + rnd(i, 22) * 70 - cameraX;
    const kind = Math.floor(rnd(i, 23) * 5);
    if (kind === 0) {
      els.push(<View key={`d${i}`} style={{ position: 'absolute', left: x, top: groundY - 26, width: 20, height: 27, backgroundColor: '#7f4f24', borderRadius: 5, borderWidth: 1.5, borderColor: '#4a2c12' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 6, height: 3, backgroundColor: '#d4a338' }} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: 17, height: 3, backgroundColor: '#d4a338' }} />
      </View>);
    } else if (kind === 1) {
      els.push(<View key={`d${i}`} style={{ position: 'absolute', left: x, top: groundY - 21, width: 22, height: 22, backgroundColor: '#9c6644', borderWidth: 2, borderColor: '#582f0e' }}>
        <View style={{ position: 'absolute', left: 8, top: 0, width: 2, height: 18, backgroundColor: '#582f0e' }} />
      </View>);
    } else if (kind === 2) {
      els.push(<View key={`d${i}`} style={{ position: 'absolute', left: x, top: groundY - 54, width: 18, height: 55, backgroundColor: '#6c757d', borderWidth: 1.5, borderColor: '#343a40' }}>
        <View style={{ position: 'absolute', left: -3, top: -5, width: 24, height: 7, backgroundColor: '#868e96' }} />
        <View style={{ position: 'absolute', left: 0, top: 18, width: 18, height: 5, backgroundColor: groundTop, opacity: 0.8 }} />
      </View>);
    } else if (kind === 3) {
      els.push(<Text key={`d${i}`} style={{ position: 'absolute', left: x, top: groundY - 20, fontSize: 18 }}>{th.decorEmoji}</Text>);
    } else {
      els.push(<View key={`d${i}`} style={{ position: 'absolute', left: x, top: groundY - 14, width: 30, height: 15 }}>
        <View style={{ position: 'absolute', left: 0, top: 4, width: 14, height: 12, borderRadius: 7, backgroundColor: mix(groundTop, '#000000', 0.35) }} />
        <View style={{ position: 'absolute', left: 9, top: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: mix(groundTop, '#000000', 0.2) }} />
      </View>);
    }
  }
  return <>{els}</>;
};

export const WorldDecor = React.memo(DecorImpl);
