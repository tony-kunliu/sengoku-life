// 内容注册表：引擎只依赖这里的接口，具体人物/地点/事件由 content/ 注册。
// 以后添加新年份、新地点、新人物，只需要注册新的内容数据。
import type { OpponentDef } from './combat/types';
import type { AnyKey, GameState, LocationId, NpcId, Stance, StatKey } from './types';

export type Cond = (s: GameState) => boolean;
export type Txt = string | ((s: GameState) => string);

export type Effect =
  | { t: 'rel'; npc: NpcId; trust?: number; respect?: number; favor?: number }
  | { t: 'stance'; npc: NpcId; stance: Stance }
  | { t: 'meet'; npc: NpcId }
  | { t: 'mem'; npc: NpcId; id: string; text: string }
  | { t: 'flag'; key: string; v: number | boolean | string }
  | { t: 'quest'; id: string; stage: number }
  | { t: 'money'; n: number }
  | { t: 'fame'; n: number }
  | { t: 'xp'; stat: AnyKey; n: number }
  | { t: 'cap'; stat: StatKey; n: number }
  | { t: 'tech'; id: string }
  | { t: 'time'; slots: number }
  | { t: 'goto'; loc: LocationId }
  | { t: 'lodging'; v: 'teahouse' | 'forge' }
  | { t: 'know'; opp: string; n: number }
  | { t: 'world'; key: 'imagawa' | 'odaIntel'; n: number }
  | { t: 'log'; text: string; kind?: 'event' | 'world' | 'growth' }
  | { t: 'maxSt'; n: number }
  | { t: 'weapon'; n: number }
  | {
      t: 'bout';
      opp: string;
      kind: 'spar' | 'story' | 'test';
      label: string;
      win: string;
      lose: string;
      draw?: string;
      rounds?: number;
    }
  | { t: 'end'; ending: string }
  | { t: 'run'; fn: (s: GameState) => void };

export interface Choice {
  label: Txt;
  /** 小标签，例如【现代知识】【需要信任】 */
  tag?: string;
  /** 不满足则隐藏 */
  when?: Cond;
  /** 返回字符串时显示为不可选并说明原因 */
  locked?: (s: GameState) => string | null;
  effects?: Effect[];
  next?: string;
}

export interface SceneNode {
  speaker?: NpcId | 'narrator' | 'player';
  text: Txt;
  effects?: Effect[];
  choices?: Choice[];
  next?: string;
}

export interface SceneDef {
  id: string;
  title: string;
  /** 默认只触发一次 */
  repeatable?: boolean;
  priority?: number;
  trigger?: { loc?: LocationId[]; when: Cond };
  /** 场景插画（地点或特殊图） */
  art?: string;
  nodes: Record<string, SceneNode>;
}

export interface ActionDef {
  id: string;
  label: Txt;
  loc: LocationId | 'any';
  cost: number;
  desc: Txt;
  /** 关联人物（显示头像，且需要其在场） */
  npc?: NpcId;
  tag?: string;
  icon?: string;
  when?: Cond;
  locked?: (s: GameState) => string | null;
  /** 返回本次行动的结果文本 */
  run: (s: GameState) => string;
}

export interface NpcDef {
  id: NpcId;
  name: string;
  reading: string;
  age: number;
  role: string;
  personality: string;
  goal: string;
  /** 头像主字与配色 */
  glyph: string;
  color: string;
  historical?: boolean;
  /** 是否在人物页显示 */
  major: boolean;
  where: (s: GameState) => { loc: LocationId | null; doing: string };
  /** 送礼的喜好与忌讳（礼物 id） */
  likes?: string;
  dislikes?: string;
  giftLines?: { liked: string; disliked?: string };
  /** 当前人生状态（随剧情变化） */
  status: (s: GameState) => string;
}

export interface LocationDef {
  id: LocationId;
  name: string;
  sub: string;
  desc: Txt;
  art: string;
}

export interface TalkResult {
  text: string;
  effects?: Effect[];
}

export const REG = {
  scenes: {} as Record<string, SceneDef>,
  actions: [] as ActionDef[],
  npcs: {} as Record<NpcId, NpcDef>,
  locations: {} as Record<LocationId, LocationDef>,
  opponents: {} as Record<string, OpponentDef>,
  /** 根据游戏状态调整对手（NPC 也在成长） */
  opponentFor: (_s: GameState, id: string): OpponentDef => REG.opponents[id],
  talk: (_s: GameState, _npc: NpcId): TalkResult => ({ text: '……' }),
  /** 每日开始时的世界变化 */
  onNewDay: (_s: GameState): void => {},
  /** 地点闲谈（当前流传的传闻） */
  rumorsNow: (_s: GameState): string[] => [],
};
