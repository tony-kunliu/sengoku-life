// 基础状态操作（在克隆后的草稿上原地修改）
import type { GameState, LogKind, NpcId, NpcState, Stance, StatKey } from './types';

export const SAVE_VERSION = 2;

const ALL_NPCS: NpcId[] = ['gensai', 'hayato', 'seibei', 'oryo', 'toshiie', 'gonroku', 'gosaku', 'nobunaga'];

function freshNpc(): NpcState {
  return { rel: { trust: 0, respect: 0, favor: 0, stance: 'stranger', met: false }, memories: [], talkedDay: 0 };
}

export function newGame(name: string, seed = Date.now() % 1_000_000_007): GameState {
  const npcs = {} as Record<NpcId, NpcState>;
  ALL_NPCS.forEach((id) => (npcs[id] = freshNpc()));
  const stat = (lv: number) => ({ lv, xp: 0, cap: 3, reps: 0 });
  return {
    version: SAVE_VERSION,
    seed,
    rngState: seed,
    day: 1,
    slot: 0,
    location: 'village',
    player: {
      name: name.trim() || '无名',
      money: 0,
      fame: 0,
      stats: { atk: stat(2), def: stat(2), eye: stat(1) },
      // 现代人受过教育：智略起点较高；口才、医术要在这个时代慢慢学
      life: { wit: { lv: 1, xp: 0, cap: 5, reps: 0 }, speech: { lv: 0, xp: 0, cap: 5, reps: 0 }, med: { lv: 0, xp: 0, cap: 5, reps: 0 } },
      maxStamina: 8,
      techniques: [],
      weapon: 0,
      lodging: 'none',
    },
    npcs,
    flags: {},
    quests: {},
    oppKnowledge: {},
    world: { imagawa: 0, odaIntel: 0, rumorsHeard: [] },
    scene: null,
    bout: null,
    log: [],
    seenScenes: [],
    daily: {},
    ended: false,
    ending: null,
    record: { bouts: 0, wins: 0, losses: 0 },
    toast: [],
  };
}

export const clone = (s: GameState): GameState => structuredClone(s);

export function log(s: GameState, text: string, kind: LogKind = 'action') {
  s.log.push({ day: s.day, slot: s.slot, text, kind });
  if (s.log.length > 400) s.log.splice(0, s.log.length - 400);
}

export function toast(s: GameState, text: string) {
  s.toast.push(text);
}

const clamp = (n: number) => Math.max(-100, Math.min(100, n));

const REL_LABEL = { trust: '信任', respect: '尊敬', favor: '恩义' } as const;

export function rel(
  s: GameState,
  npc: NpcId,
  d: { trust?: number; respect?: number; favor?: number },
  names: Record<string, string> = {},
) {
  const r = s.npcs[npc].rel;
  const parts: string[] = [];
  for (const k of ['trust', 'respect', 'favor'] as const) {
    const v = d[k];
    if (!v) continue;
    r[k] = clamp(r[k] + v);
    parts.push(`${REL_LABEL[k]}${v > 0 ? '+' : ''}${v}`);
  }
  if (!r.met) meet(s, npc);
  if (parts.length) toast(s, `${names[npc] ?? npc} ${parts.join(' ')}`);
}

export function meet(s: GameState, npc: NpcId) {
  const r = s.npcs[npc].rel;
  if (!r.met) {
    r.met = true;
    if (r.stance === 'stranger') r.stance = 'neutral';
  }
}

export function setStance(s: GameState, npc: NpcId, stance: Stance) {
  s.npcs[npc].rel.stance = stance;
}

export function remember(s: GameState, npc: NpcId, id: string, text: string) {
  const m = s.npcs[npc].memories;
  if (m.some((x) => x.id === id)) return;
  m.push({ id, day: s.day, text });
  log(s, text, 'memory');
}

export function hasMem(s: GameState, npc: NpcId, id: string) {
  return s.npcs[npc].memories.some((x) => x.id === id);
}

export function flag(s: GameState, key: string) {
  return s.flags[key];
}

export function quest(s: GameState, id: string) {
  return s.quests[id] ?? 0;
}

export function R(s: GameState, npc: NpcId) {
  return s.npcs[npc].rel;
}

/** 今天做过某事几次 */
export function doneToday(s: GameState, key: string): number {
  const d = s.daily[key];
  return d && d.day === s.day ? d.count : 0;
}

export function markToday(s: GameState, key: string) {
  const c = doneToday(s, key);
  s.daily[key] = { day: s.day, count: c + 1 };
}

export function statLv(s: GameState, k: StatKey) {
  return s.player.stats[k].lv;
}
