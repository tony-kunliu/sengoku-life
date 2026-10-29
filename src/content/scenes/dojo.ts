// 道场线：入门 → 初次失败 → 修行 → 再次挑战 → 师父认可
import { hasMem, R, remember } from '../../engine/core';
import type { Choice, SceneDef, SceneNode } from '../../engine/registry';
import { raiseCap } from '../../engine/training';
import type { GameState } from '../../engine/types';

const firstBoutChoice: Choice = {
  label: '接受挑战',
  effects: [
    { t: 'flag', key: 'hayatoFirstBout', v: true },
    { t: 'run', fn: (s) => (s.flags.firstBoutDay = s.day) },
    { t: 'meet', npc: 'hayato' },
    { t: 'bout', opp: 'hayato', kind: 'story', label: '初次比试', win: 'beat', lose: 'lost', draw: 'lost' },
  ],
};

const firstBoutNodes: Record<string, SceneNode> = {
  lost: {
    speaker: 'hayato',
    text: '哼，就这点本事？连木刀都握不稳，还想拜师？',
    effects: [
      { t: 'mem', npc: 'hayato', id: 'first_loss', text: '你第一次和隼人比试，输了。' },
      { t: 'flag', key: 'firstLossHayato', v: true },
    ],
    choices: [
      {
        label: '“再来一次！”',
        effects: [{ t: 'rel', npc: 'hayato', respect: 3 }, { t: 'rel', npc: 'gensai', respect: -2 }],
        next: 'again',
      },
      {
        label: '向隼人行礼：“请指教，我输在哪里？”',
        effects: [
          { t: 'rel', npc: 'hayato', trust: 4, respect: 2 },
          { t: 'rel', npc: 'gensai', trust: 3 },
          { t: 'know', opp: 'hayato', n: 1 },
          { t: 'mem', npc: 'hayato', id: 'asked', text: '输给隼人后，你低头向他请教。他嘴上嫌弃，却还是说了。' },
        ],
        next: 'asked',
      },
      {
        label: '默默行礼，退到场边',
        effects: [
          { t: 'rel', npc: 'gensai', respect: 5 },
          { t: 'mem', npc: 'gensai', id: 'composed', text: '你输了却没有失态。师父多看了你一眼。' },
        ],
        next: 'composed',
      },
    ],
  },
  again: {
    speaker: 'gensai',
    text: '够了。输了就急着再来的人，第二次只会输得更快。\n\n先看清自己为什么输。',
  },
  asked: {
    speaker: 'hayato',
    text: '……你啊，一直往后缩，又什么都不看。我出刀前脚会先动，这都看不出来？\n\n——喂，我可没教你！是你自己笨得看不下去！',
  },
  composed: {
    speaker: 'gensai',
    text: '（师父什么也没说，只是把一把旧扫帚递到你手里。）',
  },
  beat: {
    speaker: 'narrator',
    text: '木刀轻轻点在隼人的肩上。道场一下子静了。\n\n隼人的脸涨得通红。',
    effects: [
      { t: 'mem', npc: 'hayato', id: 'beaten_first', text: '你第一次和隼人比试就赢了他，他至今不服。' },
      { t: 'flag', key: 'rematchDone', v: true },
    ],
    choices: [
      {
        label: '“侥幸而已。”',
        effects: [{ t: 'rel', npc: 'hayato', respect: 5, trust: 2 }, { t: 'rel', npc: 'gensai', respect: 3 }],
        next: 'humble',
      },
      {
        label: '“道场的师兄，也不过如此。”',
        effects: [
          { t: 'stance', npc: 'hayato', stance: 'rival' },
          { t: 'rel', npc: 'hayato', trust: -8, respect: -2 },
          { t: 'rel', npc: 'gensai', respect: -6 },
          { t: 'mem', npc: 'gensai', id: 'arrogant', text: '你赢了隼人后出言轻慢，师父皱起了眉。' },
        ],
        next: 'arrogant',
      },
    ],
  },
  humble: { speaker: 'hayato', text: '……下次绝不会输给你。记住了！' },
  arrogant: { speaker: 'gensai', text: '剑赢了，心却输了。（隼人狠狠瞪着你，一句话也没说。）' },
};

const testBout: Choice = {
  label: '拿起木刀',
  effects: [{ t: 'bout', opp: 'gensai', kind: 'test', label: '师父的考验', win: 'judge', lose: 'judge', draw: 'judge', rounds: 6 }],
};

const passed = (s: GameState) => (s.flags.lastBoutResult === 'win' || ((s.flags.testScore as number) ?? 0) >= 3);

const testNodes: Record<string, SceneNode> = {
  judge: {
    speaker: 'gensai',
    text: (s) => {
      const notes = (s.flags.testNotes as string) ?? '';
      return passed(s)
        ? `（师父收起木刀，沉默了很久。）\n\n${notes}。\n\n胜负不重要。重要的是你看着对手，而不是看着自己的恐惧。`
        : `（师父收起木刀。）\n\n${notes}。\n\n你急着证明自己，却忘了看对手。回去吧，想清楚了再来。`;
    },
    choices: [
      { label: '跪坐，静听', when: passed, next: 'pass' },
      { label: '行礼退下', when: (s) => !passed(s), next: 'fail' },
    ],
  },
  pass: {
    speaker: 'gensai',
    text: '柳心流不教人怎么砍倒别人，而是教人怎样不被乱世砍倒——风来时像柳枝一样弯下去，再弹回来。\n\n这是“柳返”。还有这张初目录，上面写着你的名字。\n\n{name}，从今天起，你是柳心馆的门人了。',
    effects: [
      { t: 'flag', key: 'masterRecognized', v: true },
      { t: 'tech', id: 'yanagi' },
      { t: 'run', fn: (s) => (['atk', 'def', 'eye'] as const).forEach((k) => raiseCap(s, k, 1)) },
      { t: 'rel', npc: 'gensai', trust: 10, respect: 10 },
      { t: 'fame', n: 4 },
      { t: 'mem', npc: 'gensai', id: 'recognized', text: '师父认可了你，授予你柳心流初目录与“柳返”。' },
      { t: 'stance', npc: 'gensai', stance: 'ally' },
    ],
  },
  fail: {
    speaker: 'narrator',
    text: '你没能让师父满意。\n\n（提示：考验看重的是读局——先试探、看破后正确应对、不在气力耗尽时乱攻、攻守有变化。隔日可在道场请求再次考验。）',
    effects: [
      { t: 'flag', key: 'testFailed', v: true },
      { t: 'run', fn: (s) => (s.flags.testRetryDay = s.day + 1) },
      { t: 'mem', npc: 'gensai', id: 'test_fail', text: '第一次接受师父考验，你没能让他满意。' },
    ],
  },
};

export const DOJO: SceneDef[] = [
  {
    id: 'dojo_enter',
    title: '柳心馆',
    art: 'dojo',
    priority: 80,
    trigger: { loc: ['dojo'], when: () => true },
    nodes: {
      start: {
        speaker: 'narrator',
        text: '“喝！”——推开道场的门，几个年轻人正在挥木刀。最前面的一个回过头，眉毛一挑。',
        effects: [{ t: 'run', fn: (s) => (s.flags.dojoEnterDay = s.day) }],
        next: 'hayato',
      },
      hayato: {
        speaker: 'hayato',
        text: '喂，哪来的乞丐？这里是柳心馆，不施舍饭团。',
        effects: [{ t: 'meet', npc: 'hayato' }, { t: 'meet', npc: 'gonroku' }],
        next: 'master',
      },
      master: {
        speaker: 'gensai',
        text: '隼人。\n\n（一位白发老人从里屋走出来。不高，背却挺得笔直。）\n\n你是来做什么的？',
        effects: [{ t: 'meet', npc: 'gensai' }],
        choices: [
          {
            label: '“我想在这里学剑——为了在这个乱世活下去。”',
            effects: [{ t: 'rel', npc: 'gensai', trust: 3, respect: 3 }, { t: 'flag', key: 'reason', v: 'survive' }],
            next: 'why',
          },
          {
            label: '“我想变强，不再被人看不起。”',
            effects: [{ t: 'rel', npc: 'hayato', respect: 3 }, { t: 'rel', npc: 'gensai', trust: 1 }, { t: 'flag', key: 'reason', v: 'strong' }],
            next: 'why',
          },
          {
            label: '“我想保护身边的人。”',
            effects: [{ t: 'rel', npc: 'gensai', trust: 4 }, { t: 'rel', npc: 'hayato', respect: -1 }, { t: 'flag', key: 'reason', v: 'protect' }],
            next: 'why',
          },
        ],
      },
      why: {
        speaker: 'gensai',
        text: (s) =>
          ({
            survive: '活下去……说实话的人不多。',
            strong: '好胜之心，也是一种心。只是它会骗你。',
            protect: '这句话人人都会说。且看你做不做得到。',
          })[(s.flags.reason as string) ?? 'survive'] + '\n\n柳心馆先修心，后修剑。想入门，先把道场的地扫干净。',
        next: 'challenge',
      },
      challenge: {
        speaker: 'hayato',
        text: '师父！这种来历不明的家伙，让我先试试他的斤两！',
        choices: [
          firstBoutChoice,
          {
            label: '“我听师父的，先扫地。”',
            effects: [
              { t: 'rel', npc: 'gensai', respect: 5 },
              { t: 'rel', npc: 'hayato', respect: -3 },
              { t: 'mem', npc: 'hayato', id: 'refused', text: '你拒绝了隼人的挑战，他说你是胆小鬼。' },
            ],
            next: 'refuse',
          },
        ],
      },
      refuse: { speaker: 'hayato', text: '哈！胆小鬼。你躲得了今天，躲不了明天。' },
      ...firstBoutNodes,
    },
  },
  {
    id: 'hayato_challenge',
    title: '隼人的挑战',
    art: 'dojo',
    priority: 60,
    trigger: {
      loc: ['dojo'],
      when: (s) =>
        !s.flags.hayatoFirstBout && s.day > ((s.flags.dojoEnterDay as number) ?? 99) && R(s, 'hayato').met && s.slot < 2 && !s.flags.hayatoSummoned,
    },
    nodes: {
      start: {
        speaker: 'hayato',
        text: '又来扫地了？今天可别想再躲。拿起木刀！',
        choices: [
          firstBoutChoice,
          {
            label: '“好，但输了你要教我。”',
            effects: [{ t: 'rel', npc: 'hayato', trust: 2 }, ...(firstBoutChoice.effects ?? [])],
          },
        ],
      },
      ...firstBoutNodes,
    },
  },
  {
    id: 'admission',
    title: '入门',
    art: 'dojo',
    priority: 70,
    trigger: {
      loc: ['dojo'],
      when: (s) => {
        if (s.flags.admitted || !s.seenScenes.includes('dojo_enter')) return false;
        const chores = s.quests.chores ?? 0;
        return chores >= 2 || (chores >= 1 && !!s.flags.hayatoFirstBout) || (!!s.flags.hayatoFirstBout && R(s, 'gensai').respect >= 8);
      },
    },
    nodes: {
      start: {
        speaker: 'gensai',
        text: (s) =>
          (hasMem(s, 'gensai', 'composed') ? '输了不乱，' : '') +
          ((s.quests.chores ?? 0) >= 2 ? '地扫得很干净。' : '也算有点样子。') +
          '\n\n（师父递给你一把磨得发亮的旧木刀。）\n\n明天起，跟权六一起练基本功。挥刀、练型、看别人怎么打——光挥刀是变不强的。',
        effects: [
          { t: 'flag', key: 'admitted', v: true },
          { t: 'rel', npc: 'gensai', trust: 5 },
          { t: 'mem', npc: 'gensai', id: 'admitted', text: '师父允许你入门柳心馆。' },
          { t: 'log', text: '道场新增行动：素振、型稽古、切磋、向师父请教。', kind: 'event' },
        ],
        next: 'tip',
      },
      tip: {
        speaker: 'narrator',
        text: '【修行提示】\n· 素振、型稽古：稳定成长，但同一种训练重复越多，收益越低。\n· 实战与观摩：会重置递减，并带来眼力与对手情报。\n· 能力有上限（瓶颈），需要师父指导才能突破。师父越信任你，愿意指导的次数越多。',
      },
    },
  },
  {
    id: 'hayato_rematch',
    title: '再战',
    art: 'dojo',
    priority: 55,
    trigger: {
      loc: ['dojo'],
      when: (s) =>
        !!s.flags.admitted &&
        !!s.flags.hayatoFirstBout &&
        !s.flags.rematchDone &&
        !s.flags.hayatoSummoned &&
        s.slot < 2 &&
        s.day >= ((s.flags.firstBoutDay as number) ?? 0) + 2 &&
        (s.player.stats.atk.lv + s.player.stats.def.lv >= 5 || (s.oppKnowledge.hayato ?? 0) >= 2),
    },
    nodes: {
      start: {
        speaker: 'hayato',
        text: (s) =>
          hasMem(s, 'hayato', 'first_loss')
            ? '听说你天天在这里挥刀到天黑？好啊。师父，请做见证——今天我要让他彻底死心。'
            : '上次是我大意。师父，请做见证，我要堂堂正正再比一次！',
        next: 'master',
      },
      master: {
        speaker: 'gensai',
        text: '……好。二本先取。\n\n{name}，记住你上次是怎么输——或者怎么赢的。',
        choices: [
          {
            label: '行礼，摆出中段',
            effects: [
              { t: 'flag', key: 'rematchDone', v: true },
              { t: 'bout', opp: 'hayato', kind: 'story', label: '道场再战', win: 'win', lose: 'lose', draw: 'lose' },
            ],
          },
        ],
      },
      win: {
        speaker: 'hayato',
        text: (s) =>
          hasMem(s, 'hayato', 'first_loss')
            ? '……你，什么时候看穿我的出手的？\n\n（隼人盯着你看了很久，忽然笑了。）可恶，这下我也得去观摩别人了。'
            : '……又输了。两次。\n\n（隼人把木刀摔在地上，又捡起来。）我会变强的。比你更强。',
        effects: [
          { t: 'rel', npc: 'hayato', respect: 8, trust: 4 },
          { t: 'rel', npc: 'gensai', respect: 6, trust: 3 },
          { t: 'fame', n: 2 },
          { t: 'mem', npc: 'hayato', id: 'rematch_win', text: '道场再战，你赢了隼人。' },
          { t: 'mem', npc: 'gensai', id: 'rematch_win', text: '师父见证了你在再战中击败隼人。' },
        ],
      },
      lose: {
        speaker: 'hayato',
        text: '哈！还差得远呢。\n\n……不过，比上次像样多了。',
        effects: [
          { t: 'rel', npc: 'hayato', respect: 3 },
          { t: 'rel', npc: 'gensai', trust: 2 },
          { t: 'mem', npc: 'hayato', id: 'rematch_lose', text: '再战时你又输给了隼人，但他承认你有进步。' },
          { t: 'log', text: '可以继续在道场与隼人切磋。赢他一次，是师父考验的条件之一。', kind: 'event' },
        ],
      },
    },
  },
  {
    id: 'hayato_friend',
    title: '隼人的心事',
    art: 'teahouse',
    priority: 45,
    trigger: {
      loc: ['teahouse', 'dojo'],
      when: (s) => {
        const r = R(s, 'hayato');
        const here = !s.flags.hayatoSummoned && ((s.location === 'teahouse' && s.slot === 2 && s.day >= 4) || (s.location === 'dojo' && s.slot === 2));
        return here && ((s.flags.wins_hayato as number) ?? 0) >= 1 && r.trust >= 14 && r.respect >= 10 && (r.stance !== 'rival' || r.respect >= 18);
      },
    },
    nodes: {
      start: {
        speaker: 'hayato',
        text: '……坐吧。今天我请。\n\n我是早瀬家的次男。家里的东西、名字、主家的赏识，全都是大哥的。我要是不在战场上立功，这辈子就只是个“早瀬家的老二”。\n\n今川要来了。这是我的机会。',
        choices: [
          {
            label: '“立功不急在一时。活下来，才有下一次。”',
            effects: [
              { t: 'flag', key: 'hayatoPatience', v: true },
              { t: 'rel', npc: 'hayato', trust: 6 },
              { t: 'mem', npc: 'hayato', id: 'patience', text: '你劝隼人：战场上活下来比抢功更重要。他沉默着记下了。' },
            ],
            next: 'patience',
          },
          {
            label: '“那就抢在所有人前面，让他们看看！”',
            effects: [
              { t: 'flag', key: 'hayatoReckless', v: true },
              { t: 'rel', npc: 'hayato', trust: 9 },
              { t: 'mem', npc: 'hayato', id: 'reckless', text: '你鼓励隼人在战场上抢在所有人前面。' },
            ],
            next: 'reckless',
          },
        ],
      },
      patience: {
        speaker: 'hayato',
        text: '……你说话跟师父一样。烦死了。\n\n（他把酒一口喝干。）不过，我会记着的。\n\n作为回礼——你远间出手太犹豫了。看好，踏进去的时候，要用后脚推。',
        next: 'teach',
      },
      reckless: {
        speaker: 'hayato',
        text: '哈哈！就是这样！你果然懂我！\n\n作为回礼——你远间出手太犹豫了。看好，踏进去的时候，要用后脚推。',
        next: 'teach',
      },
      teach: {
        speaker: 'narrator',
        text: '隼人在茶屋外的空地上比划了好几遍。你终于明白了“踏入”的诀窍。',
        effects: [
          { t: 'tech', id: 'fumikomi' },
          { t: 'stance', npc: 'hayato', stance: 'ally' },
          { t: 'know', opp: 'hayato', n: 3 },
          { t: 'mem', npc: 'hayato', id: 'friend', text: '隼人把你当成了朋友，教你“踏入”。' },
        ],
      },
    },
  },
  {
    id: 'guidance',
    title: '师父的指导',
    art: 'dojo',
    repeatable: true,
    nodes: {
      start: {
        speaker: 'gensai',
        text: (s) =>
          (s.quests.guidance ?? 0) === 0 ? '想问什么，就问吧。我只说一遍。' : '……又来了？好。今天想问什么？',
        choices: [
          {
            label: '“如何出刀才更快？”（攻势上限 +1）',
            locked: (s) => (s.player.stats.atk.cap >= 6 ? '已到极限' : null),
            effects: [
              { t: 'cap', stat: 'atk', n: 1 },
              { t: 'xp', stat: 'atk', n: 25 },
              { t: 'run', fn: (s) => (s.quests.guidance = (s.quests.guidance ?? 0) + 1) },
            ],
            next: 'atk',
          },
          {
            label: '“如何守得更稳？”（守备上限 +1）',
            locked: (s) => (s.player.stats.def.cap >= 6 ? '已到极限' : null),
            effects: [
              { t: 'cap', stat: 'def', n: 1 },
              { t: 'xp', stat: 'def', n: 25 },
              { t: 'run', fn: (s) => (s.quests.guidance = (s.quests.guidance ?? 0) + 1) },
            ],
            next: 'def',
          },
          {
            label: '“如何看穿对手？”（眼力上限 +1）',
            locked: (s) => (s.player.stats.eye.cap >= 6 ? '已到极限' : null),
            effects: [
              { t: 'cap', stat: 'eye', n: 1 },
              { t: 'xp', stat: 'eye', n: 25 },
              { t: 'run', fn: (s) => (s.quests.guidance = (s.quests.guidance ?? 0) + 1) },
            ],
            next: 'eye',
          },
        ],
      },
      atk: { speaker: 'gensai', text: '快，不在手，在腰。你砍的时候，人还留在原地。让身体先到，刀自然就到了。' },
      def: { speaker: 'gensai', text: '守，不是挡。挡是硬碰硬，总有挡不住的时候。要“流”——让对方的力从你身边过去。' },
      eye: { speaker: 'gensai', text: '不要看刀。看肩，看脚，看他的呼吸。人在出手之前，身体早就说出来了。' },
    },
  },
  {
    id: 'master_test',
    title: '师父的考验',
    art: 'dojo',
    priority: 65,
    trigger: {
      loc: ['dojo'],
      when: (s) =>
        !!s.flags.admitted &&
        !s.flags.masterRecognized &&
        !s.flags.testFailed &&
        s.slot < 2 &&
        R(s, 'gensai').trust >= 30 &&
        R(s, 'gensai').respect >= 22 &&
        ((s.flags.wins_hayato as number) ?? 0) >= 1,
    },
    nodes: {
      start: {
        speaker: 'gensai',
        text: '{name}，拿起木刀，到场中来。\n\n一本胜负。我不看你赢不赢，我看你怎么打。',
        choices: [testBout],
      },
      ...testNodes,
    },
  },
  {
    id: 'master_test_again',
    title: '再次考验',
    art: 'dojo',
    repeatable: true,
    nodes: {
      start: {
        speaker: 'gensai',
        text: '想清楚了？那就来吧。',
        effects: [{ t: 'flag', key: 'testFailed', v: false }],
        choices: [testBout],
      },
      ...testNodes,
    },
  },
  {
    id: 'gensai_night',
    title: '灯下',
    art: 'dojo',
    priority: 30,
    trigger: { loc: ['dojo'], when: (s) => s.slot === 2 && !!s.flags.admitted && R(s, 'gensai').trust >= 20 },
    nodes: {
      start: {
        speaker: 'gensai',
        text: '这么晚了还来？……坐吧。\n\n我以前有个儿子。四年前，殿下和弟弟勘十郎大人在稻生打起来的时候，他跟着去了，再也没回来。\n\n那之后我想过关掉道场。教人用剑，就是教人去死。',
        choices: [
          {
            label: '“那您为什么还在教剑？”',
            effects: [{ t: 'rel', npc: 'gensai', trust: 6 }],
            next: 'why',
          },
          {
            label: '（什么也不说，陪他坐着）',
            effects: [{ t: 'rel', npc: 'gensai', trust: 5, respect: 2 }],
            next: 'silent',
          },
        ],
      },
      why: {
        speaker: 'gensai',
        text: '因为不教，他们照样会去。照样会死。\n\n至少……学过剑的人，在该退的时候知道怎么退。',
        effects: [{ t: 'mem', npc: 'gensai', id: 'son', text: '师父告诉你，他的儿子死于稻生之战。他教剑，是为了让弟子知道何时该退。' }],
      },
      silent: {
        speaker: 'narrator',
        text: '灯芯噼啪作响。过了很久，师父说：“你是个奇怪的人。像是见过很多……还没发生的事。”',
        effects: [
          { t: 'mem', npc: 'gensai', id: 'son', text: '师父告诉你，他的儿子死于稻生之战。那一晚你陪他坐了很久。' },
          { t: 'run', fn: (s) => remember(s, 'gensai', 'strange', '师父说你“像是见过很多还没发生的事”。') },
        ],
      },
    },
  },
  {
    id: 'learn_nidan',
    title: '隼人的绝招',
    art: 'dojo',
    priority: 44,
    trigger: {
      loc: ['dojo'],
      when: (s) =>
        s.player.techniques.includes('fumikomi') && !s.player.techniques.includes('nidan') && R(s, 'hayato').trust >= 30 && !s.flags.hayatoSummoned && s.slot < 2,
    },
    nodes: {
      start: {
        speaker: 'hayato',
        text: '喂，{name}，过来。\n\n这招我练了三年，连权六都没见过——第一刀是假的，被挡住的瞬间，第二刀才是真的。我叫它“二段”。\n\n……别误会！我只是想找个像样的对手，看看它到底管不管用。',
        choices: [
          {
            label: '拿起木刀，请他示范',
            effects: [
              { t: 'tech', id: 'nidan' },
              { t: 'rel', npc: 'hayato', trust: 5, respect: 3 },
              { t: 'time', slots: 1 },
              { t: 'mem', npc: 'hayato', id: 'nidan', text: '隼人把自己练了三年的绝招“二段”教给了你。' },
            ],
            next: 'done',
          },
        ],
      },
      done: {
        speaker: 'narrator',
        text: '你挨了不知多少下第二刀，终于学会在被挡的瞬间顺势再斩。\n\n【秘传】二段：比试中积攒 3 点“势”即可发动。势来自防守、看破对手和被对手击中。',
      },
    },
  },
  {
    id: 'learn_sasoi',
    title: '权六的诱',
    art: 'dojo',
    priority: 43,
    trigger: {
      loc: ['dojo'],
      when: (s) => ((s.flags.wins_gonroku as number) ?? 0) >= 2 && !s.player.techniques.includes('sasoi') && s.slot < 2 && !!s.flags.admitted,
    },
    nodes: {
      start: {
        speaker: 'gonroku',
        text: '……你破了我的守两次。\n\n守，就是等对手犯错。但有的人不犯错——那就让他犯。（权六的刀尖向下一沉，露出胸前的空当。）\n\n看见了？那是假的。来砍的人，都会砍空。',
        choices: [
          {
            label: '试着砍向那个空当',
            effects: [
              { t: 'tech', id: 'sasoi' },
              { t: 'rel', npc: 'gonroku', trust: 6, respect: 6 },
              { t: 'time', slots: 1 },
              { t: 'mem', npc: 'gonroku', id: 'sasoi', text: '权六教会了你“诱”——故意露出破绽，让对手砍空。' },
            ],
            next: 'done',
          },
        ],
      },
      done: {
        speaker: 'narrator',
        text: '你砍空了，木刀轻轻落在你的肩上。权六难得地笑了一下。\n\n【秘传】诱：消耗 2 点“势”。专克进攻型的对手。',
      },
    },
  },
  {
    id: 'learn_zanshin',
    title: '残心',
    art: 'dojo',
    priority: 42,
    trigger: {
      loc: ['dojo'],
      when: (s) => !!s.flags.masterRecognized && R(s, 'gensai').trust >= 50 && !s.player.techniques.includes('zanshin') && s.day < 17,
    },
    nodes: {
      start: {
        speaker: 'gensai',
        text: '{name}，你还记得我说过，剑是用来知道何时该退的吗？\n\n今天教你的，是何时不必退。\n\n斩完之后，心不离开对手——这叫“残心”。心在，刀就在。对手无论从哪里来，你都已经在那里了。',
        choices: [
          {
            label: '跪坐，闭上眼睛',
            effects: [
              { t: 'tech', id: 'zanshin' },
              { t: 'rel', npc: 'gensai', trust: 5, respect: 5 },
              { t: 'time', slots: 1 },
              { t: 'mem', npc: 'gensai', id: 'zanshin', text: '师父把柳心流的心法“残心”传给了你。' },
            ],
            next: 'done',
          },
        ],
      },
      done: {
        speaker: 'narrator',
        text: '那一整天，师父只是让你站着。直到黄昏，你才明白：等，也是一种出刀。\n\n【秘传】残心：消耗 4 点“势”。最强的防守反击。',
      },
    },
  },
];
