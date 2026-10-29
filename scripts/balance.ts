// 平衡性模拟：npx tsx scripts/balance.ts
import { createCombat, simulate } from '../src/engine/combat/rules';
import { opponentWeights, weightsToProbs } from '../src/engine/combat/ai';
import type { CombatState, Move } from '../src/engine/combat/types';
import { roll, type RngHolder } from '../src/engine/rng';
import { OPPONENTS } from '../src/content/opponents';

export const COUNTER: Record<Move, Move> = { atk: 'def', def: 'probe', probe: 'atk', adjust: 'atk' };

export const policies: Record<string, (cs: CombatState, h: RngHolder) => Move> = {
  allAtk: () => 'atk',
  allDef: () => 'def',
  allProbe: () => 'probe',
  allAdjust: () => 'adjust',
  random: (_cs, h) => (['atk', 'def', 'probe', 'adjust'] as Move[])[Math.floor(roll(h) * 4)],
  // 会读局的玩家：利用看破与情报（相当于情报等级 3）
  smart: (cs) => {
    if (cs.reveal) return COUNTER[cs.oppNext];
    if (cs.p.stamina <= 2) return 'adjust';
    const probs = weightsToProbs(opponentWeights(cs));
    const top = (Object.keys(probs) as Move[]).sort((a, b) => probs[b] - probs[a])[0];
    return COUNTER[top];
  },
};

function run(oppId: string, stats: { atk: number; def: number; eye: number; st: number }, n = 400) {
  const out: Record<string, string> = {};
  for (const [name, pol] of Object.entries(policies)) {
    let w = 0;
    for (let i = 0; i < n; i++) {
      const cs = createCombat(
        OPPONENTS[oppId],
        { name: '你', atk: stats.atk, def: stats.def, eye: stats.eye, maxStamina: stats.st, techniques: [], weapon: 0 },
        i * 7919 + 13,
      );
      const end = simulate(cs, pol);
      if (end.result === 'win') w++;
    }
    out[name] = ((w / n) * 100).toFixed(0) + '%';
  }
  return out;
}

if (process.argv[1]?.includes('balance')) {
  const early = { atk: 2, def: 2, eye: 1, st: 8 };
  const mid = { atk: 3, def: 3, eye: 2, st: 9 };
  const late = { atk: 4, def: 4, eye: 3, st: 10 };
  for (const opp of ['hayato', 'gonroku', 'toshiie', 'gensai']) {
    console.log(opp, 'early', run(opp, early));
    console.log(opp, 'mid  ', run(opp, mid));
    console.log(opp, 'late ', run(opp, late));
  }
}
