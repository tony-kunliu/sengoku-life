// 古乐器合成：全部用 Web Audio 实时合成，不含任何外部音频素材。
// 箏（koto）与三味线：Karplus-Strong 拨弦；尺八：带气声的笛音；
// 太鼓 / 缔太鼓 / 拍子木 / 木刀：打击合成；梵钟 / 铃：非谐波泛音。

export type Inst =
  | 'koto'
  | 'shamisen'
  | 'shaku'
  | 'fue'
  | 'strings'
  | 'kane'
  | 'taiko'
  | 'shime'
  | 'hyoshigi'
  | 'bokuto'
  | 'bell'
  | 'rin';

export const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export interface Bus {
  ctx: AudioContext;
  out: AudioNode;
  /** 混响送出 */
  verb: AudioNode;
}

const ksCache = new Map<string, AudioBuffer>();
let noiseBuf: AudioBuffer | null = null;

export function noise(ctx: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  const len = ctx.sampleRate * 2;
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = b;
  return b;
}

/** Karplus-Strong 拨弦。用整数延迟线生成，再用 playbackRate 修正音高误差。 */
function ksBuffer(ctx: AudioContext, freq: number, kind: 'koto' | 'shamisen'): { buf: AudioBuffer; rate: number } {
  const sr = ctx.sampleRate;
  const N = Math.max(8, Math.round(sr / freq));
  const key = `${kind}-${N}-${sr}`;
  const rate = freq / (sr / N);
  const hit = ksCache.get(key);
  if (hit) return { buf: hit, rate };
  const t60 = kind === 'koto' ? Math.min(3.2, 2600 / freq + 0.6) : 1.1;
  const dur = Math.min(3.4, t60 + 0.2);
  const len = Math.floor(sr * dur);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const ring = new Float32Array(N);
  // 激励：箏较柔（低通的噪声），三味线较亮（拨子）
  const bright = kind === 'koto' ? 0.45 : 0.85;
  let p = 0;
  for (let i = 0; i < N; i++) {
    p += bright * (Math.random() * 2 - 1 - p);
    ring[i] = p;
  }
  // 拨弦位置：减去延迟的副本，产生梳状频谱（箏在靠近龙角处弹奏）
  const pos = Math.max(1, Math.round(N * (kind === 'koto' ? 0.18 : 0.08)));
  const copy = ring.slice();
  for (let i = 0; i < N; i++) ring[i] = copy[i] - 0.7 * copy[(i + N - pos) % N];
  const g = Math.min(0.99995, Math.pow(10, -3 / (t60 * freq)));
  let idx = 0;
  let peak = 0;
  for (let n = 0; n < len; n++) {
    const cur = ring[idx];
    const nxt = ring[(idx + 1) % N];
    ring[idx] = g * (0.5 * (cur + nxt));
    let v = cur;
    // 三味线的“さわり”：轻微的削波，带出沙沙的共鸣
    if (kind === 'shamisen') v = Math.tanh(v * 2.2) * 0.7;
    d[n] = v;
    peak = Math.max(peak, Math.abs(v));
    idx = (idx + 1) % N;
  }
  // 结尾淡出，避免爆音
  const fade = Math.floor(sr * 0.08);
  for (let n = 0; n < fade; n++) d[len - 1 - n] *= n / fade;
  if (peak > 0) for (let n = 0; n < len; n++) d[n] *= 0.85 / peak;
  ksCache.set(key, buf);
  return { buf, rate };
}

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function pluck(bus: Bus, kind: 'koto' | 'shamisen', freq: number, t: number, v: number, dur: number, bend = 0) {
  const { ctx } = bus;
  const { buf, rate } = ksBuffer(ctx, freq, kind);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.setValueAtTime(rate, t);
  // 押手：弦被按下，音高缓缓上扬（箏的特有表情）
  if (bend) src.playbackRate.linearRampToValueAtTime(rate * Math.pow(2, bend / 12), t + 0.35);
  const g = ctx.createGain();
  g.gain.value = v * (kind === 'koto' ? 0.85 : 0.55);
  const pan = ctx.createStereoPanner();
  pan.pan.value = kind === 'koto' ? -0.25 + Math.random() * 0.2 : 0.25;
  src.connect(g).connect(pan);
  pan.connect(bus.out);
  pan.connect(bus.verb);
  const stop = Math.min(buf.duration / rate, Math.max(dur + 0.6, kind === 'koto' ? 2.5 : 1.0));
  if (stop < buf.duration / rate) {
    g.gain.setValueAtTime(g.gain.value, t + stop - 0.15);
    g.gain.linearRampToValueAtTime(0, t + stop);
  }
  src.start(t);
  src.stop(t + stop + 0.02);
  if (kind === 'shamisen') {
    // 拨子击打琴皮的“啪”
    const n = ctx.createBufferSource();
    n.buffer = noise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400;
    bp.Q.value = 1.2;
    const ng = ctx.createGain();
    env(ng, t, v * 0.12, 0.002, 0.04);
    n.connect(bp).connect(ng).connect(bus.out);
    n.start(t, Math.random());
    n.stop(t + 0.08);
  }
}

/** 尺八：三角波 + 泛音 + 带通气声，起音带“メリ”（低起）与延迟揉音 */
function shakuhachi(bus: Bus, freq: number, t: number, v: number, dur: number) {
  const { ctx } = bus;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o.frequency.setValueAtTime(freq * 0.965, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.18);
  o2.frequency.setValueAtTime(freq * 2 * 0.965, t);
  o2.frequency.exponentialRampToValueAtTime(freq * 2, t + 0.18);
  // 揉音
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 4.6 + Math.random() * 0.8;
  const lg = ctx.createGain();
  lg.gain.setValueAtTime(0, t);
  lg.gain.linearRampToValueAtTime(0, t + Math.min(0.5, dur * 0.4));
  lg.gain.linearRampToValueAtTime(freq * 0.012, t + Math.min(1.2, dur * 0.8));
  lfo.connect(lg);
  lg.connect(o.frequency);
  lg.connect(o2.frequency);
  const o2g = ctx.createGain();
  o2g.gain.value = 0.18;
  // 气声
  const n = ctx.createBufferSource();
  n.buffer = noise(ctx);
  n.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq * 2.2;
  bp.Q.value = 1.4;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(v * 0.5, t + 0.05); // 吹口的“ムラ息”
  ng.gain.exponentialRampToValueAtTime(v * 0.09, t + 0.35);
  ng.gain.setValueAtTime(v * 0.09, t + dur);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(4200, freq * 5);
  const g = ctx.createGain();
  const peak = v * 0.36;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.14);
  g.gain.setValueAtTime(peak, t + Math.max(0.15, dur - 0.05));
  // 收尾的“吹き切り”：微微下坠
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);
  o.connect(lp);
  o2.connect(o2g).connect(lp);
  n.connect(bp).connect(ng).connect(lp);
  lp.connect(g);
  const pan = ctx.createStereoPanner();
  pan.pan.value = 0.1;
  g.connect(pan);
  pan.connect(bus.out);
  pan.connect(bus.verb);
  const end = t + dur + 0.45;
  for (const s of [o, o2, lfo]) {
    s.start(t);
    s.stop(end);
  }
  n.start(t, Math.random());
  n.stop(end);
}

function drum(bus: Bus, t: number, v: number, f0: number, f1: number, decay: number, noiseLp: number, noiseAmt: number) {
  const { ctx } = bus;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + decay * 0.6);
  const g = ctx.createGain();
  env(g, t, v, 0.004, decay);
  o.connect(g);
  g.connect(bus.out);
  g.connect(bus.verb);
  o.start(t);
  o.stop(t + decay + 0.1);
  const n = ctx.createBufferSource();
  n.buffer = noise(ctx);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = noiseLp;
  const ng = ctx.createGain();
  env(ng, t, v * noiseAmt, 0.002, 0.07);
  n.connect(lp).connect(ng).connect(bus.out);
  n.start(t, Math.random());
  n.stop(t + 0.15);
}

/** 木头相击：拍子木（清脆）或木刀（闷） */
function wood(bus: Bus, t: number, v: number, freq: number, q: number, decay: number) {
  const { ctx } = bus;
  const n = ctx.createBufferSource();
  n.buffer = noise(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = ctx.createGain();
  env(g, t, v * 1.6, 0.001, decay);
  n.connect(bp).connect(g);
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(freq * 0.8, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.7, t + decay);
  const og = ctx.createGain();
  env(og, t, v * 0.35, 0.001, decay * 0.8);
  o.connect(og);
  g.connect(bus.out);
  og.connect(bus.out);
  g.connect(bus.verb);
  n.start(t, Math.random());
  n.stop(t + decay + 0.05);
  o.start(t);
  o.stop(t + decay + 0.05);
}

/** 钟：非谐波泛音 + 成对微失谐产生“うなり”（拍频） */
function bell(bus: Bus, freq: number, t: number, v: number, big: boolean) {
  const { ctx } = bus;
  const partials = big ? [0.5, 1, 1.183, 1.506, 2, 2.514, 2.662, 3.011] : [1, 2.32, 4.25, 6.63];
  const decay = big ? 7 : 2.6;
  partials.forEach((p, i) => {
    for (const det of big ? [1, 1.0035] : [1]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * p * det;
      const g = ctx.createGain();
      const amp = (v * (big ? 0.22 : 0.18)) / (1 + i * (big ? 0.55 : 0.9));
      const d = decay / (1 + i * 0.35);
      env(g, t, amp, big ? 0.012 : 0.003, d);
      o.connect(g);
      g.connect(bus.out);
      g.connect(bus.verb);
      o.start(t);
      o.stop(t + d + 0.1);
    }
  });
  if (big) {
    // 撞木击钟的闷响
    drum(bus, t, v * 0.25, 140, 70, 0.4, 300, 0.5);
  }
}

/** 篠笛：比尺八明亮、起音快、揉音密，祭典和明快曲子的主旋律 */
function fue(bus: Bus, freq: number, t: number, v: number, dur: number) {
  const { ctx } = bus;
  const o = ctx.createOscillator();
  o.type = 'sine';
  const o2 = ctx.createOscillator();
  o2.type = 'triangle';
  o.frequency.setValueAtTime(freq * 0.985, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
  o2.frequency.setValueAtTime(freq * 0.985, t);
  o2.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.8 + Math.random() * 0.6;
  const lg = ctx.createGain();
  lg.gain.setValueAtTime(0, t);
  lg.gain.linearRampToValueAtTime(0, t + Math.min(0.25, dur * 0.5));
  lg.gain.linearRampToValueAtTime(freq * 0.009, t + Math.min(0.6, dur * 0.9));
  lfo.connect(lg);
  lg.connect(o.frequency);
  lg.connect(o2.frequency);
  const o2g = ctx.createGain();
  o2g.gain.value = 0.35;
  const n = ctx.createBufferSource();
  n.buffer = noise(ctx);
  n.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = Math.min(9000, freq * 3);
  bp.Q.value = 2;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(v * 0.3, t + 0.02);
  ng.gain.exponentialRampToValueAtTime(v * 0.05, t + 0.12);
  ng.gain.setValueAtTime(v * 0.05, t + dur);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
  const g = ctx.createGain();
  const peak = v * 0.3;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.035);
  g.gain.setValueAtTime(peak, t + Math.max(0.04, dur - 0.04));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.18);
  o.connect(g);
  o2.connect(o2g).connect(g);
  n.connect(bp).connect(ng).connect(g);
  const pan = ctx.createStereoPanner();
  pan.pan.value = -0.05;
  g.connect(pan);
  pan.connect(bus.out);
  pan.connect(bus.verb);
  const end = t + dur + 0.25;
  for (const s of [o, o2, lfo]) {
    s.start(t);
    s.stop(end);
  }
  n.start(t, Math.random());
  n.stop(end);
}

/** 弦乐铺底：三支微失谐的锯齿波，柔和低通，慢起慢收 */
function strings(bus: Bus, freq: number, t: number, v: number, dur: number) {
  const { ctx } = bus;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(2600, freq * 4);
  lp.Q.value = 0.5;
  const g = ctx.createGain();
  const peak = v * 0.07;
  const atk = Math.min(0.35, dur * 0.3);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + atk);
  g.gain.setValueAtTime(peak, t + Math.max(atk, dur - 0.05));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
  lp.connect(g);
  const pan = ctx.createStereoPanner();
  pan.pan.value = (Math.random() - 0.5) * 0.6;
  g.connect(pan);
  pan.connect(bus.out);
  pan.connect(bus.verb);
  for (const det of [-7, 0, 6]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    o.detune.value = det;
    o.connect(lp);
    o.start(t);
    o.stop(t + dur + 0.6);
  }
}

/** 当り钲（祭典的小铜钲）：清亮的金属短音 */
function kane(bus: Bus, t: number, v: number) {
  const { ctx } = bus;
  [1, 2.76, 5.4, 8.93].forEach((p, i) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 1650 * p;
    const g = ctx.createGain();
    env(g, t, (v * 0.12) / (1 + i), 0.001, 0.22 / (1 + i * 0.4));
    o.connect(g);
    g.connect(bus.out);
    g.connect(bus.verb);
    o.start(t);
    o.stop(t + 0.3);
  });
  const n = ctx.createBufferSource();
  n.buffer = noise(ctx);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 5000;
  const ng = ctx.createGain();
  env(ng, t, v * 0.12, 0.001, 0.05);
  n.connect(hp).connect(ng).connect(bus.out);
  n.start(t, Math.random());
  n.stop(t + 0.08);
}

export function play(bus: Bus, inst: Inst, t: number, midi: number, v: number, dur: number, bend = 0) {
  const f = mtof(midi);
  switch (inst) {
    case 'koto':
      return pluck(bus, 'koto', f, t, v, dur, bend);
    case 'shamisen':
      return pluck(bus, 'shamisen', f, t, v, dur, bend);
    case 'shaku':
      return shakuhachi(bus, f, t, v, dur);
    case 'fue':
      return fue(bus, f, t, v, dur);
    case 'strings':
      return strings(bus, f, t, v, dur);
    case 'kane':
      return kane(bus, t, v);
    case 'taiko':
      return drum(bus, t, v * 0.9, 95, 48, 0.75, 380, 0.45);
    case 'shime':
      return drum(bus, t, v * 0.5, 360, 260, 0.13, 2600, 0.7);
    case 'hyoshigi':
      return wood(bus, t, v * 0.7, 2300, 9, 0.07);
    case 'bokuto':
      return wood(bus, t, v, 1050, 4, 0.09);
    case 'bell':
      return bell(bus, f, t, v, true);
    case 'rin':
      return bell(bus, f, t, v, false);
  }
}

/** 生成混响冲激响应（寺院木造空间的感觉：中等长度，高频衰减快） */
export function makeReverb(ctx: AudioContext, seconds = 2.6): ConvolverNode {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const b = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const tt = i / len;
      const r = Math.random() * 2 - 1;
      // 随时间加重低通
      const k = 0.9 - 0.75 * tt;
      lp += k * (r - lp);
      d[i] = lp * Math.pow(1 - tt, 2.4);
    }
  }
  const c = ctx.createConvolver();
  c.buffer = b;
  return c;
}
