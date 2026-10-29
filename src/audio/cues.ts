// 由游戏状态变化推导音乐与音效（纯函数，可测试）。规则引擎完全不知道声音的存在。
import type { GameState } from '../engine/types';
import { REG } from '../engine/registry';
import type { Sfx } from './engine';

export function themeFor(s: GameState | null): string {
  if (!s) return 'title';
  if (s.ended) return 'ending';
  if (s.bout) return 'combat';
  const art = s.scene ? REG.scenes[s.scene.id]?.art : null;
  if (art === 'night') return 'night';
  if (s.day >= 16 && s.slot === 2) return 'night';
  switch (s.location) {
    case 'dojo':
      return 'dojo';
    case 'teahouse':
      return 'teahouse';
    case 'village':
      return 'village';
    default:
      return 'town';
  }
}

/** 战斗紧张度：0 起手 · 1 交锋展开 · 2 胜负一线 */
export function intensityFor(s: GameState | null): number {
  const cs = s?.bout?.combat;
  if (!cs) return 0;
  const matchPoint = cs.p.points === cs.target - 1 || cs.o.points === cs.target - 1;
  if (matchPoint || cs.round >= cs.maxRounds - 1) return 2;
  if (cs.round >= 3 || cs.p.points + cs.o.points > 0) return 1;
  return 0;
}

export function cuesFor(prev: GameState | null, next: GameState | null): Sfx[] {
  if (!prev || !next || prev === next) return [];
  const out: Sfx[] = [];
  if (next.ended && !prev.ended) return ['ending'];
  if (next.day > prev.day) out.push('newDay');
  else if (next.location !== prev.location && !next.scene) out.push('travel');

  // 比试
  if (next.bout && !prev.bout) out.push('boutStart');
  const pb = prev.bout?.combat;
  const nb = next.bout?.combat;
  if (pb && nb && nb.history.length > pb.history.length) {
    const r = nb.history[nb.history.length - 1];
    if (r.scorer === 'p') out.push('scoreP');
    else if (r.scorer === 'o') out.push('scoreO');
    else if (r.pMove === 'atk' && r.oMove === 'atk') out.push('clash');
    else if (r.pMove === 'atk' || r.oMove === 'atk') out.push('block');
    else out.push('probe');
    if (nb.finished) out.push(nb.result === 'win' ? 'win' : 'lose');
  }

  // 场景
  if (next.scene && !next.bout && (!prev.scene || prev.scene.id !== next.scene.id)) out.push('sceneOpen');
  else if (next.scene && prev.scene && next.scene.node !== prev.scene.node && !next.bout) out.push('choice');

  // 成长与钱
  if (next.toast.some((t) => t.includes('↑') || t.startsWith('习得') || t.includes('上限'))) out.push('growth');
  else if (next.player.money > prev.player.money) out.push('coin');
  return out;
}
