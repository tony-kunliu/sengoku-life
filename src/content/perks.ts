// 关系回报：每个人物“信任 / 尊敬 / 恩义到多少，能得到什么”，在人物页清楚列出。
import { quest, R } from '../engine/core';
import type { GameState, NpcId } from '../engine/types';

export interface Perk {
  /** 条件说明 */
  need: string;
  /** 回报说明 */
  reward: string;
  ok: (s: GameState) => boolean;
  /** 已经拿到（例如事件已发生） */
  done?: (s: GameState) => boolean;
}

const t = (s: GameState, n: NpcId) => R(s, n).trust;
const r = (s: GameState, n: NpcId) => R(s, n).respect;
const f = (s: GameState, n: NpcId) => R(s, n).favor;
const wins = (s: GameState, id: string) => ((s.flags[`wins_${id}`] as number) ?? 0) >= 1;

export const PERKS: Partial<Record<NpcId, Perk[]>> = {
  gensai: [
    { need: '入门后 · 信任 15', reward: '可以请教一次，突破一项能力上限', ok: (s) => !!s.flags.admitted && t(s, 'gensai') >= 15 },
    { need: '信任 30', reward: '可以请教第二次', ok: (s) => t(s, 'gensai') >= 30 },
    { need: '信任 30 · 尊敬 22 · 胜隼人一次', reward: '接受师父的考验，习得“柳返”，三项上限 +1', ok: (s) => t(s, 'gensai') >= 30 && r(s, 'gensai') >= 22 && wins(s, 'hayato'), done: (s) => !!s.flags.masterRecognized },
    { need: '信任 45', reward: '可以请教第三次', ok: (s) => t(s, 'gensai') >= 45 },
  ],
  hayato: [
    { need: '信任 14 · 尊敬 10 · 胜他一次', reward: '茶屋夜谈，成为朋友并学会“踏入”', ok: (s) => t(s, 'hayato') >= 14 && r(s, 'hayato') >= 10 && wins(s, 'hayato'), done: (s) => s.player.techniques.includes('fumikomi') },
    { need: '信任 20', reward: '切磋后会告诉你权六的习惯（权六情报 +1）', ok: (s) => t(s, 'hayato') >= 20 },
  ],
  seibei: [
    { need: '信任 20', reward: '帮他拉风箱的工钱从 20 文涨到 30 文', ok: (s) => t(s, 'seibei') >= 20 },
    { need: '保住铺子', reward: '特制橡木木刀（威力 +1），并把你介绍给又左卫门', ok: (s) => quest(s, 'seibei') >= 4, done: (s) => quest(s, 'seibei') >= 4 },
  ],
  oryo: [
    { need: '信任 12', reward: '托付“可疑的行商”委托', ok: (s) => t(s, 'oryo') >= 12, done: (s) => (s.quests.spy ?? 0) >= 1 },
    { need: '信任 20', reward: '可以请她引荐买家', ok: (s) => t(s, 'oryo') >= 20 },
    { need: '信任 25', reward: '交谈时会告诉你别人喜欢什么礼物', ok: (s) => t(s, 'oryo') >= 25 },
  ],
  toshiie: [
    { need: '信任 15 · 胜他一次', reward: '传授“见切”（眼力视为高一级）', ok: (s) => t(s, 'toshiie') >= 15 && wins(s, 'toshiie'), done: (s) => s.player.techniques.includes('mikiri') },
    { need: '信任 20 · 尊敬 12', reward: '邀你一同奔赴战场', ok: (s) => t(s, 'toshiie') >= 20 && r(s, 'toshiie') >= 12, done: (s) => !!s.flags.toshiieOathAsked },
  ],
  gonroku: [{ need: '胜他一次', reward: '承认你能破他的守', ok: (s) => wins(s, 'gonroku') }],
  gosaku: [
    { need: '救下孙子', reward: '炭窑按旧价卖炭给你', ok: (s) => !!s.flags.villageSaved },
    { need: '孙子康复后', reward: '村里人凑钱谢你，并告诉你后山的跑步路线', ok: (s) => s.npcs.gosaku.memories.some((m) => m.id === 'recovered') },
    { need: '恩义 30', reward: '五郎作逢人便说你的好话（名声更容易提升）', ok: (s) => f(s, 'gosaku') >= 30 },
  ],
};
