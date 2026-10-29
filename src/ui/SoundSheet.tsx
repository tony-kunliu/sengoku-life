import { useEffect, useState } from 'react';
import { audio } from '../audio/engine';
import { STYLE_LABEL, getTheme, type MusicStyle } from '../audio/score';

export function useAudioSettings() {
  const [s, setS] = useState(audio.settings);
  useEffect(() => {
    const off = audio.subscribe(() => setS({ ...audio.settings }));
    return () => {
      off();
    };
  }, []);
  return s;
}

export function SoundButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  const s = useAudioSettings();
  return (
    <button className={`sound-btn ${className}`} onClick={onClick} aria-label={s.muted ? '声音：已关闭' : '声音设置'}>
      <span className={s.muted ? 'muted-glyph' : ''}>音</span>
    </button>
  );
}

export function SoundSheet({ onClose, theme }: { onClose: () => void; theme: string }) {
  const s = useAudioSettings();
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" onClick={(e: Event) => e.stopPropagation()} role="dialog" aria-label="声音">
        <h2 className="sheet-title">声音</h2>
        <p className="muted">
          正在演奏：《{getTheme(theme, s.style).name}》。笛、箏、三味线、弦乐、太鼓与钲，全部由浏览器即时合成。
        </p>
        <div className="style-pick" role="radiogroup" aria-label="配乐风格">
          {(['bright', 'classic'] as MusicStyle[]).map((st) => (
            <button
              key={st}
              role="radio"
              aria-checked={s.style === st}
              className={`style-opt ${s.style === st ? 'on' : ''}`}
              onClick={() => {
                audio.unlock();
                audio.update({ style: st });
              }}
            >
              <strong>{STYLE_LABEL[st]}</strong>
              <small>{st === 'bright' ? '笛与弦乐、祭典节奏，积极向上' : '尺八与箏，幽玄寂静'}</small>
            </button>
          ))}
        </div>
        <div className="sound-row">
          <label htmlFor="vol-music">音乐</label>
          <input
            id="vol-music"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={s.music}
            onInput={(e: Event) => audio.update({ music: Number((e.target as HTMLInputElement).value) })}
          />
          <span className="vol-num">{Math.round(s.music * 100)}</span>
        </div>
        <div className="sound-row">
          <label htmlFor="vol-sfx">音效</label>
          <input
            id="vol-sfx"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={s.sfx}
            onInput={(e: Event) => audio.update({ sfx: Number((e.target as HTMLInputElement).value) })}
          />
          <span className="vol-num">{Math.round(s.sfx * 100)}</span>
        </div>
        <button
          className={`toggle ${s.muted ? '' : 'on'}`}
          onClick={() => {
            audio.unlock();
            audio.update({ muted: !s.muted });
          }}
          aria-pressed={!s.muted}
        >
          {s.muted ? '声音已关闭 · 点按开启' : '声音已开启 · 点按关闭'}
        </button>
        <p className="muted small-note">听不到声音时，请检查 iPhone 侧面的静音开关，并调高媒体音量。</p>
        <button className="primary" onClick={onClose}>
          完成
        </button>
      </div>
    </div>
  );
}
