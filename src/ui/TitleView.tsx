import { useState } from 'react';
import { dateLabel } from '../engine/calendar';
import type { SaveMeta } from '../engine/save';
import { TitleArt } from './art';

export function TitleView({ meta, onContinue, onNew }: { meta: SaveMeta | null; onContinue: () => void; onNew: (name: string) => void }) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  return (
    <div className="title-screen">
      <TitleArt />
      <div className="title-inner">
        <h1 className="game-title" aria-label="战国浮生录">
          <span>战国</span>
          <span>浮生录</span>
        </h1>
        <p className="title-sub">第一章 · 乱世来客</p>
        <p className="title-lede">永禄三年，尾张清洲。距离桶狭间，还有十六日。</p>

        {!naming ? (
          <div className="title-actions">
            {meta && (
              <button className="primary big" onClick={onContinue}>
                继续游戏
                <small>
                  {meta.name} · {dateLabel(meta.day)}
                </small>
              </button>
            )}
            <button className={meta ? 'ghost big' : 'primary big'} onClick={() => setNaming(true)}>
              新的人生
            </button>
            <p className="title-note">一局约 20–30 分钟 · 每次行动自动存档</p>
          </div>
        ) : (
          <form
            className="name-form"
            onSubmit={(e: Event) => {
              e.preventDefault();
              onNew(name.trim() || '无名');
            }}
          >
            <label htmlFor="pname">在这个时代，你叫什么名字？</label>
            <input
              id="pname"
              value={name}
              maxLength={8}
              placeholder="例如：林一"
              autoComplete="off"
              onInput={(e: Event) => setName((e.target as HTMLInputElement).value)}
            />
            <button className="primary big" type="submit">
              睁开眼睛
            </button>
            {meta && <p className="title-note">开始新游戏会覆盖自动存档（手动档位不受影响）。</p>}
            <button type="button" className="link" onClick={() => setNaming(false)}>
              返回
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
