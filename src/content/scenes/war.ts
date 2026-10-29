// 桶狭间前夕 —— 重要抉择与第一章结局
import { hasMem, quest, R } from '../../engine/core';
import type { Choice, SceneDef } from '../../engine/registry';
import type { GameState } from '../../engine/types';

const canFight = (s: GameState) => !!s.flags.masterRecognized || s.player.stats.atk.lv >= 4;

const dawnText = (s: GameState) => {
  let t =
    '五月十九日，天还没亮。\n\n清洲城里忽然传出鼓声。人们说，殿下起身唱了一段幸若舞《敦盛》——“人生不过五十年”——然后站着吃完泡饭，披甲上马，只带了几名近侍就冲出了城门。\n\n马蹄声向南，往热田方向去了。';
  if (hasMem(s, 'nobunaga', 'bold')) t += '\n\n经过你身边时，马上的人侧过头看了你一眼。“……是你啊。说今川不足为惧的那个。”他什么也没再说。';
  if (s.flags.toldToshiie) t += '\n\n你听见身后又左卫门倒吸了一口凉气：“……真被你说中了。”';
  return t;
};

const endChoice = (ending: string): Choice => ({ label: '……', effects: [{ t: 'end', ending }] });

export const WAR: SceneDef[] = [
  {
    id: 'war_near',
    title: '风声',
    art: 'town',
    priority: 150,
    trigger: { loc: ['town', 'teahouse', 'dojo', 'village'], when: (s) => s.day >= 15 && s.slot === 0 && s.world.imagawa >= 80 },
    nodes: {
      start: {
        speaker: 'narrator',
        text: (s) =>
          '一早，城下就乱成一片：今川的大军已到尾张边境，鹫津、丸根两砦危急。有人往城里搬米，有人往乡下逃。\n\n' +
          (hasMem(s, 'hayato', 'summoned') ? '道场里少了隼人的声音——他被家主召进城里待命了。\n\n' : '') +
          (quest(s, 'seibei') >= 4 ? '“清兵卫锻冶”的炉火一夜没熄，军需的枪头订单堆成了山。\n\n' : '') +
          (quest(s, 'seibei') === 99 ? '清兵卫被拉去搬运兵粮，你看见他扛着米袋，满脸疲惫。\n\n' : '') +
          '离五月十九日，还有四天。你知道那一天会发生什么——至少，你以为你知道。',
        effects: [{ t: 'log', text: '今川大军压境。距离五月十九日还有四天。', kind: 'world' }],
      },
    },
  },
  {
    id: 'eve',
    title: '桶狭间前夜',
    art: 'night',
    priority: 200,
    trigger: { loc: ['town', 'teahouse', 'dojo', 'village'], when: (s) => s.day >= 16 && s.slot === 2 && s.world.imagawa >= 90 },
    nodes: {
      start: {
        speaker: 'narrator',
        text: (s) =>
          '五月十八日夜。\n\n传言说今川义元已入沓挂城，明天就会攻打鹫津与丸根。清洲城里开了军议，殿下却只说了些闲话，就让重臣们回去睡觉。\n\n' +
          (s.flags.toshiieOath ? '又左卫门敲开了你的门。他身上已经穿好了旧的胴丸。“明早，殿下一定会出阵。说好的，你来不来？”\n\n' : '') +
          (R(s, 'oryo').trust >= 20 ? '阿凉在茶屋门口收拾着东西，回头看了你一眼：“你呢？你打算怎么办？”\n\n' : '') +
          '你知道明天会发生什么。现在，你要决定自己站在哪里。',
        choices: [
          {
            label: '随又左卫门出阵——不请自来，奔赴战场',
            when: (s) => !!s.flags.toshiieOath || R(s, 'toshiie').trust >= 30,
            locked: (s) => (canFight(s) ? null : '你的剑还不足以在战场上自保（需要师父认可，或攻势达到 4）'),
            effects: [{ t: 'flag', key: 'finalPath', v: 'battle' }],
            next: 'dawn_battle',
          },
          {
            label: '去前线的中岛砦找隼人',
            when: (s) => R(s, 'hayato').stance === 'ally',
            effects: [{ t: 'flag', key: 'finalPath', v: 'hayato' }],
            next: 'dawn_hayato',
          },
          {
            label: '把“今川本阵会在桶狭间一带歇脚”的判断托阿凉送出去',
            tag: '现代知识',
            when: (s) => !!s.flags.oryoNetwork || s.world.odaIntel >= 15,
            effects: [{ t: 'flag', key: 'finalPath', v: 'intel' }],
            next: 'intel',
          },
          {
            label: '留在清洲，守护这里的人',
            effects: [{ t: 'flag', key: 'finalPath', v: 'stay' }],
            next: 'stay',
          },
          {
            label: '收拾行李，趁夜离开尾张',
            effects: [{ t: 'flag', key: 'finalPath', v: 'flee' }],
            next: 'flee',
          },
        ],
      },

      // —— 出阵 ——
      dawn_battle: { speaker: 'narrator', text: dawnText, next: 'battle1' },
      battle1: {
        speaker: 'narrator',
        text: '你和又左卫门追着殿下的马队，过了热田，又过了善照寺砦。沿途不断有人赶来汇合，渐渐聚成两千余人。\n\n正午，天色骤然变黑。一场倾盆大雨从西边压了过来，雨点打得人睁不开眼。\n\n“就是现在！”殿下的声音穿过雨幕。大军冲进了桶狭间的山谷——今川本阵就在那里歇脚。\n\n一个今川的武者挺枪朝又左卫门的背后刺来。',
        choices: [
          {
            label: '挡在他身后',
            effects: [
              { t: 'know', opp: 'imagawa', n: 1 },
              { t: 'bout', opp: 'imagawa', kind: 'story', label: '桶狭间', win: 'battle_win', lose: 'battle_lose', draw: 'battle_lose' },
            ],
          },
        ],
      },
      battle_win: {
        speaker: 'toshiie',
        text: '（你架开了那一枪。武者在泥里滑倒，丢下枪逃了。）\n\n干得好！{name}，背后就交给你了！\n\n——雨停的时候，今川治部大辅义元的首级已被毛利新介取下。四万大军，一个下午就崩溃了。\n\n又左卫门浑身泥血，提着几个首级去见殿下。殿下看了他一眼，什么也没说——没有赦免，也没有赶他走。\n\n“够了，”又左卫门回来时笑得像个孩子，“他看了我一眼。总有一天，他会让我回去的。”',
        effects: [
          { t: 'rel', npc: 'toshiie', trust: 15, respect: 10 },
          { t: 'mem', npc: 'toshiie', id: 'saved_back', text: '桶狭间的大雨中，你替又左卫门挡住了背后的一枪。' },
          { t: 'fame', n: 5 },
          { t: 'flag', key: 'battleResult', v: 'win' },
        ],
        choices: [endChoice('battle')],
      },
      battle_lose: {
        speaker: 'toshiie',
        text: '（枪尖擦过你的手臂，你摔进泥里——又左卫门回身一枪，把那个武者挑翻在地。）\n\n别死在这种地方！站起来！\n\n——雨停的时候，今川治部大辅义元的首级已被毛利新介取下。你的手臂缠着破布，又左卫门把你扛回了热田。\n\n“你替我挡了一下，”他说，“虽然挡得很难看。”',
        effects: [
          { t: 'rel', npc: 'toshiie', trust: 10, respect: 4 },
          { t: 'mem', npc: 'toshiie', id: 'saved_back', text: '桶狭间的大雨中，你想替又左卫门挡枪，反被他救了一命。' },
          { t: 'fame', n: 2 },
          { t: 'flag', key: 'battleResult', v: 'lose' },
        ],
        choices: [endChoice('battle')],
      },

      // —— 找隼人 ——
      dawn_hayato: { speaker: 'narrator', text: dawnText, next: 'hayato1' },
      hayato1: {
        speaker: 'narrator',
        text: (s) =>
          '你赶到中岛砦附近时，正撞见佐佐隼人正与千秋四郎的人马在集结——他们不等殿下的主力，打算抢先攻击今川的前锋。\n\n隼人就在队伍里。' +
          (s.flags.hayatoPatience
            ? '\n\n他看见了你，犹豫了很久，最后从队伍里走了出来。“……你说过，活下来才有下一次。”\n\n那支三百人的队伍冲了出去，再也没有回来。'
            : '\n\n“{name}！你来得正好！跟我一起冲，抢头功！”他的眼睛亮得吓人。'),
        choices: [
          { label: '和隼人一起等待殿下的主力', when: (s) => !!s.flags.hayatoPatience, next: 'hayato_safe' },
          {
            label: '拉住他——“不要去！”',
            when: (s) => !s.flags.hayatoPatience,
            effects: [{ t: 'bout', opp: 'hayato', kind: 'story', label: '拦住隼人', win: 'hayato_stopped', lose: 'hayato_charged', draw: 'hayato_charged' }],
          },
        ],
      },
      hayato_safe: {
        speaker: 'hayato',
        text: '（正午的暴雨中，殿下的主力冲进了桶狭间。隼人跟在后面，砍倒了一个逃跑的今川足轻。）\n\n……我没抢到头功。可我活着。\n\n师父知道了，一定又会说那句“知道何时该退”。烦死了。\n\n——谢谢你，{name}。',
        effects: [
          { t: 'flag', key: 'hayatoFate', v: 'safe' },
          { t: 'rel', npc: 'hayato', trust: 15 },
          { t: 'mem', npc: 'hayato', id: 'lived', text: '桶狭间那天，隼人听了你的话，没有加入佐佐、千秋的冒进。他活了下来。' },
        ],
        choices: [endChoice('hayato')],
      },
      hayato_stopped: {
        speaker: 'hayato',
        text: '（你夺下了他的刀。隼人跪在泥里，看着那支队伍冲出去——然后被今川的大军吞没。）\n\n……他们，全死了？\n\n（他的声音在发抖。）你救了我。可恶……你又赢了我一次。',
        effects: [
          { t: 'flag', key: 'hayatoFate', v: 'safe' },
          { t: 'rel', npc: 'hayato', trust: 12, respect: 8 },
          { t: 'mem', npc: 'hayato', id: 'lived', text: '桶狭间那天，你硬是拦下了要去冒进的隼人。他活了下来。' },
        ],
        choices: [endChoice('hayato')],
      },
      hayato_charged: {
        speaker: 'narrator',
        text: '隼人甩开了你，跟着队伍冲了出去。\n\n傍晚，你在死伤者中找到了他——腿上中了一枪，但还活着。他看见你，咧嘴笑了一下：“……没抢到。”\n\n那支三百人的冲锋，几乎无人生还。佐佐隼人正、千秋四郎都战死了。而殿下的主力，在暴雨中取下了今川义元的首级。',
        effects: [
          { t: 'flag', key: 'hayatoFate', v: 'wounded' },
          { t: 'rel', npc: 'hayato', trust: 6 },
          { t: 'mem', npc: 'hayato', id: 'wounded', text: '桶狭间那天，隼人跟着冒进的队伍冲了出去，身负重伤。是你把他从死人堆里拖了回来。' },
        ],
        choices: [endChoice('hayato')],
      },

      // —— 情报 ——
      intel: {
        speaker: 'oryo',
        text: '桶狭间……你说今川大人会在那里歇脚？\n\n（她看着你，像在看一个谜。）\n\n我不问你怎么知道的。我会把话送到簗田大人那里——但你要明白，殿下不会因为一个茶屋女人的一句话就改变主意。他要的是探子亲眼所见。',
        next: 'intel2',
      },
      intel2: {
        speaker: 'narrator',
        text: (s) =>
          dawnText(s) +
          '\n\n——傍晚，消息传回清洲：簗田出羽守的探子在正午前找到了今川本阵的位置，殿下趁暴雨奇袭，取下了今川义元的首级。\n\n' +
          (s.world.odaIntel >= 30
            ? '阿凉悄悄告诉你：簗田大人说，那张砦图和你的话，让他的探子少走了很多冤枉路。“你在这场仗里，也有一份。”'
            : '你不知道你的话有没有派上用场。也许，历史本来就会这样发生。'),
        effects: [
          { t: 'rel', npc: 'oryo', trust: 10, respect: 8 },
          { t: 'stance', npc: 'oryo', stance: 'ally' },
          { t: 'mem', npc: 'oryo', id: 'intel', text: '桶狭间前夜，你托阿凉把关于今川本阵的判断送了出去。' },
        ],
        choices: [endChoice('intel')],
      },

      // —— 留守 ——
      stay: { speaker: 'narrator', text: dawnText, next: 'stay2' },
      stay2: {
        speaker: 'narrator',
        text: (s) =>
          (quest(s, 'seibei') >= 4
            ? '你在“清兵卫锻冶”帮了一整天，最后一批枪头赶在午前送去了热田。清兵卫说：“这些枪头里，也有你拉的风箱。”\n\n'
            : '你帮阿凉把茶屋的东西搬进地窖。\n\n') + '午后，城下忽然起了骚动——几个趁乱打劫的浪人砸开了街口的店铺，朝茶屋走来。',
        choices: [
          {
            label: '拿起木刀，挡在门口',
            effects: [{ t: 'know', opp: 'looter', n: 1 }, { t: 'bout', opp: 'looter', kind: 'story', label: '守住水月', win: 'stay_win', lose: 'stay_lose', draw: 'stay_lose' }],
          },
        ],
      },
      stay_win: {
        speaker: 'oryo',
        text: '（浪人们骂骂咧咧地跑了。）\n\n……你这人，平时看着呆呆的，关键时刻还挺像样。\n\n——傍晚，消息传来：殿下在桶狭间取下了今川义元的首级。城下的人哭着、笑着涌上街头。',
        effects: [
          { t: 'rel', npc: 'oryo', trust: 10 },
          { t: 'rel', npc: 'seibei', trust: 6 },
          { t: 'fame', n: 3 },
          { t: 'mem', npc: 'oryo', id: 'guarded', text: '桶狭间那天，你守在水月门口，赶走了打劫的浪人。' },
        ],
        choices: [endChoice('stay')],
      },
      stay_lose: {
        speaker: 'narrator',
        text: '你被推倒在地，浪人们抢走了几袋米。是清兵卫抡着铁锤冲过来，才把他们吓跑。\n\n“没事吧？”阿凉替你包扎伤口，“……谢谢你挡在那里。”\n\n——傍晚，消息传来：殿下在桶狭间取下了今川义元的首级。',
        effects: [
          { t: 'rel', npc: 'oryo', trust: 6 },
          { t: 'rel', npc: 'seibei', trust: 4 },
          { t: 'mem', npc: 'oryo', id: 'guarded', text: '桶狭间那天，你守在水月门口，虽然被打倒，却没有逃走。' },
        ],
        choices: [endChoice('stay')],
      },

      // —— 逃离 ——
      flee: {
        speaker: 'narrator',
        text: '你在夜色里出了清洲，沿着河往北走。没有和任何人告别。\n\n第三天，你在美浓的一座小镇上听说：织田上总介在桶狭间奇袭今川，取下了义元的首级。\n\n历史没有因为你的离开而改变。只是，那些你在清洲认识的人，从此再也没有了消息。',
        effects: [
          { t: 'run', fn: (s) => (['gensai', 'hayato', 'seibei', 'oryo', 'toshiie'] as const).forEach((n) => (s.npcs[n].rel.trust -= 10)) },
        ],
        choices: [endChoice('flee')],
      },
    },
  },
];
