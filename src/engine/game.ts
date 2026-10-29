// 游戏规则引擎：所有对外操作都是 (state, 参数) => 新 state 的纯函数。
import { createCombat, resolveRound } from './combat/rules';
import { gradeTest } from './combat/hint';
import type { Move } from './combat/types';
import { clone, doneToday, log, markToday, meet, rel, remember, setStance, toast } from './core';
import { OKEHAZAMA_DAY, SLOT_LABEL, dateLabel } from './calendar';
import { REG, type Choice, type Effect, type SceneNode, type Txt } from './registry';
import { gainXp, raiseCap } from './training';
import { autoMove } from './combat/auto';
import type { BoutContext, GameState, LocationId, NpcId, Slot } from './types';

export const txt = (s: GameState, t: Txt) => (typeof t === 'function' ? t(s) : t).replace(/\{name\}/g, s.player.name);

const npcName = () => Object.fromEntries(Object.values(REG.npcs).map((n) => [n.id, n.name]));

// ───────────────────────── 效果 ─────────────────────────

export function applyEffects(s: GameState, effects: Effect[] | undefined) {
  if (!effects) return;
  for (const e of effects) applyEffect(s, e);
}

export function applyEffect(s: GameState, e: Effect) {
  switch (e.t) {
    case 'rel':
      rel(s, e.npc, e, npcName());
      break;
    case 'stance':
      setStance(s, e.npc, e.stance);
      break;
    case 'meet':
      meet(s, e.npc);
      break;
    case 'mem':
      remember(s, e.npc, e.id, e.text);
      break;
    case 'flag':
      s.flags[e.key] = e.v;
      break;
    case 'quest':
      s.quests[e.id] = e.stage;
      break;
    case 'money':
      s.player.money = Math.max(0, s.player.money + e.n);
      toast(s, `钱 ${e.n > 0 ? '+' : ''}${e.n} 文`);
      break;
    case 'fame': {
      // 五郎作（恩义 30）逢人便说你的好话
      const bonus = e.n > 0 && s.npcs.gosaku.rel.favor >= 30 ? 1 : 0;
      s.player.fame += e.n + bonus;
      toast(s, `名声 ${e.n > 0 ? '+' : ''}${e.n + bonus}`);
      break;
    }
    case 'xp':
      toast(s, gainXp(s, e.stat, e.n, true));
      break;
    case 'cap':
      raiseCap(s, e.stat, e.n);
      break;
    case 'tech':
      if (!s.player.techniques.includes(e.id)) {
        s.player.techniques.push(e.id);
        log(s, `习得技法：${TECH_NAMES[e.id] ?? e.id}`, 'growth');
        toast(s, `习得【${TECH_NAMES[e.id] ?? e.id}】`);
      }
      break;
    case 'time':
      advanceTime(s, e.slots);
      break;
    case 'goto':
      s.location = e.loc;
      break;
    case 'lodging':
      s.player.lodging = e.v;
      break;
    case 'know': {
      const before = s.oppKnowledge[e.opp] ?? 0;
      s.oppKnowledge[e.opp] = Math.min(3, before + e.n);
      if (s.oppKnowledge[e.opp] > before) toast(s, `对${REG.opponents[e.opp]?.name ?? e.opp}的了解加深（情报 ${s.oppKnowledge[e.opp]}）`);
      break;
    }
    case 'world':
      s.world[e.key] = Math.max(0, Math.min(100, s.world[e.key] + e.n));
      break;
    case 'log':
      log(s, e.text, e.kind ?? 'event');
      break;
    case 'maxSt':
      s.player.maxStamina = Math.min(12, s.player.maxStamina + e.n);
      toast(s, `气力上限 ${s.player.maxStamina}`);
      break;
    case 'weapon':
      s.player.weapon = Math.max(s.player.weapon, e.n);
      break;
    case 'bout':
      startBout(s, e.opp, {
        kind: e.kind,
        label: e.label,
        sceneId: s.scene?.id,
        winNode: e.win,
        loseNode: e.lose,
        drawNode: e.draw ?? e.lose,
      }, e.rounds);
      break;
    case 'end':
      s.ended = true;
      s.ending = e.ending;
      log(s, '《乱世来客》第一章 完', 'event');
      break;
    case 'run':
      e.fn(s);
      break;
  }
}

export const TECH_NAMES: Record<string, string> = {
  yanagi: '柳返',
  fumikomi: '踏入',
  mikiri: '见切',
};

export const TECH_DESC: Record<string, string> = {
  yanagi: '防守时，只要守备不低于来刀且架势未崩，就能卸力反击。',
  fumikomi: '远间进攻不再吃亏。',
  mikiri: '眼力视为高一级，对手的意图更容易看清。',
};

// ───────────────────────── 时间 ─────────────────────────

export function advanceTime(s: GameState, slots: number) {
  for (let i = 0; i < slots; i++) {
    if (s.slot < 2) s.slot = (s.slot + 1) as Slot;
    else newDay(s);
  }
}

function newDay(s: GameState) {
  s.day += 1;
  s.slot = 0;
  // 回到住处醒来
  if (s.player.lodging !== 'none') s.location = s.player.lodging === 'teahouse' ? 'teahouse' : 'town';
  log(s, `—— ${dateLabel(s.day)} ——`, 'system');
  REG.onNewDay(s);
}

/** 就寝：直接跳到下一个早晨 */
export function sleep(prev: GameState): GameState {
  const s = clone(prev);
  s.toast = [];
  // 逐个时段推进：途中若有事件发生（例如前夜的召唤），会被叫醒
  const startDay = s.day;
  while (s.day === startDay) {
    advanceTime(s, 1);
    checkTriggers(s);
    if (s.scene || s.ended) break;
  }
  return s;
}

// ───────────────────────── 移动 ─────────────────────────

export function travelCost(from: LocationId, to: LocationId): number {
  if (from === to) return 0;
  return from === 'village' || to === 'village' ? 1 : 0;
}

export function travel(prev: GameState, to: LocationId): GameState {
  if (prev.scene || prev.bout || prev.ended) return prev;
  const s = clone(prev);
  s.toast = [];
  const cost = travelCost(s.location, to);
  if (cost) {
    log(s, `走了半个时辰的路，来到${REG.locations[to].name}。`, 'action');
    advanceTime(s, cost);
  }
  s.location = to;
  checkTriggers(s);
  return s;
}

// ───────────────────────── 行动 ─────────────────────────

export function actionsHere(s: GameState) {
  return REG.actions.filter((a) => (a.loc === 'any' || a.loc === s.location) && (!a.when || a.when(s)));
}

export function isNpcHere(s: GameState, npc: NpcId) {
  return REG.npcs[npc].where(s).loc === s.location;
}

export function actionLock(s: GameState, id: string): string | null {
  const a = REG.actions.find((x) => x.id === id);
  if (!a) return '无此行动';
  if (a.loc !== 'any' && a.loc !== s.location) return '不在此地';
  if (a.when && !a.when(s)) return '现在不能这么做';
  if (a.npc && !isNpcHere(s, a.npc)) return `${REG.npcs[a.npc].name}不在这里`;
  return a.locked ? a.locked(s) : null;
}

export function performAction(prev: GameState, id: string): GameState {
  if (prev.scene || prev.bout || prev.ended) return prev;
  const a = REG.actions.find((x) => x.id === id);
  if (!a || actionLock(prev, id)) return prev;
  const s = clone(prev);
  s.toast = [];
  const before = s.slot;
  const result = a.run(s);
  markToday(s, a.id);
  if (result) log(s, result, 'action');
  // run 中若开启了比试，则时间在比试结束时再推进
  if (s.bout) (s.bout.context as BoutContext & { cost?: number }).cost = a.cost;
  else advanceTime(s, a.cost);
  if (!s.bout) checkTriggers(s);
  void before;
  return s;
}

// ───────────────────────── 交谈 ─────────────────────────

export function talk(prev: GameState, npc: NpcId): GameState {
  if (prev.scene || prev.bout || prev.ended) return prev;
  if (!isNpcHere(prev, npc)) return prev;
  const s = clone(prev);
  s.toast = [];
  const st = s.npcs[npc];
  meet(s, npc);
  const res = REG.talk(s, npc);
  const first = st.talkedDay !== s.day;
  st.talkedDay = s.day;
  applyEffects(s, res.effects);
  if (first && npc !== 'nobunaga') {
    rel(s, npc, { trust: 2 }, npcName());
    gainXp(s, 'speech', 8, true);
  }
  s.flags.lastTalk = `${npc}|${res.text}`;
  log(s, `${REG.npcs[npc].name}：${res.text}`, 'event');
  checkTriggers(s);
  return s;
}

// ───────────────────────── 事件场景 ─────────────────────────

export function startScene(s: GameState, id: string) {
  const def = REG.scenes[id];
  if (!def) return;
  s.scene = { id, node: 'start' };
  if (!s.seenScenes.includes(id)) s.seenScenes.push(id);
  enterNode(s, 'start');
}

function enterNode(s: GameState, node: string) {
  if (!s.scene) return;
  s.scene.node = node;
  const n = currentNode(s);
  if (n) applyEffects(s, n.effects);
}

export function currentNode(s: GameState): SceneNode | null {
  if (!s.scene) return null;
  return REG.scenes[s.scene.id]?.nodes[s.scene.node] ?? null;
}

export function visibleChoices(s: GameState): { c: Choice; i: number; lock: string | null }[] {
  const n = currentNode(s);
  if (!n?.choices) return [];
  return n.choices
    .map((c, i) => ({ c, i, lock: c.locked ? c.locked(s) : null }))
    .filter(({ c }) => !c.when || c.when(s));
}

export function choose(prev: GameState, index: number): GameState {
  const n = currentNode(prev);
  if (!prev.scene || !n || prev.bout) return prev;
  const s = clone(prev);
  s.toast = [];
  if (n.choices && n.choices.length) {
    const c = n.choices[index];
    if (!c || (c.when && !c.when(s)) || (c.locked && c.locked(s))) return prev;
    log(s, `▸ ${txt(s, c.label)}`, 'event');
    applyEffects(s, c.effects);
    if (s.bout) return s; // 比试开始，场景暂停
    if (s.ended) {
      s.scene = null;
      return s;
    }
    if (c.next) enterNode(s, c.next);
    else endScene(s);
  } else {
    if (n.next) enterNode(s, n.next);
    else endScene(s);
  }
  // 节点可能直接触发比试或结局
  if (s.ended) s.scene = null;
  return s;
}

function endScene(s: GameState) {
  s.scene = null;
  checkTriggers(s);
}

export function checkTriggers(s: GameState) {
  if (s.scene || s.bout || s.ended) return;
  const list = Object.values(REG.scenes)
    .filter((d) => d.trigger)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  for (const d of list) {
    if (!d.repeatable && s.seenScenes.includes(d.id)) continue;
    const t = d.trigger!;
    if (t.loc && !t.loc.includes(s.location)) continue;
    if (t.when(s)) {
      startScene(s, d.id);
      return;
    }
  }
}

// ───────────────────────── 比试 ─────────────────────────

export function playerCombatStats(s: GameState) {
  const p = s.player;
  const mikiri = p.techniques.includes('mikiri') ? 1 : 0;
  return {
    name: p.name,
    atk: p.stats.atk.lv,
    def: p.stats.def.lv,
    eye: p.stats.eye.lv + mikiri,
    maxStamina: p.maxStamina,
    techniques: p.techniques,
    weapon: p.weapon,
  };
}

export function startBout(s: GameState, opp: string, ctx: BoutContext, rounds?: number) {
  const def = REG.opponentFor(s, opp);
  const combat = createCombat(def, playerCombatStats(s), s.rngState, {
    maxRounds: rounds ?? 7,
    target: ctx.kind === 'test' ? 1 : 2,
  });
  s.bout = { combat, context: ctx };
}

export function playMove(prev: GameState, m: Move): GameState {
  if (!prev.bout || prev.bout.combat.finished) return prev;
  const s = clone(prev);
  s.toast = [];
  s.bout!.combat = resolveRound(s.bout!.combat, m);
  s.rngState = s.bout!.combat.rng;
  return s;
}

/** 速决：只对已经赢过的对手开放，按习惯自动打完（规则与手动完全相同） */
export function canQuickFinish(s: GameState): boolean {
  const b = s.bout;
  if (!b || b.combat.finished || b.context.kind !== 'spar') return false;
  return ((s.flags[`wins_${b.combat.oppId}`] as number) ?? 0) >= 1;
}

export function quickFinish(prev: GameState): GameState {
  if (!canQuickFinish(prev)) return prev;
  let s = prev;
  const know = prev.oppKnowledge[prev.bout!.combat.oppId] ?? 0;
  for (let i = 0; i < 30 && s.bout && !s.bout.combat.finished; i++) s = playMove(s, autoMove(s.bout.combat, know));
  return s;
}

/** 比试结束后结算成长、记忆，并回到场景 */
export function closeBout(prev: GameState): GameState {
  if (!prev.bout || !prev.bout.combat.finished) return prev;
  const s = clone(prev);
  s.toast = [];
  const { combat: cs, context } = s.bout!;
  const opp = cs.oppId;
  const result = cs.result!;
  s.bout = null;
  s.record.bouts += 1;
  if (result === 'win') s.record.wins += 1;
  if (result === 'lose') s.record.losses += 1;
  s.flags[`bouts_${opp}`] = ((s.flags[`bouts_${opp}`] as number) ?? 0) + 1;
  if (result === 'win') s.flags[`wins_${opp}`] = ((s.flags[`wins_${opp}`] as number) ?? 0) + 1;

  const resText = result === 'win' ? '胜' : result === 'lose' ? '败' : '平';
  log(s, `【${context.label}】对${cs.o.name}：${resText}（${cs.p.points} - ${cs.o.points}）`, 'bout');

  // —— 成长：无论输赢 ——
  const used = (m: Move) => cs.history.filter((r) => r.pMove === m).length;
  const bonus = result === 'win' ? 6 : 0;
  const growth: string[] = [];
  if (used('atk') >= 1) growth.push(gainXp(s, 'atk', 16 + bonus, true));
  if (used('def') >= 1) growth.push(gainXp(s, 'def', 16 + bonus, true));
  if (used('probe') >= 1) growth.push(gainXp(s, 'eye', 18 + bonus, true));
  const know = s.oppKnowledge[opp] ?? 0;
  if (result !== 'win' || know === 0) {
    if (know < 3) {
      s.oppKnowledge[opp] = know + 1;
      growth.push(`你摸清了${cs.o.name}的一些习惯（情报 ${know + 1}/3）`);
    }
  }
  if (context.kind === 'test') {
    const g = gradeTest(cs);
    s.flags.testScore = g.score;
    s.flags.testNotes = g.notes.join('；');
  }
  growth.forEach((g) => toast(s, g));
  s.flags.lastBoutGrowth = growth.join('\n');
  s.flags.lastBoutResult = result;

  const cost = (context as BoutContext & { cost?: number }).cost ?? 0;
  if (context.sceneId) {
    const node = result === 'win' ? context.winNode : result === 'lose' ? context.loseNode : context.drawNode;
    s.scene = { id: context.sceneId, node: node! };
    const n = currentNode(s);
    applyEffects(s, n?.effects);
  } else {
    advanceTime(s, cost);
    checkTriggers(s);
  }
  return s;
}

/** 放弃比试（认输） */
export function forfeitBout(prev: GameState): GameState {
  if (!prev.bout) return prev;
  const s = clone(prev);
  const cs = s.bout!.combat;
  cs.finished = true;
  cs.result = 'lose';
  cs.history.push({ round: cs.round, pMove: 'def', oMove: cs.oppNext, lines: ['你放下木刀认输。'], scorer: null, revealed: false });
  return s;
}

// ───────────────────────── 杂项 ─────────────────────────

export function clearToast(prev: GameState): GameState {
  if (!prev.toast.length) return prev;
  const s = clone(prev);
  s.toast = [];
  return s;
}

export function timeLabel(s: GameState) {
  return `${dateLabel(s.day)} · ${SLOT_LABEL[s.slot]}`;
}

export function isOkehazamaPast(s: GameState) {
  return s.day > OKEHAZAMA_DAY;
}

export { doneToday };
