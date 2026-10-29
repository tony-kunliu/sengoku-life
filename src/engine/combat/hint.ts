// “气配”提示：情报等级越高，越能看出对手的意图。
import { opponentWeights, weightsToProbs } from './ai';
import type { CombatState, Move, OpponentDef } from './types';
import { MOVE_LABEL, TECH_COST } from './types';
import { TECH_NAME } from './rules';

export interface Hint {
  level: number;
  text: string;
  /** 已看破时为确定的下一手 */
  certain?: Move;
  probs?: { move: Move; p: number }[];
}

export function makeHint(cs: CombatState, opp: OpponentDef, knowledge: number): Hint {
  if (cs.reveal) {
    const tech = cs.oppTech ? `【${TECH_NAME[cs.oppTech]}】（${MOVE_LABEL[cs.oppNext]}）` : `【${MOVE_LABEL[cs.oppNext]}】`;
    return {
      level: 4,
      certain: cs.oppNext,
      text: `看破！${opp.tells[cs.oppNext]}——下一手必是${tech}。`,
    };
  }
  const level = Math.min(3, knowledge + (cs.p.eye >= 3 ? 1 : 0));
  const probs = Object.entries(weightsToProbs(opponentWeights(cs)))
    .map(([move, p]) => ({ move: move as Move, p }))
    .sort((a, b) => b.p - a.p);
  const warn = cs.o.techniques.includes('nidan') && cs.o.sei >= TECH_COST.nidan ? '气势逼人：对手的进攻会是【二段】，光挡不够。' : '';
  if (warn && level >= 1) return { level, text: warn, probs: level >= 3 ? probs.slice(0, 3) : undefined };
  if (level <= 0) {
    return { level, text: '看不透对方的心思。（输一次、在道场观摩或向熟人打听，都能了解其习惯）' };
  }
  if (level === 1) return { level, text: opp.styleNote };
  const top = probs[0];
  if (level === 2) {
    return { level, text: `${opp.tells[top.move]}——多半会【${MOVE_LABEL[top.move]}】。` };
  }
  return {
    level,
    text: `${opp.tells[top.move]}`,
    probs: probs.slice(0, 3),
  };
}

/** 师父考验的评价：看重读局与心性，而非输赢 */
export function gradeTest(cs: CombatState): { score: number; notes: string[] } {
  const notes: string[] = [];
  let score = 0;
  const h = cs.history;
  const probes = h.filter((r) => r.pMove === 'probe').length;
  if (probes >= 1) {
    score += 1;
    notes.push('懂得先观察再出手');
  } else notes.push('一次也没有试探，只凭冲动');
  const usedReveal = h.filter((r) => r.revealed);
  const goodAnswers = usedReveal.filter(
    (r) =>
      (r.oMove === 'atk' && r.pMove === 'def') ||
      (r.oMove === 'def' && r.pMove === 'probe') ||
      ((r.oMove === 'probe' || r.oMove === 'adjust') && r.pMove === 'atk'),
  ).length;
  if (goodAnswers >= 1) {
    score += 1;
    notes.push('看破之后能做出正确应对');
  }
  const reckless = h.filter((r, i) => r.pMove === 'atk' && i > 0 && staminaBefore(cs, i) <= 1).length;
  if (reckless === 0) {
    score += 1;
    notes.push('气力将尽时没有乱砍');
  } else notes.push('气力耗尽仍强行进攻');
  if (cs.p.points >= 1) {
    score += 1;
    notes.push('取得了一本');
  }
  const variety = new Set(h.map((r) => r.pMove)).size;
  if (variety >= 3) {
    score += 1;
    notes.push('攻守有变化，不拘泥一招');
  }
  return { score, notes };
}

/** 估算第 i 回合开始前玩家的气力（由历史回放计算） */
function staminaBefore(cs: CombatState, i: number): number {
  let st = cs.p.maxStamina;
  const cost = { atk: -2, def: -1, probe: -1, adjust: 3 } as const;
  for (let k = 0; k < i; k++) st = Math.max(0, Math.min(cs.p.maxStamina, st + cost[cs.history[k].pMove]));
  return st;
}
