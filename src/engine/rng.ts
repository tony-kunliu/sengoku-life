// 可复现的伪随机数（mulberry32）。状态存放在存档里，保证读档后结果一致。

export function nextRandom(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) | 0;
  const next = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, next];
}

/** 一个可变的 RNG 持有者，方便在克隆后的草稿状态上使用 */
export interface RngHolder {
  rng: number;
}

export function roll(h: RngHolder): number {
  const [v, n] = nextRandom(h.rng);
  h.rng = n;
  return v;
}

/** 按权重抽取 */
export function weighted<K extends string>(h: RngHolder, weights: Record<K, number>): K {
  const entries = Object.entries(weights) as [K, number][];
  const total = entries.reduce((a, [, w]) => a + Math.max(0, w), 0);
  let r = roll(h) * total;
  for (const [k, w] of entries) {
    r -= Math.max(0, w);
    if (r < 0) return k;
  }
  return entries[entries.length - 1][0];
}

/** -1 / 0 / +1 的小幅波动（25% / 50% / 25%） */
export function jitter(h: RngHolder): number {
  const v = roll(h);
  return v < 0.25 ? -1 : v < 0.75 ? 0 : 1;
}
