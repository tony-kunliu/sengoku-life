import { useState, type ReactNode } from 'react';
import { SoundButton } from './SoundSheet';
import { dateLabel } from '../engine/calendar';
import type { SaveMeta } from '../engine/save';
import { TitleArt } from './art';
import { ENDING_IDS, ENDING_INFO } from '../content/endings';
import { seenEndings } from './gallery';

export function TitleView({
  meta,
  onContinue,
  onNew,
  onSound,
  soundSheet,
}: {
  meta: SaveMeta | null;
  onContinue: () => void;
  onNew: (name: string) => void;
  onSound: () => void;
  soundSheet: ReactNode;
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [gallery, setGallery] = useState(false);
  const seen = seenEndings();
  return (
    <div className="title-screen">
      <TitleArt />
      <SoundButton className="title-sound" onClick={onSound} />
      <div className="title-inner">
        <h1 className="game-title" aria-label="战国浮生录">
          <span className="brush-in">战国</span>
          <span className="brush-in b2">浮生录</span>
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
            <button className="link" onClick={() => setGallery(true)}>
              结局图鉴 {seen.length} / {ENDING_IDS.length}
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
      {soundSheet}
      {gallery && (
        <div className="sheet-back" onClick={() => setGallery(false)}>
          <div className="sheet" onClick={(e: Event) => e.stopPropagation()} role="dialog" aria-label="结局图鉴">
            <h2 className="sheet-title">结局图鉴</h2>
            <ul className="gallery">
              {ENDING_IDS.map((id) => {
                const got = seen.includes(id);
                return (
                  <li key={id} className={got ? 'got' : ''}>
                    <strong>{got ? ENDING_INFO[id].title : '？？？'}</strong>
                    <small>{got ? '已达成' : `提示：${ENDING_INFO[id].hint}`}</small>
                  </li>
                );
              })}
            </ul>
            <button className="primary" onClick={() => setGallery(false)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
