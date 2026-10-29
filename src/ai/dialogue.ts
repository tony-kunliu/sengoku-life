// 可选 AI 自由对话适配器。
// 原则：规则引擎决定事实，AI 只负责“说话”；AI 永远拿不到修改状态的接口。
// 浏览器里不得出现 API 密钥 —— 只有在配置了安全的服务端代理时才会启用。
import { R } from '../engine/core';
import { REG } from '../engine/registry';
import type { GameState, NpcId } from '../engine/types';

export interface DialogueAdapter {
  readonly enabled: boolean;
  readonly reason: string;
  reply(context: DialogueContext, playerLine: string): Promise<string>;
}

/** 交给 AI 的只读上下文：经过筛选的人物设定、关系与记忆 */
export interface DialogueContext {
  npc: { name: string; age: number; role: string; personality: string; goal: string; status: string };
  relation: { trust: number; respect: number; favor: number; stance: string };
  memories: string[];
  world: { date: string; rumors: string[] };
  playerName: string;
}

export function buildContext(s: GameState, npc: NpcId, date: string): DialogueContext {
  const d = REG.npcs[npc];
  const r = R(s, npc);
  return {
    npc: { name: d.name, age: d.age, role: d.role, personality: d.personality, goal: d.goal, status: d.status(s) },
    relation: { trust: r.trust, respect: r.respect, favor: r.favor, stance: r.stance },
    memories: s.npcs[npc].memories.map((m) => m.text).slice(-8),
    world: { date, rumors: REG.rumorsNow(s).slice(0, 3) },
    playerName: s.player.name,
  };
}

/** 默认：未启用。不会伪装成 AI。 */
export const disabledAdapter: DialogueAdapter = {
  enabled: false,
  reason: '当前版本没有配置安全的服务端 AI，自由对话未启用。全部剧情都可以通过固定选项完整体验。',
  async reply() {
    throw new Error('AI 对话未启用');
  },
};

/**
 * 服务端代理适配器（未来使用）：前端只把只读上下文发给自己的后端，
 * 由后端持有密钥调用模型，返回一段台词文本。返回值只用于显示，不会改变任何游戏状态。
 */
export function proxyAdapter(endpoint: string): DialogueAdapter {
  return {
    enabled: true,
    reason: '',
    async reply(context, playerLine) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, playerLine }),
      });
      if (!res.ok) throw new Error(`对话服务返回 ${res.status}`);
      const data = (await res.json()) as { text?: string };
      return String(data.text ?? '').slice(0, 400);
    },
  };
}

export const dialogue: DialogueAdapter = disabledAdapter;
