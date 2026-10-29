import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/styles.css';
import { audio } from './audio/engine';

// 调试/自动化测试用：?debug 时暴露音频状态
if (location.search.includes('debug')) (window as unknown as { __audio: typeof audio }).__audio = audio;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// PWA：只在自有域名下注册（嵌入预览中跳过）
if ('serviceWorker' in navigator && location.protocol === 'https:' && !location.hostname.endsWith('claude.ai') && window.top === window) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
