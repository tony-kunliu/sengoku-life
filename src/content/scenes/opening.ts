// 《乱世来客》序章：穿越 → 清洲安身
import { quest } from '../../engine/core';
import type { SceneDef } from '../../engine/registry';

export const OPENING: SceneDef[] = [
  {
    id: 'prologue',
    title: '田埂上的醒来',
    art: 'village',
    priority: 100,
    trigger: { loc: ['village'], when: (s) => s.day === 1 && !s.flags.prologueDone },
    nodes: {
      start: {
        speaker: 'narrator',
        text: '泥土的气味。蛙鸣。你睁开眼，看见的不是天花板，而是一片刚插完秧的水田，和远处一座你从未见过的木造城郭。\n\n手机不见了。身上的衣服湿透，沾满了泥。',
        next: 'n2',
      },
      n2: {
        speaker: 'gosaku',
        text: '喂——你这家伙！倒在别人家田里做什么？……这身衣服，你是哪里来的？南蛮人？',
        effects: [{ t: 'meet', npc: 'gosaku' }],
        choices: [
          {
            label: '“我来自四百多年以后。”',
            effects: [
              { t: 'rel', npc: 'gosaku', trust: -3 },
              { t: 'flag', key: 'toldTruth', v: true },
              { t: 'mem', npc: 'gosaku', id: 'truth', text: '你对五郎作说自己来自四百年后，他以为你被狐狸迷了心窍。' },
            ],
            next: 'truth',
          },
          {
            label: '“我是远方来的旅人，路上遭了山贼。”',
            effects: [{ t: 'rel', npc: 'gosaku', trust: 3 }],
            next: 'lie',
          },
          {
            label: '先不解释：“老伯，今年是哪一年？”',
            next: 'year',
          },
        ],
      },
      truth: {
        speaker: 'gosaku',
        text: '四百年……？阿弥陀佛，是被狐狸附了身吧。可怜见的。\n\n（老人后退半步，但还是递来一条干布。）先擦擦。现在是永禄三年，五月初三。',
        next: 'realize',
      },
      lie: {
        speaker: 'gosaku',
        text: '山贼？这年头哪条路都不太平。能捡回一条命就不错了。\n\n今天是永禄三年五月初三。前面就是清洲，织田殿下的城。',
        next: 'realize',
      },
      year: {
        speaker: 'gosaku',
        text: '哪一年？永禄三年啊，五月初三。你连这都忘了？摔坏脑袋了吧。',
        next: 'realize',
      },
      realize: {
        speaker: 'player',
        text: '永禄三年……公元 1560 年。尾张，清洲。\n\n如果我记得没错——再过十六天，五月十九日，今川义元的大军会在桶狭间……\n\n不，我真的记得没错吗？就算记得，我一个来路不明的人，又能做什么？',
        next: 'clothes',
      },
      clothes: {
        speaker: 'gosaku',
        text: '先换上这个吧，是我儿子的旧衣服。你那身打扮进城，会被当成细作抓起来的。\n\n……唉，要是你懂医术就好了。村里好几个孩子闹肚子，我那孙子也躺了两天了。',
        effects: [{ t: 'rel', npc: 'gosaku', trust: 2 }],
        choices: [
          {
            label: '“孩子是怎么病的？让我看看。”',
            tag: '现代知识',
            effects: [
              { t: 'quest', id: 'village_sick', stage: 1 },
              { t: 'rel', npc: 'gosaku', trust: 3 },
            ],
            next: 'sick',
          },
          {
            label: '“谢谢您。我得先进城找个落脚的地方。”',
            effects: [{ t: 'quest', id: 'village_sick', stage: 1 }],
            next: 'leave',
          },
        ],
      },
      sick: {
        speaker: 'narrator',
        text: '你跟着五郎作去看了孩子：腹泻、口干、哭不出眼泪。村里的人都喝五条川的生水。\n\n是脱水。现代人都知道该怎么做——可这里没有口服补液盐，也没有糖。你需要想清楚：用这个时代有的东西，能做到什么程度。\n\n（可在村庄随时处理此事）',
        next: 'leave',
      },
      leave: {
        speaker: 'narrator',
        text: '五郎作指了指北边：“沿着河走，半个时辰就到清洲城下。”\n\n你身无分文，没有身份，没有认识的人。只有一点关于未来的、不知道是否可靠的记忆。',
        effects: [
          { t: 'flag', key: 'prologueDone', v: true },
          { t: 'log', text: '你在五条村的田埂上醒来。今天是永禄三年五月初三。', kind: 'event' },
        ],
      },
    },
  },
  {
    id: 'sick_child',
    title: '病童',
    art: 'village',
    priority: 40,
    trigger: { loc: ['village'], when: (s) => quest(s, 'village_sick') === 1 && !s.flags.sickPrompted && s.slot < 2 && !!s.flags.townArrived },
    nodes: {
      start: {
        effects: [{ t: 'flag', key: 'sickPrompted', v: true }],
        speaker: 'gosaku',
        text: '你回来了！孙子还是不见好，村里的阿婆说要去寺里求护符……你那天说要看看，你真有办法吗？',
        choices: [
          {
            label: '把水烧开再喝；用米汤加一点盐，一口一口慢慢喂。',
            tag: '现代知识',
            effects: [
              { t: 'flag', key: 'villageSaved', v: true },
              { t: 'run', fn: (s) => (s.flags.villageSavedDay = s.day) },
              { t: 'quest', id: 'village_sick', stage: 2 },
              { t: 'rel', npc: 'gosaku', trust: 15, favor: 20 },
              { t: 'fame', n: 3 },
              { t: 'mem', npc: 'gosaku', id: 'saved', text: '你教村里人把水烧开、喂盐米汤，救了五郎作的孙子。' },
              { t: 'time', slots: 1 },
            ],
            next: 'good',
          },
          {
            label: '去城里买药。（需要 60 文）',
            locked: (s) => (s.player.money < 60 ? '钱不够（需要 60 文）' : null),
            effects: [
              { t: 'money', n: -60 },
              { t: 'quest', id: 'village_sick', stage: 2 },
              { t: 'rel', npc: 'gosaku', trust: 6, favor: 6 },
              { t: 'time', slots: 1 },
            ],
            next: 'medicine',
          },
          { label: '“我再想想。”', next: 'later' },
        ],
      },
      good: {
        speaker: 'narrator',
        text: '你解释不了“细菌”，只能说：“河水里有看不见的脏东西，煮沸就能杀死。”五郎作半信半疑，但照做了。\n\n没有糖，你就用熬得稀稀的米汤加一撮盐——这是这个时代能做到的最接近补液的东西。\n\n傍晚，孩子第一次哭出了眼泪。',
        next: 'good2',
      },
      good2: {
        speaker: 'gosaku',
        text: '……谢谢你。真的谢谢你。村后炭窑是我侄子在烧，以后你要什么，跟我说一声。',
        effects: [{ t: 'flag', key: 'charcoalContact', v: true }],
      },
      medicine: {
        speaker: 'narrator',
        text: '你买来的草药让孩子好受了一些，但村里还有别的孩子在喝生水。\n\n五郎作还是很感激你。',
      },
      later: { speaker: 'gosaku', text: '……好吧。唉。（你随时可以在村里再去看看孩子）' },
    },
    repeatable: true,
  },
  {
    id: 'arrive_town',
    title: '清洲城下',
    art: 'town',
    priority: 90,
    trigger: { loc: ['town', 'teahouse', 'dojo'], when: (s) => !s.flags.townArrived },
    nodes: {
      start: {
        speaker: 'narrator',
        text: '清洲城下比你想象的热闹得多。叫卖声、马蹄声、铁匠铺的锤声混在一起。路过的武士腰间插着两把刀，人们自然地给他们让路。\n\n你饿了。口袋里一文钱也没有。\n\n街角，一辆装满炭袋的板车卡进了泥坑，一个年轻人正咬着牙推车。',
        effects: [{ t: 'flag', key: 'townArrived', v: true }, { t: 'goto', loc: 'town' }],
        choices: [
          { label: '上前帮忙推车', effects: [{ t: 'rel', npc: 'seibei', trust: 6, favor: 4 }], next: 'help' },
          { label: '在一旁看着', effects: [{ t: 'meet', npc: 'seibei' }], next: 'watch' },
        ],
      },
      help: {
        speaker: 'seibei',
        text: '呼……多谢。我叫清兵卫，在前面开铁匠铺……其实是师父留下的铺子。\n\n你脸色好差，饿了吧？走，我请你喝碗茶——茶屋的阿凉总会多给一个饭团。',
        effects: [{ t: 'mem', npc: 'seibei', id: 'cart', text: '初到清洲时，你帮清兵卫把炭车推出了泥坑。' }],
        next: 'tea',
      },
      watch: {
        speaker: 'seibei',
        text: '……（车终于推出来了。年轻人抹了把汗，注意到你。）你是外地人吧？看你站了半天了。饿了？前面茶屋的阿凉人好，你去说说看。',
        next: 'tea',
      },
      tea: {
        speaker: 'oryo',
        text: '哎呀，清兵卫带客人来了？……这身衣服是借的吧，袖子短了一截。\n\n（老板娘笑着打量你，目光像能把人里外看透。）你叫什么？从哪来？',
        effects: [{ t: 'meet', npc: 'oryo' }, { t: 'goto', loc: 'teahouse' }],
        choices: [
          { label: '“我叫{name}，从很远的地方来，什么都没有了。”', effects: [{ t: 'rel', npc: 'oryo', trust: 3 }], next: 'oryo2' },
          {
            label: '“我能读书写字，也会算账。”',
            tag: '现代知识',
            effects: [{ t: 'rel', npc: 'oryo', respect: 4 }, { t: 'flag', key: 'canWrite', v: true }],
            next: 'oryo2',
          },
        ],
      },
      oryo2: {
        speaker: 'oryo',
        text: '呵，这年头说自己什么都没有的人，往往藏着点什么。\n\n饭团算我请的。想在清洲待下去，就得有个落脚处，晚上再来跟我说吧。\n\n对了——城西有家道场叫柳心馆，常有浪人去拜师。你要是想混口饭吃，学点剑总没坏处。',
        effects: [{ t: 'flag', key: 'dojoKnown', v: true }, { t: 'log', text: '你初到清洲，结识了铁匠清兵卫和茶屋的阿凉。', kind: 'event' }],
      },
    },
  },
  {
    id: 'first_night',
    title: '落脚之处',
    art: 'teahouse',
    priority: 95,
    trigger: { loc: ['town', 'teahouse', 'dojo'], when: (s) => s.slot === 2 && s.player.lodging === 'none' && !!s.flags.townArrived },
    nodes: {
      start: {
        speaker: 'narrator',
        text: '天黑了。城下的灯一盏盏亮起，你得决定今晚睡在哪里——这也许决定了你在清洲的日子会怎么过。',
        next: 'offers',
      },
      offers: {
        speaker: 'narrator',
        text: '阿凉说茶屋后面有间堆柴的小屋，帮工可以换食宿。\n清兵卫说铺子的阁楼虽然热，但地方够大，只要你肯帮他拉风箱。',
        choices: [
          {
            label: '住在茶屋水月，帮阿凉做事',
            effects: [
              { t: 'lodging', v: 'teahouse' },
              { t: 'rel', npc: 'oryo', trust: 8 },
              { t: 'mem', npc: 'oryo', id: 'lodger', text: '你住进了水月后面的柴房，成了阿凉的帮工。' },
              { t: 'goto', loc: 'teahouse' },
            ],
            next: 'tea',
          },
          {
            label: '住在清兵卫的铁匠铺阁楼',
            effects: [
              { t: 'lodging', v: 'forge' },
              { t: 'rel', npc: 'seibei', trust: 8, favor: 3 },
              { t: 'mem', npc: 'seibei', id: 'lodger', text: '你住进了清兵卫铺子的阁楼，每天被锤声叫醒。' },
              { t: 'goto', loc: 'town' },
            ],
            next: 'forge',
          },
        ],
      },
      tea: {
        speaker: 'oryo',
        text: '好啊。在我这里，不用付房钱，但要付耳朵——客人说的话，记得的都告诉我。\n\n（她半开玩笑地眨眨眼。你隐约觉得，这不完全是玩笑。）',
        effects: [{ t: 'flag', key: 'oryoEars', v: true }],
      },
      forge: {
        speaker: 'seibei',
        text: '真的？太好了！师父走后，铺子里一直就我一个人……晚上太静了。\n\n明天早上我教你怎么看火色。',
      },
    },
  },
  {
    id: 'village_night',
    title: '借宿',
    art: 'village',
    priority: 94,
    trigger: { loc: ['village'], when: (s) => s.slot === 2 && s.player.lodging === 'none' && !s.flags.townArrived && !!s.flags.prologueDone },
    nodes: {
      start: {
        speaker: 'gosaku',
        text: '天都黑了，路上不安全。今晚就睡在我家仓房吧。明天一早再进城。',
        effects: [{ t: 'rel', npc: 'gosaku', trust: 2 }],
      },
    },
  },
];
