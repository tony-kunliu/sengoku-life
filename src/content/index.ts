// 将“1560 清洲”剧本注册到引擎。未来的其他年份/地点可以写成新的剧本包。
import { REG } from '../engine/registry';
import { ACTIONS } from './actions';
import { LOCATIONS } from './locations';
import { NPCS } from './npcs';
import { OPPONENTS } from './opponents';
import { DOJO } from './scenes/dojo';
import { OPENING } from './scenes/opening';
import { SOCIAL } from './scenes/social';
import { WAR } from './scenes/war';
import { talkLine } from './talk';
import { onNewDay, opponentFor, rumorsNow } from './world';

let done = false;

export function registerContent() {
  if (done) return;
  done = true;
  for (const sc of [...OPENING, ...DOJO, ...SOCIAL, ...WAR]) {
    if (REG.scenes[sc.id]) throw new Error(`重复的场景 id：${sc.id}`);
    REG.scenes[sc.id] = sc;
  }
  REG.actions.push(...ACTIONS);
  Object.assign(REG.npcs, NPCS);
  Object.assign(REG.locations, LOCATIONS);
  Object.assign(REG.opponents, OPPONENTS);
  REG.opponentFor = opponentFor;
  REG.talk = talkLine;
  REG.onNewDay = onNewDay;
  REG.rumorsNow = rumorsNow;
}

registerContent();
