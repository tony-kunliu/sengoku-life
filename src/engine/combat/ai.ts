// 对手行为倾向 —— 每种风格是“局面 → 行动权重”的函数。
// 权重本身就是对手的“习惯”，情报等级越高，玩家看到的提示越接近这些权重。

import type { CombatState, Move } from './types';

const COUNTER: Record<Move, Move> = { atk: 'def', def: 'probe', probe: 'atk', adjust: 'atk' };

function lastPlayerMoves(cs: CombatState, n: number): Move[] {
  return cs.history.slice(-n).map((r) => r.pMove);
}

function norm(w: Record<Move, number>): Record<Move, number> {
  for (const k of Object.keys(w) as Move[]) w[k] = Math.max(0.1, w[k]);
  return w;
}

export function opponentWeights(cs: CombatState): Record<Move, number> {
  const me = cs.o;
  const foe = cs.p;
  const last = cs.history[cs.history.length - 1];
  const lastTwo = lastPlayerMoves(cs, 2);
  let w: Record<Move, number>;

  switch (cs.style) {
    case 'aggressive': {
      // 积极进攻型：喜欢抢攻，被得分后更急躁；气力见底时才会调整
      w = { atk: 5, def: 1.2, probe: 1, adjust: 0.6 };
      if (cs.initiative === 'o') w.atk += 2;
      if (foe.posture <= 1) w.atk += 3;
      if (foe.stamina <= 2) w.atk += 2;
      if (last?.scorer === 'p') w.atk += 2;
      if (last?.pMove === 'def') w.probe += 1.5;
      if (lastTwo.length === 2 && lastTwo.every((m) => m === 'def')) w.probe += 7;
      if (me.stamina <= 2) {
        w.adjust += 6;
        w.atk -= 3;
      }
      break;
    }
    case 'cautious': {
      // 谨慎防守反击型：守住中段等对手犯错，对手疲惫或架势崩溃时才出手
      w = { atk: 1, def: 4, probe: 1.5, adjust: 1.5 };
      if (foe.stamina <= 2 || foe.posture <= 1) w.atk += 5;
      if (cs.initiative === 'o' && me.posture >= 3) w.atk += 2;
      if (last?.pMove === 'atk') w.def += 2;
      if (lastTwo.length === 2 && lastTwo.every((m) => m === 'probe')) w.atk += 3;
      if (lastTwo.length === 2 && lastTwo.every((m) => m === 'def')) w.probe += 4;
      if (me.stamina <= 2) {
        w.adjust += 4;
        w.def -= 1;
      }
      break;
    }
    case 'adaptive':
    case 'master': {
      // 应变型：观察你最近的习惯并针对
      const recent = lastPlayerMoves(cs, 3);
      w = cs.style === 'master' ? { atk: 2, def: 3, probe: 2, adjust: 1 } : { atk: 2.5, def: 2, probe: 1.5, adjust: 0.8 };
      if (recent.length) {
        const counts: Record<Move, number> = { atk: 0, def: 0, probe: 0, adjust: 0 };
        recent.forEach((m) => (counts[m] += 1));
        let pred: Move = recent[recent.length - 1];
        for (const m of Object.keys(counts) as Move[]) if (counts[m] > counts[pred]) pred = m;
        w[COUNTER[pred]] += (cs.style === 'master' ? 2.5 : 4) * (counts[pred] / recent.length);
      }
      if (foe.stamina <= 0) w.atk += 4;
      if (me.stamina <= 2) {
        w.adjust += 4;
        w.atk -= 1.5;
      }
      break;
    }
  }
  return norm(w);
}

export function weightsToProbs(w: Record<Move, number>): Record<Move, number> {
  const t = Object.values(w).reduce((a, b) => a + b, 0);
  const out = {} as Record<Move, number>;
  for (const k of Object.keys(w) as Move[]) out[k] = w[k] / t;
  return out;
}
