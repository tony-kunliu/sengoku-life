import { buildEnding } from '../content/endings';
import type { GameState } from '../engine/types';
import { SceneArt } from './art';

export function EndingView({ s, onTitle }: { s: GameState; onTitle: () => void }) {
  const e = buildEnding(s);
  return (
    <div className="ending">
      <SceneArt name={s.ending === 'flee' ? 'village' : 'night'} className="ending-art" />
      <div className="ending-body">
        <p className="ending-chapter">第一章 · 乱世来客 · 完</p>
        <h1>{e.title}</h1>
        <p className="ending-sub">{e.subtitle}</p>
        {e.paragraphs.map((p, i) => (
          <p key={i} className="ending-p">
            {p}
          </p>
        ))}
        <h2>他们的去向</h2>
        <ul className="fates">
          {e.fates.map((f) => (
            <li key={f.name}>
              <strong>{f.name}</strong>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
        <h2>这一章的足迹</h2>
        <ul className="achv">
          {e.achievements.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <h2>未完待续</h2>
        <ul className="future">
          {e.future.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="muted">换一种选择再来一次：不同的住处、对细作的处置、与谁结下交情，都会改变结局。</p>
        <button className="primary big" onClick={onTitle}>
          回到标题
        </button>
      </div>
    </div>
  );
}
