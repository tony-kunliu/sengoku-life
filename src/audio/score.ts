// 乐谱：用日本传统五声音阶写的原创旋律。纯数据 + 纯函数，可测试。
import type { Inst } from './synth';

/** 都节音阶（阴音阶）—— 幽玄、哀愁 */
export const IN = [0, 1, 5, 7, 8];
/** 民谣音阶（阳音阶）—— 明朗、乡野 */
export const YO = [0, 2, 5, 7, 9];
/** 平调子 —— 箏的标准调弦 */
export const HIRA = [0, 2, 3, 7, 8];

export function degToMidi(root: number, scale: number[], deg: number): number {
  const n = scale.length;
  const oct = Math.floor(deg / n);
  const i = ((deg % n) + n) % n;
  return root + 12 * oct + scale[i];
}

export interface NoteEv {
  /** 在本层循环内的拍位置 */
  b: number;
  /** MIDI 音高（打击乐忽略） */
  n: number;
  /** 时值（拍） */
  d: number;
  v: number;
  /** 押手（半音） */
  bend?: number;
}

export interface Layer {
  inst: Inst;
  cycle: number;
  events: NoteEv[];
  /** 每个音符出现的概率（制造变化） */
  prob?: number;
  /** 需要的紧张度（战斗时逐层加入） */
  minIntensity?: number;
  maxIntensity?: number;
}

export interface Theme {
  id: string;
  name: string;
  bpm: number;
  layers: Layer[];
  ambience?: 'rain' | 'wind' | null;
}

/**
 * 旋律记法："度数:拍数" 以空格分隔；"-" 为休止；"|" 只为可读性；
 * 度数加 "~" 表示押手上扬一个半音，例如 "3~:2"。
 */
export function seq(src: string, inst: Inst, root: number, scale: number[], v = 0.6, extra: Partial<Layer> = {}): Layer {
  const events: NoteEv[] = [];
  let b = 0;
  for (const tok of src.trim().split(/\s+/)) {
    if (tok === '|') continue;
    const [degRaw, durRaw] = tok.split(':');
    const d = Number(durRaw ?? 1);
    if (!Number.isFinite(d) || d <= 0) throw new Error(`乐谱时值错误：${tok}`);
    if (degRaw !== '-') {
      const bend = degRaw.endsWith('~') ? 1 : 0;
      const deg = Number(degRaw.replace('~', ''));
      if (!Number.isFinite(deg)) throw new Error(`乐谱音高错误：${tok}`);
      events.push({ b, n: degToMidi(root, scale, deg), d, v, ...(bend ? { bend } : {}) });
    }
    b += d;
  }
  return { inst, cycle: b, events, ...extra };
}

/** 节奏记法：X 重击，x 普通，o 轻，. 休止；step 为每格拍数 */
export function rhythm(src: string, inst: Inst, step: number, v = 0.7, extra: Partial<Layer> = {}): Layer {
  const s = src.replace(/\s|\|/g, '');
  const events: NoteEv[] = [];
  [...s].forEach((c, i) => {
    const amp = c === 'X' ? 1 : c === 'x' ? 0.7 : c === 'o' ? 0.4 : 0;
    if (amp) events.push({ b: i * step, n: 0, d: step, v: v * amp });
  });
  return { inst, cycle: s.length * step, events, ...extra };
}

const D4 = 62;
const D3 = 50;
const D2 = 38;

export const THEMES: Record<string, Theme> = {
  title: {
    id: 'title',
    name: '浮世',
    bpm: 54,
    layers: [
      seq('2:3 3:1 4:2 3:2 2:6 -:2 | 4:3 5:1 6:2 5:2 4:4 3:2 2:2 | 1:3 2:1 3:4 2:2 1:2 0:4 | -:16', 'shaku', D4, IN, 0.55),
      seq('-5:0.5 -3:0.5 0:0.5 2:6.5 -5:0.5 -2:0.5 0:0.5 1~:6.5', 'koto', D4, IN, 0.45, { prob: 0.92 }),
      seq('0:64', 'bell', D2, IN, 0.5),
    ],
    ambience: 'wind',
  },
  town: {
    id: 'town',
    name: '城下町',
    bpm: 100,
    layers: [
      seq('-5:0.5 0:0.5 -1:0.5 0:0.5 -3:0.5 0:0.5 -1:0.5 -2:0.5', 'shamisen', D4, YO, 0.42, { prob: 0.95 }),
      seq(
        '3:1 4:0.5 3:0.5 2:1 1:1 | 2:1 3:1 2:0.5 1:0.5 0:1 | 1:0.5 2:0.5 3:1 5:1 4:1 | 3:2 -:2 | ' +
          '5:1 4:0.5 5:0.5 6:1 5:1 | 4:1 3:1 2:1 3:1 | 2:0.5 1:0.5 0:1 1:1 2:1 | 0:2 -:2',
        'koto',
        D4,
        YO,
        0.6,
      ),
      rhythm('x.o.x.oo', 'shime', 0.5, 0.45, { prob: 0.9 }),
      rhythm('X.......x.x.....', 'taiko', 1, 0.45),
      rhythm('X...............................', 'hyoshigi', 1, 0.6),
    ],
  },
  dojo: {
    id: 'dojo',
    name: '道場',
    bpm: 66,
    layers: [
      rhythm('X..x....X..x...o', 'taiko', 0.5, 0.7),
      seq('-:8 2:4 3:2 2:2 1:6 0:2 -:8 | 4:3 3:1 2:4 1:4 0:4 -:16', 'shaku', D4, IN, 0.5),
      seq('-5:4 -5:4 -4:4 -3~:4', 'koto', D4, IN, 0.32, { prob: 0.9 }),
      rhythm('X...............................', 'hyoshigi', 1, 0.55),
    ],
  },
  teahouse: {
    id: 'teahouse',
    name: '水月',
    bpm: 78,
    layers: [
      seq(
        '4:1 3:1 2:1 3:1 | 4:2 5:2 | 3:1 2:1 1:1 0:1 | 1~:4 | 2:1 3:1 4:1 5:1 | 6:2 5:2 | 4:1 3:1 2:1 1:1 | 0:4',
        'koto',
        D4,
        HIRA,
        0.8,
      ),
      seq('-5:2 -3:2 -4:2 -3:2', 'koto', D4, HIRA, 0.45, { prob: 0.85 }),
      seq('-:16 2:8 0:8', 'shaku', D4, HIRA, 0.4, { prob: 0.7 }),
    ],
  },
  village: {
    id: 'village',
    name: '田園',
    bpm: 72,
    layers: [
      seq('2:2 3:1 4:1 3:2 2:2 | 1:2 2:1 1:1 0:4 | 2:2 3:1 4:1 5:2 4:2 | 3:6 -:2', 'shaku', D4, YO, 0.6),
      seq('-5:1 0:1 -3:1 0:1', 'koto', D4, YO, 0.38, { prob: 0.85 }),
      rhythm('x...............', 'hyoshigi', 1, 0.25, { prob: 0.5 }),
    ],
    ambience: 'wind',
  },
  night: {
    id: 'night',
    name: '前夜',
    bpm: 50,
    layers: [
      seq('0:32', 'bell', D2, IN, 0.55),
      seq('-5:2 -4:2 -3:4 -:8 -5:2 -1:2 -2~:4 -:8', 'koto', D4, IN, 0.4),
      seq('-:8 4:6 3:2 2:8 1:4 0:4', 'shaku', D4, IN, 0.45),
    ],
    ambience: 'rain',
  },
  combat: {
    id: 'combat',
    name: '立合',
    bpm: 126,
    layers: [
      rhythm('X..xX.x.X..xX.xx', 'taiko', 0.5, 0.75),
      rhythm('x.xox.xox.xox.xx', 'shime', 0.25, 0.35, { minIntensity: 1 }),
      seq('0:0.5 0:0.5 1:0.5 0:0.5 3:0.5 2:0.5 1:0.5 0:0.5', 'shamisen', D3, IN, 0.42),
      seq('5:1 -:3 4:1 -:3 3:1 -:1 2:1 -:1 1~:2 -:2', 'koto', D4, IN, 0.5, { minIntensity: 1 }),
      seq('7:4 6:2 5:2 4~:8', 'shaku', D4, IN, 0.4, { minIntensity: 2 }),
      rhythm('X...............', 'hyoshigi', 1, 0.5),
    ],
  },
  ending: {
    id: 'ending',
    name: '浮生',
    bpm: 60,
    layers: [
      seq('4:4 3:2 2:2 3:4 1:4 | 2:4 1:2 0:2 1:8 | 3:4 4:2 5:2 4:4 3:4 | 2:8 0:8', 'shaku', D4, YO, 0.5),
      seq('-5:0.5 -3:0.5 0:0.5 2:2.5 -4:0.5 -2:0.5 1:0.5 3:2.5', 'koto', D4, YO, 0.36),
      seq('0:64', 'bell', D2, YO, 0.45),
    ],
    ambience: 'wind',
  },
};

/** 取出 [from, to) 拍区间内应发声的音符（含循环展开） */
export function eventsInWindow(layer: Layer, from: number, to: number): { at: number; ev: NoteEv }[] {
  const out: { at: number; ev: NoteEv }[] = [];
  const c = layer.cycle;
  const k0 = Math.floor(from / c);
  const k1 = Math.floor((to - 1e-9) / c);
  for (let k = k0; k <= k1; k++) {
    for (const ev of layer.events) {
      const at = k * c + ev.b;
      if (at >= from && at < to) out.push({ at, ev });
    }
  }
  return out;
}

// ═════════════════════ 明快版（祭典与凯歌） ═════════════════════
// 五声音阶的旋律 + 西洋三和弦的弦乐与琶音：日本风味，但明亮、向上。

const CHORDS: Record<string, number[]> = {
  D: [50, 54, 57],
  G: [55, 59, 62],
  A: [57, 61, 64],
  Em: [52, 55, 59],
  Bm: [47, 50, 54],
  C: [48, 52, 55],
};

export interface ChordOpts {
  beats?: number;
  pad?: number;
  bass?: number;
  arp?: number;
  arpInst?: Inst;
  /** 琶音每格拍数（0.5 = 八分音符） */
  arpStep?: number;
  arpMin?: number;
  padMin?: number;
}

/** 由和弦进行生成：弦乐铺底、箏低音、琶音 */
export function chordLayers(prog: string, o: ChordOpts = {}): Layer[] {
  const beats = o.beats ?? 4;
  const names = prog.trim().split(/\s+/);
  for (const n of names) if (!CHORDS[n]) throw new Error(`未知和弦：${n}`);
  const cycle = names.length * beats;
  const layers: Layer[] = [];
  if (o.pad) {
    const ev: NoteEv[] = [];
    names.forEach((n, i) => {
      const [r, t, f] = CHORDS[n];
      for (const m of [r, t, f, r + 12]) ev.push({ b: i * beats, n: m + 12, d: beats, v: o.pad! });
    });
    layers.push({ inst: 'strings', cycle, events: ev, ...(o.padMin != null ? { minIntensity: o.padMin } : {}) });
  }
  if (o.bass) {
    const ev: NoteEv[] = [];
    names.forEach((n, i) => {
      const [r, , f] = CHORDS[n];
      ev.push({ b: i * beats, n: r - 12, d: 2, v: o.bass! });
      ev.push({ b: i * beats + beats / 2, n: f - 12, d: 2, v: o.bass! * 0.8 });
    });
    layers.push({ inst: 'koto', cycle, events: ev });
  }
  if (o.arp) {
    const step = o.arpStep ?? 0.5;
    const pat = [0, 2, 1, 2, 3, 2, 1, 2];
    const ev: NoteEv[] = [];
    names.forEach((n, i) => {
      const [r, t, f] = CHORDS[n];
      const tones = [r + 12, t + 12, f + 12, r + 24];
      for (let k = 0; k * step < beats; k++) ev.push({ b: i * beats + k * step, n: tones[pat[k % pat.length]], d: step, v: o.arp! });
    });
    layers.push({ inst: o.arpInst ?? 'koto', cycle, events: ev, prob: 0.96, ...(o.arpMin != null ? { minIntensity: o.arpMin } : {}) });
  }
  return layers;
}

const D5 = 74;

export const BRIGHT: Record<string, Theme> = {
  title: {
    id: 'title',
    name: '青云之志',
    bpm: 100,
    layers: [
      seq(
        '5:1.5 6:0.5 7:2 | 6:1 5:1 3:2 | 4:1 5:1 6:2 | 5:4 | 7:1.5 8:0.5 9:1 8:1 | 7:1 6:1 5:2 | 4:1 3:1 4:1 6:1 | 5:3 -:1 | ' +
          '3:1.5 4:0.5 5:2 | 4:1 3:1 2:2 | 3:1 4:1 5:1 6:1 | 7:4 | 8:1.5 7:0.5 6:1 5:1 | 6:1 5:1 4:2 | 3:1 4:1 6:1 7:1 | 5:4',
        'fue',
        D4,
        YO,
        0.62,
      ),
      ...chordLayers('D G G D G D Em D D G G G D Em A D', { pad: 0.55, bass: 0.5, arp: 0.32 }),
      rhythm('X.......x...x...', 'taiko', 0.5, 0.5),
      rhythm('..x...x...x...x.', 'kane', 0.5, 0.45),
    ],
  },
  town: {
    id: 'town',
    name: '城下繁华',
    bpm: 124,
    layers: [
      seq(
        '3:0.5 4:0.5 5:1 4:0.5 3:0.5 2:1 | 3:1 5:1 4:2 | 3:0.5 4:0.5 5:1 6:0.5 5:0.5 4:1 | 3:3 -:1 | ' +
          '5:0.5 6:0.5 7:1 6:0.5 5:0.5 4:1 | 5:1 4:1 3:2 | 2:0.5 3:0.5 4:1 3:1 1:1 | 0:3 -:1',
        'fue',
        D5,
        YO,
        0.5,
      ),
      ...chordLayers('D D G A D G A D', { pad: 0.35, bass: 0.55, arp: 0.3, arpInst: 'shamisen' }),
      rhythm('X.x.X.x.X.x.X.xx', 'shime', 0.5, 0.4),
      rhythm('x.ox.ox.x.ox.oxo', 'kane', 0.25, 0.4),
      rhythm('X.......X...x...', 'taiko', 0.5, 0.55),
    ],
  },
  village: {
    id: 'village',
    name: '田植歌',
    bpm: 108,
    layers: [
      seq('2:1 3:1 4:1 3:1 | 2:1 1:1 2:2 | 3:1 4:1 5:1 4:1 | 3:3 -:1 | 5:1 4:1 3:1 4:1 | 5:1 6:1 5:2 | 4:1 3:1 2:1 1:1 | 2:3 -:1', 'fue', D4, YO, 0.6),
      ...chordLayers('G G G D G Em D G', { pad: 0.35, bass: 0.45, arp: 0.24 }),
      rhythm('..x...x...x...x.', 'hyoshigi', 0.5, 0.35),
      rhythm('X.......x.......', 'taiko', 0.5, 0.4),
    ],
    ambience: 'wind',
  },
  teahouse: {
    id: 'teahouse',
    name: '水月小调',
    bpm: 92,
    layers: [
      seq('5:1 4:0.5 3:0.5 4:1 2:1 | 3:2 1:1 2:1 | 3:1 4:1 5:1 6:1 | 5:4 | 6:1 5:0.5 4:0.5 5:1 3:1 | 4:2 2:1 3:1 | 1:1 2:1 3:1 1:1 | 0:4', 'koto', D4, YO, 0.8),
      ...chordLayers('D Em G D Em G A D', { pad: 0.4, bass: 0.4 }),
      seq('-:16 5:4 6:4 7:4 5:4', 'fue', D4, YO, 0.35, { prob: 0.8 }),
      rhythm('..o...o...o...o.', 'kane', 0.5, 0.25),
    ],
  },
  dojo: {
    id: 'dojo',
    name: '朝稽古',
    bpm: 116,
    layers: [
      seq('0:0.5 2:0.5 3:1 5:2 | 4:1 3:1 2:1 3:1 | 3:0.5 5:0.5 6:1 7:2 | 6:1 5:1 4:2 | 5:1 6:1 7:1 8:1 | 7:1 6:1 5:2 | 4:1 5:1 6:1 4:1 | 5:4', 'fue', D4, YO, 0.6),
      ...chordLayers('D G G Em G G A D', { pad: 0.45, bass: 0.55, arp: 0.28 }),
      rhythm('X..xX...X..xX.x.', 'taiko', 0.5, 0.65),
      rhythm('x.x.x.x.x.x.x.x.', 'shime', 0.5, 0.3),
      rhythm('X...............', 'hyoshigi', 1, 0.5),
    ],
  },
  night: {
    id: 'night',
    name: '决意之夜',
    bpm: 76,
    layers: [
      seq('2:2 3:1 4:1 | 5:3 4:1 | 3:2 2:1 1:1 | 2:4 | 4:2 5:1 6:1 | 7:3 6:1 | 5:1 4:1 3:1 1:1 | 2:4', 'shaku', D4, YO, 0.5),
      ...chordLayers('G G Em G Em G D G', { pad: 0.5, bass: 0.35 }),
      seq('0:32', 'bell', D2, YO, 0.4),
      rhythm('X...............', 'taiko', 0.5, 0.35),
    ],
    ambience: 'rain',
  },
  combat: {
    id: 'combat',
    name: '一骑讨',
    bpm: 140,
    layers: [
      seq('4:1 5:1 6:2 | 5:1 4:1 2:2 | 3:1 4:1 5:1 3:1 | 5:4 | 6:1 7:1 8:2 | 7:1 6:1 5:2 | 4:1 5:1 6:1 8:1 | 9:2 8:2', 'fue', D4, YO, 0.58),
      seq('4:1 5:1 6:2 | 5:1 4:1 2:2 | 3:1 4:1 5:1 3:1 | 5:4 | 6:1 7:1 8:2 | 7:1 6:1 5:2 | 4:1 5:1 6:1 8:1 | 9:2 8:2', 'shamisen', D3, YO, 0.45, {
        minIntensity: 2,
      }),
      ...chordLayers('Bm G A D Em G A D', { pad: 0.5, bass: 0.6, arp: 0.3, arpMin: 1 }),
      rhythm('X.xxX.x.X.xxX.xx', 'taiko', 0.5, 0.75),
      rhythm('x.ox.ox.x.ox.oxo', 'kane', 0.25, 0.35, { minIntensity: 1 }),
      rhythm('xxoxxxoxxxoxxxxx', 'shime', 0.25, 0.28, { minIntensity: 2 }),
    ],
  },
  ending: {
    id: 'ending',
    name: '凯旋',
    bpm: 96,
    layers: [
      seq('5:2 6:1 7:1 | 8:3 7:1 | 6:1 5:1 6:1 7:1 | 5:4 | 7:1.5 6:0.5 5:1 4:1 | 5:1 6:1 4:2 | 3:1 4:1 5:1 6:1 | 5:4', 'fue', D4, YO, 0.62),
      ...chordLayers('D G Em D G D A D', { pad: 0.55, bass: 0.5, arp: 0.3 }),
      rhythm('X.......x...x...', 'taiko', 0.5, 0.5),
      rhythm('..x...x...x...x.', 'kane', 0.5, 0.4),
      seq('0:32', 'bell', D2, YO, 0.35),
    ],
  },
};

export type MusicStyle = 'bright' | 'classic';

export const STYLE_LABEL: Record<MusicStyle, string> = { bright: '明快', classic: '古朴' };

export function getTheme(id: string, style: MusicStyle): Theme {
  const set = style === 'classic' ? THEMES : BRIGHT;
  return set[id] ?? set.title;
}
