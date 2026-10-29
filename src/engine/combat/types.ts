// 剑术比试 —— 类型

/** 四种基础行动：进攻 / 防守 / 试探 / 调整 */
export type Move = 'atk' | 'def' | 'probe' | 'adjust';

export const MOVES: Move[] = ['atk', 'def', 'probe', 'adjust'];

export const MOVE_LABEL: Record<Move, string> = {
  atk: '进攻',
  def: '防守',
  probe: '试探',
  adjust: '调整',
};

/** 0 远间 · 1 一足一刀 · 2 近间 */
export type Distance = 0 | 1 | 2;

export const DISTANCE_LABEL = ['远间', '一足一刀', '近间'] as const;

export type Side = 'p' | 'o';

export type AiStyle = 'aggressive' | 'cautious' | 'adaptive' | 'master';

export interface Fighter {
  name: string;
  atk: number;
  def: number;
  eye: number;
  stamina: number;
  maxStamina: number;
  /** 架势 0(崩) - 4(盛) */
  posture: number;
  points: number;
  techniques: string[];
  weapon: number;
}

export interface RoundRecord {
  round: number;
  pMove: Move;
  oMove: Move;
  lines: string[];
  scorer: Side | null;
  /** 本回合开始时对手意图是否已被看破 */
  revealed: boolean;
}

export interface CombatState {
  round: number;
  maxRounds: number;
  /** 先取几本获胜 */
  target: number;
  distance: Distance;
  initiative: Side | null;
  p: Fighter;
  o: Fighter;
  oppId: string;
  style: AiStyle;
  /** 对手已决定的下一手（对玩家隐藏，除非看破） */
  oppNext: Move;
  /** 玩家是否已看破对手下一手 */
  reveal: boolean;
  /** 对手看破玩家：下一回合对手威力 +1 */
  oppRead: number;
  history: RoundRecord[];
  /** 连续消极防守次数 */
  passive: { p: number; o: number };
  finished: boolean;
  result: 'win' | 'lose' | 'draw' | null;
  rng: number;
}

export interface OpponentDef {
  id: string;
  name: string;
  style: AiStyle;
  atk: number;
  def: number;
  eye: number;
  maxStamina: number;
  techniques?: string[];
  /** 不同情报等级可见的风格说明 */
  styleNote: string;
  /** 对手每种意图的“气配”描写 */
  tells: Record<Move, string>;
}
