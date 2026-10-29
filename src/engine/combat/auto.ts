// 速决：按“你的习惯”自动打完一场已经赢过的切磋。
// 策略只用玩家能看到的信息：看破就克制，情报足够时针对对手习惯，气力不足就调整。
import { opponentWeights, weightsToProbs } from './ai';
import type { CombatState, Move } from './types';

const COUNTER: Record<Move, Move> = { atk: 'def', def: 'probe', probe: 'atk', adjust: 'atk' };

export function autoMove(cs: CombatState, knowledge: number): Move {
  if (cs.reveal) return COUNTER[cs.oppNext];
  if (cs.p.stamina <= 2) return 'adjust';
  if (cs.history.length === 0) return 'probe';
  if (knowledge >= 2) {
    const p = weightsToProbs(opponentWeights(cs));
    const top = (Object.keys(p) as Move[]).sort((a, b) => p[b] - p[a])[0];
    return COUNTER[top];
  }
  // 情报不足：克制对手上一手
  return COUNTER[cs.history[cs.history.length - 1].oMove];
}
