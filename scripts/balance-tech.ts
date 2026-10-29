// 秘传平衡：npx tsx scripts/balance-tech.ts
import { createCombat, resolveRound, canUseTech } from '../src/engine/combat/rules';
import { opponentWeights, weightsToProbs } from '../src/engine/combat/ai';
import type { CombatState, Move, TechId } from '../src/engine/combat/types';
import { OPPONENTS } from '../src/content/opponents';
import { roll } from '../src/engine/rng';

const C: Record<Move, Move> = { atk: 'def', def: 'probe', probe: 'atk', adjust: 'atk' };
type Pol = (cs: CombatState, h: { rng: number }) => [Move, TechId?];

const smart: Pol = (cs) => {
  if (cs.reveal) return [C[cs.oppNext]];
  if (cs.p.stamina <= 2) return ['adjust'];
  const p = weightsToProbs(opponentWeights(cs));
  return [C[(Object.keys(p) as Move[]).sort((a, b) => p[b] - p[a])[0]]];
};
// 会用秘传的读局者：看破时用最合适的秘传
const smartTech: Pol = (cs, h) => {
  const [m] = smart(cs, h);
  const next = cs.reveal ? cs.oppNext : null;
  if (next === 'atk' && canUseTech(cs, 'zanshin')) return ['def', 'zanshin'];
  if (next === 'atk' && canUseTech(cs, 'sasoi')) return ['probe', 'sasoi'];
  if (next === 'def' && canUseTech(cs, 'nidan')) return ['atk', 'nidan'];
  return [m];
};
// 无脑：势一够就乱用秘传
const spamTech: Pol = (cs, h) => {
  for (const t of ['zanshin', 'nidan', 'sasoi'] as TechId[]) if (canUseTech(cs, t)) return [t === 'zanshin' ? 'def' : t === 'nidan' ? 'atk' : 'probe', t];
  return [(['atk', 'def', 'probe', 'adjust'] as Move[])[Math.floor(roll(h) * 4)]];
};
const allDefTech: Pol = (cs) => (canUseTech(cs, 'zanshin') ? ['def', 'zanshin'] : ['def']);

function rate(opp: string, techs: string[], pol: Pol, n = 400) {
  let w = 0;
  for (let i = 0; i < n; i++) {
    let cs = createCombat(OPPONENTS[opp], { name: '你', atk: 3, def: 3, eye: 2, maxStamina: 9, techniques: techs, weapon: 0 }, i * 7919 + 13);
    const h = { rng: i + 1 };
    for (let k = 0; k < 40 && !cs.finished; k++) {
      const [m, t] = pol(cs, h);
      cs = resolveRound(cs, m, t);
    }
    if (cs.result === 'win') w++;
  }
  return Math.round((w / n) * 100) + '%';
}

const ALL = ['nidan', 'sasoi', 'zanshin'];
for (const opp of ['hayato', 'gonroku', 'toshiie', 'gensai']) {
  console.log(opp.padEnd(8), '读局无秘传', rate(opp, [], smart), '| 读局+秘传', rate(opp, ALL, smartTech), '| 乱用秘传', rate(opp, ALL, spamTech), '| 只防守+残心', rate(opp, ALL, allDefTech));
}
