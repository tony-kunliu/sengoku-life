import type { Slot } from './types';

export const SLOT_LABEL = ['朝', '昼', '晚'] as const;

/** 第 1 日 = 永禄三年（1560）五月初三（旧历） */
export const START_MONTH_DAY = 3;
/** 桶狭间之战：五月十九日 = 第 17 日 */
export const OKEHAZAMA_DAY = 17;

const CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

export function cnDay(n: number): string {
  if (n <= 10) return '初' + CN[n];
  if (n < 20) return '十' + CN[n - 10];
  if (n === 20) return '二十';
  if (n < 30) return '廿' + CN[n - 20];
  return '三十';
}

export function monthDay(day: number): number {
  return START_MONTH_DAY + day - 1;
}

export function dateLabel(day: number): string {
  return `五月${cnDay(monthDay(day))}`;
}

export function fullDateLabel(day: number, slot: Slot): string {
  return `永禄三年 ${dateLabel(day)} · ${SLOT_LABEL[slot]}`;
}

export function daysUntilOkehazama(day: number): number {
  return OKEHAZAMA_DAY - day;
}
