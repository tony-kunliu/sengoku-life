import { useEffect, useRef, useState } from 'react';
import '../content';
import { daysUntilOkehazama, fullDateLabel } from '../engine/calendar';
import { newGame } from '../engine/core';
import { checkTriggers, clearToast } from '../engine/game';
import { readMeta, readSlot, writeSlot } from '../engine/save';
import type { GameState } from '../engine/types';
import { CombatView } from './CombatView';
import { EndingView } from './EndingView';
import { SceneView } from './SceneView';
import { LogScreen, MapScreen, PeopleScreen, TrainScreen } from './screens';
import { TitleView } from './TitleView';
import { audio } from '../audio/engine';
import { cuesFor, intensityFor, themeFor } from '../audio/cues';
import { DayCard, Fusuma } from './fx';
import { SoundButton, SoundSheet } from './SoundSheet';

export type Tab = 'map' | 'people' | 'train' | 'log';
export type Apply = (fn: (s: GameState) => GameState) => void;

const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: 'map', label: '地图', glyph: '図' },
  { id: 'people', label: '人物', glyph: '人' },
  { id: 'train', label: '修行', glyph: '剣' },
  { id: 'log', label: '日志', glyph: '録' },
];

export function App() {
  const [g, setG] = useState<GameState | null>(null);
  const [tab, setTabRaw] = useState<Tab>('map');
  const [saveOk, setSaveOk] = useState(true);
  const tabRef = useRef<Tab>('map');
  const prevRef = useRef<GameState | null>(null);
  const [dayCard, setDayCard] = useState<number | null>(null);
  const [soundOpen, setSoundOpen] = useState(false);

  // 第一次触碰屏幕时解锁音频（iOS 要求必须由用户手势启动）
  useEffect(() => {
    const unlock = () => {
      if (!audio.ready) audio.unlock();
    };
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('keydown', unlock);
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  // 状态变化 → 配乐、音效、日替转场
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = g;
    audio.setTheme(themeFor(g));
    audio.setIntensity(intensityFor(g));
    for (const c of cuesFor(prev, g)) audio.sfx(c);
    if (prev && g && g.day > prev.day && !g.ended) setDayCard(g.day);
  }, [g]);

  // 浏览器返回键：在页签之间后退，而不是离开游戏
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const t = (e.state && e.state.tab) as Tab | undefined;
      if (t) {
        tabRef.current = t;
        setTabRaw(t);
      }
    };
    window.addEventListener('popstate', onPop);
    try {
      history.replaceState({ tab: 'map' }, '');
    } catch {
      /* 预览环境可能不允许 */
    }
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setTab = (t: Tab) => {
    if (t === tabRef.current) return;
    audio.sfx('tab');
    tabRef.current = t;
    setTabRaw(t);
    try {
      history.pushState({ tab: t }, '');
    } catch {
      /* ignore */
    }
    window.scrollTo(0, 0);
  };

  const apply: Apply = (fn) => {
    setG((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      if (next !== prev) setSaveOk(writeSlot('auto', next));
      return next;
    });
  };

  // 新的提示几秒后消失
  useEffect(() => {
    if (!g || !g.toast.length) return;
    const t = setTimeout(() => setG((p) => (p ? clearToast(p) : p)), 2800);
    return () => clearTimeout(t);
  }, [g?.toast]);

  // 场景或比试开始时，回到页面顶部
  const overlayKey = g ? `${g.scene?.id ?? ''}:${g.scene?.node ?? ''}:${g.bout ? 'b' : ''}` : '';
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [overlayKey]);

  if (!g) {
    return (
      <TitleView
        onSound={() => setSoundOpen(true)}
        soundSheet={soundOpen ? <SoundSheet theme="title" onClose={() => setSoundOpen(false)} /> : null}
        meta={readMeta('auto')}
        onContinue={() => {
          const s = readSlot('auto');
          if (s) {
            setG(s);
            setTabRaw('map');
          }
        }}
        onNew={(name) => {
          let s = newGame(name);
          s = { ...s };
          checkTriggers(s);
          setSaveOk(writeSlot('auto', s));
          setG(s);
          setTabRaw('map');
        }}
      />
    );
  }

  if (g.ended) return <EndingView s={g} onTitle={() => setG(null)} />;

  const sceneKey = g.bout ? `bout-${g.bout.context.label}-${g.record.bouts}` : g.scene ? `scene-${g.scene.id}` : '';

  const left = daysUntilOkehazama(g.day);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="date">
          <span className="date-main">{fullDateLabel(g.day, g.slot)}</span>
          <span className="date-sub">{left > 0 ? `距五月十九日还有 ${left} 日` : left === 0 ? '五月十九日' : '桶狭间之后'}</span>
        </div>
        <div className="purse">
          <span title="钱">{g.player.money} 文</span>
          <span title="名声">名 {g.player.fame}</span>
          <SoundButton onClick={() => setSoundOpen(true)} />
        </div>
      </header>

      {!saveOk && <div className="warn">浏览器无法保存进度（可能是隐私模式）。请在“日志”页复制存档码备份。</div>}

      <main className="main">
        {tab === 'map' && <MapScreen s={g} apply={apply} />}
        {tab === 'people' && <PeopleScreen s={g} apply={apply} />}
        {tab === 'train' && <TrainScreen s={g} apply={apply} />}
        {tab === 'log' && <LogScreen s={g} setG={(s) => { setG(s); writeSlot('auto', s); }} toTitle={() => setG(null)} />}
      </main>

      <nav className="tabbar" aria-label="主导航">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)} aria-current={tab === t.id}>
            <span className="tab-glyph">{t.glyph}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {g.toast.length > 0 && (
        <div className="toasts" role="status">
          {g.toast.slice(-4).map((t, i) => (
            <div key={i} className="toast">
              {t}
            </div>
          ))}
        </div>
      )}

      {g.scene && !g.bout && <SceneView s={g} apply={apply} />}
      {g.bout && <CombatView s={g} apply={apply} />}
      {sceneKey && <Fusuma key={sceneKey} />}
      {dayCard && <DayCard day={dayCard} onDone={() => setDayCard(null)} />}
      {soundOpen && <SoundSheet theme={themeFor(g)} onClose={() => setSoundOpen(false)} />}
    </div>
  );
}
