// 自动通关脚本：模拟一个认真游玩的玩家，验证主线可以完整走完。
// 用法：npx tsx scripts/playthrough.ts [路线]
import { act, go, rest, say } from '../tests/helpers';
import { newGame } from '../src/engine/core';
import { buildEnding } from '../src/content/endings';
import type { GameState } from '../src/engine/types';

export type Step = ['go', string] | ['act', string] | ['talk', string] | ['rest'];

export const PREFER = [
  '让我看看', '烧开', '帮忙推车', '读书写字', '活下去', '接受挑战', '请指教', '住在茶屋',
  '我来帮你', '能便宜些', '请阿凉引荐', '交给阿凉', '交给我', '挡在两人中间', '跪下，但抬头', '一介浪人',
  '立功不急', '拿起木刀', '跪坐', '行礼，摆出中段', '我跟你去', '如何守得更稳', '如何看穿', '如何出刀',
  '那您为什么', '挡在他身后', '随又左卫门', '继续', '端着茶',
];

export function runPlan(plan: Step[][], prefer = PREFER, verbose = false) {
  let s: GameState = newGame('测试者', 42);
  const trace: string[] = [];
  s = go(s, 'village', prefer, trace); // 触发序章
  for (const day of plan) {
    if (s.ended) break;
    const startDay = s.day;
    for (const st of day) {
      if (s.ended || s.day !== startDay) break;
      if (st[0] === 'go') s = go(s, st[1] as never, prefer, trace);
      else if (st[0] === 'act') s = act(s, st[1], prefer, trace);
      else if (st[0] === 'talk') s = say(s, st[1] as never, prefer, trace);
      else s = rest(s, prefer, trace);
    }
    if (!s.ended && s.day === startDay) s = rest(s, prefer, trace);
  }
  // 若计划结束仍未到结局，持续休息直到历史推进
  let g = 0;
  while (!s.ended && g++ < 30) s = rest(s, prefer, trace);
  if (verbose) console.log(trace.join('\n'));
  return { s, trace };
}

const D = (...steps: Step[]) => steps;

export const GOOD_PLAN: Step[][] = [
  // 1 五月初三
  D(['go', 'town'], ['go', 'dojo'], ['act', 'dojo_chores'], ['act', 'dojo_observe'], ['go', 'teahouse']),
  // 2
  D(['go', 'village'], ['act', 'visit_sick'], ['go', 'dojo'], ['act', 'dojo_chores']),
  // 3
  D(['go', 'dojo'], ['act', 'dojo_kata'], ['act', 'dojo_observe'], ['go', 'teahouse'], ['act', 'tea_work']),
  // 4
  D(['go', 'dojo'], ['act', 'dojo_chores'], ['go', 'town'], ['act', 'seibei_help'], ['go', 'teahouse'], ['act', 'tea_work']),
  // 5
  D(['go', 'dojo'], ['act', 'dojo_swing'], ['go', 'town'], ['act', 'town_wander'], ['go', 'teahouse'], ['act', 'tea_work']),
  // 6
  D(['go', 'dojo'], ['act', 'spar_hayato'], ['go', 'village'], ['act', 'charcoal'], ['act', 'village_run']),
  // 7
  D(['go', 'dojo'], ['act', 'dojo_chores'], ['act', 'ask_master'], ['go', 'teahouse'], ['act', 'tea_work']),
  // 8
  D(['go', 'town'], ['act', 'spy_tail'], ['act', 'seibei_buyer'], ['go', 'dojo'], ['act', 'dojo_observe']),
  // 9
  D(['go', 'dojo'], ['act', 'spar_hayato'], ['go', 'village'], ['act', 'spar_toshiie'], ['act', 'village_run']),
  // 10
  D(['go', 'dojo'], ['act', 'dojo_chores'], ['act', 'ask_master'], ['go', 'teahouse'], ['act', 'tea_work']),
  // 11
  D(['go', 'dojo'], ['act', 'spar_gonroku'], ['go', 'village'], ['act', 'spar_toshiie'], ['act', 'village_run']),
  // 12
  D(['go', 'dojo'], ['act', 'dojo_chores'], ['act', 'spar_hayato'], ['go', 'teahouse'], ['act', 'tea_work']),
  // 13
  D(['go', 'dojo'], ['act', 'ask_master'], ['go', 'village'], ['act', 'spar_toshiie'], ['act', 'village_run']),
  // 14
  D(['go', 'dojo'], ['act', 'master_test_retry'], ['act', 'dojo_kata'], ['go', 'village'], ['act', 'spar_toshiie']),
  // 15
  D(['go', 'dojo'], ['act', 'dojo_swing'], ['go', 'village'], ['act', 'spar_toshiie']),
  // 16
  D(['go', 'dojo'], ['act', 'dojo_kata'], ['act', 'dojo_swing']),
];

if (process.argv[1]?.includes('playthrough')) {
  const { s, trace } = runPlan(GOOD_PLAN, PREFER, true);
  void trace;
  console.log('\n==== 结果 ====');
  console.log('结局:', s.ending, '日:', s.day, '时段', s.slot);
  console.log('能力:', JSON.stringify(s.player.stats), '气力', s.player.maxStamina, '技', s.player.techniques);
  console.log('战绩:', s.record, '钱', s.player.money, '名声', s.player.fame);
  for (const [id, n] of Object.entries(s.npcs)) console.log(id, JSON.stringify(n.rel), n.memories.map((m) => m.id).join(','));
  console.log('flags:', JSON.stringify(s.flags));
  console.log('quests:', JSON.stringify(s.quests));
  const e = buildEnding(s);
  console.log(e.title, e.subtitle, e.achievements);
}
