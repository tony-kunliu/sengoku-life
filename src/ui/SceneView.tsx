import { choose, currentNode, txt, visibleChoices } from '../engine/game';
import { REG } from '../engine/registry';
import type { GameState } from '../engine/types';
import type { Apply } from './App';
import { SceneArt, Seal } from './art';

export function SceneView({ s, apply }: { s: GameState; apply: Apply }) {
  const def = REG.scenes[s.scene!.id];
  const node = currentNode(s);
  if (!def || !node) return null;
  const choices = visibleChoices(s);
  const sp = node.speaker;
  const npc = sp && sp !== 'narrator' && sp !== 'player' ? REG.npcs[sp] : null;
  const text = txt(s, node.text);

  return (
    <div className="overlay scene" role="dialog" aria-label={def.title}>
      <div className="scene-art">
        <SceneArt name={def.art ?? REG.locations[s.location].art} className="hero-art" />
        <h2 className="scene-title">{def.title}</h2>
      </div>
      <div className="scroll-paper" key={`${s.scene!.id}-${s.scene!.node}`}>
        {npc && (
          <div className="speaker">
            <Seal glyph={npc.glyph} color={npc.color} size={46} />
            <div>
              <strong>{s.npcs[npc.id].rel.met || npc.id === 'nobunaga' ? npc.name : '？？？'}</strong>
              <small>{npc.role}</small>
            </div>
          </div>
        )}
        {sp === 'player' && (
          <div className="speaker">
            <Seal glyph={s.player.name.slice(0, 1)} color="#1f2a44" size={46} />
            <div>
              <strong>{s.player.name}</strong>
              <small>心中所想</small>
            </div>
          </div>
        )}
        <div className={`scene-text ${sp === 'narrator' ? 'narr' : ''} ${sp === 'player' ? 'inner' : ''}`}>
          {text.split('\n\n').map((p, i) => (
            <p key={i} className="ink-p" style={{ animationDelay: `${0.12 + i * 0.32}s` }}>
              {p}
            </p>
          ))}
        </div>
      </div>
      <div className="choices">
        {choices.length > 0 ? (
          choices.map(({ c, i, lock }) => (
            <button key={i} className="choice" disabled={!!lock} onClick={() => apply((g) => choose(g, i))}>
              <span>
                {c.tag && <em className="tag">{c.tag}</em>}
                {txt(s, c.label)}
              </span>
              {lock && <small className="lock">{lock}</small>}
            </button>
          ))
        ) : (
          <button className="choice next" onClick={() => apply((g) => choose(g, 0))}>
            {node.next ? '继续' : '结束'}
          </button>
        )}
      </div>
    </div>
  );
}
