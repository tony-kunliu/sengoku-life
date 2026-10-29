import { doneToday, flag, quest, R, rel, remember, toast } from '../engine/core';
import { startBout, startScene } from '../engine/game';
import type { ActionDef } from '../engine/registry';
import { gainXp, nextRepGain } from '../engine/training';
import type { GameState, NpcId } from '../engine/types';
import { NPCS } from './npcs';
import { hearRumor } from './world';

const names = Object.fromEntries(Object.values(NPCS).map((n) => [n.id, n.name]));
const r = (s: GameState, npc: NpcId, d: { trust?: number; respect?: number; favor?: number }) => rel(s, npc, d, names);
const here = (s: GameState, npc: NpcId) => NPCS[npc].where(s).loc === s.location;
const onceToday = (key: string, msg = '今天已经做过了') => (s: GameState) => (doneToday(s, key) ? msg : null);

export const ACTIONS: ActionDef[] = [
  // ───── 清洲城下 ─────
  {
    id: 'town_wander',
    label: '在城下闲逛',
    loc: 'town',
    cost: 1,
    icon: '🏮',
    desc: '走街串巷，看看城下的样子，也许会遇到什么。',
    run: (s) => {
      if (!flag(s, 'dojoKnown')) {
        s.flags.dojoKnown = true;
        return '你在西边的巷子里听见整齐的“喝！”声——一间叫“柳心馆”的道场。地图上新增了地点。';
      }
      const t = hearRumor(s);
      return `你在街口听人闲聊：“${t}”`;
    },
  },
  {
    id: 'town_labor',
    label: '打零工搬运货物',
    loc: 'town',
    cost: 1,
    icon: '📦',
    desc: '在河岸码头帮人卸货。辛苦，但能换些铜钱。（+30 文）',
    run: (s) => {
      const pay = s.world.imagawa >= 60 ? 40 : 30;
      s.player.money += pay;
      toast(s, `钱 +${pay} 文`);
      return `在五条川码头卸了一整个时辰的货，得了 ${pay} 文。${s.world.imagawa >= 60 ? '军需的货越来越多，工钱也涨了。' : ''}`;
    },
  },
  {
    id: 'seibei_help',
    label: '帮清兵卫拉风箱',
    loc: 'town',
    npc: 'seibei',
    cost: 1,
    icon: '🔥',
    desc: (s) => (quest(s, 'seibei') === 99 ? '清兵卫的铺子已经被封了。' : '在炉边帮忙，顺便听他讲钢和火候。（+20 文，清兵卫信任）'),
    locked: (s) => (quest(s, 'seibei') === 99 ? '铺子已被封' : NPCS.seibei.where(s).doing.includes('铺') ? null : '他现在不在铺子里'),
    run: (s) => {
      s.player.money += 20;
      toast(s, '钱 +20 文');
      r(s, 'seibei', { trust: 4, favor: 1 });
      const n = doneToday(s, 'seibei_help_total');
      void n;
      const lines = [
        '清兵卫说：“钢要叠打，杂质才会出来。人也一样吧。”',
        '你拉了一个时辰风箱，手臂酸得抬不起来。清兵卫递来一碗凉水。',
        '你随口说起“淬火时水温”的讲究，清兵卫愣了很久，在墙上划了一道记号。',
      ];
      return lines[s.day % lines.length];
    },
  },
  {
    id: 'spy_tail',
    label: '跟踪卖针的行商',
    loc: 'town',
    cost: 1,
    icon: '👣',
    tag: '委托',
    when: (s) => quest(s, 'spy') === 1,
    desc: '阿凉托你留意的那个行商，今天好像要往东门去。',
    run: (s) => {
      startScene(s, 'spy_confront');
      return '';
    },
  },
  {
    id: 'seibei_buyer',
    label: '替清兵卫寻找买家',
    loc: 'town',
    cost: 1,
    icon: '🤝',
    tag: '委托',
    when: (s) => quest(s, 'seibei') === 2,
    desc: '清兵卫有了炭，还缺一个肯订货的买家。',
    run: (s) => {
      startScene(s, 'seibei_buyer');
      return '';
    },
  },

  // ───── 道场 ─────
  {
    id: 'dojo_chores',
    label: '打扫道场',
    loc: 'dojo',
    cost: 1,
    icon: '🧹',
    desc: '擦地、挑水、修补护具。师父说：剑先修心。（师父信任/尊敬）',
    locked: onceToday('dojo_chores', '今天已经打扫过了'),
    run: (s) => {
      s.quests.chores = quest(s, 'chores') + 1;
      r(s, 'gensai', { trust: 4, respect: 3 });
      if (quest(s, 'chores') === 3) remember(s, 'gensai', 'chores3', '你连续几天默默打扫道场，师父看在眼里。');
      const t = [
        '你跪在地上把道场的木板一块块擦亮。权六远远点了点头。',
        '挑了二十担水，肩膀磨破了皮。师父路过，什么也没说。',
        '你修好了一副破旧的护手。师父拿起来看了看：“手不笨。”',
      ];
      return t[quest(s, 'chores') % t.length];
    },
  },
  {
    id: 'dojo_swing',
    label: '素振（挥刀）',
    loc: 'dojo',
    cost: 1,
    icon: '⚔️',
    when: (s) => !!flag(s, 'admitted'),
    desc: (s) => `基本功，提高攻势。下次预计经验 +${nextRepGain(s, 'atk', 30)}（重复越多收益越低）`,
    run: (s) => {
      const msg = gainXp(s, 'atk', 30, false);
      if (here(s, 'gensai') && s.slot === 0) r(s, 'gensai', { trust: 1 });
      return `你挥了五百次木刀。${msg}`;
    },
  },
  {
    id: 'dojo_kata',
    label: '型稽古（练型）',
    loc: 'dojo',
    cost: 1,
    icon: '🛡️',
    when: (s) => !!flag(s, 'admitted'),
    desc: (s) => `随权六演练柳心流的型，提高守备。下次预计经验 +${nextRepGain(s, 'def', 30)}`,
    run: (s) => {
      const msg = gainXp(s, 'def', 30, false);
      return `你一遍遍演练“受”与“流”的型。${msg}`;
    },
  },
  {
    id: 'dojo_observe',
    label: '观摩高手',
    loc: 'dojo',
    cost: 1,
    icon: '👁️',
    desc: '坐在一旁看别人切磋，提高眼力，也能摸清在场者的习惯。（每日一次）',
    locked: onceToday('dojo_observe', '今天已经观摩过了，再看也看不出新东西'),
    run: (s) => {
      const msg = gainXp(s, 'eye', 22, true);
      const lines: string[] = [];
      for (const id of ['hayato', 'gonroku'] as const) {
        if (!here(s, id)) continue;
        const k = s.oppKnowledge[id] ?? 0;
        if (k < 2) {
          s.oppKnowledge[id] = k + 1;
          lines.push(`你看出了${NPCS[id].name}的一些习惯（情报 ${k + 1}/3）`);
        }
      }
      if (here(s, 'gensai')) lines.push('师父偶尔出手指点弟子，一招一式都看不出多余。');
      return `你在场边观摩了一个时辰。${msg}。${lines.join('；')}`;
    },
  },
  {
    id: 'spar_hayato',
    label: '与隼人切磋',
    loc: 'dojo',
    npc: 'hayato',
    cost: 1,
    icon: '🥋',
    when: (s) => !!flag(s, 'admitted'),
    locked: onceToday('spar_hayato', '隼人：“今天打够了，明天再来！”'),
    desc: (s) => `积极进攻型。情报 ${s.oppKnowledge.hayato ?? 0}/3`,
    run: (s) => {
      startBout(s, 'hayato', { kind: 'spar', label: '道场切磋' });
      if (R(s, 'hayato').stance !== 'rival') r(s, 'hayato', { trust: 2, respect: 1 });
      else r(s, 'hayato', { respect: 2 });
      return '你向隼人行礼，请他赐教。';
    },
  },
  {
    id: 'spar_gonroku',
    label: '与权六切磋',
    loc: 'dojo',
    npc: 'gonroku',
    cost: 1,
    icon: '🥋',
    when: (s) => !!flag(s, 'admitted'),
    locked: onceToday('spar_gonroku', '权六：“今天到此为止。”'),
    desc: (s) => `谨慎防守反击型。情报 ${s.oppKnowledge.gonroku ?? 0}/3`,
    run: (s) => {
      startBout(s, 'gonroku', { kind: 'spar', label: '道场切磋' });
      return '权六默默拿起木刀，摆出中段。';
    },
  },
  {
    id: 'ask_master',
    label: '向师父请教',
    loc: 'dojo',
    npc: 'gensai',
    cost: 1,
    icon: '📜',
    tag: '指导',
    when: (s) => !!flag(s, 'admitted'),
    desc: (s) => {
      const used = quest(s, 'guidance');
      const allowed = Math.floor(R(s, 'gensai').trust / 15);
      return `请师父点拨，突破瓶颈（提升上限）。已指导 ${used} 次 / 当前信任允许 ${allowed} 次`;
    },
    locked: (s) => {
      if (quest(s, 'guidance') >= Math.floor(R(s, 'gensai').trust / 15)) return '师父：“你还没有准备好听。”（需要更多信任）';
      if (s.slot === 2) return '师父晚上不授剑';
      if (doneToday(s, 'ask_master')) return '一天只能消化一次指导';
      return null;
    },
    run: (s) => {
      startScene(s, 'guidance');
      return '';
    },
  },
  {
    id: 'master_test_retry',
    label: '请求师父再次考验',
    loc: 'dojo',
    npc: 'gensai',
    cost: 0,
    icon: '🎴',
    tag: '考验',
    when: (s) => !!flag(s, 'testFailed') && !flag(s, 'masterRecognized'),
    locked: (s) => ((s.flags.testRetryDay as number) > s.day ? '师父：“回去想清楚再来。”（隔日可再次挑战）' : s.slot === 2 ? '师父晚上不授剑' : null),
    desc: '上一次考验未能让师父满意。',
    run: (s) => {
      startScene(s, 'master_test_again');
      return '';
    },
  },

  // ───── 茶屋 ─────
  {
    id: 'tea_work',
    label: '在茶屋帮工',
    loc: 'teahouse',
    npc: 'oryo',
    cost: 1,
    icon: '🍵',
    desc: '端茶、烧水、听客人说话。（+25 文，阿凉信任，可能听到消息）',
    run: (s) => {
      const pay = s.player.lodging === 'teahouse' ? 20 : 25;
      s.player.money += pay;
      toast(s, `钱 +${pay} 文`);
      r(s, 'oryo', { trust: 3 });
      const t = hearRumor(s);
      return `你忙了一个时辰，得了 ${pay} 文${s.player.lodging === 'teahouse' ? '（扣去饭钱）' : ''}。端茶时听见客人说：“${t}”`;
    },
  },
  {
    id: 'tea_listen',
    label: '花 10 文喝茶打听',
    loc: 'teahouse',
    cost: 1,
    icon: '🗞️',
    desc: '坐在角落里喝茶，留心听邻桌的议论。',
    locked: (s) => (s.player.money < 10 ? '钱不够' : null),
    run: (s) => {
      s.player.money -= 10;
      const a = hearRumor(s);
      const b = hearRumor(s);
      return `你听到两段议论：“${a}”……“${b}”`;
    },
  },

  // ───── 城外村庄 ─────
  {
    id: 'village_farm',
    label: '帮五郎作干农活',
    loc: 'village',
    npc: 'gosaku',
    cost: 1,
    icon: '🌾',
    desc: '插秧、除草。不多的工钱，但村里人会记得你。（+15 文）',
    run: (s) => {
      s.player.money += 15;
      toast(s, '钱 +15 文');
      r(s, 'gosaku', { trust: 3 });
      return '你在水田里弯腰插了一上午秧。五郎作说：“你这手，原来是不干活的手吧。”';
    },
  },
  {
    id: 'village_run',
    label: '在山路上奔跑锻炼',
    loc: 'village',
    cost: 1,
    icon: '🏃',
    desc: (s) => `沿着林间山路来回奔跑，锻炼气力上限（当前 ${s.player.maxStamina}）。每日一次，越往后越难提升。`,
    locked: onceToday('village_run', '腿已经跑软了，明天再来'),
    run: (s) => {
      const n = quest(s, 'runs') + 1;
      s.quests.runs = n;
      // 第 2、5 次奔跑各 +1 气力上限
      if (n === 2 || n === 5) {
        s.player.maxStamina += 1;
        toast(s, `气力上限 ${s.player.maxStamina}`);
        return `你跑到第 ${n} 天，终于感觉呼吸顺了。气力上限 +1（现为 ${s.player.maxStamina}）。`;
      }
      return `你在山路上跑得满身大汗。（坚持下去：第 ${n} 次）`;
    },
  },
  {
    id: 'spar_toshiie',
    label: '向又左卫门讨教',
    loc: 'village',
    npc: 'toshiie',
    cost: 1,
    icon: '🗡️',
    when: (s) => !!flag(s, 'toshiieMet'),
    locked: onceToday('spar_toshiie', '又左卫门：“今天的酒钱你出就再陪你一场。”（明天再来）'),
    desc: (s) => `应变型强敌。他尊敬能打的人。情报 ${s.oppKnowledge.toshiie ?? 0}/3`,
    run: (s) => {
      startBout(s, 'toshiie', { kind: 'spar', label: '林中过招' });
      r(s, 'toshiie', { trust: 3, respect: 2 });
      return '又左卫门把长枪插在地上，捡起一根木刀：“来吧，让我看看。”';
    },
  },
  {
    id: 'charcoal',
    label: '去炭窑商量买炭',
    loc: 'village',
    cost: 1,
    icon: '⛰️',
    tag: '委托',
    when: (s) => quest(s, 'seibei') === 1,
    desc: '村后的炭窑也许能便宜卖炭给清兵卫。',
    run: (s) => {
      startScene(s, 'charcoal');
      return '';
    },
  },

  {
    id: 'visit_sick',
    label: '去看五郎作的孙子',
    loc: 'village',
    cost: 0,
    icon: '🩺',
    tag: '委托',
    when: (s) => quest(s, 'village_sick') === 1,
    desc: '村里的孩子还在闹肚子。',
    run: (s) => {
      startScene(s, 'sick_child');
      return '';
    },
  },
  // ───── 任意地点 ─────
];
