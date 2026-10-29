// 可玩性检查：一个偏重交际与智略的玩家，能否及时解锁新分支
import { runPlan, PREFER, type Step } from './playthrough';
const D = (...s: Step[]) => s;
const plan: Step[][] = [
  D(['go', 'town'], ['go', 'dojo'], ['act', 'dojo_chores'], ['go', 'teahouse'], ['act', 'tea_work']),
  D(['go', 'village'], ['act', 'visit_sick'], ['go', 'teahouse'], ['talk', 'oryo'], ['act', 'tea_work']),
  D(['talk', 'oryo'], ['act', 'tea_accounts'], ['act', 'tea_work'], ['go', 'dojo'], ['act', 'dojo_chores']),
  D(['talk', 'oryo'], ['act', 'tea_accounts'], ['act', 'tea_listen'], ['go', 'town'], ['talk', 'seibei'], ['act', 'seibei_help']),
  D(['talk', 'oryo'], ['act', 'tea_accounts'], ['act', 'tea_work'], ['go', 'dojo'], ['act', 'dojo_chores']),
  D(['talk', 'oryo'], ['act', 'tea_accounts'], ['go', 'village'], ['act', 'charcoal'], ['act', 'village_heal']),
  D(['talk', 'oryo'], ['act', 'tea_work'], ['go', 'town'], ['act', 'spy_tail'], ['act', 'seibei_buyer']),
  D(['talk', 'oryo'], ['act', 'tea_accounts'], ['go', 'village'], ['act', 'village_heal'], ['go', 'dojo'], ['act', 'dojo_chores']),
  D(['talk', 'oryo'], ['go', 'village'], ['act', 'village_heal'], ['go', 'dojo'], ['act', 'dojo_swing']),
  D(['go', 'dojo'], ['act', 'dojo_chores'], ['act', 'spar_hayato'], ['go', 'teahouse'], ['act', 'tea_work']),
  D(['go', 'dojo'], ['act', 'dojo_chores'], ['act', 'spar_hayato'], ['go', 'teahouse'], ['act', 'tea_work']),
  D(['go', 'dojo'], ['act', 'dojo_chores'], ['act', 'spar_hayato'], ['go', 'teahouse'], ['act', 'tea_work']),
  D(['go', 'dojo'], ['act', 'dojo_swing'], ['act', 'spar_hayato']),
  D(['go', 'dojo'], ['act', 'dojo_kata'], ['act', 'dojo_swing']),
  D(['go', 'dojo'], ['act', 'dojo_kata']),
  D(['go', 'dojo'], ['act', 'dojo_kata']),
];
const { s, trace } = runPlan(plan, ['说服伝藏', '亲自去军需役所', '笑着给两人', '替炭窑重算', '撕下衣袖', '替街上受伤', '去前线的中岛砦', ...PREFER]);
console.log(trace.filter((t) => /说服|军需|倒一杯|重算|止血|包扎|spy_tail|seibei_buyer|charcoal|无法/.test(t)).join('\n'));
const L = s.player.life;
console.log('结局', s.ending, '日', s.day, '| 智略', L.wit.lv, '口才', L.speech.lv, '医术', L.med.lv, '| spy', s.flags.spyChoice, 'buyer', s.flags.buyerVia, 'hayatoFate', s.flags.hayatoFate);
