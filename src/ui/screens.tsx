import { useState } from 'react';
import { buildContext, dialogue } from '../ai/dialogue';
import { SLOT_LABEL, dateLabel, fullDateLabel } from '../engine/calendar';
import { R } from '../engine/core';
import {
  TECH_DESC,
  TECH_NAMES,
  actionLock,
  actionsHere,
  isNpcHere,
  performAction,
  sleep,
  talk,
  travel,
  travelCost,
  txt,
} from '../engine/game';
import { REG } from '../engine/registry';
import { deleteSlot, fromCode, readMeta, readSlot, storageAvailable, toCode, writeSlot, type SlotKey } from '../engine/save';
import { STAT_FULL, nextRepGain } from '../engine/training';
import type { GameState, LocationId, NpcId, Stance, StatKey } from '../engine/types';
import type { Apply } from './App';
import { SceneArt } from './art';
import { CharPortrait } from './portrait';

const STANCE: Record<Stance, string> = {
  stranger: '未相识',
  neutral: '相识',
  friendly: '友好',
  rival: '对手',
  ally: '知己',
  wary: '戒备',
};

const LOC_ORDER: LocationId[] = ['village', 'town', 'teahouse', 'dojo'];

// ───────────────────────── 地图 ─────────────────────────
export function MapScreen({ s, apply }: { s: GameState; apply: Apply }) {
  const loc = REG.locations[s.location];
  const [talkNpc, setTalkNpc] = useState<NpcId | null>(null);
  const people = (Object.keys(REG.npcs) as NpcId[]).filter((id) => id !== 'nobunaga' && isNpcHere(s, id));
  const acts = actionsHere(s);
  const known = (l: LocationId) => l !== 'dojo' || !!s.flags.dojoKnown;
  const townOk = (l: LocationId) => l === 'village' || !!s.flags.townArrived || l === 'town';

  return (
    <div className="screen">
      <section className="loc-hero">
        <SceneArt name={loc.art} className="hero-art" />
        <div className="loc-title">
          <h1>{loc.name}</h1>
          <p>{loc.sub}</p>
        </div>
      </section>

      <section className="region" aria-label="移动">
        <div className="region-river" aria-hidden="true" />
        {LOC_ORDER.map((l) => {
          const d = REG.locations[l];
          const here = l === s.location;
          const ok = known(l) && townOk(l);
          const cost = travelCost(s.location, l);
          return (
            <button
              key={l}
              className={`region-node ${here ? 'here' : ''}`}
              disabled={here || !ok}
              onClick={() => apply((g) => travel(g, l))}
              aria-label={`前往${d.name}`}
            >
              <span className="node-dot" />
              <span className="node-name">{ok ? d.name.replace('城外·', '') : '？？'}</span>
              <span className="node-cost">{here ? '你在这里' : !ok ? '未发现' : cost ? '半个时辰' : '步行可达'}</span>
            </button>
          );
        })}
      </section>

      <p className="loc-desc">{txt(s, loc.desc)}</p>

      <section className="block">
        <h2>在场的人</h2>
        {people.length === 0 && <p className="muted">这里现在没有熟识的人。不同时段，人们会在不同的地方。</p>}
        <div className="people-row">
          {people.map((id) => {
            const n = REG.npcs[id];
            const met = s.npcs[id].rel.met;
            return (
              <button key={id} className="person" onClick={() => { apply((g) => talk(g, id)); setTalkNpc(id); }}>
                <CharPortrait id={id} size={44} unknown={!met} />
                <span className="person-text">
                  <strong>{met ? n.name : '陌生人'}</strong>
                  <small>{n.where(s).doing}</small>
                </span>
                <span className="person-act">交谈</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="block">
        <h2>可以做的事 <span className="slot-left">今日剩余 {3 - s.slot} 个时段</span></h2>
        <ul className="actions">
          {acts.map((a) => {
            const lock = actionLock(s, a.id);
            if (a.npc && !isNpcHere(s, a.npc)) return null;
            return (
              <li key={a.id}>
                <button className="action" disabled={!!lock} onClick={() => apply((g) => performAction(g, a.id))}>
                  <span className="action-icon" aria-hidden="true">{a.icon ?? '・'}</span>
                  <span className="action-body">
                    <span className="action-label">
                      {txt(s, a.label)}
                      {a.tag && <em className="tag">{a.tag}</em>}
                    </span>
                    <span className="action-desc">{lock ?? txt(s, a.desc)}</span>
                  </span>
                  <span className="action-cost">{a.cost ? `${a.cost} 时段` : '不耗时'}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button className="rest" onClick={() => apply(sleep)}>
          {s.slot === 2 ? '就寝，迎接明天' : '休息到明天'}
          <small>{s.slot === 2 ? '' : `跳过剩下的${SLOT_LABEL.slice(s.slot).join('、')}（途中有事会被叫醒）`}</small>
        </button>
      </section>

      {talkNpc && <TalkSheet s={s} npc={talkNpc} onClose={() => setTalkNpc(null)} />}
    </div>
  );
}

function TalkSheet({ s, npc, onClose }: { s: GameState; npc: NpcId; onClose: () => void }) {
  const n = REG.npcs[npc];
  const raw = String(s.flags.lastTalk ?? '');
  const [who, ...rest] = raw.split('|');
  const line = who === npc ? rest.join('|') : '……';
  const r = R(s, npc);
  void buildContext;
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" onClick={(e: Event) => e.stopPropagation()} role="dialog" aria-label={`与${n.name}交谈`}>
        <div className="speaker talk-speaker">
          <CharPortrait id={npc} size={96} crop="bust" />
          <div>
            <strong>{n.name}</strong>
            <small>{STANCE[r.stance]} · {n.status(s)}</small>
          </div>
        </div>
        <p className="say">{line}</p>
        <RelBars s={s} npc={npc} />
        <div className="ai-off">
          <strong>自由对话</strong>
          <span>{dialogue.enabled ? '' : dialogue.reason}</span>
        </div>
        <button className="primary" onClick={onClose}>
          结束交谈
        </button>
      </div>
    </div>
  );
}

function Bar({ label, v, color }: { label: string; v: number; color: string }) {
  const w = Math.max(0, Math.min(100, v));
  return (
    <div className="bar">
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span className="bar-fill" style={{ width: `${w}%`, background: color }} />
      </span>
      <span className="bar-num">{v}</span>
    </div>
  );
}

function RelBars({ s, npc }: { s: GameState; npc: NpcId }) {
  const r = R(s, npc);
  return (
    <div className="bars">
      <Bar label="信任" v={r.trust} color="var(--indigo)" />
      <Bar label="尊敬" v={r.respect} color="var(--gold)" />
      <Bar label="恩义" v={r.favor} color="var(--vermilion)" />
    </div>
  );
}

// ───────────────────────── 人物 ─────────────────────────
export function PeopleScreen({ s }: { s: GameState; apply: Apply }) {
  const [open, setOpen] = useState<NpcId | null>(null);
  const ids = (Object.keys(REG.npcs) as NpcId[]).filter((id) => REG.npcs[id].major || s.npcs[id].rel.met);
  return (
    <div className="screen pad">
      <h1 className="page-title">人物</h1>
      <p className="muted">人物会记住你做过的事。关系会解锁新的修行、委托和抉择。</p>
      <ul className="npc-list">
        {ids.map((id) => {
          const n = REG.npcs[id];
          const st = s.npcs[id];
          const met = st.rel.met;
          const w = n.where(s);
          return (
            <li key={id}>
              <button className="npc-card" disabled={!met} onClick={() => setOpen(id)}>
                <CharPortrait id={id} size={50} unknown={!met} />
                <span className="npc-main">
                  <strong>
                    {met ? n.name : '尚未相识'}
                    {met && n.historical && <em className="tag hist">史实</em>}
                  </strong>
                  <small>{met ? `${STANCE[st.rel.stance]} · ${n.status(s)}` : '也许会在清洲的某处遇见'}</small>
                  {met && (
                    <small className="where">
                      {w.loc ? `此刻：${REG.locations[w.loc].name} · ${w.doing}` : `此刻：${w.doing}`}
                    </small>
                  )}
                </span>
                {met && <span className="mem-count">{st.memories.length} 段记忆</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {open && (
        <div className="sheet-back" onClick={() => setOpen(null)}>
          <div className="sheet tall" onClick={(e: Event) => e.stopPropagation()} role="dialog">
            <NpcDetail s={s} id={open} />
            <button className="primary" onClick={() => setOpen(null)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NpcDetail({ s, id }: { s: GameState; id: NpcId }) {
  const n = REG.npcs[id];
  const st = s.npcs[id];
  return (
    <div className="npc-detail">
      <div className="speaker">
        <CharPortrait id={id} size={120} crop="bust" />
        <div>
          <strong>{n.name}</strong>
          <small>
            {n.reading} · {n.age} 岁
          </small>
        </div>
      </div>
      <dl className="facts">
        <dt>身份</dt>
        <dd>{n.role}</dd>
        <dt>性格</dt>
        <dd>{n.personality}</dd>
        <dt>心愿</dt>
        <dd>{n.goal}</dd>
        <dt>现状</dt>
        <dd>{n.status(s)}</dd>
      </dl>
      {id !== 'nobunaga' && <RelBars s={s} npc={id} />}
      <h3>记忆</h3>
      {st.memories.length === 0 ? (
        <p className="muted">还没有值得记住的事。</p>
      ) : (
        <ol className="memories">
          {st.memories.map((m) => (
            <li key={m.id}>
              <span className="mem-day">{dateLabel(m.day)}</span>
              {m.text}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ───────────────────────── 修行 ─────────────────────────
export function TrainScreen({ s }: { s: GameState }) {
  const p = s.player;
  const base: Record<StatKey, number> = { atk: 30, def: 30, eye: 22 };
  return (
    <div className="screen pad">
      <h1 className="page-title">修行</h1>
      <div className="me">
        <CharPortrait id="player" size={56} />
        <div>
          <strong>{p.name}</strong>
          <small>
            {s.flags.masterRecognized ? '柳心流 初目录' : s.flags.admitted ? '柳心馆门下' : '来历不明的旅人'} · 住处：
            {p.lodging === 'teahouse' ? '茶屋水月' : p.lodging === 'forge' ? '清兵卫铺子阁楼' : '无'}
          </small>
        </div>
      </div>

      <section className="block">
        <h2>能力</h2>
        {(['atk', 'def', 'eye'] as StatKey[]).map((k) => {
          const st = p.stats[k];
          const capped = st.lv >= st.cap;
          return (
            <div key={k} className="stat">
              <div className="stat-head">
                <strong>{STAT_FULL[k]}</strong>
                <span className="pips" aria-label={`${st.lv} / 上限 ${st.cap}`}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className={`pip ${i < st.lv ? 'on' : i < st.cap ? 'open' : 'locked'}`} />
                  ))}
                </span>
                <span className="stat-num">
                  {st.lv}
                  <small>/{st.cap}</small>
                </span>
              </div>
              <div className="xp">
                <span className="xp-fill" style={{ width: `${st.xp}%` }} />
              </div>
              <small className="muted">
                {capped
                  ? '已到瓶颈：需要师父指导突破上限'
                  : k === 'eye'
                    ? '靠观摩与实战中的试探成长'
                    : `重复训练下一次 +${nextRepGain(s, k, base[k])}（实战后恢复）`}
              </small>
            </div>
          );
        })}
        <div className="stat">
          <div className="stat-head">
            <strong>气力</strong>
            <span className="stat-num">{p.maxStamina}</span>
          </div>
          <small className="muted">比试中的体力上限。在村外山路奔跑可以提升。</small>
        </div>
        {p.weapon > 0 && <p className="muted">兵器：清兵卫特制橡木木刀（威力 +{p.weapon}）</p>}
      </section>

      <section className="block">
        <h2>技法</h2>
        {p.techniques.length === 0 ? (
          <p className="muted">尚未习得任何技法。获得师父认可、与人结下交情，都可能学到新东西。</p>
        ) : (
          <ul className="techs">
            {p.techniques.map((t) => (
              <li key={t}>
                <strong>{TECH_NAMES[t]}</strong>
                <span>{TECH_DESC[t]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="block">
        <h2>对手情报</h2>
        <ul className="intel">
          {Object.values(REG.opponents)
            .filter((o) => (s.oppKnowledge[o.id] ?? 0) > 0 || (s.flags[`bouts_${o.id}`] as number) > 0)
            .map((o) => {
              const k = s.oppKnowledge[o.id] ?? 0;
              return (
                <li key={o.id}>
                  <strong>{o.name}</strong>
                  <span className="stars">{'◆'.repeat(k)}{'◇'.repeat(3 - k)}</span>
                  <small>
                    {(s.flags[`wins_${o.id}`] as number) ?? 0} 胜 / {(s.flags[`bouts_${o.id}`] as number) ?? 0} 战
                  </small>
                  {k >= 1 && <p>{o.styleNote}</p>}
                </li>
              );
            })}
        </ul>
        <p className="muted">战绩：{s.record.wins} 胜 {s.record.losses} 败 · 共 {s.record.bouts} 战</p>
      </section>

      <section className="block rules">
        <h2>剑术心得</h2>
        <p>
          <b>进攻</b>克试探与调整；<b>防守</b>克进攻，守备够高能反击；<b>试探</b>能破开防守并看破对方下一手；<b>调整</b>恢复气力和架势，但会被趁机进攻。
        </p>
        <p>距离、架势、主动与气力决定克制能否兑现。远间进攻吃亏，近间威力更强。连续消极防守会被裁判判罚。</p>
      </section>
    </div>
  );
}

// ───────────────────────── 日志与存档 ─────────────────────────
export function LogScreen({ s, setG, toTitle }: { s: GameState; setG: (s: GameState) => void; toTitle: () => void }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [, force] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const items = [...s.log].reverse().filter((l) => l.kind !== 'action' || true);
  const slots: SlotKey[] = ['1', '2', '3'];
  const canStore = storageAvailable();

  return (
    <div className="screen pad">
      <h1 className="page-title">日志</h1>

      <section className="block">
        <h2>存档</h2>
        <p className="muted">{canStore ? '每次行动后都会自动存档。也可以存到手动档位。' : '此浏览器无法本地保存，请使用下方存档码备份。'}</p>
        <ul className="slots">
          {slots.map((k) => {
            const m = readMeta(k);
            return (
              <li key={k}>
                <span className="slot-name">档位 {k}</span>
                <span className="slot-meta">{m ? `${m.name} · ${dateLabel(m.day)}` : '空'}</span>
                <button
                  className="mini"
                  onClick={() => {
                    setMsg(writeSlot(k, s) ? `已存到档位 ${k}` : '存档失败');
                    force((x: number) => x + 1);
                  }}
                >
                  存档
                </button>
                <button
                  className="mini"
                  disabled={!m}
                  onClick={() => {
                    const g = readSlot(k);
                    if (g) {
                      setG(g);
                      setMsg(`已读取档位 ${k}`);
                    } else setMsg('读档失败');
                  }}
                >
                  读档
                </button>
              </li>
            );
          })}
        </ul>
        <details className="code-box">
          <summary>存档码（复制到备忘录可永久保存）</summary>
          <textarea readOnly value={toCode(s)} onFocus={(e: FocusEvent) => (e.target as HTMLTextAreaElement).select()} rows={3} />
          <button
            className="mini"
            onClick={() => {
              try {
                navigator.clipboard.writeText(toCode(s));
                setMsg('存档码已复制');
              } catch {
                setMsg('请长按文本框手动复制');
              }
            }}
          >
            复制存档码
          </button>
          <textarea placeholder="粘贴存档码以读取" value={code} onInput={(e: Event) => setCode((e.target as HTMLTextAreaElement).value)} rows={3} />
          <button
            className="mini"
            disabled={!code.trim()}
            onClick={() => {
              try {
                setG(fromCode(code));
                setMsg('读取成功');
                setCode('');
              } catch (e) {
                setMsg(`读取失败：${(e as Error).message}`);
              }
            }}
          >
            读取存档码
          </button>
        </details>
        {msg && <p className="ok-msg" role="status">{msg}</p>}
        <div className="danger">
          {!confirmReset ? (
            <button className="mini ghost" onClick={() => setConfirmReset(true)}>
              重新开始…
            </button>
          ) : (
            <>
              <span>确定放弃当前进度？（手动档位会保留）</span>
              <button
                className="mini warn-btn"
                onClick={() => {
                  deleteSlot('auto');
                  toTitle();
                }}
              >
                确定，回到标题
              </button>
              <button className="mini" onClick={() => setConfirmReset(false)}>
                取消
              </button>
            </>
          )}
        </div>
      </section>

      <section className="block">
        <h2>事件记录</h2>
        <ol className="log">
          {items.map((l, i) => (
            <li key={i} className={`log-${l.kind}`}>
              {l.kind !== 'system' && <span className="log-time">{fullDateLabel(l.day, l.slot).replace('永禄三年 ', '')}</span>}
              <span>{l.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
