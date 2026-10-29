import '../src/content';
import { COUNTER, opponentWeights, weightsToProbs } from './policy';
import { choose, closeBout, currentNode, performAction, playMove, sleep, talk, travel, txt, visibleChoices, actionLock } from '../src/engine/game';
import type { Move } from '../src/engine/combat/types';
import type { GameState, LocationId, NpcId } from '../src/engine/types';

/** 读局玩家：看破就克制，否则针对最可能的一手 */
export function smartMove(s: GameState): Move {
  const cs = s.bout!.combat;
  if (cs.reveal) return COUNTER[cs.oppNext];
  if (cs.p.stamina <= 2) return 'adjust';
  const probs = weightsToProbs(opponentWeights(cs));
  const top = (Object.keys(probs) as Move[]).sort((a, b) => probs[b] - probs[a])[0];
  if (cs.history.length === 0) return 'probe';
  return COUNTER[top];
}

/** 处理场景与比试，直到回到自由行动状态 */
export function settle(s: GameState, prefer: string[] = [], movePolicy = smartMove, trace: string[] = []): GameState {
  let guard = 0;
  while ((s.scene || s.bout) && !s.ended && guard++ < 400) {
    if (s.bout) {
      if (s.bout.combat.finished) s = closeBout(s);
      else s = playMove(s, movePolicy(s));
      continue;
    }
    const n = currentNode(s)!;
    const ch = visibleChoices(s).filter((c) => !c.lock);
    if (ch.length) {
      const labels = ch.map((c) => txt(s, c.c.label));
      let pick = ch[0];
      for (const p of prefer) {
        const i = labels.findIndex((l) => l.includes(p));
        if (i >= 0) {
          pick = ch[i];
          break;
        }
      }
      trace.push(`[${s.scene!.id}] ▸ ${txt(s, pick.c.label)}`);
      s = choose(s, pick.i);
    } else {
      void n;
      s = choose(s, 0);
    }
  }
  return s;
}

export function act(s: GameState, id: string, prefer: string[] = [], trace: string[] = []): GameState {
  const lock = actionLock(s, id);
  if (lock) {
    trace.push(`(无法 ${id}: ${lock})`);
    return s;
  }
  s = performAction(s, id);
  trace.push(`${s.day}:${s.slot} ${id}`);
  return settle(s, prefer, smartMove, trace);
}

export function go(s: GameState, loc: LocationId, prefer: string[] = [], trace: string[] = []) {
  return settle(travel(s, loc), prefer, smartMove, trace);
}

export function say(s: GameState, npc: NpcId, prefer: string[] = [], trace: string[] = []) {
  return settle(talk(s, npc), prefer, smartMove, trace);
}

export function rest(s: GameState, prefer: string[] = [], trace: string[] = []) {
  return settle(sleep(s), prefer, smartMove, trace);
}
