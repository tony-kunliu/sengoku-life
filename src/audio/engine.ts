// 音乐与音效总控：主题交叉淡入淡出、前瞻调度、环境声、音量设置、iOS 解锁。
import { eventsInWindow, getTheme, type MusicStyle, type Theme } from './score';
import { makeReverb, noise, play, type Bus, type Inst } from './synth';

export type Sfx =
  | 'choice'
  | 'tab'
  | 'travel'
  | 'newDay'
  | 'sceneOpen'
  | 'boutStart'
  | 'clash'
  | 'block'
  | 'probe'
  | 'scoreP'
  | 'scoreO'
  | 'win'
  | 'lose'
  | 'growth'
  | 'coin'
  | 'ending';

export interface AudioSettings {
  music: number;
  sfx: number;
  muted: boolean;
  style: MusicStyle;
}

const KEY = 'sengoku-life:audio';
const DEFAULTS: AudioSettings = { music: 0.6, sfx: 0.8, muted: false, style: 'bright' };

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* 存储不可用 */
  }
  return { ...DEFAULTS };
}

interface Playing {
  theme: Theme;
  gain: GainNode;
  bus: Bus;
  startTime: number;
  /** 已调度到的拍位置 */
  beat: number;
  ambience: AudioScheduledSourceNode[];
}

class AudioDirector {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicGain!: GainNode;
  private sfxGain!: GainNode;
  private musicVerb!: GainNode;
  private sfxVerb!: GainNode;
  private current: Playing | null = null;
  private wanted = 'title';
  private intensity = 0;
  private timer: number | null = null;
  settings: AudioSettings = loadSettings();
  private listeners = new Set<() => void>();

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  /** 必须在用户手势中调用（iOS 要求） */
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC({ latencyHint: 'playback' });
        const ctx = this.ctx;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 3;
        this.master = ctx.createGain();
        this.master.connect(comp).connect(ctx.destination);
        this.musicGain = ctx.createGain();
        this.sfxGain = ctx.createGain();
        this.musicGain.connect(this.master);
        this.sfxGain.connect(this.master);
        // 音乐与音效各自一套混响，分别跟随各自的音量
        const mkVerb = (dest: AudioNode, wet: number) => {
          const send = ctx.createGain();
          const conv = makeReverb(ctx);
          const g = ctx.createGain();
          g.gain.value = wet;
          send.connect(conv).connect(g).connect(dest);
          return send;
        };
        this.musicVerb = mkVerb(this.musicGain, 0.34);
        this.sfxVerb = mkVerb(this.sfxGain, 0.26);
        this.applyVolumes();
        document.addEventListener('visibilitychange', () => {
          if (!this.ctx) return;
          if (document.hidden) this.ctx.suspend().catch(() => {});
          else this.ctx.resume().catch(() => {});
        });
      }
      // iOS：播放一个无声的缓冲区以真正解锁
      const b = this.ctx.createBuffer(1, 1, 22050);
      const s = this.ctx.createBufferSource();
      s.buffer = b;
      s.connect(this.ctx.destination);
      s.start(0);
      this.ctx.resume().then(() => {
        if (!this.current) this.switchTo(this.wanted);
        this.emit();
      }).catch(() => {});
      if (this.timer == null) this.timer = window.setInterval(() => this.tick(), 60);
    } catch {
      /* 浏览器不支持音频时静默降级 */
    }
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((f) => f());
  }

  update(patch: Partial<AudioSettings>) {
    const styleChanged = patch.style && patch.style !== this.settings.style;
    this.settings = { ...this.settings, ...patch };
    if (styleChanged && this.ctx && this.ctx.state === 'running') this.switchTo(this.wanted);
    try {
      localStorage.setItem(KEY, JSON.stringify(this.settings));
    } catch {
      /* ignore */
    }
    this.applyVolumes();
    this.emit();
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const m = this.settings.muted ? 0 : 1;
    this.musicGain.gain.setTargetAtTime(this.settings.music * this.settings.music * m, t, 0.1);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfx * m, t, 0.05);
  }

  setTheme(id: string) {
    this.wanted = id;
    if (!this.ctx || this.ctx.state !== 'running') return;
    if (this.current?.theme.id === id && this.current.theme === getTheme(id, this.settings.style)) return;
    this.switchTo(id);
  }

  setIntensity(n: number) {
    this.intensity = n;
  }

  private switchTo(id: string) {
    const ctx = this.ctx!;
    const theme = getTheme(id, this.settings.style);
    const now = ctx.currentTime;
    const old = this.current;
    if (old) {
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setValueAtTime(old.gain.gain.value, now);
      old.gain.gain.linearRampToValueAtTime(0, now + 1.4);
      const g = old.gain;
      const amb = old.ambience;
      setTimeout(() => {
        amb.forEach((a) => {
          try {
            a.stop();
          } catch {
            /* already stopped */
          }
        });
        g.disconnect();
      }, 6000);
    }
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + (old ? 1.6 : 2.4));
    gain.connect(this.musicGain);
    const bus: Bus = { ctx, out: gain, verb: this.musicVerb };
    this.current = {
      theme,
      gain,
      bus,
      startTime: now + (old ? 0.6 : 0.15),
      beat: 0,
      ambience: this.startAmbience(theme, gain),
    };
  }

  private startAmbience(theme: Theme, out: AudioNode): AudioScheduledSourceNode[] {
    if (!theme.ambience) return [];
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = noise(ctx);
    src.loop = true;
    const g = ctx.createGain();
    if (theme.ambience === 'rain') {
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 5200;
      g.gain.value = 0.06;
      src.connect(hp).connect(lp).connect(g).connect(out);
      src.start();
      return [src];
    }
    // 风：带通滤波随低频振荡缓慢游移
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 450;
    bp.Q.value = 0.8;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = ctx.createGain();
    lg.gain.value = 220;
    lfo.connect(lg).connect(bp.frequency);
    g.gain.value = 0.028;
    src.connect(bp).connect(g).connect(out);
    src.start();
    lfo.start();
    return [src, lfo];
  }

  private tick() {
    const ctx = this.ctx;
    const cur = this.current;
    if (!ctx || !cur || ctx.state !== 'running') return;
    const spb = 60 / cur.theme.bpm;
    const ahead = 0.35;
    const nowBeat = (ctx.currentTime + ahead - cur.startTime) / spb;
    if (nowBeat <= cur.beat) return;
    const from = cur.beat;
    const to = nowBeat;
    cur.beat = to;
    for (const layer of cur.theme.layers) {
      if (layer.minIntensity != null && this.intensity < layer.minIntensity) continue;
      if (layer.maxIntensity != null && this.intensity > layer.maxIntensity) continue;
      for (const { at, ev } of eventsInWindow(layer, from, to)) {
        if (layer.prob != null && Math.random() > layer.prob) continue;
        const human = (Math.random() - 0.5) * 0.018;
        const t = Math.max(ctx.currentTime, cur.startTime + at * spb + human);
        const v = ev.v * (0.9 + Math.random() * 0.2);
        play(cur.bus, layer.inst, t, ev.n, v, ev.d * spb, ev.bend ?? 0);
      }
    }
  }

  sfx(name: Sfx) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || this.settings.muted) return;
    const bus: Bus = { ctx, out: this.sfxGain, verb: this.sfxVerb };
    const t = ctx.currentTime + 0.01;
    const p = (inst: Inst, dt: number, midi: number, v: number, d = 0.5, bend = 0) => play(bus, inst, t + dt, midi, v, d, bend);
    const KOTO_HI = [74, 76, 79, 81, 83, 86];
    switch (name) {
      case 'choice':
        p('koto', 0, KOTO_HI[Math.floor(Math.random() * KOTO_HI.length)], 0.35, 0.4);
        break;
      case 'tab':
        p('hyoshigi', 0, 0, 0.18);
        break;
      case 'travel':
        p('bokuto', 0, 0, 0.12);
        p('bokuto', 0.22, 0, 0.1);
        p('koto', 0.05, 62, 0.25, 0.6);
        p('koto', 0.12, 69, 0.22, 0.6);
        break;
      case 'newDay':
        p('bell', 0, 38, 0.65, 6);
        break;
      case 'sceneOpen':
        this.slide(t);
        p('hyoshigi', 0.42, 0, 0.3);
        break;
      case 'boutStart':
        p('hyoshigi', 0, 0, 0.6);
        p('hyoshigi', 0.18, 0, 0.6);
        p('taiko', 0.45, 0, 0.9);
        break;
      case 'clash':
        p('bokuto', 0, 0, 0.9);
        p('bokuto', 0.05, 0, 0.6);
        break;
      case 'block':
        p('bokuto', 0, 0, 0.7);
        break;
      case 'probe':
        this.whoosh(t, 0.12);
        break;
      case 'scoreP':
        this.whoosh(t, 0.25);
        p('bokuto', 0.1, 0, 0.9);
        p('taiko', 0.12, 0, 1);
        p('koto', 0.18, 74, 0.4, 0.8);
        p('koto', 0.26, 81, 0.4, 0.8);
        break;
      case 'scoreO':
        this.whoosh(t, 0.25);
        p('bokuto', 0.1, 0, 0.9);
        p('taiko', 0.12, 0, 1);
        p('koto', 0.2, 51, 0.45, 1.2, 1);
        break;
      case 'win':
        [62, 64, 67, 69, 71, 74, 76, 79].forEach((m, i) => p('koto', i * 0.07, m, 0.42, 1));
        p('rin', 0.6, 88, 0.5, 2);
        break;
      case 'lose':
        [74, 70, 69, 63, 62].forEach((m, i) => p('koto', i * 0.18, m, 0.4, 1.4, i === 4 ? 1 : 0));
        p('taiko', 0.9, 0, 0.5);
        break;
      case 'growth':
        p('rin', 0, 93, 0.45, 2);
        p('koto', 0.08, 81, 0.25, 0.8);
        break;
      case 'coin':
        p('rin', 0, 100, 0.22, 1);
        p('rin', 0.09, 103, 0.18, 1);
        break;
      case 'ending':
        p('bell', 0, 38, 0.75, 7);
        break;
    }
  }

  /** 拉门滑动：低通噪声的缓慢扫频 */
  private slide(t: number) {
    const ctx = this.ctx!;
    const n = ctx.createBufferSource();
    n.buffer = noise(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = 'bandpass';
    lp.Q.value = 0.9;
    lp.frequency.setValueAtTime(380, t);
    lp.frequency.linearRampToValueAtTime(900, t + 0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    n.connect(lp).connect(g).connect(this.sfxGain);
    n.start(t, Math.random());
    n.stop(t + 0.5);
  }

  /** 挥刀的风声 */
  private whoosh(t: number, v: number) {
    const ctx = this.ctx!;
    const n = ctx.createBufferSource();
    n.buffer = noise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 2;
    bp.frequency.setValueAtTime(600, t);
    bp.frequency.exponentialRampToValueAtTime(3200, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    n.connect(bp).connect(g).connect(this.sfxGain);
    n.start(t, Math.random());
    n.stop(t + 0.22);
  }
}

export const audio = new AudioDirector();
