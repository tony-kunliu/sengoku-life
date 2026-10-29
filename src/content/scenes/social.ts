// 城下人际：清兵卫的铺子、阿凉的委托、前田又左卫门、信长
import { hasMem, quest, R } from '../../engine/core';
import type { SceneDef } from '../../engine/registry';
import type { GameState } from '../../engine/types';
import { NPCS } from '../npcs';

const here = (s: GameState, id: keyof typeof NPCS) => NPCS[id].where(s).loc === s.location;

export const SOCIAL: SceneDef[] = [
  // ───────── 清兵卫 ─────────
  {
    id: 'seibei_trouble',
    title: '座钱',
    art: 'town',
    priority: 50,
    trigger: { loc: ['town'], when: (s) => s.day >= 4 && s.slot < 2 && quest(s, 'seibei') === 0 && R(s, 'seibei').met && here(s, 'seibei') },
    nodes: {
      start: {
        speaker: 'narrator',
        text: '铁匠铺前站着两个穿着体面的男人。“大黑屋老爷说了，十五日之前交齐三百文座钱，否则这铺子就别开了。”\n\n他们走后，清兵卫蹲在炉边，半天没说话。',
        next: 'talk',
      },
      talk: {
        speaker: 'seibei',
        text: '师父在的时候，座钱是他想办法。现在炭价涨了一倍，我连铁都快买不起了……\n\n我想有一天挂上自己的招牌。可现在，连这间铺子都保不住。',
        choices: [
          {
            label: '“我来帮你想办法。先解决炭，再找肯订货的买家。”',
            effects: [
              { t: 'quest', id: 'seibei', stage: 1 },
              { t: 'rel', npc: 'seibei', trust: 5 },
              { t: 'mem', npc: 'seibei', id: 'promise', text: '你答应帮清兵卫保住铺子。' },
            ],
            next: 'plan',
          },
          {
            label: '“殿下讨厌座这种东西。也许不必交座钱——直接把货卖给织田家的军需。”',
            tag: '现代知识',
            effects: [
              { t: 'quest', id: 'seibei', stage: 1 },
              { t: 'flag', key: 'rakuzaIdea', v: true },
              { t: 'rel', npc: 'seibei', trust: 3, respect: 4 },
              { t: 'mem', npc: 'seibei', id: 'promise', text: '你答应帮清兵卫，还说出了“不必依靠座”的想法。' },
            ],
            next: 'rakuza',
          },
          {
            label: '“抱歉，我自身难保。”',
            effects: [{ t: 'quest', id: 'seibei', stage: 1 }, { t: 'rel', npc: 'seibei', trust: -4 }, { t: 'flag', key: 'seibeiRefused', v: true }],
            next: 'refuse',
          },
        ],
      },
      plan: {
        speaker: 'seibei',
        text: '……真的？谢谢。炭的话，城外村子后面有座炭窑。买家……我嘴笨，从来没跟武家打过交道。\n\n（委托：先去五条村炭窑弄到炭，再在城下替他找买家。期限：五月十五。）',
      },
      rakuza: {
        speaker: 'seibei',
        text: '不交座钱？那、那可是要被砸铺子的……\n\n不过，要是真有武家的大订单护着，大黑屋也不敢乱来吧。你这人，想法真奇怪。\n\n（委托：先去五条村炭窑弄到炭，再在城下替他找买家。期限：五月十五。）',
      },
      refuse: {
        speaker: 'seibei',
        text: '……嗯。也是。是我多嘴了。\n\n（你仍可以改变主意：去五条村的炭窑，或在城下找买家。期限：五月十五。）',
      },
    },
  },
  {
    id: 'charcoal',
    title: '炭窑',
    art: 'village',
    repeatable: true,
    nodes: {
      start: {
        speaker: 'narrator',
        text: (s) =>
          s.flags.charcoalContact
            ? '烧炭的汉子满脸黑灰。他一见你就咧嘴笑了：“你就是救了五郎作家孩子的那个人？叔叔都跟我说了！”'
            : '烧炭的汉子满脸黑灰，打量了你一眼：“炭？现在城里的武家都在抢炭，价钱可不便宜。”',
        choices: [
          {
            label: '“能便宜些卖给城下的清兵卫吗？”',
            when: (s) => !!s.flags.charcoalContact,
            effects: [
              { t: 'quest', id: 'seibei', stage: 2 },
              { t: 'rel', npc: 'seibei', favor: 6 },
              { t: 'rel', npc: 'gosaku', trust: 2 },
              { t: 'mem', npc: 'seibei', id: 'charcoal', text: '你通过五条村的人情，替清兵卫弄到了便宜的炭。' },
            ],
            next: 'cheap',
          },
          {
            label: '付 120 文买下十袋炭',
            locked: (s) => (s.player.money < 120 ? '钱不够（需要 120 文）' : null),
            effects: [
              { t: 'money', n: -120 },
              { t: 'quest', id: 'seibei', stage: 2 },
              { t: 'rel', npc: 'seibei', favor: 8 },
              { t: 'mem', npc: 'seibei', id: 'charcoal', text: '你自掏腰包替清兵卫买了炭。' },
            ],
            next: 'bought',
          },
          {
            label: '帮他装窑出炭来抵钱（多花一个时段）',
            effects: [
              { t: 'time', slots: 1 },
              { t: 'quest', id: 'seibei', stage: 2 },
              { t: 'rel', npc: 'seibei', favor: 5 },
              { t: 'mem', npc: 'seibei', id: 'charcoal', text: '你在炭窑干了半天活，换来清兵卫需要的炭。' },
            ],
            next: 'labor',
          },
          { label: '“我再想想。”' },
        ],
      },
      cheap: { speaker: 'narrator', text: '汉子拍着胸脯说：按旧价，明天就用牛车送到城下。\n\n（清兵卫的炭有着落了。接下来要在城下替他找买家。）' },
      bought: { speaker: 'narrator', text: '十袋炭装上了村里的牛车。你的钱袋瘪了下去。\n\n（清兵卫的炭有着落了。接下来要在城下替他找买家。）' },
      labor: { speaker: 'narrator', text: '你被熏得满脸乌黑，咳了一路。但炭有了。\n\n（清兵卫的炭有着落了。接下来要在城下替他找买家。）' },
    },
  },
  {
    id: 'seibei_buyer',
    title: '找买家',
    art: 'town',
    repeatable: true,
    nodes: {
      start: {
        speaker: 'narrator',
        text: '清兵卫有了炭，就能打出像样的东西。问题是，谁会向一个没有招牌的年轻铁匠订货？',
        choices: [
          {
            label: '请阿凉引荐常来茶屋的足轻组头',
            tag: '需要阿凉信任 20',
            locked: (s) => (R(s, 'oryo').trust < 20 ? `阿凉还不够信任你（${R(s, 'oryo').trust}/20）` : null),
            effects: [{ t: 'quest', id: 'seibei', stage: 3 }, { t: 'rel', npc: 'oryo', favor: 3 }, { t: 'flag', key: 'buyerVia', v: 'oryo' }],
            next: 'oryo',
          },
          {
            label: '托前田又左卫门介绍织田家的旧识',
            when: (s) => !!s.flags.toshiieMet,
            locked: (s) => (R(s, 'toshiie').trust < 12 ? `又左卫门还不够信任你（${R(s, 'toshiie').trust}/12）` : null),
            effects: [{ t: 'quest', id: 'seibei', stage: 3 }, { t: 'rel', npc: 'toshiie', favor: 4 }, { t: 'flag', key: 'buyerVia', v: 'toshiie' }],
            next: 'toshiie',
          },
          {
            label: '写一份“统一规格、按件计价”的枪头订货方案，递到城门的军需役所',
            tag: '现代知识',
            when: (s) => !!s.flags.rakuzaIdea || !!s.flags.canWrite,
            locked: (s) => (s.player.fame < 3 ? `你在城下还没有名声，没人会看一个无名浪人的文书（名声 ${s.player.fame}/3）` : null),
            effects: [{ t: 'quest', id: 'seibei', stage: 3 }, { t: 'fame', n: 2 }, { t: 'flag', key: 'buyerVia', v: 'proposal' }],
            next: 'proposal',
          },
          {
            label: '挨家挨户去问',
            next: 'fail',
          },
        ],
      },
      oryo: {
        speaker: 'oryo',
        text: '弥五郎组头？他那队正缺枪头。我替你说一声——不过，人情是要还的哦。',
      },
      toshiie: {
        speaker: 'toshiie',
        text: '清兵卫？那小子的手艺我知道，上次替我修过枪。好，我写封信给以前的同僚，他们没理由不收好东西。',
      },
      proposal: {
        speaker: 'narrator',
        text: '你在纸上画出统一的长度、重量和插口，写明“百件为一批，验后付钱”。\n\n役所的小吏本来不耐烦，听说你就是“救了五条村病童的人”，才把文书收下。三天后，回信来了：先订五十件。\n\n——现代知识有用，但让它被听见的，是你已经积累的名声。',
      },
      fail: {
        speaker: 'narrator',
        text: '你问了一整天，得到的只是白眼和关上的门。没有身份、没有引荐，在这个时代寸步难行。\n\n（也许该先和城下的人建立更多信任，或积累些名声。）',
      },
    },
  },
  {
    id: 'seibei_workshop',
    title: '清兵卫锻冶',
    art: 'town',
    priority: 50,
    trigger: { loc: ['town', 'teahouse'], when: (s) => quest(s, 'seibei') === 3 && here(s, 'seibei') },
    nodes: {
      start: {
        speaker: 'seibei',
        text: (s) =>
          (s.flags.rakuzaIdea
            ? '大黑屋的人又来了，可一看到织田家的订单，屁都没放一个就走了！'
            : '第一批货的钱拿到了！座钱交上了，还剩下不少。') +
          '\n\n{name}，你看——（他从炉边抱出一块新刻的木招牌：“清兵卫锻冶”。）\n\n还有这个，是我用最好的橡木给你削的木刀。重心我调了三次。',
        effects: [
          { t: 'quest', id: 'seibei', stage: 4 },
          { t: 'weapon', n: 1 },
          { t: 'rel', npc: 'seibei', trust: 10, favor: 15 },
          { t: 'stance', npc: 'seibei', stance: 'ally' },
          { t: 'fame', n: 2 },
          { t: 'mem', npc: 'seibei', id: 'helped', text: '你帮清兵卫保住了铺子，“清兵卫锻冶”挂上了招牌。' },
          { t: 'log', text: '获得清兵卫特制的橡木木刀（攻击威力 +1）。', kind: 'growth' },
        ],
        next: 'intro',
      },
      intro: {
        speaker: 'seibei',
        text: (s) =>
          s.flags.toshiieMet
            ? '对了，又左卫门大人前几天来修枪，问起你。他说你是“有意思的家伙”。'
            : '对了，有个高个子浪人常来修枪——前田又左卫门大人。我跟他提起你了，他说想见见“救了五条村的怪人”。他下午常在村外林子里练枪。',
        effects: [{ t: 'rel', npc: 'toshiie', trust: 5 }, { t: 'flag', key: 'toshiieIntro', v: true }],
      },
    },
  },

  // ───────── 阿凉 ─────────
  {
    id: 'oryo_spy',
    title: '可疑的行商',
    art: 'teahouse',
    priority: 45,
    trigger: { loc: ['teahouse'], when: (s) => s.day >= 6 && quest(s, 'spy') === 0 && R(s, 'oryo').trust >= 12 && here(s, 'oryo') },
    nodes: {
      start: {
        speaker: 'oryo',
        text: '{name}，过来一下。（她压低声音）\n\n看到角落那个卖针的行商了吗？叫伝藏。三天来了五次，买的针没几根，问的倒不少——鹫津砦有几口井，丸根砦守兵多少……\n\n我一个女人家不方便跟着。你是生面孔，帮我看看他平时去哪儿？',
        choices: [
          {
            label: '“交给我。”',
            effects: [{ t: 'quest', id: 'spy', stage: 1 }, { t: 'rel', npc: 'oryo', trust: 4 }],
            next: 'yes',
          },
          {
            label: '“阿凉，你为什么关心这些？”',
            effects: [{ t: 'quest', id: 'spy', stage: 1 }, { t: 'rel', npc: 'oryo', respect: 3 }],
            next: 'why',
          },
        ],
      },
      yes: { speaker: 'oryo', text: '就知道你靠得住。他通常在城下转悠——小心别被发现。\n\n（城下新增行动：跟踪卖针的行商）' },
      why: {
        speaker: 'oryo',
        text: '呵……开茶屋的，就靠耳朵吃饭。今川真打过来，这城下烧成一片，我的水月也就没了。\n\n这个理由够不够？\n\n（城下新增行动：跟踪卖针的行商）',
      },
    },
  },
  {
    id: 'spy_confront',
    title: '东门外',
    art: 'town',
    repeatable: true,
    nodes: {
      start: {
        speaker: 'narrator',
        text: '你远远跟着伝藏出了东门。他在一座破旧的小神社后停下，从行李里取出一个竹筒，塞进石灯笼的缝隙。\n\n等他走开，你取出竹筒——里面是一张画得很细的图：鹫津、丸根两砦，旁边写着“井二”“兵约四百”。\n\n“……你都看见了？”伝藏不知何时折了回来，脸色惨白。',
        choices: [
          {
            label: '押着他去见织田家的人',
            effects: [
              { t: 'flag', key: 'spyChoice', v: 'oda' },
              { t: 'flag', key: 'spyResolved', v: true },
              { t: 'quest', id: 'spy', stage: 2 },
              { t: 'world', key: 'odaIntel', n: 20 },
              { t: 'fame', n: 3 },
            ],
            next: 'oda',
          },
          {
            label: '把竹筒和人交给阿凉处理',
            effects: [
              { t: 'flag', key: 'spyChoice', v: 'oryo' },
              { t: 'flag', key: 'spyResolved', v: true },
              { t: 'flag', key: 'oryoNetwork', v: true },
              { t: 'quest', id: 'spy', stage: 2 },
              { t: 'world', key: 'odaIntel', n: 15 },
              { t: 'rel', npc: 'oryo', trust: 12, favor: 8 },
              { t: 'mem', npc: 'oryo', id: 'spy_oryo', text: '你把今川的细作交给了阿凉，并因此得知她在替织田家收集消息。' },
            ],
            next: 'oryo',
          },
          {
            label: '撕掉地图，放他走：“离开尾张，别再回来。”',
            effects: [
              { t: 'flag', key: 'spyChoice', v: 'mercy' },
              { t: 'flag', key: 'spyResolved', v: true },
              { t: 'quest', id: 'spy', stage: 2 },
              { t: 'rel', npc: 'oryo', trust: -3, respect: 3 },
              { t: 'mem', npc: 'oryo', id: 'spy_mercy', text: '你撕掉了细作的地图，放他离开了尾张。阿凉说你“心太软”。' },
            ],
            next: 'mercy',
          },
        ],
      },
      oda: {
        speaker: 'narrator',
        text: (s) =>
          s.flags.toshiieMet
            ? '你找到了前田又左卫门。他看了地图，脸色一沉：“这东西得马上送进城。我虽被逐，城里还有肯听我说话的人。”\n\n当晚，伝藏被织田家的人带走了。又左卫门拍着你的肩膀：“干得好。”'
            : '城门的守卫起初把你当成疯子，直到你说出“五条村”的名字——有人听说过你。伝藏被带走了，图被送进了城。',
        effects: [
          { t: 'run', fn: (s) => { if (s.flags.toshiieMet) { s.npcs.toshiie.rel.trust += 6; s.npcs.toshiie.rel.respect += 8; } } },
          { t: 'mem', npc: 'oryo', id: 'spy_oda', text: '你把今川的细作交给了织田家。阿凉知道后，笑着说“你倒是比我想的更像武士”。' },
          { t: 'rel', npc: 'oryo', trust: 2 },
        ],
      },
      oryo: {
        speaker: 'oryo',
        text: '……你比我想的还要聪明。\n\n好吧，告诉你也无妨。我收集的消息，会送到簗田出羽守大人那里——他是殿下的耳目。这张图，今晚就会到他手上。\n\n伝藏？他会被好好“请”去说话的。\n\n{name}，从今天起，你也是这张网的一部分了。',
      },
      mercy: {
        speaker: 'narrator',
        text: '伝藏跪下磕了三个头，连夜离开了。\n\n你不知道自己做得对不对。也许，他也只是为了养活一家人。\n\n第二天，阿凉听说后叹了口气：“你心太软了……不过，这样的人，我不讨厌。”',
        effects: [{ t: 'run', fn: (s) => void (s.flags.densoOwes = true) }],
      },
    },
  },

  // ───────── 前田又左卫门 ─────────
  {
    id: 'toshiie_meet',
    title: '高个子的浪人',
    art: 'teahouse',
    priority: 48,
    trigger: { loc: ['teahouse'], when: (s) => !s.flags.toshiieMet && s.slot === 2 && here(s, 'toshiie') },
    nodes: {
      start: {
        speaker: 'narrator',
        text: (s) =>
          '茶屋角落坐着一个异常高大的年轻武士，身边靠着一杆长枪。他一个人喝着酒，周围的客人都离他远远的。' +
          (here(s, 'hayato') ? '\n\n隼人喝得满脸通红，忽然站了起来。' : ''),
        effects: [{ t: 'meet', npc: 'toshiie' }, { t: 'flag', key: 'toshiieMet', v: true }],
        choices: [
          { label: '继续', when: (s) => here(s, 'hayato'), next: 'quarrel' },
          { label: '端着茶坐到他对面', when: (s) => !here(s, 'hayato'), effects: [{ t: 'rel', npc: 'toshiie', trust: 3 }], next: 'sit' },
        ],
      },
      quarrel: {
        speaker: 'hayato',
        text: '哟，这不是在殿下面前斩了同朋众、被赶出家门的又左卫门大人吗？还有脸在清洲喝酒？',
        next: 'toshiie_up',
      },
      toshiie_up: {
        speaker: 'toshiie',
        text: '……小鬼，你再说一遍。\n\n（他站起来的时候，头几乎碰到房梁。手已经握住了枪杆。）',
        choices: [
          {
            label: '挡在两人中间：“在这里动手，阿凉的店就毁了。”',
            effects: [
              { t: 'rel', npc: 'oryo', trust: 5 },
              { t: 'rel', npc: 'toshiie', respect: 4 },
              { t: 'rel', npc: 'hayato', trust: -2 },
              { t: 'mem', npc: 'toshiie', id: 'stopped', text: '茶屋里你挡在他和隼人之间，阻止了一场斗殴。' },
            ],
            next: 'calm',
          },
          {
            label: '站到隼人身边：“被逐出的人，就别在这里耍威风。”',
            effects: [
              { t: 'rel', npc: 'hayato', trust: 5 },
              { t: 'rel', npc: 'toshiie', trust: -6 },
              { t: 'mem', npc: 'toshiie', id: 'sided_hayato', text: '初见时，你站在隼人一边嘲讽他。' },
              { t: 'mem', npc: 'hayato', id: 'sided', text: '在茶屋和前田又左卫门起冲突时，你站在了隼人这边。' },
            ],
            next: 'side',
          },
          {
            label: '“要比就用木刀。明天村外林子里，堂堂正正比一场。”',
            effects: [
              { t: 'flag', key: 'hayatoFired', v: true },
              { t: 'rel', npc: 'toshiie', respect: 6, trust: 2 },
              { t: 'rel', npc: 'hayato', respect: 2 },
              { t: 'mem', npc: 'toshiie', id: 'duel_idea', text: '你提议他和隼人用木刀决斗，而不是在茶屋拔刀。' },
              { t: 'mem', npc: 'hayato', id: 'lost_toshiie', text: '隼人在林中木刀决斗中输给了又左卫门，从此加倍苦练。' },
            ],
            next: 'duel',
          },
        ],
      },
      calm: {
        speaker: 'toshiie',
        text: '……哼。看在老板娘的面子上。\n\n（隼人被权六拖走了。高个子重新坐下，看了你一眼。）你胆子不小。坐吧。',
        next: 'sit',
      },
      side: {
        speaker: 'toshiie',
        text: '（他盯着你看了很久，最后把酒钱拍在桌上，扛起枪走了。）\n\n……我记住你了。',
      },
      duel: {
        speaker: 'narrator',
        text: '第二天，你听说了结果：隼人三招之内就被打掉了木刀。\n\n他没有哭，也没有骂，只是从那天起每天天不亮就去道场。\n\n又左卫门后来在茶屋见到你，主动给你倒了一杯酒。',
        next: 'sit',
      },
      sit: {
        speaker: 'toshiie',
        text: '我叫前田又左卫门。以前是殿下的近侍……去年在殿下面前斩了拾阿弥那个混账，被赶了出来。\n\n我不后悔斩他。我只后悔……让殿下难做。\n\n今川要来了。只要能在殿下面前立功，我就能回去。我一定会回去。',
        effects: [{ t: 'mem', npc: 'toshiie', id: 'story', text: '又左卫门对你说了被逐的缘由，和他想重回主公身边的心愿。' }],
      },
    },
  },
  {
    id: 'toshiie_meet_village',
    title: '林中的枪声',
    art: 'village',
    priority: 48,
    trigger: { loc: ['village'], when: (s) => !s.flags.toshiieMet && s.slot === 1 && here(s, 'toshiie') && (s.day >= 6 || !!s.flags.toshiieIntro) },
    nodes: {
      start: {
        speaker: 'narrator',
        text: '杂木林深处传来破风声。一个高得惊人的年轻武士正对着一棵树练枪，一枪一枪刺在同一个位置，树皮已经被刺穿了。',
        effects: [{ t: 'meet', npc: 'toshiie' }, { t: 'flag', key: 'toshiieMet', v: true }],
        next: 'talk',
      },
      talk: {
        speaker: 'toshiie',
        text: (s) =>
          s.flags.toshiieIntro
            ? '你就是清兵卫说的那个怪人？救了村子的孩子，还帮他保住了铺子。……有意思。'
            : '看什么？没见过人练枪？',
        choices: [
          {
            label: '“好枪法。能指点我一二吗？”',
            effects: [{ t: 'rel', npc: 'toshiie', trust: 3, respect: 2 }],
            next: 'teach',
          },
          {
            label: '“为什么一个人在这种地方练？”',
            effects: [{ t: 'rel', npc: 'toshiie', trust: 2 }],
            next: 'story',
          },
        ],
      },
      teach: {
        speaker: 'toshiie',
        text: '哈！我是用枪的，你是用刀的。不过——想打的话，随时来。我下午都在这里。\n\n（村庄新增行动：向又左卫门讨教）',
        next: 'story',
      },
      story: {
        speaker: 'toshiie',
        text: '我叫前田又左卫门。以前是殿下的近侍，去年在殿下面前斩了同朋众拾阿弥，被逐出来了。\n\n不后悔。只是……我想回去。今川来的时候，就是我的机会。',
        effects: [{ t: 'mem', npc: 'toshiie', id: 'story', text: '又左卫门对你说了被逐的缘由，和他想重回主公身边的心愿。' }],
      },
    },
  },
  {
    id: 'toshiie_oath',
    title: '不请自来',
    art: 'village',
    priority: 52,
    trigger: {
      loc: ['village', 'teahouse'],
      when: (s) => !!s.flags.toshiieMet && !s.flags.toshiieOathAsked && s.day >= 11 && here(s, 'toshiie') && R(s, 'toshiie').trust >= 20 && R(s, 'toshiie').respect >= 12,
    },
    nodes: {
      start: {
        speaker: 'toshiie',
        text: '{name}，跟你说件事。\n\n今川一到，殿下一定会出阵——他那个人，不会躲在城里等死。到时候我不请自来，冲进敌阵砍几个像样的首级。\n\n你的剑，我看过了。要不要跟我一起去？',
        effects: [{ t: 'flag', key: 'toshiieOathAsked', v: true }],
        choices: [
          {
            label: '“我跟你去。”',
            effects: [
              { t: 'flag', key: 'toshiieOath', v: true },
              { t: 'rel', npc: 'toshiie', trust: 10 },
              { t: 'stance', npc: 'toshiie', stance: 'ally' },
              { t: 'mem', npc: 'toshiie', id: 'oath', text: '你答应和又左卫门一起，不请自来地奔赴战场。' },
            ],
            next: 'yes',
          },
          {
            label: '“殿下会在十九日拂晓出城，先去热田神宫。”',
            tag: '现代知识',
            effects: [
              { t: 'flag', key: 'toshiieOath', v: true },
              { t: 'flag', key: 'toldToshiie', v: true },
              { t: 'rel', npc: 'toshiie', trust: 6, respect: 6 },
              { t: 'stance', npc: 'toshiie', stance: 'ally' },
              { t: 'mem', npc: 'toshiie', id: 'oath', text: '你答应与又左卫门同去，还说出了信长出阵的日子。他看你的眼神变了。' },
            ],
            next: 'know',
          },
          {
            label: '“我还没想好。”',
            effects: [{ t: 'mem', npc: 'toshiie', id: 'hesitate', text: '又左卫门邀你同赴战场，你没有立刻答应。' }],
            next: 'maybe',
          },
        ],
      },
      yes: { speaker: 'toshiie', text: '好！就这么说定了。到时候，你替我看住背后。' },
      know: {
        speaker: 'toshiie',
        text: '……你怎么知道？\n\n（他眯起眼睛，久久地看着你。）算了。你这人身上，怪事本来就多。要是真被你说中了，我就信你一辈子。',
      },
      maybe: { speaker: 'toshiie', text: '……也是。这不是小事。到那天之前想好吧。' },
    },
  },

  // ───────── 信长 ─────────
  {
    id: 'nobunaga_pass',
    title: '马上的人',
    art: 'town',
    priority: 58,
    trigger: { loc: ['town'], when: (s) => s.day >= 5 && s.slot === 1 },
    nodes: {
      start: {
        speaker: 'narrator',
        text: '“让开！让开！”街上的人纷纷跪倒在路边。\n\n一队骑马的人从城门方向疾驰而来。为首的年轻人穿着随意的浴衣，腰上挂着火打袋和葫芦，头发随便扎成一束——可跪在你旁边的老人在发抖：“是殿下……”\n\n织田上总介信长。',
        effects: [{ t: 'meet', npc: 'nobunaga' }],
        choices: [
          {
            label: '和众人一起跪伏',
            effects: [{ t: 'mem', npc: 'nobunaga', id: 'knelt', text: '你在城下第一次见到信长，和众人一起跪在路边。' }],
            next: 'knelt',
          },
          {
            label: '跪下，但抬头看着他',
            effects: [{ t: 'mem', npc: 'nobunaga', id: 'looked', text: '你在路边抬头直视了信长。他勒住马，问你是什么人。' }],
            next: 'look',
          },
        ],
      },
      knelt: {
        speaker: 'narrator',
        text: '马蹄声从你头顶掠过，扬起一片尘土。等你抬起头，那队人已经消失在街角。\n\n二十六岁。你想。他现在只有二十六岁。',
      },
      look: {
        speaker: 'nobunaga',
        text: '……汝，何者？\n\n（他勒住马。那双眼睛落在你身上的时候，你觉得自己像被看穿了。）',
        choices: [
          {
            label: '“在下{name}，一介浪人，在柳心馆学剑。”',
            effects: [{ t: 'mem', npc: 'nobunaga', id: 'plain', text: '你对信长报上了自己的名字。' }],
            next: 'plain',
          },
          {
            label: '“殿下，今川不足为惧。”',
            tag: '现代知识',
            effects: [
              { t: 'mem', npc: 'nobunaga', id: 'bold', text: '你当街对信长说“今川不足为惧”。他笑了。' },
              { t: 'fame', n: 2 },
              { t: 'flag', key: 'suspected', v: true },
            ],
            next: 'bold',
          },
        ],
      },
      plain: {
        speaker: 'nobunaga',
        text: '柳心馆……源斋那个老头子还活着啊。\n\n（他没等你回答，一甩马鞭走了。）',
      },
      bold: {
        speaker: 'nobunaga',
        text: '哈。\n\n（他笑了，笑得一点也不像在开心。）来路不明的人说吉言，要么是傻子，要么是今川的细作。\n\n——你若说错了，就拿头来赔。\n\n（马队远去。身边的人都用看死人的眼神看着你。）',
      },
    },
  },
  {
    id: 'oryo_warn',
    title: '阿凉的提醒',
    art: 'teahouse',
    priority: 40,
    trigger: { loc: ['teahouse'], when: (s) => !!s.flags.suspected && here(s, 'oryo') },
    nodes: {
      start: {
        speaker: 'oryo',
        text: '你是傻子吗？当街跟殿下说那种话！\n\n城里已经有人在打听你是谁了。这几天老实点——要是有人问，就说你是我茶屋的人。',
        effects: [
          { t: 'rel', npc: 'oryo', trust: 3 },
          { t: 'mem', npc: 'oryo', id: 'covered', text: '你当街对信长口出狂言后，阿凉替你遮掩了身份。' },
        ],
      },
    },
  },
  {
    id: 'village_thanks',
    title: '村里的谢礼',
    art: 'village',
    priority: 20,
    trigger: { loc: ['village'], when: (s) => !!s.flags.villageSaved && hasMem(s, 'gosaku', 'recovered') },
    nodes: {
      start: {
        speaker: 'gosaku',
        text: '孙子能跑能跳了！村里人都说要谢你。这是大家凑的一点心意，还有——你要练身体的话，后山那条路最好跑，我年轻时也天天跑。',
        effects: [{ t: 'money', n: 40 }, { t: 'rel', npc: 'gosaku', trust: 5 }],
      },
    },
  },
];
