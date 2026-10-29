// 世界随时间自行发展：今川军推进、人物命运变化、城中传闻
import { hasMem, log, quest, remember } from '../engine/core';
import type { OpponentDef } from '../engine/combat/types';
import type { GameState } from '../engine/types';
import { OPPONENTS } from './opponents';

export function onNewDay(s: GameState) {
  // 今川军推进：历史默认节奏（五月十二日出骏府、十八日进抵沓挂）
  s.world.imagawa = Math.min(100, s.world.imagawa + 6);
  const d = s.day;
  if (d === 6) log(s, '传闻：今川治部大辅在骏府集结大军，号称四万。', 'world');
  if (d === 10) log(s, '今川义元率大军自骏府出发，向西进军。', 'world');
  if (d === 13) log(s, '今川军先锋进入三河，前锋直指尾张东境。', 'world');
  if (d === 15) {
    log(s, '今川军抵达尾张边境。鹫津、丸根两砦危在旦夕。', 'world');
    s.flags.hayatoSummoned = true;
    log(s, '早瀬隼人被家主召集，离开了道场。', 'world');
    if (s.npcs.hayato.rel.met) remember(s, 'hayato', 'summoned', '隼人奉命入城待命，临走前回头看了道场一眼。');
  }
  if (d === 16) log(s, '今川义元进入沓挂城。清洲城内却迟迟没有出阵的命令。', 'world');

  // 清兵卫的期限：五月十五前没有解决座的问题，铺子就会被关
  const sq = quest(s, 'seibei');
  if (d === 13 && sq >= 1 && sq < 3) {
    s.quests.seibei = 99;
    log(s, '“座”的人封了清兵卫的铺子。他只能去替军队搬运兵粮。', 'world');
    remember(s, 'seibei', 'closed', '铺子被封那天，清兵卫一句话也没说。');
  }

  // 被羞辱后的隼人加倍苦练
  if (s.flags.hayatoFired && !s.flags.hayatoBuffLogged) {
    s.flags.hayatoBuffLogged = true;
    log(s, '听说隼人每天天不亮就到道场挥刀，像是憋着一口气。', 'world');
  }

  // 村里病童的后续
  if (s.flags.villageSaved && !hasMem(s, 'gosaku', 'recovered') && d >= ((s.flags.villageSavedDay as number) ?? 0) + 1) {
    remember(s, 'gosaku', 'recovered', '五郎作的孙子退了烧，能下地跑了。');
  }
}

/** NPC 也在成长 */
export function opponentFor(s: GameState, id: string): OpponentDef {
  const base = structuredClone(OPPONENTS[id]);
  if (id === 'hayato') {
    if (s.day >= 9 || s.flags.hayatoFired) base.atk += 1;
    if (s.flags.hayatoPatience) base.def += 1;
  }
  if (id === 'gonroku' && s.day >= 10) base.def += 1;
  return base;
}

interface Rumor {
  id: string;
  text: string;
  when: (s: GameState) => boolean;
}

const RUMORS: Rumor[] = [
  { id: 'r_kiyosu', text: '清洲的殿下年轻时被叫作“尾张的大傻瓜”，现在可没人敢这么叫了。', when: (s) => s.day <= 8 },
  { id: 'r_price', text: '炭和铁的价钱一天一个样，听说城里在悄悄收购。', when: (s) => s.day <= 10 },
  { id: 'r_toshiie', text: '去年在城里斩了同朋众的那个高个子又左，好像一直没离开清洲附近。', when: (s) => s.day >= 3 && s.day <= 12 },
  { id: 'r_imagawa1', text: '骏河的今川大人要上洛了，尾张挡在路上……', when: (s) => s.world.imagawa >= 30 && s.world.imagawa < 60 },
  { id: 'r_imagawa2', text: '今川军已经出了骏府！说是四万人，也有人说两万五。', when: (s) => s.world.imagawa >= 60 && s.world.imagawa < 85 },
  { id: 'r_forts', text: '鹫津砦、丸根砦正对着大高城，今川一来首当其冲。', when: (s) => s.world.imagawa >= 70 },
  { id: 'r_council', text: '城里的重臣急得要命，殿下却只是说些闲话，叫大家回去睡觉。', when: (s) => s.world.imagawa >= 90 },
  { id: 'r_ataru', text: '有人说要守清洲城，有人说要出城决战。谁也不知道殿下怎么想。', when: (s) => s.world.imagawa >= 85 },
  { id: 'r_spy', text: '最近来了个卖针的行商，什么都要打听，连砦里有几口井都问。', when: (s) => s.day >= 5 && !s.flags.spyResolved },
  { id: 'r_village', text: '五条村那边有孩子闹肚子，听说已经倒下好几个了。', when: (s) => !s.flags.villageSaved && s.day <= 9 },
  { id: 'r_saved', text: '听说五条村来了个奇怪的旅人，几句话就让病孩子退了烧。', when: (s) => !!s.flags.villageSaved },
  { id: 'r_seibei', text: '“座”的大黑屋在逼清兵卫交座钱，那孩子的铺子怕是撑不住了。', when: (s) => (s.quests.seibei ?? 0) >= 1 && (s.quests.seibei ?? 0) < 4 },
  { id: 'r_seibei2', text: '清兵卫的新铺子打出来的枪头又直又匀，连足轻组头都去订货。', when: (s) => (s.quests.seibei ?? 0) >= 4 },
];

export function rumorsNow(s: GameState): string[] {
  return RUMORS.filter((r) => r.when(s)).map((r) => r.text);
}

/** 听一条还没听过的传闻（优先新的）。返回文本 */
export function hearRumor(s: GameState): string {
  const avail = RUMORS.filter((r) => r.when(s));
  const fresh = avail.filter((r) => !s.world.rumorsHeard.includes(r.id));
  const pick = (fresh.length ? fresh : avail)[0];
  if (!pick) return '今天没听到什么新鲜事。';
  if (!s.world.rumorsHeard.includes(pick.id)) s.world.rumorsHeard.push(pick.id);
  return pick.text;
}
