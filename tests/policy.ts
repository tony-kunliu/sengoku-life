export { opponentWeights, weightsToProbs } from '../src/engine/combat/ai';
import type { Move } from '../src/engine/combat/types';
export const COUNTER: Record<Move, Move> = { atk: 'def', def: 'probe', probe: 'atk', adjust: 'atk' };
