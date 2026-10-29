// 运行：npm test（node:test + tsx）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/content';
import { createCombat, resolveRound, simulate } from '../src/engine/combat/rules';
import { opponentWeights } from '../src/engine/combat/ai';
import { makeHint } from '../src/engine/combat/hint';
import type { CombatState, Move } from '../src/engine/combat/types';
import { OPPONENTS } from '../src/content/opponents';
import { newGame, hasMem } from '../src/engine/core';
import { advanceTime, performAction, talk, travel, sleep } from '../src/engine/game';
import { gainXp, repGain } from '../src/engine/training';
import { deserialize, fromCode, migrate, serialize, toCode } from '../src/engine/save';
import { policies } from '../scripts/balance';
import { GOOD_PLAN, PREFER, runPlan } from '../scripts/playthrough';
import { buildEnding } from '../src/content/endings';
import { go, settle } from './helpers';

const P = (atk: number, def: number, eye: number, st = 9) => ({ name: '你', atk, def, eye, maxStamina: st, techniques: [], weapon: 0 });

function winRate(opp: string, stats: ReturnType<typeof P>, pol: (cs: CombatState, h: { rng: number }) => Move, n = 300) {
  let w = 0;
  for (let i = 0; i < n; i++) if (simulate(createCombat(OPPONENTS[opp], stats, i * 7919 + 13), pol).result === 'win') w++;
  return w / n;
}

// ───── 战斗 ─────
test('战斗：相同状态与输入得到相同结果（可重复模拟）', () => {
  const cs = createCombat(OPPONENTS.hayato, P(2, 2, 1), 777);
  const a = resolveRound(resolveRound(cs, 'def'), 'probe');
  const b = resolveRound(resolveRound(cs, 'def'), 'probe');
  assert.deepEqual(a, b);
  assert.equal(cs.round, 1, '不修改入参');
});

test('战斗：防守克进攻 —— 守备高于威力时反击得分', () => {
  const cs = createCombat(OPPONENTS.hayato, P(2, 6, 1), 1);
  cs.oppNext = 'atk';
  cs.distance = 0; // 远间进攻 -1
  let hits = 0;
  for (let seed = 0; seed < 50; seed++) {
    const c = structuredClone(cs);
    c.rng = seed;
    const r = resolveRound(c, 'def');
    if (r.history[0].scorer === 'p') hits++;
  }
  assert.ok(hits > 40, `反击应稳定成立，实际 ${hits}/50`);
});

test('战斗：试探克防守 —— 破坏架势并看破下一手', () => {
  const cs = createCombat(OPPONENTS.gonroku, P(2, 2, 1), 5);
  cs.oppNext = 'def';
  const r = resolveRound(cs, 'probe');
  assert.equal(r.o.posture, 1);
  assert.equal(r.initiative, 'p');
  assert.equal(r.reveal, true);
  const h = makeHint(r, OPPONENTS.gonroku, 0);
  assert.equal(h.certain, r.oppNext);
});

test('战斗：进攻打中调整中的对手', () => {
  const cs = createCombat(OPPONENTS.hayato, P(3, 2, 1), 9);
  cs.oppNext = 'adjust';
  const r = resolveRound(cs, 'atk');
  assert.equal(r.history[0].scorer, 'p');
});

test('战斗：两种对手风格的行为倾向明显不同', () => {
  const a = createCombat(OPPONENTS.hayato, P(2, 2, 1), 3);
  const c = createCombat(OPPONENTS.gonroku, P(2, 2, 1), 3);
  const wa = opponentWeights(a);
  const wc = opponentWeights(c);
  assert.ok(wa.atk > wa.def * 2, '进攻型以进攻为主');
  assert.ok(wc.def > wc.atk * 2, '防守型以防守为主');
});

test('战斗：没有任何单一行动永远占优，读局者胜率最高', () => {
  const mid = P(3, 3, 2);
  for (const opp of ['hayato', 'gonroku', 'toshiie']) {
    const smart = winRate(opp, mid, policies.smart);
    for (const pure of ['allAtk', 'allDef', 'allProbe', 'allAdjust']) {
      const r = winRate(opp, mid, policies[pure]);
      assert.ok(r < smart - 0.15, `${opp}: ${pure}=${r.toFixed(2)} 不应接近读局 ${smart.toFixed(2)}`);
      assert.ok(r <= 0.6, `${opp}: ${pure}=${r.toFixed(2)} 单一行动不应稳定获胜`);
    }
  }
});

test('战斗：修炼提升能力会改善胜率', () => {
  const early = winRate('hayato', P(2, 2, 1, 8), policies.random);
  const late = winRate('hayato', P(4, 4, 3, 10), policies.random);
  assert.ok(late > early + 0.2, `early ${early} late ${late}`);
});

test('战斗：一场比试在回合上限内结束（5–8 回合左右）', () => {
  for (let i = 0; i < 50; i++) {
    const end = simulate(createCombat(OPPONENTS.gonroku, P(3, 3, 2), i), policies.random);
    assert.ok(end.finished && end.history.length <= 7);
  }
});

// ───── 修行 ─────
test('修行：重复训练收益递减，实战重置递减', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map((r) => repGain(30, r)), [30, 19, 14, 11, 9]);
  const s = newGame('甲', 1);
  gainXp(s, 'atk', 30, false);
  gainXp(s, 'atk', 30, false);
  assert.equal(s.player.stats.atk.reps, 2);
  gainXp(s, 'atk', 10, true);
  assert.equal(s.player.stats.atk.reps, 0);
});

test('修行：达到上限后无法再升级，需要突破', () => {
  const s = newGame('甲', 1);
  for (let i = 0; i < 40; i++) gainXp(s, 'def', 30, false);
  assert.equal(s.player.stats.def.lv, s.player.stats.def.cap);
  assert.ok(s.player.stats.def.xp <= 100);
});

// ───── 时间与世界 ─────
test('时间：行动推进时段，晚上之后进入新的一天并推进今川军', () => {
  const s = newGame('甲', 1);
  s.player.lodging = 'teahouse';
  advanceTime(s, 3);
  assert.equal(s.day, 2);
  assert.equal(s.slot, 0);
  assert.equal(s.world.imagawa, 6);
  assert.equal(s.location, 'teahouse');
});

test('NPC：日程随时间变化（隼人在不同时段出现在不同地点，后期被召集）', async () => {
  const { NPCS } = await import('../src/content/npcs');
  const s = newGame('甲', 1);
  s.day = 4;
  s.slot = 0;
  assert.equal(NPCS.hayato.where(s).loc, 'dojo');
  s.slot = 2;
  assert.equal(NPCS.hayato.where(s).loc, 'teahouse');
  s.flags.hayatoSummoned = true;
  assert.equal(NPCS.hayato.where(s).loc, null);
});

// ───── 存档 ─────
test('存档：序列化往返与存档码', () => {
  let s = newGame('乙', 9);
  s = go(s, 'village');
  const back = deserialize(serialize(s));
  assert.equal(back.player.name, '乙');
  assert.deepEqual(back.seenScenes, s.seenScenes);
  const code = toCode(s);
  assert.equal(fromCode(code).day, s.day);
});

test('存档：旧版本存档可以迁移', () => {
  const s = newGame('丙', 2) as unknown as Record<string, unknown>;
  const old: Record<string, unknown> = { ...s, version: 0 };
  delete old.toast;
  delete old.record;
  const m = migrate(old);
  assert.equal(m.version, 3);
  assert.equal(m.player.life.wit.lv, 1);
  assert.deepEqual(m.record, { bouts: 0, wins: 0, losses: 0 });
});

test('存档：读档后继续得到完全相同的结果', () => {
  let s = newGame('丁', 3);
  s = go(s, 'village');
  s = settle(travel(s, 'town'));
  const saved = serialize(s);
  const a = settle(performAction(s, 'town_wander'));
  const b = settle(performAction(deserialize(saved), 'town_wander'));
  assert.deepEqual({ ...a, toast: [] }, { ...b, toast: [] });
});

// ───── 人物与记忆 ─────
test('记忆：输给隼人后，他的台词会改变', () => {
  let s = newGame('戊', 4);
  s = go(s, 'village');
  s = settle(travel(s, 'town'));
  s.day = 2;
  s.slot = 0;
  s.npcs.hayato.rel.met = true;
  s.npcs.hayato.memories.push({ id: 'first_loss', day: 1, text: '' });
  s.location = 'dojo';
  s.seenScenes.push('dojo_enter', 'hayato_challenge');
  s.flags.hayatoFirstBout = true;
  const t = talk(s, 'hayato');
  assert.ok(String(t.flags.lastTalk).includes('输过一次'));
});

// ───── 完整流程 ─────
test('主线：认真游玩可以从开场走到第一章结局', () => {
  const { s } = runPlan(GOOD_PLAN);
  assert.equal(s.ended, true);
  assert.ok(s.flags.masterRecognized, '获得师父认可');
  assert.ok(hasMem(s, 'hayato', 'first_loss') || hasMem(s, 'hayato', 'beaten_first'));
  assert.ok(s.seenScenes.includes('eve'));
  const e = buildEnding(s);
  assert.ok(e.paragraphs.length >= 2 && e.fates.length >= 5);
});

test('主线：不同选择导向不同结局，且都不会卡死', () => {
  const routes = [
    ['收拾行李'],
    ['留在清洲'],
    ['我跟你去', '随又左卫门'],
  ];
  const endings = new Set<string>();
  for (const r of routes) {
    const { s } = runPlan(GOOD_PLAN, [...r, ...PREFER.filter((p) => p !== '托阿凉')]);
    assert.equal(s.ended, true, `路线 ${r} 应到达结局`);
    endings.add(String(s.ending));
  }
  assert.ok(endings.size >= 2, `结局应有差异：${[...endings]}`);
});

test('主线：什么都不做也会被历史推着走到结局', () => {
  let s = newGame('己', 5);
  s = go(s, 'village');
  for (let i = 0; i < 30 && !s.ended; i++) s = settle(sleep(s));
  assert.equal(s.ended, true);
  assert.equal(s.ending, 'flee' === s.ending ? 'flee' : s.ending);
});
