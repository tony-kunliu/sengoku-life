import { needLock, needTag, type Need } from '../../engine/checks';
import type { GameState } from '../../engine/types';

/** 给选项加上能力检定：标签显示要求，不足时锁定并说明还差多少 */
export function req(n: Need): { tag: string; locked: (s: GameState) => string | null } {
  return { tag: needTag(n), locked: (s) => needLock(s, n) };
}
