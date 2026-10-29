// 能力检定：选项上标明需要什么，不够时说明还差多少（让玩家知道该去练什么）
import { lv, STAT_FULL } from './training';
import type { AnyKey, GameState } from './types';

export type Need = Partial<Record<AnyKey, number>>;

export function needTag(n: Need): string {
  return Object.entries(n)
    .map(([k, v]) => `${STAT_FULL[k as AnyKey]} ${v}`)
    .join(' · ');
}

/** 满足返回 null，否则返回原因 */
export function needLock(s: GameState, n: Need): string | null {
  const miss = Object.entries(n)
    .filter(([k, v]) => lv(s, k as AnyKey) < (v as number))
    .map(([k, v]) => `${STAT_FULL[k as AnyKey]} ${v}（现在 ${lv(s, k as AnyKey)}）`);
  return miss.length ? `需要 ${miss.join('、')}` : null;
}

export function meets(s: GameState, n: Need): boolean {
  return needLock(s, n) === null;
}
