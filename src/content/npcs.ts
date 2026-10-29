import { quest } from '../engine/core';
import type { NpcDef } from '../engine/registry';
import type { GameState, NpcId } from '../engine/types';

const f = (s: GameState, k: string) => s.flags[k];

export const NPCS: Record<NpcId, NpcDef> = {
  gensai: {
    id: 'gensai',
    likes: 'tea',
    dislikes: 'sake',
    giftLines: { liked: '……好茶。坐下，陪我喝一碗。', disliked: '酒是乱心的东西。拿回去。' },
    name: '柳田源斋',
    reading: 'やなぎだ げんさい',
    age: 58,
    role: '柳心馆道场师范',
    personality: '寡言、严格，重品行胜过胜负。说话常像谜语，但从不说空话。',
    goal: '在乱世里找到一个“心正”的传人，不让柳心流只剩杀人之术。',
    glyph: '源',
    color: '#2f4a6b',
    major: true,
    where: (s) => {
      if (s.day >= 17) return { loc: 'dojo', doing: '独自坐在空荡的道场里' };
      if (s.slot === 1 && s.day % 5 === 0) return { loc: 'teahouse', doing: '难得来茶屋喝一碗茶' };
      if (s.slot === 0) return { loc: 'dojo', doing: '指导晨练' };
      if (s.slot === 1) return { loc: 'dojo', doing: '静坐看弟子练习' };
      return { loc: 'dojo', doing: '在里屋灯下读书' };
    },
    status: (s) =>
      f(s, 'masterRecognized') ? '已将柳心流初目录授予你' : f(s, 'admitted') ? '你的师父' : '道场的主人',
  },
  hayato: {
    id: 'hayato',
    likes: 'sake',
    dislikes: 'book',
    giftLines: { liked: '哈！懂我！今晚就喝了它！', disliked: '书？我看见字就头疼……' },
    name: '早瀬隼人',
    reading: 'はやせ はやと',
    age: 19,
    role: '柳心馆弟子 · 下级武士家次男',
    personality: '好胜、急躁、嘴硬心软。最怕被人看不起，也最佩服真正有本事的人。',
    goal: '在战场上立功，被织田家正式召为家臣，让看不起次男的父兄刮目相看。',
    glyph: '隼',
    color: '#9b2d20',
    major: true,
    where: (s) => {
      if (f(s, 'hayatoSummoned')) return { loc: null, doing: '已被召入城中待命' };
      if (s.slot === 0) return { loc: 'dojo', doing: '挥刀，一下比一下狠' };
      if (s.slot === 1)
        return s.day % 2 === 1 ? { loc: 'dojo', doing: '缠着权六切磋' } : { loc: 'town', doing: '在城下闲逛，打听军中消息' };
      if (s.day >= 4) return { loc: 'teahouse', doing: '在茶屋喝酒，高谈阔论' };
      return { loc: 'dojo', doing: '独自加练' };
    },
    status: (s) => {
      if (f(s, 'hayatoSummoned')) return '被家主召集，等待出阵';
      if (s.npcs.hayato.rel.stance === 'ally') return '你的朋友，也是对手';
      if (s.npcs.hayato.rel.stance === 'rival') return '视你为眼中钉的对手';
      return '道场师兄';
    },
  },
  seibei: {
    id: 'seibei',
    likes: 'whetstone',
    giftLines: { liked: '这、这是京都的砥石？！我能用它磨十年的刀……' },
    name: '清兵卫',
    reading: 'せいべえ',
    age: 21,
    role: '城下铁匠',
    personality: '老实、手巧、说话慢，认死理。对火候和钢的事一说就停不下来。',
    goal: '师父去年冬天过世后，想撑下这间铺子，有一天挂上“清兵卫锻冶”的招牌。',
    glyph: '清',
    color: '#5b4a3a',
    major: true,
    where: (s) => {
      const st = quest(s, 'seibei');
      if (st === 99) return { loc: 'town', doing: s.slot === 2 ? '帮军队搬运兵粮' : '在城门口替军队搬运' };
      if (s.slot === 2 && s.day % 2 === 0) return { loc: 'teahouse', doing: '来喝一碗粗茶' };
      if (st >= 4) return { loc: 'town', doing: '在自己的新铺子里打铁' };
      return { loc: 'town', doing: s.slot === 2 ? '收拾铺子' : '在铺子里打铁' };
    },
    status: (s) => {
      const st = quest(s, 'seibei');
      if (st >= 4) return '“清兵卫锻冶”开张了';
      if (st === 99) return '铺子被座关闭，替军队做苦力';
      if (st >= 1) return '铺子面临关门危机';
      return '撑着师父留下的铺子';
    },
  },
  oryo: {
    id: 'oryo',
    likes: 'book',
    dislikes: 'whetstone',
    giftLines: { liked: '哎呀，是物语抄本。你怎么知道我晚上睡不着？', disliked: '砥石？我开的是茶屋，不是铁匠铺哦。' },
    name: '阿凉',
    reading: 'おりょう',
    age: 26,
    role: '茶屋“水月”女主人',
    personality: '精明、爽利，笑着说话也能把人看穿。消息灵通，从不白给。',
    goal: '让水月在战火里活下去；暗地里替某人收集今川方的消息。',
    glyph: '凉',
    color: '#3f6f63',
    major: true,
    where: (s) => {
      if (s.slot === 0 && s.day % 3 === 0) return { loc: 'town', doing: '在市场采买' };
      return { loc: 'teahouse', doing: s.slot === 2 ? '在灯下招呼客人' : '擦拭茶碗，听客人闲聊' };
    },
    status: (s) => (f(s, 'oryoNetwork') ? '你知道她在替织田家收集消息' : '茶屋老板娘'),
  },
  toshiie: {
    id: 'toshiie',
    likes: 'sake',
    dislikes: 'tea',
    giftLines: { liked: '好酒！比茶强一百倍！', disliked: '茶？我又不是那些坐着发呆的茶人。' },
    name: '前田又左卫门利家',
    reading: 'まえだ またざえもん としいえ',
    age: 22,
    role: '被逐出织田家的浪人',
    personality: '高大、傲气、脾气火爆，却重情义。人称“枪之又左”。',
    goal: '去年因斩杀同朋众拾阿弥被信长逐出，一心想立下战功，重回主公身边。',
    glyph: '利',
    color: '#7a5a12',
    historical: true,
    major: true,
    where: (s) => {
      if (s.day < 4 || s.day >= 17) return { loc: null, doing: '不知去向' };
      if (s.slot === 0) return { loc: null, doing: '不知去向' };
      if (s.slot === 1) return { loc: 'village', doing: '在村外林中独自练枪' };
      return s.day % 2 === 1 ? { loc: 'teahouse', doing: '独自喝闷酒' } : { loc: 'village', doing: '借住在村里的破庙' };
    },
    status: (s) => (f(s, 'toshiieOath') ? '约你一同奔赴战场' : '被逐的浪人'),
  },
  gonroku: {
    id: 'gonroku',
    likes: 'tea',
    giftLines: { liked: '……多谢。（他难得地笑了一下）' },
    name: '岩田权六',
    reading: 'いわた ごんろく',
    age: 27,
    role: '柳心馆资深弟子',
    personality: '沉稳木讷，守得像一堵墙。替师父照看后辈。',
    goal: '守好道场。',
    glyph: '岩',
    color: '#4b5560',
    major: false,
    where: (s) => (s.slot < 2 && s.day < 17 ? { loc: 'dojo', doing: '守着道场' } : { loc: null, doing: '回家' }),
    status: () => '道场资深弟子',
  },
  gosaku: {
    id: 'gosaku',
    likes: 'sake',
    giftLines: { liked: '哎呀，这怎么好意思……那我今晚就喝一口。' },
    name: '五郎作',
    reading: 'ごろさく',
    age: 61,
    role: '清洲城外村庄的老农',
    personality: '朴实、多疑，但心肠好。',
    goal: '让孙子们平安长大，熬过这一年的兵荒。',
    glyph: '农',
    color: '#6b6a3a',
    major: false,
    where: () => ({ loc: 'village', doing: '在田边劳作' }),
    status: (s) => (f(s, 'villageSaved') ? '视你为村子的恩人' : '收留过你的老农'),
  },
  nobunaga: {
    id: 'nobunaga',
    name: '织田上总介信长',
    reading: 'おだ かずさのすけ のぶなが',
    age: 26,
    role: '尾张之主 · 清洲城城主',
    personality: '难以捉摸，厌恶繁文缛节，眼光锐利得可怕。',
    goal: '在今川大军压境之际，保住尾张。',
    glyph: '信',
    color: '#1d1d1f',
    historical: true,
    major: false,
    where: () => ({ loc: null, doing: '在清洲城中' }),
    status: () => '尾张之主',
  },
};
