import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/content';
import { createCombat, resolveRound, canUseTech } from '../src/engine/combat/rules';
import { OPPONENTS } from '../src/content/opponents';
import { newGame } from '../src/engine/core';
import { applyEffect, toggleEquip } from '../src/engine/game';
import type { CombatState } from '../src/engine/combat/types';

const P = (techs: string[]) => ({ name: '你', atk: 3, def: 3, eye: 2, maxStamina: 9, techniques: techs, weapon: 0 });

function withSei(cs: CombatState, n: number) {
  cs.p.sei = n;
  return cs;
}

test('势：防守 +1，被取一本 +2，看破 +1，上限 5', () => {
  const cs = createCombat(OPPONENTS.gonroku, P([]), 1);
  cs.oppNext = 'def';
  const a = resolveRound(cs, 'def');
  assert.equal(a.p.sei, 1);
  const b = createCombat(OPPONENTS.hayato, P([]), 2);
  b.oppNext = 'atk';
  b.p.posture = 0;
  b.p.stamina = 0;
  const r = resolveRound(b, 'adjust');
  assert.equal(r.history[0].scorer, 'o');
  assert.equal(r.p.sei, 2);
  const c = createCombat(OPPONENTS.gonroku, P([]), 3);
  c.oppNext = 'def';
  assert.equal(resolveRound(c, 'probe').p.sei, 1);
});

test('秘传：势不足或未携带时不能发动，发动会扣势', () => {
  const cs = createCombat(OPPONENTS.hayato, P(['nidan']), 4);
  assert.equal(canUseTech(cs, 'nidan'), false);
  withSei(cs, 3);
  assert.equal(canUseTech(cs, 'nidan'), true);
  assert.equal(canUseTech(cs, 'zanshin'), false);
  cs.oppNext = 'probe';
  const r = resolveRound(cs, 'atk', 'nidan');
  assert.equal(r.history[0].pTech, 'nidan');
  assert.ok(r.p.sei <= 1);
});

test('二段：被格挡也能补上第二刀', () => {
  let hits = 0;
  for (let seed = 0; seed < 60; seed++) {
    const cs = withSei(createCombat(OPPONENTS.gonroku, P(['nidan']), seed), 3);
    cs.oppNext = 'def';
    cs.oppTech = null;
    cs.distance = 1;
    if (resolveRound(cs, 'atk', 'nidan').history[0].scorer === 'p') hits++;
  }
  assert.ok(hits > 25, `二段应常常突破防守，实际 ${hits}/60`);
});

test('诱：对手进攻时侧身反击；残心：来刀几乎必被反击', () => {
  let lure = 0;
  let zan = 0;
  for (let seed = 0; seed < 60; seed++) {
    const a = withSei(createCombat(OPPONENTS.hayato, P(['sasoi']), seed), 2);
    a.oppNext = 'atk';
    if (resolveRound(a, 'probe', 'sasoi').history[0].scorer === 'p') lure++;
    const b = withSei(createCombat(OPPONENTS.hayato, P(['zanshin']), seed), 4);
    b.oppNext = 'atk';
    if (resolveRound(b, 'def', 'zanshin').history[0].scorer === 'p') zan++;
  }
  assert.ok(lure > 40, `诱 ${lure}/60`);
  assert.ok(zan > 50, `残心 ${zan}/60`);
});

test('又左卫门势满时会用二段', () => {
  const cs = createCombat(OPPONENTS.toshiie, P([]), 9);
  cs.o.sei = 3;
  cs.oppNext = 'atk';
  cs.oppTech = 'nidan';
  const r = resolveRound(cs, 'def');
  assert.equal(r.history[0].oTech, 'nidan');
  assert.equal(r.o.sei, 0);
});

test('携带上限 3：第四项学到后不自动携带，可在修行页更换', () => {
  let s = newGame('甲', 1);
  for (const t of ['yanagi', 'fumikomi', 'mikiri', 'nidan']) applyEffect(s, { t: 'tech', id: t });
  assert.deepEqual(s.player.equipped, ['yanagi', 'fumikomi', 'mikiri']);
  assert.equal(toggleEquip(s, 'nidan'), s, '满了不能再带');
  s = toggleEquip(s, 'mikiri');
  s = toggleEquip(s, 'nidan');
  assert.deepEqual(s.player.equipped, ['yanagi', 'fumikomi', 'nidan']);
});
