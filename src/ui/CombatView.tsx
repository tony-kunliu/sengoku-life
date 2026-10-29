import { makeHint } from '../engine/combat/hint';
import { describeState, previewMove } from '../engine/combat/rules';
import type { Fighter, Move } from '../engine/combat/types';
import { MOVE_LABEL } from '../engine/combat/types';
import { closeBout, forfeitBout, playMove } from '../engine/game';
import { REG } from '../engine/registry';
import type { GameState, NpcId } from '../engine/types';
import type { Apply } from './App';
import { Seal } from './art';

const MOVE_GLYPH: Record<Move, string> = { atk: '攻', def: '守', probe: '探', adjust: '整' };
const MOVE_HINT: Record<Move, string> = {
  atk: '克试探·调整',
  def: '克进攻',
  probe: '克防守',
  adjust: '恢复',
};
const POSTURE = ['崩', '乱', '稳', '固', '盛'];

function FighterPanel({ f, target, glyph, color, side }: { f: Fighter; target: number; glyph: string; color: string; side: 'p' | 'o' }) {
  return (
    <div className={`fighter ${side}`}>
      <Seal glyph={glyph} color={color} size={42} />
      <div className="f-body">
        <div className="f-name">
          <strong>{f.name}</strong>
          <span className="ippon" aria-label={`得分 ${f.points}`}>
            {Array.from({ length: target }).map((_, i) => (
              <span key={i} className={`ippon-mark ${i < f.points ? 'on' : ''}`} />
            ))}
          </span>
        </div>
        <div className="f-stats">
        <div className="meter" aria-label={`气力 ${f.stamina}/${f.maxStamina}`}>
          <span className="meter-label">气力</span>
          <span className="meter-track">
            <span className="meter-fill" style={{ width: `${(f.stamina / f.maxStamina) * 100}%` }} />
          </span>
          <span className="meter-num">{f.stamina}</span>
        </div>
        <div className="posture">
          <span className="meter-label">架势</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`pst ${i <= f.posture ? 'on' : ''} ${f.posture <= 1 && i <= f.posture ? 'bad' : ''}`} />
          ))}
          <span className="pst-name">{POSTURE[f.posture]}</span>
        </div>
        </div>
      </div>
    </div>
  );
}

export function CombatView({ s, apply }: { s: GameState; apply: Apply }) {
  const { combat: cs, context } = s.bout!;
  const opp = REG.opponentFor(s, cs.oppId);
  const npc = REG.npcs[cs.oppId as NpcId];
  const knowledge = s.oppKnowledge[cs.oppId] ?? 0;
  const hint = makeHint(cs, opp, knowledge);
  const last = cs.history[cs.history.length - 1];
  const moves: Move[] = ['atk', 'def', 'probe', 'adjust'];

  return (
    <div className="overlay combat" role="dialog" aria-label={context.label}>
      <div className="combat-head">
        <span className="bout-label">{context.label}</span>
        <span className="head-right">
          <span className="round">
            第 {Math.min(cs.round, cs.maxRounds)}/{cs.maxRounds} 回合 · {cs.target === 1 ? '一本胜负' : `${cs.target} 本先取`}
          </span>
          {context.kind === 'spar' && !cs.finished && (
            <button className="forfeit" onClick={() => apply(forfeitBout)}>
              认输
            </button>
          )}
        </span>
      </div>

      <FighterPanel f={cs.o} target={cs.target} glyph={npc?.glyph ?? '敌'} color={npc?.color ?? '#5a3a2a'} side="o" />

      <div className="field" aria-label={describeState(cs)}>
        <div className={`distance d${cs.distance}`}>
          <span className="dist-mark o" />
          <span className="dist-line" />
          <span className="dist-mark p" />
        </div>
        <div className="field-text">
          {describeState(cs)}
          {cs.initiative && <span className={`init ${cs.initiative}`}>{cs.initiative === 'p' ? '先' : '后'}</span>}
        </div>
      </div>

      <FighterPanel f={cs.p} target={cs.target} glyph={s.player.name.slice(0, 1)} color="#1f2a44" side="p" />

      {last && (
        <div className={`exchange ${last.scorer ? `scored-${last.scorer}` : ''}`} key={cs.history.length}>
          <div className="ex-moves">
            你【{MOVE_LABEL[last.pMove]}】 对 {cs.o.name}【{MOVE_LABEL[last.oMove]}】
          </div>
          {last.lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      )}

      {!cs.finished ? (
        <>
          <div className={`hint lv${hint.level}`}>
            <span className="hint-label">{hint.level === 4 ? '看破' : '气配'}</span>
            <div>
              <p>{hint.text}</p>
              {hint.probs && (
                <p className="probs">
                  {hint.probs.map((p) => `${MOVE_LABEL[p.move]} ${Math.round(p.p * 100)}%`).join('　')}
                </p>
              )}
            </div>
          </div>
          <div className="moves">
            {moves.map((m) => (
              <button key={m} className={`move m-${m} ${hint.certain && hint.certain !== m ? '' : ''}`} onClick={() => apply((g) => playMove(g, m))}>
                <span className="move-glyph">{MOVE_GLYPH[m]}</span>
                <span className="move-name">{MOVE_LABEL[m]}</span>
                <span className="move-meta">{previewMove(cs, m)}</span>
                <span className="move-beat">{MOVE_HINT[m]}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className={`result r-${cs.result}`}>
          <h2>{cs.result === 'win' ? '胜' : cs.result === 'lose' ? '败' : '平'}</h2>
          <p>
            {cs.p.points} 本 对 {cs.o.points} 本
          </p>
          <p className="muted">
            {cs.result === 'win'
              ? '胜负之后，实战的心得会让你突破训练的瓶颈。'
              : '输了也有收获：你更了解对手的习惯了。下次比试时，气配提示会更清楚。'}
          </p>
          <button className="primary" onClick={() => apply(closeBout)}>
            收刀行礼
          </button>
        </div>
      )}
    </div>
  );
}
