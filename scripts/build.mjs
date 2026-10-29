// 构建：esbuild 打包 → dist/index.html（单文件，可直接用手机浏览器打开或部署）
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';

const dev = process.argv.includes('--dev');
mkdirSync('dist', { recursive: true });
const r = await build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  minify: !dev,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  outdir: 'dist/assets',
  write: false,
  define: { 'process.env.NODE_ENV': dev ? '"development"' : '"production"' },
  legalComments: 'none',
});
let js = '', css = '';
for (const f of r.outputFiles) {
  if (f.path.endsWith('.js')) js = f.text;
  if (f.path.endsWith('.css')) css = f.text;
}
const tpl = readFileSync('index.html', 'utf8');
const html = tpl
  .replace('<!--CSS-->', () => `<style>${css}</style>`)
  .replace('<!--JS-->', () => `<script>${js.replace(/<\/script/g, '<\\/script')}</script>`);
writeFileSync('dist/index.html', html);
for (const f of ['manifest.webmanifest', 'sw.js', 'icon.svg']) if (existsSync(`public/${f}`)) copyFileSync(`public/${f}`, `dist/${f}`);
console.log(`dist/index.html ${(html.length / 1024).toFixed(0)} KB`);

// Claude Artifact 版本：不含 html/head/body 外壳、不含 manifest/service worker
const artifactCss = `${css}
.topbar{top:env(safe-area-inset-top,0px);padding-top:8px}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:25;background:#1f2a44}`;
const artifact = `<title>战国浮生录</title>
<meta name="theme-color" content="#1f2a44" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Zhi+Mang+Xing&display=swap" rel="stylesheet" />
<style>${artifactCss}</style>
<div id="root"></div>
<script>${js.replace(/<\/script/g, '<\\/script')}</script>
`;
writeFileSync('dist/artifact.html', artifact);
console.log(`dist/artifact.html ${(artifact.length / 1024).toFixed(0)} KB`);
