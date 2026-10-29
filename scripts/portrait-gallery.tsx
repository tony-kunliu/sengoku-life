// 立绘总览：node scripts/portrait-gallery.mjs <目录>
import { createRoot } from 'react-dom/client';
import { PORTRAITS } from '../src/content/portraits';
import { Portrait } from '../src/ui/portrait';

createRoot(document.getElementById('root')!).render(
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 12, background: '#efe8da', fontFamily: 'serif' }}>
    {Object.entries(PORTRAITS).map(([id, p]) => (
      <figure key={id} style={{ margin: 0, textAlign: 'center' }}>
        <Portrait spec={p} size={200} crop="bust" />
        <figcaption>{id}</figcaption>
        <Portrait spec={p} size={56} />
      </figure>
    ))}
  </div>,
);
