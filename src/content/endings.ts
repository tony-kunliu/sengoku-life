// 第一章结局：根据玩家的人生轨迹生成
import { hasMem, quest, R } from '../engine/core';
import type { GameState } from '../engine/types';

export interface EndingView {
  title: string;
  subtitle: string;
  paragraphs: string[];
  fates: { name: string; text: string }[];
  achievements: string[];
  future: string[];
}

const TITLES: Record<string, [string, string]> = {
  battle: ['雨中的背影', '你与前田又左卫门一同奔赴桶狭间'],
  hayato: ['知退之人', '你在中岛砦前找到了隼人'],
  intel: ['看不见的线', '你把未来的碎片交给了阿凉的情报网'],
  stay: ['守灯人', '你留在清洲，守护了身边的人'],
  flee: ['过客', '你在历史到来之前离开了尾张'],
};

export const ENDING_IDS = ['battle', 'hayato', 'intel', 'stay', 'flee'] as const;

export const ENDING_INFO: Record<string, { title: string; hint: string }> = {
  battle: { title: '雨中的背影', hint: '与又左卫门立下约定，并让剑术足以自保' },
  hayato: { title: '知退之人', hint: '和隼人成为真正的朋友' },
  intel: { title: '看不见的线', hint: '走进阿凉背后的那张网' },
  stay: { title: '守灯人', hint: '在最后一夜，选择守护身边的人' },
  flee: { title: '过客', hint: '在历史到来之前离开' },
};

export function buildEnding(s: GameState): EndingView {
  const key = s.ending ?? 'stay';
  const [title, subtitle] = TITLES[key] ?? TITLES.stay;
  const name = s.player.name;
  const paragraphs: string[] = [];

  paragraphs.push(
    `永禄三年五月十九日，织田信长以两千余人在桶狭间奇袭今川义元的本阵，取下了义元的首级。历史仍沿着它的方向前进——但在清洲城下，有一些人的命运，因为一个叫“${name}”的来客而改变了。`,
  );

  if (key === 'flee') {
    paragraphs.push('你保住了性命，却把在清洲结下的缘分留在了身后。也许，乱世里最难的不是活下去，而是决定为谁而活。');
  } else if (s.flags.masterRecognized) {
    paragraphs.push('你从一个连木刀都握不稳的现代人，成为了柳心流的门人。师父说，柳枝被风压弯，却不会折断。');
  } else {
    paragraphs.push('你的剑术还远未成熟，但你已经在这个时代站住了脚。');
  }

  const fates: EndingView['fates'] = [];
  // 隼人
  const hf = s.flags.hayatoFate;
  fates.push({
    name: '早瀬隼人',
    text:
      hf === 'treated'
        ? '随冒进的队伍冲锋，身负重伤。你当场替他止血、固定伤腿，他保住了腿，也学会了等待。'
        : hf === 'safe'
        ? '在佐佐、千秋的冒进中活了下来。他后来对人说：“有个怪人教会我什么时候该退。”'
        : hf === 'wounded'
          ? '随冒进的队伍冲锋，身负重伤，但捡回了一条命。他再也跑不快了，却从此学会了等待。'
          : s.flags.hayatoReckless
            ? '桶狭间那天，他跟着冒进的队伍冲了出去，从此下落不明。'
            : R(s, 'hayato').stance === 'rival'
              ? '至死都把你当成要超越的对手。战后，他在道场挂了一块木牌，上面写着你的名字。'
              : '随家主出阵，平安归来。他说下一次一定要和你堂堂正正地比一场。',
  });
  // 清兵卫
  const sq = quest(s, 'seibei');
  fates.push({
    name: '清兵卫',
    text:
      sq >= 4
        ? '“清兵卫锻冶”的枪头随织田军出征。多年以后，这间铺子会成为城下最有名的锻冶屋。'
        : sq === 99
          ? '铺子被座关闭后，他替军队搬运兵粮。战后他攒钱重开炉火——用的是你曾说过的淬火法子。'
          : '仍守着师父留下的铺子。',
  });
  // 阿凉
  fates.push({
    name: '阿凉',
    text: s.flags.oryoNetwork
      ? '继续在水月的暖帘后，为簗田出羽守编织着看不见的情报网。你知道，她的网里有一根线是你。'
      : hasMem(s, 'oryo', 'guarded')
        ? '水月在战乱中保住了。她在柜台下藏了一个茶碗，说是“留给守门人的”。'
        : '水月的暖帘照旧挂着。她仍旧笑着，把每个人看透。',
  });
  // 又左卫门
  fates.push({
    name: '前田又左卫门利家',
    text:
      key === 'battle'
        ? '在桶狭间取下首级，却仍未获赦免。他要再等一年，才会在森部之战后重回信长身边——那是另一个故事了。'
        : s.flags.toshiieMet
          ? '在桶狭间不请自来，取下首级，却仍未获赦免。他离开清洲前，托清兵卫带话：“下次一起喝酒。”'
          : '你始终没有和这位后来的加贺百万石之主说上话。',
  });
  // 师父
  fates.push({
    name: '柳田源斋',
    text: s.flags.masterRecognized
      ? hasMem(s, 'gensai', 'son')
        ? '在空荡的道场里等弟子们回来。他在灯下多摆了一只茶碗——为了儿子，也为了你。'
        : '在道场门口等弟子们回来。看到你时，他只说了一句：“回来了。”'
      : '仍在柳心馆授剑。他说，你还有很多东西没学完。',
  });
  if (s.flags.villageSaved) fates.push({ name: '五条村', text: '村里人开始把水烧开再喝。孩子们管这叫“怪人的规矩”。' });

  const achievements: string[] = [];
  if (s.flags.masterRecognized) achievements.push('柳心流初目录');
  if (s.record.wins >= 5) achievements.push(`剑术比试 ${s.record.wins} 胜`);
  if (s.player.techniques.includes('fumikomi')) achievements.push('习得“踏入”');
  if (s.flags.villageSaved) achievements.push('五条村的恩人');
  if (sq >= 4) achievements.push('清兵卫锻冶开张');
  if (s.flags.spyResolved) achievements.push(s.flags.spyChoice === 'double' ? '策反今川细作' : '识破今川细作');
  if (s.flags.townHealer) achievements.push('水月的先生');
  const L = s.player.life;
  if (L.wit.lv >= 3) achievements.push(`智略 ${L.wit.lv}`);
  if (L.speech.lv >= 3) achievements.push(`口才 ${L.speech.lv}`);
  if (L.med.lv >= 3) achievements.push(`医术 ${L.med.lv}`);
  if (s.player.techniques.includes('mikiri')) achievements.push('习得“见切”');
  if (s.flags.battleResult === 'win') achievements.push('桶狭间·护背之功');
  if (hasMem(s, 'nobunaga', 'bold')) achievements.push('当街直言信长');
  achievements.push(`名声 ${s.player.fame}`);

  const future = [
    '第二章 · 美浓之风（1561–1567）：随织田家北上，斋藤龙兴、稻叶山城，以及一位叫木下藤吉郎的猴子般的男人。',
    '剑术：柳心流中目录、新的流派与剑豪挑战。',
    '人生：在乱世中成家、开设自己的道场，或投身织田家成为武士。',
    '穿越设定：选择不同的年份、地点与初始身份重新开始。',
  ];

  const NAME_TO_ID: Record<string, keyof GameState['npcs']> = {
    早瀬隼人: 'hayato',
    清兵卫: 'seibei',
    阿凉: 'oryo',
    柳田源斋: 'gensai',
  };
  const shown = fates.filter((f) => !NAME_TO_ID[f.name] || s.npcs[NAME_TO_ID[f.name]].rel.met);
  return { title, subtitle, paragraphs, fates: shown, achievements, future };
}
