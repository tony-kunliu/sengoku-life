// 结局图鉴：跨存档保存在本机（与游戏存档分开）
const KEY = 'sengoku-life:endings';

export function seenEndings(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function recordEnding(id: string) {
  try {
    const seen = seenEndings();
    if (!seen.includes(id)) localStorage.setItem(KEY, JSON.stringify([...seen, id]));
  } catch {
    /* 存储不可用 */
  }
}
