// 日常交谈：根据关系、记忆和世界状态挑选台词（固定对话，不依赖 AI）
import { hasMem, quest, R } from '../engine/core';
import type { TalkResult } from '../engine/registry';
import type { GameState, NpcId } from '../engine/types';
import { hearRumor } from './world';
import { GIFTS, likeKnown, type GiftId } from '../engine/gifts';
import { NPCS } from './npcs';

/** 阿凉（信任 25）：每天告诉你一个还不知道的礼物喜好 */
function oryoGiftHint(s: GameState): string | null {
  if (s.npcs.oryo.rel.trust < 25 || s.flags.oryoHintDay === s.day) return null;
  const who = (Object.keys(NPCS) as NpcId[]).find((id) => id !== 'oryo' && NPCS[id].likes && s.npcs[id].rel.met && !likeKnown(s, id));
  if (!who) return null;
  s.flags.oryoHintDay = s.day;
  s.flags[`knownLike_${who}`] = true;
  return `告诉你个秘密：${NPCS[who].name}最喜欢${GIFTS[NPCS[who].likes as GiftId].name}。别说是我说的。`;
}

type Line = { when: (s: GameState) => boolean; text: string | ((s: GameState) => string); effects?: TalkResult['effects'] };

const POOLS: Record<NpcId, Line[]> = {
  gensai: [
    { when: (s) => s.day >= 17, text: '……都去了。道场空了也好。剩下的人，记得活着回来。' },
    { when: (s) => s.world.imagawa >= 85, text: '大军要来了。弟子们心都乱了。你呢？你的心乱不乱？' },
    { when: (s) => hasMem(s, 'gensai', 'recognized'), text: '柳返，不是技巧，是心法。被压弯的时候，别折断。' },
    { when: (s) => hasMem(s, 'gensai', 'arrogant') && !hasMem(s, 'gensai', 'recognized'), text: '赢了之后说的话，比输了之后说的话，更能看出一个人。' },
    { when: (s) => !!s.flags.testFailed && !s.flags.masterRecognized, text: '上次考验，你看的是我的刀，不是我。' },
    { when: (s) => !!s.flags.villageSaved && !hasMem(s, 'gensai', 'heard_village'), text: '听说你救了五条村的孩子。……剑是杀人的，你却先学会了救人。', effects: [{ t: 'rel', npc: 'gensai', respect: 5 }, { t: 'mem', npc: 'gensai', id: 'heard_village', text: '师父听说你救了五条村的病童。' }] },
    { when: (s) => !!s.flags.admitted && R(s, 'gensai').trust < 24, text: '每天挥刀很好。但只挥刀，就像只吃米——会饿死的。去看，去打，去输。' },
    { when: (s) => !!s.flags.admitted, text: '你最近的眼神，比刚来时沉了些。' },
    { when: () => true, text: '想入门，就先把地扫干净。' },
  ],
  hayato: [
    { when: (s) => R(s, 'hayato').stance === 'ally' && s.world.imagawa >= 70, text: '要打仗了。……喂，你会去吗？我是一定要去的。' },
    { when: (s) => R(s, 'hayato').stance === 'ally', text: (s) => `嘿，${s.player.name}！今天也来挨打吗？——开玩笑的。你的踏入还是太慢，后脚！后脚！` },
    { when: (s) => hasMem(s, 'hayato', 'lost_toshiie'), text: '别提那个高个子的事。……我会赢回来的。总有一天。' },
    { when: (s) => R(s, 'hayato').stance === 'rival', text: '有话快说。我不想跟你这种人浪费时间。' },
    { when: (s) => hasMem(s, 'hayato', 'rematch_win'), text: '……你到底是什么人？刚来的时候连木刀都握不好。' },
    { when: (s) => hasMem(s, 'hayato', 'asked'), text: '又来问？我说过了，看脚！看脚！……真是的，我又不是你师父。', effects: [{ t: 'know', opp: 'hayato', n: 1 }] },
    { when: (s) => hasMem(s, 'hayato', 'first_loss'), text: '哼，输过一次的人，别在我面前晃。' },
    { when: (s) => hasMem(s, 'hayato', 'refused'), text: '胆小鬼，今天还扫地吗？' },
    { when: () => true, text: '我叫早瀬隼人。将来要做织田家的武士——你记住这个名字吧。' },
  ],
  seibei: [
    { when: (s) => quest(s, 'seibei') === 99, text: '……别那样看我。搬米也是活。等仗打完，我再从头来过。' },
    { when: (s) => quest(s, 'seibei') >= 4 && s.world.imagawa >= 80, text: '订单多得做不完。听说要打大仗了……我打的枪头，会刺进谁的身体呢。' },
    { when: (s) => quest(s, 'seibei') >= 4, text: '“清兵卫锻冶”。每天早上看到招牌，我都要摸一下。……谢谢你。' },
    { when: (s) => quest(s, 'seibei') === 2, text: '炭有了！可是……谁会向我这样没名气的铁匠订货呢？（在城下替他找买家）' },
    { when: (s) => quest(s, 'seibei') === 1 && !!s.flags.seibeiRefused, text: '……没关系，我自己想办法。' },
    { when: (s) => quest(s, 'seibei') === 1, text: (s) => `离十五日还有 ${Math.max(0, 13 - s.day)} 天。炭的事，五条村后面有座炭窑……` },
    { when: (s) => s.player.lodging === 'forge', text: '早上的火色最好看，像柿子一样。你今天也要去道场吗？路上小心。' },
    { when: (s) => hasMem(s, 'seibei', 'cart'), text: '上次真是多亏你了。那车炭要是翻了，我这个月就白干了。' },
    { when: () => true, text: '钢要叠打十几次才成。急不来的。' },
  ],
  oryo: [
    { when: (s) => s.world.imagawa >= 85, text: '要是城下烧起来……我就把水月再开一次。开在哪里都一样，有人就有茶。' },
    { when: (s) => !!s.flags.oryoNetwork, text: (s) => `这是今天的“茶钱”——${hearRumor(s)}` },
    { when: (s) => quest(s, 'spy') === 1, text: '那个行商还在城下转悠。你跟紧点，但别逞强。' },
    { when: (s) => !!s.flags.oryoEars, text: (s) => `住在我这儿，耳朵可要灵。说说，今天听到什么了？……好吧，我先说：${hearRumor(s)}` },
    { when: (s) => R(s, 'oryo').trust >= 15, text: '你这人，嘴上不多说，眼睛倒是一直在看。在这里，这比刀还好用。' },
    { when: () => true, text: (s) => `来喝茶？坐吧。今天听说的是——${hearRumor(s)}` },
  ],
  toshiie: [
    { when: (s) => !!s.flags.toshiieOath, text: '准备好了吗？那一天，就快到了。' },
    { when: (s) => s.flags.spyChoice === 'oda', text: '细作那件事，城里有人记住了你的名字。……顺带，也想起了我。' },
    { when: (s) => hasMem(s, 'toshiie', 'sided_hayato'), text: '哼，是你啊。替那个小鬼说话的人。' },
    { when: (s) => ((s.flags.wins_toshiie as number) ?? 0) >= 1, text: '你赢过我一次。我不会让你赢第二次。哈哈！' },
    { when: (s) => R(s, 'toshiie').respect >= 10, text: '你出手越来越干脆了。在战场上，犹豫的人先死。' },
    { when: () => true, text: '我在等。等一个能让殿下重新看见我的机会。' },
  ],
  gonroku: [
    { when: (s) => ((s.flags.wins_gonroku as number) ?? 0) >= 1, text: '……你能破我的守了。不错。' },
    { when: () => true, text: '守，就是等。等对方先犯错。……试探我，没用的。大概。' },
  ],
  gosaku: [
    { when: (s) => !!s.flags.villageSaved, text: '孙子又在田埂上跑了。村里人都念着你的好。' },
    { when: (s) => quest(s, 'village_sick') === 1, text: '孙子还在发烧……你那天说要看看？' },
    { when: () => true, text: '要打仗了，田还得种。武家打完了仗，总是要吃米的。' },
  ],
  nobunaga: [{ when: () => true, text: '……' }],
};

export function talkLine(s: GameState, npc: NpcId): TalkResult {
  if (npc === 'oryo') {
    const hint = oryoGiftHint(s);
    if (hint) return { text: hint };
  }
  const pool = POOLS[npc] ?? [];
  const line = pool.find((l) => l.when(s)) ?? { text: '……', when: () => true };
  const text = typeof line.text === 'function' ? line.text(s) : line.text;
  // 同一句带效果的台词只生效一次
  const key = `talkfx_${npc}_${pool.indexOf(line as Line)}`;
  let effects = line.effects;
  if (effects) {
    if (s.flags[key]) effects = undefined;
    else s.flags[key] = true;
  }
  return { text, effects };
}
