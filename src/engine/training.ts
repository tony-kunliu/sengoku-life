// 修行成长：重复训练收益递减；实战、观摩、师父指导是“突破来源”，会重置递减并提高上限。
import { log, toast } from './core';
import type { AnyKey, GameState, LifeKey, StatKey, StatProgress } from './types';

export const STAT_LABEL: Record<StatKey, string> = { atk: '攻', def: '守', eye: '眼' };
export const STAT_FULL: Record<AnyKey, string> = { atk: '攻势', def: '守备', eye: '眼力', wit: '智略', speech: '口才', med: '医术' };
export const LIFE_KEYS: LifeKey[] = ['wit', 'speech', 'med'];
export const MAX_CAP = 6;
export const LIFE_CAP = 5;

export const isLife = (k: AnyKey): k is LifeKey => k === 'wit' || k === 'speech' || k === 'med';

export function prog(s: GameState, k: AnyKey): StatProgress {
  return isLife(k) ? s.player.life[k] : s.player.stats[k];
}

/** 升到下一级所需经验：剑术固定 100；生活能力越往上越难（100 / 140 / 180 / 220 …） */
export function xpNeed(k: AnyKey, level: number): number {
  return isLife(k) ? 100 + 40 * level : 100;
}

/** 当前等级进度百分比（给界面用） */
export function xpPct(s: GameState, k: AnyKey): number {
  const st = prog(s, k);
  return Math.min(100, Math.round((st.xp / xpNeed(k, st.lv)) * 100));
}

/** 当前等级（生活能力与剑术能力通用） */
export function lv(s: GameState, k: AnyKey): number {
  return prog(s, k).lv;
}

/** 计算一次重复训练的经验（不修改状态） */
export function repGain(base: number, reps: number): number {
  return Math.max(2, Math.round(base / (1 + 0.6 * reps)));
}

/**
 * 增加经验。breakthrough=true 表示来自实战/观摩/指导，会重置递减计数。
 * 返回实际描述文本。
 */
export function gainXp(s: GameState, k: AnyKey, amount: number, breakthrough: boolean): string {
  const st = prog(s, k);
  let gain = amount;
  if (breakthrough) st.reps = 0;
  else {
    gain = repGain(amount, st.reps);
    st.reps += 1;
  }
  if (st.lv >= st.cap) {
    const before = st.xp;
    const full = xpNeed(k, st.lv);
    st.xp = Math.min(full, st.xp + gain);
    if (before >= full || st.xp >= full) {
      return isLife(k)
        ? `${STAT_FULL[k]}已达到 ${st.cap} 级的极限。`
        : `${STAT_FULL[k]}已触及瓶颈（上限 ${st.cap}）——需要师父指导或更高层次的实战才能突破。`;
    }
    return `${STAT_FULL[k]}经验 +${gain}（已到当前上限，积累中）`;
  }
  st.xp += gain;
  let msg = `${STAT_FULL[k]}经验 +${gain}`;
  while (st.xp >= xpNeed(k, st.lv) && st.lv < st.cap) {
    st.xp -= xpNeed(k, st.lv);
    st.lv += 1;
    msg += `，${STAT_FULL[k]}提升到 ${st.lv}！`;
    log(s, `${STAT_FULL[k]}提升到 ${st.lv}`, 'growth');
    toast(s, `${STAT_FULL[k]} ↑ ${st.lv}`);
  }
  if (st.lv >= st.cap) st.xp = Math.min(st.xp, xpNeed(k, st.lv));
  return msg;
}

export function raiseCap(s: GameState, k: StatKey, n: number) {
  const st = s.player.stats[k];
  const before = st.cap;
  st.cap = Math.min(MAX_CAP, st.cap + n);
  if (st.cap > before) {
    log(s, `${STAT_FULL[k]}上限提升到 ${st.cap}`, 'growth');
    // 积攒的经验立即生效
    while (st.xp >= 100 && st.lv < st.cap) {
      st.xp -= 100;
      st.lv += 1;
      log(s, `${STAT_FULL[k]}提升到 ${st.lv}`, 'growth');
      toast(s, `${STAT_FULL[k]} ↑ ${st.lv}`);
    }
  }
}

/** 下一次重复训练的预估收益（给 UI 显示递减） */
export function nextRepGain(s: GameState, k: AnyKey, base: number) {
  return repGain(base, prog(s, k).reps);
}
