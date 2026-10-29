import { build } from 'esbuild';
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const out = process.argv[2];
const seconds = Number(process.argv[3] || 16);
const style = process.argv[4] || 'bright';
mkdirSync(out, { recursive: true });
const r = await build({ entryPoints: ['scripts/render-audio.ts'], bundle: true, write: false, format: 'iife' });
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.setContent('<html><body></body></html>');
await p.addScriptTag({ content: r.outputFiles[0].text });
const wav = (L, R, sr) => {
  const n = L.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4);
  }
  return buf;
};
const ids = ['title', 'town', 'dojo', 'teahouse', 'village', 'night', 'combat', 'ending'];
const report = {};
for (const id of ids) {
  const [L, R] = await p.evaluate(([id, s, st]) => window.renderTheme(id, s, 2, st), [id, seconds, style]);
  let peak = 0, sum = 0, nan = 0, silentSec = 0;
  const sr = 32000;
  for (let i = 0; i < L.length; i++) { const v = L[i]; if (!Number.isFinite(v)) nan++; peak = Math.max(peak, Math.abs(v)); sum += v * v; }
  for (let s0 = 0; s0 + sr <= L.length; s0 += sr) { let m = 0; for (let i = s0; i < s0 + sr; i++) m = Math.max(m, Math.abs(L[i])); if (m < 0.003) silentSec++; }
  report[id] = { peak: +peak.toFixed(3), rmsDb: +(10 * Math.log10(sum / L.length)).toFixed(1), nan, silentSec };
  writeFileSync(`${out}/${id}.wav`, wav(L, R, sr));
}
console.log(JSON.stringify(report, null, 1));
await b.close();
