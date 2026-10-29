import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/content';
import { newGame } from '../src/engine/core';
import { needLock } from '../src/engine/checks';
import { giveGift, giftLock } from '../src/engine/gifts';
import { canQuickFinish, performAction, quickFinish, startBout, travel } from '../src/engine/game';
import { goalsFor } from '../src/content/goals';
import { PERKS } from '../src/content/perks';
import { migrate } from '../src/engine/save';
import { go, settle } from './helpers';
import type { GameState } from '../src/engine/types';

function inTown(): GameState {
  let s = newGame('甲', 11);
  s = go(s, 'village', ['让我看看']);
  s = settle(travel(s, 'town'), ['帮忙推车']);
  return s;
}

test('能力检定：不足时说明还差多少', () => {
  const s = newGame('甲', 1);
  assert.equal(needLock(s, { wit: 1 }), null);
  assert.equal(needLock(s, { speech: 2 }), '需要 口才 2（现在 0）');
});

test('送礼：送对加倍、知道喜好；送错扣分；每人每天一次', () => {
  let s = inTown();
  s.location = 'teahouse';
  s.slot = 1;
  s.player.money = 200;
  const before = s.npcs.oryo.rel.trust;
  const a = giveGift(s, 'oryo', 'book');
  assert.equal(a.npcs.oryo.rel.trust, before + 8);
  assert.equal(a.flags.knownLike_oryo, true);
  assert.equal(a.player.money, 155);
  assert.equal(giftLock(a, 'oryo', 'tea'), '今天已经送过礼了');
  const b = giveGift(s, 'oryo', 'whetstone');
  assert.equal(b.npcs.oryo.rel.trust, before - 3);
  assert.equal(b.flags.knownDislike_oryo, true);
  s.player.money = 10;
  assert.match(giftLock(s, 'oryo', 'book') ?? '', /钱不够/);
});

test('生活能力：茶屋帮工练口才，算账练智略，看病练医术', () => {
  let s = inTown();
  s.location = 'teahouse';
  s.slot = 1;
  const sp0 = s.player.life.speech.xp + s.player.life.speech.lv * 100;
  s = settle(performAction(s, 'tea_work'));
  assert.ok(s.player.life.speech.xp + s.player.life.speech.lv * 100 > sp0);
  s.npcs.oryo.rel.trust = 20;
  s.location = 'teahouse';
  s.slot = 1;
  const w0 = s.player.life.wit.xp;
  s = settle(performAction(s, 'tea_accounts'));
  assert.equal(s.player.life.wit.xp + s.player.life.wit.lv * 1000, w0 + 25 + 1000);
});

test('救下病童后医术达到 1，看病可以继续提升', () => {
  let s = newGame('乙', 3);
  s = go(s, 'village', ['让我看看']);
  s = settle(travel(s, 'town'), ['帮忙推车']);
  s = settle(travel(s, 'village'), ['烧开']);
  if (!s.flags.villageSaved) s = settle(performAction(s, 'visit_sick'), ['烧开']);
  assert.equal(s.flags.villageSaved, true);
  assert.equal(s.player.life.med.lv, 1);
});

test('心之所向：始终最多三条，期限紧的排前面，最后几天提示抉择', () => {
  const s = newGame('丙', 4);
  const g0 = goalsFor(s);
  assert.ok(g0.length >= 1 && g0.length <= 3);
  const t = inTown();
  t.quests.seibei = 1;
  t.day = 10;
  assert.equal(goalsFor(t)[0].id, 'seibei1');
  t.day = 15;
  assert.equal(goalsFor(t)[0].id, 'eve');
});

test('速决：只对赢过的对手开放，规则与手动相同并打完整场', () => {
  const s = inTown();
  s.location = 'dojo';
  startBout(s, 'hayato', { kind: 'spar', label: 't' });
  assert.equal(canQuickFinish(s), false);
  s.flags.wins_hayato = 1;
  assert.equal(canQuickFinish(s), true);
  const done = quickFinish(s);
  assert.equal(done.bout!.combat.finished, true);
});

test('关系回报：每位主要人物都有可见的回报，且条件能被满足', () => {
  for (const id of ['gensai', 'hayato', 'seibei', 'oryo', 'toshiie'] as const) assert.ok((PERKS[id]?.length ?? 0) >= 2, id);
  const s = inTown();
  s.npcs.toshiie.rel.trust = 15;
  s.flags.wins_toshiie = 1;
  assert.equal(PERKS.toshiie![0].ok(s), true);
});

test('见切：又左卫门信任 15 且被你赢过后会传授', () => {
  let s = inTown();
  Object.assign(s.flags, { toshiieMet: true, wins_toshiie: 1 });
  s.npcs.toshiie.rel.met = true;
  s.npcs.toshiie.rel.trust = 20;
  s.day = 6;
  s.slot = 1;
  s = settle(travel(s, 'village'), ['站到枪前']);
  assert.ok(s.player.techniques.includes('mikiri'));
});

test('存档：v1 存档迁移到 v2，补上生活能力', () => {
  const s = newGame('丁', 5) as unknown as Record<string, unknown>;
  const player = { ...(s.player as Record<string, unknown>) };
  delete player.life;
  const m = migrate({ ...s, player, version: 1, flags: { villageSaved: true } });
  assert.equal(m.version, 3);
  assert.deepEqual(m.player.equipped, []);
  assert.equal(m.player.life.med.lv, 1);
});
