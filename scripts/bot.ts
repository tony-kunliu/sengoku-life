// 可玩性机器人：模拟一个“有目标的普通玩家”——每个时段按优先级找能做的事，必要时先移动过去。
// 用法：npx tsx scripts/bot.ts [social|sword]
import '../src/content';
import { newGame } from '../src/engine/core';
import { actionLock, isNpcHere, performAction, talk, travel } from '../src/engine/game';
import { giveGift, giftLock, likeKnown } from '../src/engine/gifts';
import { REG } from '../src/engine/registry';
import type { GameState, LocationId, NpcId } from '../src/engine/types';
import { go, rest, settle } from '../tests/helpers';
import { PREFER } from './playthrough';

type Pri = { loc: LocationId; id: string }[];

const SWORD: Pri = [
  { loc: 'village', id: 'visit_sick' },
  { loc: 'village', id: 'charcoal' },
  { loc: 'town', id: 'spy_tail' },
  { loc: 'town', id: 'seibei_buyer' },
  { loc: 'dojo', id: 'master_test_retry' },
  { loc: 'dojo', id: 'ask_master' },
  { loc: 'dojo', id: 'dojo_chores' },
  { loc: 'dojo', id: 'spar_hayato' },
  { loc: 'village', id: 'spar_toshiie' },
  { loc: 'dojo', id: 'dojo_observe' },
  { loc: 'dojo', id: 'spar_gonroku' },
  { loc: 'village', id: 'village_run' },
  { loc: 'teahouse', id: 'tea_work' },
  { loc: 'dojo', id: 'dojo_swing' },
  { loc: 'dojo', id: 'dojo_kata' },
];

const SOCIAL: Pri = [
  { loc: 'village', id: 'visit_sick' },
  { loc: 'village', id: 'charcoal' },
  { loc: 'town', id: 'spy_tail' },
  { loc: 'town', id: 'seibei_buyer' },
  { loc: 'teahouse', id: 'tea_accounts' },
  { loc: 'teahouse', id: 'tea_work' },
  { loc: 'dojo', id: 'dojo_chores' },
  { loc: 'village', id: 'village_heal' },
  { loc: 'dojo', id: 'master_test_retry' },
  { loc: 'dojo', id: 'ask_master' },
  { loc: 'dojo', id: 'spar_hayato' },
  { loc: 'village', id: 'spar_toshiie' },
  { loc: 'teahouse', id: 'tea_listen' },
  { loc: 'dojo', id: 'dojo_observe' },
  { loc: 'town', id: 'seibei_help' },
  { loc: 'dojo', id: 'dojo_swing' },
];

export const BOT_PREFER = ['说服伝藏', '亲自去军需役所', '笑着给两人', '替炭窑重算', '撕下衣袖', '替街上受伤', ...PREFER];

function socialize(s: GameState, prefer: string[]): GameState {
  for (const id of Object.keys(REG.npcs) as NpcId[]) {
    if (id === 'nobunaga' || !isNpcHere(s, id) || s.npcs[id].talkedDay === s.day) continue;
    s = settle(talk(s, id), prefer);
    if (s.ended) return s;
    const like = REG.npcs[id].likes as never;
    if (like && likeKnown(s, id) && !giftLock(s, id, like) && s.player.money >= 80) s = settle(giveGift(s, id, like), prefer);
  }
  return s;
}

export function playBot(kind: 'social' | 'sword', seed = 7, prefer = BOT_PREFER, log: string[] = []) {
  const pri = kind === 'social' ? SOCIAL : SWORD;
  let s = newGame('机器人', seed);
  s = go(s, 'village', prefer);
  let guard = 0;
  const reached: Record<string, number> = {};
  while (!s.ended && guard++ < 200) {
    s = socialize(s, prefer);
    if (s.ended) break;
    let did = false;
    for (const p of pri) {
      // 先看看在那里能不能做（不改变真实状态）
      const probe = p.loc === s.location ? s : settle(travel(s, p.loc), prefer);
      if (probe.ended) {
        s = probe;
        did = true;
        break;
      }
      if (actionLock(probe, p.id)) continue;
      s = settle(performAction(probe, p.id), prefer);
      log.push(`${s.day}:${s.slot} ${p.id}`);
      did = true;
      break;
    }
    if (!did) s = rest(s, prefer);
    for (const k of ['wit', 'speech', 'med'] as const) if (s.player.life[k].lv >= 2 && !reached[k]) reached[k] = s.day;
  }
  (s.flags as Record<string, unknown>).__reached = JSON.stringify(reached);
  return s;
}

if (process.argv[1]?.includes('bot')) {
  for (const kind of ['social', 'sword'] as const) {
    for (const seed of [7, 99]) {
      const log: string[] = [];
      const s = playBot(kind, seed, BOT_PREFER, log);
      const L = s.player.life;
      const st = s.player.stats;
      console.log(
        `${kind}/${seed}: 结局=${s.ending} 攻${st.atk.lv}守${st.def.lv}眼${st.eye.lv} 智${L.wit.lv}口${L.speech.lv}医${L.med.lv}`,
        `| 到达2级的日子=${s.flags.__reached} | 细作=${s.flags.spyChoice} 买家=${s.flags.buyerVia} 铺子=${s.quests.seibei} 认可=${!!s.flags.masterRecognized} 技=${s.player.techniques} 钱=${s.player.money} 战绩=${s.record.wins}/${s.record.bouts}`,
      );
    }
  }
}
