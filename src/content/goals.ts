// 心之所向：根据当前局面给出最多三个“现在可以去追”的目标，解决“不知道该做什么”。
import { dateLabel } from '../engine/calendar';
import { quest, R } from '../engine/core';
import { lv } from '../engine/training';
import type { GameState, LocationId } from '../engine/types';

export interface Goal {
  id: string;
  text: string;
  /** 进度或下一步的具体说明 */
  detail: string;
  loc?: LocationId;
  /** 有期限的目标 */
  urgent?: boolean;
}

const wins = (s: GameState, id: string) => (s.flags[`wins_${id}`] as number) ?? 0;

type Rule = (s: GameState) => Goal | null;

const RULES: Rule[] = [
  // 最后的抉择
  (s) =>
    s.day >= 15 && !s.ended
      ? { id: 'eve', text: '五月十九日将至', detail: '十八日夜里，你要决定站在哪里。之前和谁结下的交情，决定了你有哪些选择。', urgent: true }
      : null,
  (s) => (!s.flags.townArrived ? { id: 'town', text: '进入清洲城下', detail: '沿着五条川往北走，半个时辰就到。', loc: 'town' } : null),
  (s) =>
    s.flags.townArrived && !s.seenScenes.includes('dojo_enter')
      ? { id: 'dojo', text: '去柳心馆看看', detail: s.flags.dojoKnown ? '道场在城下西侧。' : '在城下闲逛，或问问茶屋的阿凉。', loc: s.flags.dojoKnown ? 'dojo' : 'town' }
      : null,
  (s) =>
    s.seenScenes.includes('dojo_enter') && !s.flags.admitted
      ? { id: 'admit', text: '获准入门', detail: `打扫道场，让师父看到你的心性（已打扫 ${s.quests.chores ?? 0}/2 次）。`, loc: 'dojo' }
      : null,
  (s) =>
    quest(s, 'village_sick') === 1
      ? { id: 'sick', text: '救五郎作的孙子', detail: '孩子在闹肚子。想想这个时代能用的办法。', loc: 'village' }
      : null,
  (s) => {
    const q = quest(s, 'seibei');
    if (q === 1)
      return { id: 'seibei1', text: '替清兵卫弄到炭', detail: `去五条村后山的炭窑。座钱期限：${dateLabel(13)}。`, loc: 'village', urgent: s.day >= 9 };
    if (q === 2) return { id: 'seibei2', text: '替清兵卫找买家', detail: `在城下想办法。期限：${dateLabel(13)}。`, loc: 'town', urgent: s.day >= 10 };
    return null;
  },
  (s) => (quest(s, 'spy') === 1 ? { id: 'spy', text: '跟踪卖针的行商', detail: '阿凉托你留意的人，常在城下转悠。', loc: 'town' } : null),
  (s) =>
    s.flags.admitted && s.flags.hayatoFirstBout && !s.flags.rematchDone && !s.flags.hayatoSummoned
      ? {
          id: 'rematch',
          text: '再战隼人',
          detail: `攻 + 守达到 5（现在 ${lv(s, 'atk') + lv(s, 'def')}），或对他的情报达到 2（现在 ${s.oppKnowledge.hayato ?? 0}）。观摩和切磋都能收集情报。`,
          loc: 'dojo',
        }
      : null,
  (s) => {
    if (!s.flags.admitted || s.flags.masterRecognized) return null;
    const g = R(s, 'gensai');
    if (s.flags.testFailed) return { id: 'test', text: '再次接受师父的考验', detail: '考验看的是读局：先试探、看破后应对、不在力竭时乱攻。', loc: 'dojo' };
    return {
      id: 'test',
      text: '让师父认可你',
      detail: `信任 ${g.trust}/30 · 尊敬 ${g.respect}/22 · 胜隼人 ${Math.min(1, wins(s, 'hayato'))}/1。打扫道场、灯下陪师父、赢得比试都有帮助。`,
      loc: 'dojo',
    };
  },
  (s) => {
    if (!s.flags.toshiieMet || s.flags.toshiieOathAsked || s.day >= 16) return null;
    const t = R(s, 'toshiie');
    return { id: 'toshiie', text: '与又左卫门结交', detail: `信任 ${t.trust}/20 · 尊敬 ${t.respect}/12。他下午在五条村的林子里练枪，喜欢能打的人。`, loc: 'village' };
  },
  (s) => {
    const h = R(s, 'hayato');
    if (!h.met || s.player.techniques.includes('fumikomi') || s.flags.hayatoSummoned || !s.flags.admitted) return null;
    return { id: 'hayato', text: '和隼人交心', detail: `信任 ${h.trust}/14 · 尊敬 ${h.respect}/10，还要赢他一次。他晚上常在茶屋喝酒。`, loc: 'teahouse' };
  },
  (s) =>
    lv(s, 'speech') < 2 && s.day >= 3
      ? { id: 'speech', text: '练好口才', detail: `口才 ${lv(s, 'speech')}/2 能解锁好几个关键选项。在茶屋帮工、送对礼物、每天和人交谈都会提升。`, loc: 'teahouse' }
      : null,
];

export function goalsFor(s: GameState, max = 3): Goal[] {
  const out: Goal[] = [];
  for (const r of RULES) {
    const g = r(s);
    if (g) out.push(g);
  }
  // 有期限的排在前面
  out.sort((a, b) => Number(!!b.urgent) - Number(!!a.urgent));
  return out.slice(0, max);
}
