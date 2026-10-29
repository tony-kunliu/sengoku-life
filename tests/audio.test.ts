import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/content';
import { BRIGHT, IN, THEMES, YO, chordLayers, degToMidi, eventsInWindow, rhythm, seq } from '../src/audio/score';
import { cuesFor, intensityFor, themeFor } from '../src/audio/cues';
import { newGame } from '../src/engine/core';
import { playMove, travel, sleep, startBout } from '../src/engine/game';
import { go, settle } from './helpers';

test('音阶：度数换算到 MIDI（含八度与负度数）', () => {
  assert.equal(degToMidi(62, IN, 0), 62);
  assert.equal(degToMidi(62, IN, 1), 63); // 都节音阶第二音是小二度
  assert.equal(degToMidi(62, YO, 5), 74);
  assert.equal(degToMidi(62, YO, -1), 59);
});

test('乐谱：记法解析与循环长度', () => {
  const l = seq('0:1 - :1', 'koto', 62, YO);
  void l;
  const a = seq('0:1 -:1 2~:2', 'koto', 62, YO);
  assert.equal(a.cycle, 4);
  assert.equal(a.events.length, 2);
  assert.equal(a.events[1].bend, 1);
  const r = rhythm('X.x.', 'taiko', 0.5);
  assert.equal(r.cycle, 2);
  assert.deepEqual(r.events.map((e) => e.b), [0, 1]);
  assert.throws(() => seq('a:1', 'koto', 62, YO));
});

test('乐谱：每首曲子都能解析，循环窗口不漏音也不重音', () => {
  for (const th of [...Object.values(THEMES), ...Object.values(BRIGHT)]) {
    assert.ok(th.bpm >= 40 && th.bpm <= 160, th.id);
    for (const layer of th.layers) {
      assert.ok(layer.cycle > 0);
      // 按 0.37 拍的碎窗口取两个循环，应正好得到 2 倍事件数
      let n = 0;
      for (let b = 0; b < layer.cycle * 2; b += 0.37) n += eventsInWindow(layer, b, Math.min(b + 0.37, layer.cycle * 2)).length;
      assert.equal(n, layer.events.length * 2, `${th.id}/${layer.inst}`);
    }
  }
});

test('配乐：随地点、比试、夜晚与结局切换', () => {
  assert.equal(themeFor(null), 'title');
  let s = newGame('甲', 1);
  s = go(s, 'village');
  assert.equal(themeFor(s), 'village');
  s = settle(travel(s, 'town'));
  s.location = 'town';
  assert.equal(themeFor(s), 'town');
  startBout(s, 'hayato', { kind: 'spar', label: 't' });
  assert.equal(themeFor(s), 'combat');
  assert.equal(intensityFor(s), 0);
  s.bout = null;
  s.day = 16;
  s.slot = 2;
  assert.equal(themeFor(s), 'night');
  s.ended = true;
  assert.equal(themeFor(s), 'ending');
});

test('音效：日替敲钟、比试开始与出招都有对应的声音', () => {
  let s = newGame('乙', 2);
  s = go(s, 'village');
  s = settle(travel(s, 'town'));
  let before = s;
  let slept = settle(sleep(s));
  while (slept.day === before.day) {
    before = slept;
    slept = settle(sleep(slept));
  }
  assert.ok(cuesFor(before, slept).includes('newDay'));
  const b0 = structuredClone(slept);
  b0.scene = null;
  const b1 = structuredClone(b0);
  startBout(b1, 'hayato', { kind: 'spar', label: 't' });
  assert.ok(cuesFor(b0, b1).includes('boutStart'));
  const b2 = playMove(b1, 'def');
  const c = cuesFor(b1, b2);
  assert.ok(c.length >= 1, `出招应有音效：${c}`);
  assert.deepEqual(cuesFor(b2, b2), []);
});

test('明快版：每首曲子的旋律与和弦进行对齐，且包含相同的场景', () => {
  assert.deepEqual(Object.keys(BRIGHT).sort(), Object.keys(THEMES).sort());
  for (const th of Object.values(BRIGHT)) {
    const melody = th.layers.find((l) => l.inst === 'fue' || l.inst === 'shaku' || (l.inst === 'koto' && l.events.length > 20 && !l.prob));
    const pad = th.layers.find((l) => l.inst === 'strings');
    assert.ok(melody && pad, th.id);
    assert.equal(melody!.cycle % pad!.cycle === 0 || pad!.cycle % melody!.cycle === 0, true, `${th.id}: 旋律 ${melody!.cycle} 拍 / 和弦 ${pad!.cycle} 拍`);
    assert.ok(th.bpm >= 90 || th.id === 'night', `${th.id} 应当轻快`);
  }
  assert.throws(() => chordLayers('D X', { pad: 1 }));
});
