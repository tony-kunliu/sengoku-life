// 截取转场与战斗动效的中间帧，并检查音频是否真的在运行
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
const out = process.argv[2];
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.goto('http://127.0.0.1:4173/index.html?debug');
await p.waitForTimeout(900);
await p.screenshot({ path: `${out}/a-title-mid.png` });
await p.getByRole('button', { name: '新的人生' }).click();
await p.fill('#pname', '林一');
await p.getByRole('button', { name: '睁开眼睛' }).click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/b-fusuma.png` });
await p.waitForTimeout(1200);
const st = await p.evaluate(() => ({ state: window.__audio.ctx?.state, ready: window.__audio.ready }));
const pick = async (t) => { const c = p.locator('.overlay.scene .choice:not([disabled])', { hasText: t }); if (await c.count()) await c.first().click(); else await p.locator('.overlay.scene .choice:not([disabled])').first().click(); await p.waitForTimeout(100); };
for (let i = 0; i < 12 && (await p.locator('.overlay.scene').count()); i++) await pick('让我看看');
await p.locator('.region-node', { hasText: '清洲城下' }).click();
for (let i = 0; i < 12 && (await p.locator('.overlay.scene').count()); i++) await pick('帮忙推车');
await p.waitForTimeout(400);
await p.locator('.region-node', { hasText: '柳心馆' }).click();
await p.waitForTimeout(1200);
for (let i = 0; i < 12 && (await p.locator('.overlay.scene').count()) && !(await p.locator('.overlay.combat').count()); i++) await pick('接受挑战');
await p.waitForTimeout(250);
await p.screenshot({ path: `${out}/c-hajime.png` });
let shotStrike = false, shotClash = false;
for (let i = 0; i < 10 && !(await p.locator('.result').count()); i++) {
  await p.locator('.move', { hasText: ['进攻', '防守', '试探', '进攻'][i % 4] }).first().click();
  await p.waitForTimeout(260);
  if (!shotStrike && (await p.locator('.strike.mine, .strike.theirs').count())) { await p.screenshot({ path: `${out}/d-strike.png` }); shotStrike = true; }
  else if (!shotClash && (await p.locator('.strike.block, .strike.clash').count())) { await p.screenshot({ path: `${out}/d-block.png` }); shotClash = true; }
  await p.waitForTimeout(900);
}
await p.waitForTimeout(400);
await p.screenshot({ path: `${out}/e-result.png` });
await p.getByRole('button', { name: '收刀行礼' }).click();
for (let i = 0; i < 12 && (await p.locator('.overlay.scene').count()); i++) await pick('请指教');
// 跳到夜晚并就寝，观察日替卡
for (let i = 0; i < 4; i++) {
  if (await p.locator('.overlay.scene').count()) { await pick('住在茶屋'); continue; }
  const rest = p.locator('.rest');
  if (await rest.count()) await rest.click();
  await p.waitForTimeout(500);
  if (await p.locator('.daycard').count()) { await p.screenshot({ path: `${out}/f-daycard.png` }); break; }
}
await p.waitForTimeout(2500);
await p.locator('.sound-btn').first().click();
await p.waitForTimeout(400);
await p.screenshot({ path: `${out}/g-sound.png` });
console.log(JSON.stringify({ audio: st, errors }));
await b.close();
