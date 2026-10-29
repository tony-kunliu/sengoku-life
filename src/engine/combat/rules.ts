// 剑术比试规则 —— 纯函数，可测试、可重复模拟。
//
// 克制关系（核心三角 + 调整）：
//   进攻 克 试探/调整（打中没有防备的人）
//   防守 克 进攻（格挡，守备充足时反击）
//   试探 克 防守（佯攻破坏架势，并看破下一手）
//   调整 恢复气力与架势，但被进攻时会挨打
// 数值（攻击、守备、架势、主动、距离、气力）决定克制能否兑现。

import { jitter, roll, weighted, type RngHolder } from '../rng';
import type { CombatState, Distance, Fighter, Move, OpponentDef, RoundRecord, Side, TechId } from './types';
import { DISTANCE_LABEL, MAX_SEI, MOVE_LABEL, TECH_BASE, TECH_COST } from './types';
import { opponentWeights } from './ai';

export const COST: Record<Move, number> = { atk: -2, def: -1, probe: -1, adjust: 3 };

export interface PlayerCombatStats {
  name: string;
  atk: number;
  def: number;
  eye: number;
  maxStamina: number;
  techniques: string[];
  weapon: number;
}

export function createCombat(
  opp: OpponentDef,
  player: PlayerCombatStats,
  rngState: number,
  opts: { maxRounds?: number; target?: number } = {},
): CombatState {
  const p: Fighter = {
    name: player.name,
    atk: player.atk,
    def: player.def,
    eye: player.eye,
    stamina: player.maxStamina,
    maxStamina: player.maxStamina,
    posture: 2,
    points: 0,
    techniques: [...player.techniques],
    weapon: player.weapon,
    sei: 0,
  };
  const o: Fighter = {
    name: opp.name,
    atk: opp.atk,
    def: opp.def,
    eye: opp.eye,
    stamina: opp.maxStamina,
    maxStamina: opp.maxStamina,
    posture: 2,
    points: 0,
    techniques: [...(opp.techniques ?? [])],
    weapon: 0,
    sei: 0,
  };
  const cs: CombatState = {
    round: 1,
    maxRounds: opts.maxRounds ?? 7,
    target: opts.target ?? 2,
    distance: 0,
    initiative: null,
    p,
    o,
    oppId: opp.id,
    style: opp.style,
    oppNext: 'def',
    oppTech: null,
    reveal: false,
    oppRead: 0,
    history: [],
    passive: { p: 0, o: 0 },
    finished: false,
    result: null,
    rng: rngState,
  };
  pickOpp(cs);
  return cs;
}

/** 对手决定下一手：势足够且会二段时，进攻会升级为二段 */
function pickOpp(cs: CombatState) {
  cs.oppNext = weighted(cs, opponentWeights(cs));
  cs.oppTech = null;
  if (cs.oppNext === 'atk' && cs.o.techniques.includes('nidan') && cs.o.sei >= TECH_COST.nidan) cs.oppTech = 'nidan';
}

const fighter = (cs: CombatState, s: Side) => (s === 'p' ? cs.p : cs.o);
const other = (s: Side): Side => (s === 'p' ? 'o' : 'p');

function staminaMod(st: number): number {
  if (st <= 0) return -3;
  if (st <= 2) return -1;
  return 0;
}

/** 攻击威力（不含随机波动），用于解释与提示 */
export function power(cs: CombatState, s: Side): number {
  const f = fighter(cs, s);
  let v = f.atk + (f.posture - 2) + staminaMod(f.stamina) + f.weapon;
  if (cs.initiative === s) v += 1;
  if (cs.distance === 0 && !f.techniques.includes('fumikomi')) v -= 1;
  if (cs.distance === 2) v += 1;
  if (s === 'o') v += cs.oppRead;
  return v;
}

/** 守备值 */
export function guard(cs: CombatState, s: Side): number {
  const f = fighter(cs, s);
  return f.def + (f.posture - 2) + staminaMod(f.stamina);
}

const clampPosture = (n: number) => Math.max(0, Math.min(4, n));

interface Ctx {
  cs: CombatState;
  lines: string[];
  scorer: Side | null;
  revealNext: boolean;
  readNext: boolean;
  /** 本回合的威力加成（秘传） */
  bonus: { p: number; o: number };
}

const powOf = (c: Ctx, s: Side) => power(c.cs, s) + c.bonus[s];

function score(c: Ctx, s: Side, how: string) {
  if (c.scorer) return;
  c.scorer = s;
  fighter(c.cs, s).points += 1;
  c.lines.push(`${s === 'p' ? '★' : '✕'} ${how}——${s === 'p' ? '你' : c.cs.o.name}取得一本！`);
}

function posture(c: Ctx, s: Side, d: number) {
  const f = fighter(c.cs, s);
  f.posture = clampPosture(f.posture + d);
}

function nm(c: Ctx, s: Side) {
  return s === 'p' ? '你' : c.cs.o.name;
}

function revealBy(c: Ctx, s: Side) {
  if (s === 'p') c.revealNext = true;
  else c.readNext = true;
}

function resolveAttackVsAttack(c: Ctx) {
  const cs = c.cs;
  const pp = powOf(c, 'p') + jitter(cs);
  const op = powOf(c, 'o') + jitter(cs);
  const diff = pp - op;
  c.lines.push(`双方同时出刀（你 ${pp} 对 ${cs.o.name} ${op}）。`);
  if (diff >= 2) score(c, 'p', '你的刀更快一步');
  else if (diff <= -2) score(c, 'o', `${cs.o.name}抢先斩落`);
  else {
    c.lines.push('木刀相击，难分先后。双方架势都被震乱。');
    posture(c, 'p', -1);
    posture(c, 'o', -1);
    cs.initiative = diff > 0 ? 'p' : diff < 0 ? 'o' : null;
  }
  cs.distance = 2;
}

function resolveAttackVsDefend(c: Ctx, att: Side, dfn: Side) {
  const cs = c.cs;
  const pw = powOf(c, att) + jitter(cs);
  const gd = guard(cs, dfn);
  const margin = pw - gd;
  const df = fighter(cs, dfn);
  const yanagi = df.techniques.includes('yanagi');
  c.lines.push(`${nm(c, att)}进攻，${nm(c, dfn)}稳住架势格挡（攻 ${pw} 对 守 ${gd}）。`);
  if (margin >= 3) {
    score(c, att, '攻势压垮了防守');
  } else if ((margin <= -1 && df.posture >= 2) || (yanagi && margin <= 0 && df.posture >= 1)) {
    score(c, dfn, yanagi ? '柳返——卸力后顺势反击' : '格开来刀，回手反击');
  } else {
    c.lines.push(`来刀被挡下。${nm(c, att)}架势一乱，${nm(c, dfn)}夺得主动。`);
    posture(c, att, -1);
    cs.initiative = dfn;
    cs.distance = 1;
  }
}

function resolveAttackVsProbe(c: Ctx, att: Side, prb: Side) {
  const cs = c.cs;
  if (cs.distance === 0) {
    c.lines.push(`${nm(c, prb)}在远间试探，${nm(c, att)}踏入时被看清来路，轻轻避开。`);
    cs.initiative = att;
    cs.distance = 1;
    revealBy(c, prb);
    return;
  }
  const pw = powOf(c, att) + jitter(cs);
  const gd = guard(cs, prb) - 1;
  c.lines.push(`${nm(c, prb)}正欲试探，${nm(c, att)}直接出刀（攻 ${pw} 对 守 ${gd}）。`);
  if (pw >= gd) score(c, att, '趁对方试探的空隙');
  else {
    c.lines.push(`${nm(c, prb)}勉强躲过，架势散乱。`);
    posture(c, prb, -1);
    cs.initiative = att;
  }
  cs.distance = 2;
}

function resolveAttackVsAdjust(c: Ctx, att: Side, adj: Side) {
  const cs = c.cs;
  const pw = powOf(c, att) + jitter(cs);
  if (pw >= 2) {
    c.lines.push(`${nm(c, adj)}正在调息，${nm(c, att)}抓住时机进攻（攻 ${pw}）。`);
    score(c, att, '打中了调整中的对手');
  } else {
    c.lines.push(`${nm(c, att)}的进攻有气无力（攻 ${pw}），被${nm(c, adj)}退步让开。`);
    posture(c, adj, 1);
  }
  cs.distance = 2;
}

function resolveProbeVsDefend(c: Ctx, prb: Side, dfn: Side) {
  const cs = c.cs;
  const pf = fighter(cs, prb);
  const brk = pf.eye >= 3 ? 2 : 1;
  c.lines.push(`${nm(c, prb)}佯攻引诱，${nm(c, dfn)}的防守被晃开（架势 -${brk}）。${nm(c, prb)}看清了对方的下一手。`);
  posture(c, dfn, -brk);
  cs.initiative = prb;
  revealBy(c, prb);
  if (cs.distance < 2) cs.distance = (cs.distance + 1) as Distance;
}

function resolveProbeVsProbe(c: Ctx) {
  const cs = c.cs;
  const pe = cs.p.eye + jitter(cs);
  const oe = cs.o.eye + jitter(cs);
  c.lines.push(`双方互相试探（眼力 ${pe} 对 ${oe}）。`);
  if (pe > oe) {
    c.lines.push('你先一步读出了对方的节奏。');
    cs.initiative = 'p';
    revealBy(c, 'p');
  } else if (oe > pe) {
    c.lines.push(`${cs.o.name}读出了你的节奏。`);
    cs.initiative = 'o';
    revealBy(c, 'o');
  } else c.lines.push('谁也没占到便宜。');
  if (cs.distance < 2) cs.distance = (cs.distance + 1) as Distance;
}

function resolveProbeVsAdjust(c: Ctx, prb: Side, adj: Side) {
  c.lines.push(`${nm(c, adj)}调整呼吸，${nm(c, prb)}趁机观察，夺得主动。`);
  posture(c, adj, 1);
  c.cs.initiative = prb;
  revealBy(c, prb);
}

function resolveDefendVsDefend(c: Ctx) {
  c.lines.push('双方都在等待对方先动，场上一片静默。');
  posture(c, 'p', 1);
  posture(c, 'o', 1);
}

function resolveDefendVsAdjust(c: Ctx, dfn: Side, adj: Side) {
  c.lines.push(`${nm(c, dfn)}守住中段，${nm(c, adj)}拉开距离调整。`);
  posture(c, dfn, 1);
  posture(c, adj, 1);
  c.cs.distance = 1;
}

function resolveAdjustVsAdjust(c: Ctx) {
  c.lines.push('双方各自退开，重整呼吸。');
  posture(c, 'p', 1);
  posture(c, 'o', 1);
  c.cs.distance = 0;
}

// ───────── 秘传 ─────────

/** 二段：被挡下也能补上第二刀 */
function nidanVsDefend(c: Ctx, att: Side, dfn: Side) {
  const cs = c.cs;
  const a = powOf(c, att) + 2 + jitter(cs);
  const g = guard(cs, dfn);
  c.lines.push(`${nm(c, att)}使出【二段】：第一刀被挡，第二刀紧跟而至（攻 ${a} 对 守 ${g}）。`);
  if (a - g >= 1) score(c, att, '二段——第二刀斩中');
  else {
    c.lines.push(`${nm(c, dfn)}连挡两刀，${nm(c, att)}的架势一乱。`);
    posture(c, att, -1);
    cs.initiative = dfn;
  }
  cs.distance = 2;
}

/** 诱：假动作引对手出刀，侧身反击 */
function sasoiVsAttack(c: Ctx, lure: Side, att: Side) {
  const cs = c.cs;
  const a = powOf(c, lure) + jitter(cs);
  const g = guard(cs, att) - 1;
  c.lines.push(`${nm(c, lure)}使出【诱】：故意露出破绽，${nm(c, att)}果然出刀——${nm(c, lure)}侧身让过（攻 ${a} 对 守 ${g}）。`);
  if (a >= g) score(c, lure, '诱——让过来刀，回身斩中');
  else {
    c.lines.push(`反击被勉强躲开，但${nm(c, att)}的下一手已被看穿。`);
    cs.initiative = lure;
    revealBy(c, lure);
    posture(c, att, -1);
  }
  cs.distance = 2;
}

/** 残心：不动如山，来刀即反击；对方不攻则看穿其意图 */
function zanshin(c: Ctx, me: Side, foeMove: Move, foeTech: TechId | undefined) {
  const cs = c.cs;
  const foe: Side = me === 'p' ? 'o' : 'p';
  if (foeMove === 'atk') {
    const a = powOf(c, foe) + (foeTech === 'nidan' ? 2 : 0) + jitter(cs);
    const g = guard(cs, me) + 1;
    c.lines.push(`${nm(c, me)}以【残心】静待，${nm(c, foe)}出刀（攻 ${a} 对 守 ${g}）。`);
    if (a - g >= 3) score(c, foe, '攻势之强，连残心也挡不住');
    else score(c, me, '残心——来刀落空，回手一击');
    cs.distance = 2;
    return;
  }
  c.lines.push(`${nm(c, me)}以【残心】静待，${nm(c, foe)}${foeMove === 'probe' ? '的佯攻毫无作用' : '不敢妄动'}。${nm(c, me)}看穿了对方的意图。`);
  posture(c, me, 1);
  cs.initiative = me;
  revealBy(c, me);
}

/** 处理有秘传参与的回合；返回 true 表示已结算 */
function resolveTech(c: Ctx, pm: Move, om: Move, pt?: TechId, ot?: TechId): boolean {
  if (!pt && !ot) return false;
  if (pt === 'zanshin') return zanshin(c, 'p', om, ot), true;
  if (ot === 'zanshin') return zanshin(c, 'o', pm, pt), true;
  if (pt === 'sasoi' && om === 'atk') return sasoiVsAttack(c, 'p', 'o'), true;
  if (ot === 'sasoi' && pm === 'atk') return sasoiVsAttack(c, 'o', 'p'), true;
  if (pt === 'nidan' && om === 'def') return nidanVsDefend(c, 'p', 'o'), true;
  if (ot === 'nidan' && pm === 'def') return nidanVsDefend(c, 'o', 'p'), true;
  // 其余情形：秘传按基础行动结算，二段威力 +1，诱在互探中必胜
  if (pt === 'nidan') c.bonus.p += 1;
  if (ot === 'nidan') c.bonus.o += 1;
  if (pt === 'sasoi' && om === 'probe') {
    c.lines.push('你使出【诱】，对方的试探反被你牵着走。');
    c.cs.initiative = 'p';
    revealBy(c, 'p');
    return true;
  }
  if (pt) c.lines.push(`你使出【${TECH_NAME[pt]}】。`);
  if (ot) c.lines.push(`${c.cs.o.name}使出【${TECH_NAME[ot]}】！`);
  return false;
}

export const TECH_NAME: Record<TechId, string> = { nidan: '二段', sasoi: '诱', zanshin: '残心' };

function gainSei(f: Fighter, n: number) {
  f.sei = Math.min(MAX_SEI, f.sei + n);
}

/** 玩家此刻能否发动某秘传 */
export function canUseTech(cs: CombatState, t: TechId): boolean {
  return cs.p.techniques.includes(t) && cs.p.sei >= TECH_COST[t] && !cs.finished;
}

function resolvePair(c: Ctx, pm: Move, om: Move) {
  const key = `${pm}-${om}`;
  switch (key) {
    case 'atk-atk': return resolveAttackVsAttack(c);
    case 'atk-def': return resolveAttackVsDefend(c, 'p', 'o');
    case 'def-atk': return resolveAttackVsDefend(c, 'o', 'p');
    case 'atk-probe': return resolveAttackVsProbe(c, 'p', 'o');
    case 'probe-atk': return resolveAttackVsProbe(c, 'o', 'p');
    case 'atk-adjust': return resolveAttackVsAdjust(c, 'p', 'o');
    case 'adjust-atk': return resolveAttackVsAdjust(c, 'o', 'p');
    case 'probe-def': return resolveProbeVsDefend(c, 'p', 'o');
    case 'def-probe': return resolveProbeVsDefend(c, 'o', 'p');
    case 'probe-probe': return resolveProbeVsProbe(c);
    case 'probe-adjust': return resolveProbeVsAdjust(c, 'p', 'o');
    case 'adjust-probe': return resolveProbeVsAdjust(c, 'o', 'p');
    case 'def-def': return resolveDefendVsDefend(c);
    case 'def-adjust': return resolveDefendVsAdjust(c, 'p', 'o');
    case 'adjust-def': return resolveDefendVsAdjust(c, 'o', 'p');
    default: return resolveAdjustVsAdjust(c);
  }
}

function applyCost(f: Fighter, m: Move) {
  f.stamina = Math.max(0, Math.min(f.maxStamina, f.stamina + COST[m]));
}

/** 结算一个回合。返回新状态（不修改入参）。 */
export function resolveRound(prev: CombatState, pMoveIn: Move, pTechIn?: TechId): CombatState {
  if (prev.finished) return prev;
  const cs: CombatState = structuredClone(prev);
  const pTech = pTechIn && canUseTech(cs, pTechIn) ? pTechIn : undefined;
  const pMove = pTech ? TECH_BASE[pTech] : pMoveIn;
  const oMove = cs.oppNext;
  const oTech = cs.oppTech && cs.o.sei >= TECH_COST[cs.oppTech] ? cs.oppTech : undefined;
  const revealed = cs.reveal;
  const c: Ctx = { cs, lines: [], scorer: null, revealNext: false, readNext: false, bonus: { p: 0, o: 0 } };
  if (pTech) cs.p.sei -= TECH_COST[pTech];
  if (oTech) cs.o.sei -= TECH_COST[oTech];

  if (!resolveTech(c, pMove, oMove, pTech, oTech)) resolvePair(c, pMove, oMove);

  // 势：防守 +1，看破对手 +1，被取一本 +2
  if (pMove === 'def' && !pTech) gainSei(cs.p, 1);
  if (oMove === 'def' && !oTech) gainSei(cs.o, 1);
  if (c.revealNext) gainSei(cs.p, 1);
  if (c.readNext) gainSei(cs.o, 1);
  if (c.scorer === 'o') gainSei(cs.p, 2);
  if (c.scorer === 'p') gainSei(cs.o, 2);

  applyCost(cs.p, pMove);
  applyCost(cs.o, oMove);

  // 消极判定：连续三次防守而对手并未进攻
  for (const s of ['p', 'o'] as Side[]) {
    const m = s === 'p' ? pMove : oMove;
    const om = s === 'p' ? oMove : pMove;
    if (m === 'def' && om !== 'atk') cs.passive[s] += 1;
    else cs.passive[s] = 0;
    if (cs.passive[s] >= 3) {
      c.lines.push(`裁判示意${nm(c, s)}过于消极，主动权交给对方。`);
      cs.initiative = other(s);
      posture(c, s, -1);
      cs.passive[s] = 0;
    }
  }

  if (c.scorer) {
    // 取得一本后双方回到开始位置
    cs.distance = 0;
    cs.initiative = null;
    cs.p.posture = 2;
    cs.o.posture = 2;
    c.revealNext = false;
    c.readNext = false;
  }

  const rec: RoundRecord = { round: cs.round, pMove, oMove, lines: c.lines, scorer: c.scorer, revealed };
  if (pTech) rec.pTech = pTech;
  if (oTech) rec.oTech = oTech;
  cs.history.push(rec);

  // 胜负判定
  if (cs.p.points >= cs.target || cs.o.points >= cs.target) {
    cs.finished = true;
    cs.result = cs.p.points > cs.o.points ? 'win' : 'lose';
  } else if (cs.round >= cs.maxRounds) {
    cs.finished = true;
    if (cs.p.points !== cs.o.points) cs.result = cs.p.points > cs.o.points ? 'win' : 'lose';
    else {
      const tech = techScore(cs);
      cs.result = tech > 0 ? 'win' : tech < 0 ? 'lose' : 'draw';
      rec.lines.push(
        tech === 0 ? '时间到，判定为平手。' : `时间到，裁判以架势与主动判定${tech > 0 ? '你' : cs.o.name}占优。`,
      );
    }
  }

  if (!cs.finished) {
    cs.round += 1;
    cs.reveal = c.revealNext;
    cs.oppRead = c.readNext ? 1 : 0;
    pickOpp(cs);
  } else {
    cs.reveal = false;
  }
  return cs;
}

/** 平手时的技术判定：正数玩家占优 */
export function techScore(cs: CombatState): number {
  let t = 0;
  if (cs.initiative === 'p') t += 1;
  if (cs.initiative === 'o') t -= 1;
  t += Math.sign(cs.p.posture - cs.o.posture);
  return t;
}

/** 解释当前局面的简短文字（给 UI 用） */
export function describeState(cs: CombatState): string {
  const init = cs.initiative === 'p' ? '你掌握主动' : cs.initiative === 'o' ? `${cs.o.name}掌握主动` : '无人掌握主动';
  return `${DISTANCE_LABEL[cs.distance]} · ${init}`;
}

/** 预估玩家选择某一行动时的关键数值（让规则可解释） */
export function previewMove(cs: CombatState, m: Move): string {
  switch (m) {
    case 'atk':
      return `威力 ${power(cs, 'p')} · 气力 -2`;
    case 'def':
      return `守备 ${guard(cs, 'p')} · 气力 -1`;
    case 'probe':
      return `眼力 ${cs.p.eye} · 气力 -1`;
    case 'adjust':
      return `气力 +3 · 架势 +1`;
  }
}

/** 用于自动模拟：执行整场比试 */
export function simulate(cs0: CombatState, policy: (cs: CombatState, h: RngHolder) => Move): CombatState {
  let cs = cs0;
  const h: RngHolder = { rng: 12345 + cs0.rng };
  let guardN = 0;
  while (!cs.finished && guardN++ < 50) cs = resolveRound(cs, policy(cs, h));
  return cs;
}

export { MOVE_LABEL, roll };
