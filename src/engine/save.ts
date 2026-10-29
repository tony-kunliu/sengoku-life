// 存档：本地持久化 + 版本迁移 + 存档码导入导出
import { SAVE_VERSION } from './core';
import type { GameState } from './types';

export const SAVE_PREFIX = 'sengoku-life:';
export type SlotKey = 'auto' | '1' | '2' | '3';

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** 版本迁移表：key 为旧版本号，函数把它升级到下一个版本 */
export const MIGRATIONS: Record<number, Migration> = {
  // 0 → 1：早期测试存档缺少 toast / record 字段
  0: (raw) => ({ ...raw, toast: [], record: raw.record ?? { bouts: 0, wins: 0, losses: 0 }, version: 1 }),
  // 1 → 2：v0.3 新增生活能力（智略 / 口才 / 医术）
  1: (raw) => {
    const player = { ...(raw.player as Record<string, unknown>) };
    if (!player.life) {
      const med = (raw.flags as Record<string, unknown>)?.villageSaved ? 1 : 0;
      player.life = {
        wit: { lv: 1, xp: 0, cap: 5, reps: 0 },
        speech: { lv: 0, xp: 0, cap: 5, reps: 0 },
        med: { lv: med, xp: 0, cap: 5, reps: 0 },
      };
    }
    return { ...raw, player, version: 2 };
  },
  // 2 → 3：v0.4 新增技法携带（最多 3 个），比试状态新增“势”
  2: (raw) => {
    const player = { ...(raw.player as Record<string, unknown>) };
    const techs = (player.techniques as string[]) ?? [];
    if (!player.equipped) player.equipped = techs.slice(0, 3);
    const bout = raw.bout as { combat: Record<string, unknown> & { p: Record<string, unknown>; o: Record<string, unknown> } } | null;
    if (bout?.combat) {
      bout.combat.p.sei ??= 0;
      bout.combat.o.sei ??= 0;
      bout.combat.oppTech ??= null;
    }
    return { ...raw, player, version: 3 };
  },
};

export function migrate(raw: unknown): GameState {
  if (!raw || typeof raw !== 'object') throw new Error('存档格式错误');
  let obj = raw as Record<string, unknown>;
  let v = typeof obj.version === 'number' ? obj.version : 0;
  if (v > SAVE_VERSION) throw new Error('存档来自更新的版本，无法读取');
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) throw new Error(`缺少从版本 ${v} 升级的迁移`);
    obj = m(obj);
    v = obj.version as number;
  }
  const s = obj as unknown as GameState;
  if (typeof s.day !== 'number' || !s.player || !s.npcs) throw new Error('存档内容不完整');
  s.toast = [];
  return s;
}

export function serialize(s: GameState): string {
  return JSON.stringify({ ...s, toast: [] });
}

export function deserialize(json: string): GameState {
  return migrate(JSON.parse(json));
}

// —— 存档码（可复制到备忘录，防止浏览器清除数据） ——
export function toCode(s: GameState): string {
  const bytes = new TextEncoder().encode(serialize(s));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return 'SL1.' + btoa(bin);
}

export function fromCode(code: string): GameState {
  const c = code.trim().replace(/^SL1\./, '');
  const bin = atob(c);
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return deserialize(new TextDecoder().decode(bytes));
}

// —— 浏览器存储（任何时候都可能不可用，全部 try/catch） ——
export interface SaveMeta {
  slot: SlotKey;
  name: string;
  day: number;
  savedAt: number;
}

export function storageAvailable(): boolean {
  try {
    const k = SAVE_PREFIX + '__t';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function writeSlot(slot: SlotKey, s: GameState): boolean {
  try {
    localStorage.setItem(SAVE_PREFIX + slot, serialize(s));
    const meta: SaveMeta = { slot, name: s.player.name, day: s.day, savedAt: Date.now() };
    localStorage.setItem(SAVE_PREFIX + slot + ':meta', JSON.stringify(meta));
    return true;
  } catch {
    return false;
  }
}

export function readSlot(slot: SlotKey): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_PREFIX + slot);
    if (!raw) return null;
    return deserialize(raw);
  } catch {
    return null;
  }
}

export function readMeta(slot: SlotKey): SaveMeta | null {
  try {
    const raw = localStorage.getItem(SAVE_PREFIX + slot + ':meta');
    return raw ? (JSON.parse(raw) as SaveMeta) : null;
  } catch {
    return null;
  }
}

export function deleteSlot(slot: SlotKey) {
  try {
    localStorage.removeItem(SAVE_PREFIX + slot);
    localStorage.removeItem(SAVE_PREFIX + slot + ':meta');
  } catch {
    /* ignore */
  }
}
