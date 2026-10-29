// 离线渲染：在浏览器 OfflineAudioContext 中把每首曲子渲染成波形，供分析与试听。
import { THEMES, eventsInWindow } from '../src/audio/score';
import { makeReverb, play, type Bus } from '../src/audio/synth';

declare global {
  interface Window {
    renderTheme: (id: string, seconds: number, intensity: number) => Promise<number[][]>;
  }
}

window.renderTheme = async (id, seconds, intensity) => {
  const sr = 32000;
  const ctx = new OfflineAudioContext(2, sr * seconds, sr);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 3;
  const master = ctx.createGain();
  master.gain.value = 0.36;
  master.connect(comp).connect(ctx.destination);
  const send = ctx.createGain();
  const conv = makeReverb(ctx as unknown as AudioContext);
  const wet = ctx.createGain();
  wet.gain.value = 0.34;
  send.connect(conv).connect(wet).connect(master);
  const bus: Bus = { ctx: ctx as unknown as AudioContext, out: master, verb: send };
  const th = THEMES[id];
  const spb = 60 / th.bpm;
  const beats = seconds / spb;
  for (const layer of th.layers) {
    if (layer.minIntensity != null && intensity < layer.minIntensity) continue;
    for (const { at, ev } of eventsInWindow(layer, 0, beats)) {
      if (layer.prob != null && Math.random() > layer.prob) continue;
      play(bus, layer.inst, 0.1 + at * spb, ev.n, ev.v, ev.d * spb, ev.bend ?? 0);
    }
  }
  const buf = await ctx.startRendering();
  return [Array.from(buf.getChannelData(0)), Array.from(buf.getChannelData(1))];
};
