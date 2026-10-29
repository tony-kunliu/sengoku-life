// 古风动效组件：拉门转场、日替墨卡、斩击笔痕、印章。
// 所有元素的“静止状态”都是最终可见或已移开的状态，减少动态设置下不会遮挡画面。
import { useEffect, useState } from 'react';
import { daysUntilOkehazama, dateLabel } from '../engine/calendar';
import type { RoundRecord } from '../engine/combat/types';

const CN = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const cnNum = (n: number) => (n <= 10 ? CN[n] : n < 20 ? '十' + CN[n - 10] : String(n));

/** 拉门（襖）：两扇和纸门从中间向两侧拉开 */
export function Fusuma({ label }: { label?: string }) {
  return (
    <div className="fusuma" aria-hidden="true">
      <div className="fusuma-panel l">
        <span className="hikite" />
      </div>
      <div className="fusuma-panel r">
        <span className="hikite" />
      </div>
      {label && <div className="fusuma-label">{label}</div>}
    </div>
  );
}

/** 新的一天：墨色卡片 + 竖排日期，点按可跳过 */
export function DayCard({ day, onDone }: { day: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2300);
    return () => clearTimeout(t);
  }, [day]);
  const left = daysUntilOkehazama(day);
  return (
    <div className="daycard" onClick={onDone} role="status" aria-live="polite">
      <div className="daycard-inner">
        <span className="daycard-era">永禄三年</span>
        <span className="daycard-date">{dateLabel(day)}</span>
        <span className="daycard-seal">{left > 0 ? `余${cnNum(left)}日` : left === 0 ? '决战' : '战后'}</span>
      </div>
    </div>
  );
}

/** 一回合的视觉反馈：得分时的斩痕与“一本”印、相击时的火花、格挡时的波纹 */
export function StrikeFx({ rec }: { rec: RoundRecord }) {
  if (rec.scorer) {
    const mine = rec.scorer === 'p';
    return (
      <div className={`strike ${mine ? 'mine' : 'theirs'}`} aria-hidden="true">
        <svg viewBox="0 0 400 300" preserveAspectRatio="none" className="slash">
          <path d={mine ? 'M30 250 C 140 170, 250 120, 380 40' : 'M370 250 C 260 170, 150 120, 20 40'} />
        </svg>
        <span className="ippon-stamp">一本</span>
      </div>
    );
  }
  if (rec.pMove === 'atk' && rec.oMove === 'atk') {
    return (
      <div className="strike clash" aria-hidden="true">
        <span className="spark" />
        <span className="spark s2" />
      </div>
    );
  }
  if (rec.pMove === 'atk' || rec.oMove === 'atk') {
    return (
      <div className="strike block" aria-hidden="true">
        <span className="ripple" />
      </div>
    );
  }
  return null;
}

/** 比试开始的“始め”笔字 */
export function Hajime() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1300);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="hajime" aria-hidden="true">
      始め
    </div>
  );
}
