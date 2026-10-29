// 送礼：每个人都有喜好与忌讳。送对了关系大涨，送错了反而扣分；喜好可以打听出来。
import { clone, doneToday, log, markToday, meet, rel, toast } from './core';
import { REG } from './registry';
import { gainXp } from './training';
import type { GameState, NpcId } from './types';

export type GiftId = 'tea' | 'sake' | 'book' | 'whetstone';

export const GIFTS: Record<GiftId, { name: string; cost: number; desc: string }> = {
  tea: { name: '宇治茶叶', cost: 25, desc: '一小包上好的茶叶' },
  sake: { name: '清酒', cost: 35, desc: '一壶伊丹的清酒' },
  book: { name: '书册', cost: 45, desc: '手抄的兵书或物语' },
  whetstone: { name: '砥石', cost: 40, desc: '京都来的细砥石' },
};

export const GIFT_IDS = Object.keys(GIFTS) as GiftId[];

export function likeKnown(s: GameState, npc: NpcId) {
  return !!s.flags[`knownLike_${npc}`];
}
export function dislikeKnown(s: GameState, npc: NpcId) {
  return !!s.flags[`knownDislike_${npc}`];
}

export function giftLock(s: GameState, npc: NpcId, gift: GiftId): string | null {
  const def = REG.npcs[npc];
  if (!def.likes) return '这位人物不收礼';
  if (doneToday(s, `gift_${npc}`)) return '今天已经送过礼了';
  if (s.player.money < GIFTS[gift].cost) return `钱不够（需要 ${GIFTS[gift].cost} 文）`;
  return null;
}

export type GiftOutcome = 'liked' | 'disliked' | 'ok';

export function giftOutcome(npc: NpcId, gift: GiftId): GiftOutcome {
  const def = REG.npcs[npc];
  if (def.likes === gift) return 'liked';
  if (def.dislikes === gift) return 'disliked';
  return 'ok';
}

export function giveGift(prev: GameState, npc: NpcId, gift: GiftId): GameState {
  if (prev.scene || prev.bout || giftLock(prev, npc, gift)) return prev;
  if (REG.npcs[npc].where(prev).loc !== prev.location) return prev;
  const s = clone(prev);
  s.toast = [];
  const g = GIFTS[gift];
  const name = REG.npcs[npc].name;
  const names = { [npc]: name } as Record<string, string>;
  s.player.money -= g.cost;
  markToday(s, `gift_${npc}`);
  meet(s, npc);
  const out = giftOutcome(npc, gift);
  let line: string;
  if (out === 'liked') {
    rel(s, npc, { trust: 8, favor: 4 }, names);
    s.flags[`knownLike_${npc}`] = true;
    gainXp(s, 'speech', 20, true);
    line = REG.npcs[npc].giftLines?.liked ?? '……这正是我想要的。多谢。';
    toast(s, `正合${name}心意！`);
  } else if (out === 'disliked') {
    rel(s, npc, { trust: -3 }, names);
    s.flags[`knownDislike_${npc}`] = true;
    line = REG.npcs[npc].giftLines?.disliked ?? '……你留着自己用吧。';
    toast(s, `${name}似乎不太喜欢`);
  } else {
    rel(s, npc, { trust: 3 }, names);
    line = '谢谢你的心意。';
  }
  s.flags.lastTalk = `${npc}|${line}`;
  log(s, `你送给${name}${g.name}。${name}：${line}`, 'event');
  return s;
}
