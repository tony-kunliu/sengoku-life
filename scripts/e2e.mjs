// 手机尺寸浏览器验收：iPhone 13 视口，真实点击流程 + 截图 + 刷新续玩
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
const out = process.argv[2] || 'shots';
mkdirSync(out, { recursive: true });
const url = 'http://127.0.0.1:4173/index.html';
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('fonts.g') && errors.push(m.text()));
let n = 0;
const shot = async (name) => page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${name}.png` });
const click = async (text) => {
  const b = page.getByRole('button', { name: text }).first();
  await b.waitFor({ timeout: 3000 });
  await b.click();
  await page.waitForTimeout(120);
};
// 推进场景：反复点“继续/结束”或首个可选项
const advance = async (prefer = []) => {
  for (let i = 0; i < 40; i++) {
    if (!(await page.locator('.overlay.scene').count())) return;
    let done = false;
    for (const p of prefer) {
      const b = page.locator('.overlay.scene .choice:not([disabled])', { hasText: p });
      if (await b.count()) { await b.first().click(); done = true; break; }
    }
    if (!done) await page.locator('.overlay.scene .choice:not([disabled])').first().click();
    await page.waitForTimeout(80);
    if (await page.locator('.overlay.combat').count()) return;
  }
};
const fight = async () => {
  for (let i = 0; i < 12; i++) {
    if (await page.locator('.result').count()) break;
    const certain = await page.locator('.hint.lv4').count();
    let move = ['试探', '防守', '进攻', '防守', '调整'][i % 5];
    if (certain) {
      const t = await page.locator('.hint.lv4').innerText();
      move = t.includes('【进攻】') ? '防守' : t.includes('【防守】') ? '试探' : '进攻';
    }
    await page.locator('.move', { hasText: move }).first().click();
    await page.waitForTimeout(80);
    if (i === 1) await shot('combat');
  }
  await shot('combat-result');
  await click('收刀行礼');
};

await page.goto(url);
await page.waitForTimeout(400);
await shot('title');
await click('新的人生');
await page.fill('#pname', '林一');
await shot('name');
await click('睁开眼睛');
await shot('prologue');
await advance(['让我看看']);
await shot('village-map');
await page.locator('.region-node', { hasText: '清洲城下' }).click();
await page.waitForTimeout(150);
await shot('arrive-town');
await advance(['帮忙推车', '读书写字']);
await shot('town-map');
await page.evaluate(() => window.scrollTo(0, 600));
await shot('town-actions');
await page.evaluate(() => window.scrollTo(0, 0));
await page.locator('.region-node', { hasText: '柳心馆' }).click();
await page.waitForTimeout(150);
await advance(['活下去', '接受挑战']);
await shot('combat-start');
await fight();
await advance(['请指教']);
await shot('dojo');
await page.locator('.action', { hasText: '打扫道场' }).click();
await page.waitForTimeout(150);
await shot('admission');
await advance([]);
await page.locator('.person').first().click();
await page.waitForTimeout(200);
await shot('talk');
await click('结束交谈');
await click('人物');
await shot('people');
await page.locator('.npc-card:not([disabled])').first().click();
await page.waitForTimeout(200);
await shot('npc-detail');
await click('关闭');
await click('修行');
await shot('train');
await click('日志');
await shot('log');
// 浏览器返回键回到上一页签
await page.goBack();
await page.waitForTimeout(150);
const tabNow = await page.locator('.tab.on').innerText();
// 刷新后继续
const before = await page.locator('.date-main').innerText();
await page.reload();
await page.waitForTimeout(400);
await click('继续游戏');
const after = await page.locator('.date-main').innerText();
await shot('continued');
// 布局检查：没有横向滚动
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
console.log(JSON.stringify({ errors, tabAfterBack: tabNow, before, after, overflow }, null, 1));
await browser.close();
