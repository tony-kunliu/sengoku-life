// 核心类型定义 —— 规则引擎与内容数据共享
import type { CombatState } from './combat/types';

/** 一日三个时段：0 朝 · 1 昼 · 2 晚 */
export type Slot = 0 | 1 | 2;

export type LocationId = 'town' | 'dojo' | 'teahouse' | 'village';

export type NpcId =
  | 'gensai'
  | 'hayato'
  | 'seibei'
  | 'oryo'
  | 'toshiie'
  | 'gonroku'
  | 'gosaku'
  | 'nobunaga';

export type StatKey = 'atk' | 'def' | 'eye';
/** 生活能力：智略 / 口才 / 医术 */
export type LifeKey = 'wit' | 'speech' | 'med';
export type AnyKey = StatKey | LifeKey;

export type Stance = 'stranger' | 'neutral' | 'friendly' | 'rival' | 'ally' | 'wary';

export interface Relation {
  /** 信任 */
  trust: number;
  /** 尊敬 */
  respect: number;
  /** 恩义 */
  favor: number;
  stance: Stance;
  met: boolean;
}

export interface MemoryEntry {
  id: string;
  day: number;
  text: string;
}

export interface NpcState {
  rel: Relation;
  memories: MemoryEntry[];
  /** 最后一次交谈的日子（每日首谈有关系收益） */
  talkedDay: number;
}

export interface StatProgress {
  lv: number;
  xp: number;
  cap: number;
  /** 自上次“突破来源”（实战/观摩/指导）以来的重复训练次数 —— 用于收益递减 */
  reps: number;
}

export interface PlayerState {
  name: string;
  money: number;
  fame: number;
  stats: Record<StatKey, StatProgress>;
  life: Record<LifeKey, StatProgress>;
  maxStamina: number;
  techniques: string[];
  /** 兵器加成（木刀品质） */
  weapon: number;
  lodging: 'none' | 'teahouse' | 'forge';
}

export type LogKind = 'event' | 'action' | 'world' | 'memory' | 'bout' | 'growth' | 'system';

export interface LogEntry {
  day: number;
  slot: Slot;
  text: string;
  kind: LogKind;
}

export interface ActiveScene {
  id: string;
  node: string;
}

export interface BoutContext {
  /** 发起比试的场景（若有）及胜负后续节点 */
  sceneId?: string;
  winNode?: string;
  loseNode?: string;
  drawNode?: string;
  /** 比试类别：用于成长与评价 */
  kind: 'spar' | 'story' | 'test';
  label: string;
}

export interface BoutState {
  combat: CombatState;
  context: BoutContext;
}

export interface WorldState {
  /** 今川军推进度 0-100 */
  imagawa: number;
  /** 织田方对今川动向的掌握 */
  odaIntel: number;
  rumorsHeard: string[];
}

export type FlagValue = number | boolean | string;

export interface GameState {
  version: number;
  seed: number;
  rngState: number;
  /** 第 1 日 = 永禄三年五月初三 */
  day: number;
  slot: Slot;
  location: LocationId;
  player: PlayerState;
  npcs: Record<NpcId, NpcState>;
  flags: Record<string, FlagValue>;
  /** 委托/事件链阶段 */
  quests: Record<string, number>;
  /** 对各对手的情报等级 0-3 */
  oppKnowledge: Record<string, number>;
  world: WorldState;
  scene: ActiveScene | null;
  bout: BoutState | null;
  log: LogEntry[];
  seenScenes: string[];
  /** 当日已做过的动作计数：key -> {day,count} */
  daily: Record<string, { day: number; count: number }>;
  ended: boolean;
  ending: string | null;
  record: { bouts: number; wins: number; losses: number };
  /** 最近一次行动的反馈（UI 展示用） */
  toast: string[];
}
