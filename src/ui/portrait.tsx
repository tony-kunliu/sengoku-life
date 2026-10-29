// 人物立绘：金箔底半身像，墨线 + 淡彩。全部由代码绘制，原创设计。
import { PORTRAITS, type PortraitSpec } from '../content/portraits';

const INK = '#2b211b';
const W = 200;

const mirror = `translate(${W},0) scale(-1,1)`;

function Defs() {
  return (
    <defs>
      <linearGradient id="pt-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d9b866" />
        <stop offset="0.55" stopColor="#c59d48" />
        <stop offset="1" stopColor="#a87f33" />
      </linearGradient>
      <linearGradient id="pt-silver" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d7d6cf" />
        <stop offset="1" stopColor="#a9aab0" />
      </linearGradient>
      <linearGradient id="pt-dusk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c08c4a" />
        <stop offset="1" stopColor="#6e4a2c" />
      </linearGradient>
      <pattern id="pt-leaf" width="34" height="34" patternUnits="userSpaceOnUse">
        <path d="M0 0 H34 V34" fill="none" stroke="#000" strokeOpacity="0.07" strokeWidth="1" />
      </pattern>
      <radialGradient id="pt-cheek" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#d9826a" stopOpacity="0.32" />
        <stop offset="1" stopColor="#d9826a" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function Background({ bg }: { bg: PortraitSpec['bg'] }) {
  const fill = bg === 'silver' ? 'url(#pt-silver)' : bg === 'dusk' ? 'url(#pt-dusk)' : 'url(#pt-gold)';
  return (
    <g>
      <rect width={W} height="240" fill={fill} />
      <rect width={W} height="240" fill="url(#pt-leaf)" />
      {/* 金云（すやり霞） */}
      <g fill="#fff6dc" opacity="0.28">
        <rect x="-20" y="22" width="120" height="16" rx="8" />
        <rect x="120" y="44" width="110" height="14" rx="7" />
        <rect x="-30" y="196" width="100" height="14" rx="7" />
      </g>
    </g>
  );
}

// ───────── 身体与服饰 ─────────
function Body({ p }: { p: PortraitSpec }) {
  const shoulders = 'M-4 240 L-4 206 C 8 186, 44 176, 80 172 L120 172 C156 176, 192 186, 204 206 L204 240 Z';
  const crest = p.crest ? <Crest kind={p.crest} x={150} y={208} color={p.outfit === 'dogi' ? p.inner : '#efe6d0'} /> : null;
  if (p.outfit === 'armor') {
    return (
      <g>
        <path d={shoulders} fill={p.cloth} stroke={INK} strokeWidth="1.5" />
        {/* 袖（肩甲） */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <path d={`M${6 + i * 3} ${196 + i * 11} L${58 - i * 2} ${188 + i * 11} L${60 - i * 2} ${197 + i * 11} L${8 + i * 3} ${206 + i * 11} Z`} fill="#2a2622" stroke={INK} />
            <path d={`M${194 - i * 3} ${196 + i * 11} L${142 + i * 2} ${188 + i * 11} L${140 + i * 2} ${197 + i * 11} L${192 - i * 3} ${206 + i * 11} Z`} fill="#2a2622" stroke={INK} />
            <line x1={10 + i * 3} y1={201 + i * 11} x2={56 - i * 2} y2={193 + i * 11} stroke={p.accent} strokeWidth="2" />
            <line x1={190 - i * 3} y1={201 + i * 11} x2={144 + i * 2} y2={193 + i * 11} stroke={p.accent} strokeWidth="2" />
          </g>
        ))}
        {/* 胴 */}
        <path d="M64 186 L136 186 L140 240 L60 240 Z" fill="#2f2b27" stroke={INK} strokeWidth="1.5" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="62" y1={196 + i * 10} x2="138" y2={196 + i * 10} stroke={p.accent} strokeWidth="2.2" />
        ))}
        <path d="M86 170 L100 186 L114 170" fill="none" stroke="#efe6d0" strokeWidth="5" />
      </g>
    );
  }
  const collarOuter = p.outfit === 'dogi' ? 9 : 7;
  return (
    <g>
      <path d={shoulders} fill={p.cloth} stroke={INK} strokeWidth="1.5" />
      {/* 衣纹 */}
      <path d="M40 200 C 52 214, 54 226, 52 240 M160 200 C 148 214, 146 226, 148 240" stroke={INK} strokeOpacity="0.25" strokeWidth="1.2" fill="none" />
      {p.outfit === 'yukata' && (
        <g fill={p.accent} opacity="0.75">
          {[
            [28, 214],
            [62, 226],
            [138, 222],
            [172, 210],
            [176, 236],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="7" fill="none" stroke={p.accent} strokeWidth="3" />
          ))}
        </g>
      )}
      {p.outfit === 'farmer' && <path d="M20 214 L60 206 M150 206 L184 216" stroke={INK} strokeOpacity="0.3" strokeWidth="2" />}
      {/* 内衬（襦袢）与衣领：左衽在上（观者看来从右上到左下） */}
      <path d="M84 168 L104 220 L96 222 L78 172 Z" fill={p.inner} stroke={INK} strokeWidth="1" />
      <path d="M116 168 L96 226 L104 228 L122 172 Z" fill={p.inner} stroke={INK} strokeWidth="1" />
      <path
        d={`M${78 - collarOuter} 172 L${100 - 2} 238 L${100 + collarOuter} 238 L78 170 Z`}
        fill={p.outfit === 'dogi' ? p.inner : p.accent}
        stroke={INK}
        strokeWidth="1"
        opacity={p.outfit === 'dogi' ? 1 : 0.9}
      />
      <path
        d={`M${122 + collarOuter} 172 L${100 - collarOuter} 240 L${100 + 2} 240 L122 170 Z`}
        fill={p.outfit === 'dogi' ? p.inner : p.accent}
        stroke={INK}
        strokeWidth="1"
        opacity={p.outfit === 'dogi' ? 1 : 0.9}
      />
      {p.outfit === 'kataginu' && (
        <g>
          {/* 肩衣：硬挺外张的肩 */}
          <path d="M-4 194 L62 178 L70 196 L-4 214 Z" fill={p.cloth} stroke={INK} strokeWidth="1.5" />
          <path d="M204 194 L138 178 L130 196 L204 214 Z" fill={p.cloth} stroke={INK} strokeWidth="1.5" />
          <path d="M8 198 L60 186 M192 198 L140 186" stroke={p.accent} strokeWidth="1.5" />
        </g>
      )}
      {p.outfit === 'work' && (
        <g>
          {/* 襷（束袖带） */}
          <path d="M20 196 L170 240 M180 196 L30 240" stroke={p.accent} strokeWidth="5" opacity="0.85" />
        </g>
      )}
      {p.outfit === 'kosode' && p.hair === 'woman' && (
        <g fill={p.accent} opacity="0.6">
          {[24, 44, 150, 170, 34, 160].map((x, i) => (
            <path key={i} d={`M${x} ${210 + (i % 3) * 10} l4 -6 l4 6 l-4 6 Z`} />
          ))}
        </g>
      )}
      {crest}
    </g>
  );
}

function Crest({ kind, x, y, color }: { kind: 'mokko' | 'kikyo' | 'circle'; x: number; y: number; color: string }) {
  if (kind === 'circle')
    return (
      <g>
        <circle cx={x} cy={y} r="7" fill="none" stroke={color} strokeWidth="2" />
        <circle cx={x} cy={y} r="2.5" fill={color} />
      </g>
    );
  const petals = kind === 'mokko' ? 4 : 5;
  return (
    <g>
      <circle cx={x} cy={y} r="8" fill="none" stroke={color} strokeWidth="1.5" />
      {Array.from({ length: petals }).map((_, i) => {
        const a = (i / petals) * Math.PI * 2 - Math.PI / 2;
        return <ellipse key={i} cx={x + Math.cos(a) * 3.8} cy={y + Math.sin(a) * 3.8} rx="2.6" ry="2.2" fill={color} />;
      })}
    </g>
  );
}

// ───────── 头部 ─────────
function facePath(jaw: PortraitSpec['jaw']) {
  if (jaw === 'narrow') return 'M70 94 C 70 62, 130 62, 130 94 C 130 118, 123 134, 112 143 C 106 148, 94 148, 88 143 C 77 134, 70 118, 70 94 Z';
  if (jaw === 'square') return 'M67 94 C 67 60, 133 60, 133 94 C 133 120, 129 136, 118 145 C 110 151, 90 151, 82 145 C 71 136, 67 120, 67 94 Z';
  return 'M68 94 C 68 60, 132 60, 132 94 C 132 119, 126 136, 114 145 C 107 150, 93 150, 86 145 C 74 136, 68 119, 68 94 Z';
}

function Eye({ kind }: { kind: PortraitSpec['eyes'] }) {
  // 以观者左眼为基准绘制，右眼镜像
  const shapes: Record<PortraitSpec['eyes'], { white: string; lid: string; iy: number; ir: number }> = {
    sharp: { white: 'M75 101 Q 84 95 95 98 Q 86 104 75 101 Z', lid: 'M73 101 Q 83 92 97 97 Q 84 95.5 73 102 Z', iy: 99.6, ir: 3 },
    gentle: { white: 'M75 99 Q 85 94 94 99 Q 85 104 75 99 Z', lid: 'M73 100 Q 85 91.5 96 99 Q 85 95 73 101 Z', iy: 99.4, ir: 3.4 },
    narrow: { white: 'M76 100 Q 85 97 94 99 Q 85 102 76 100 Z', lid: 'M73 100.5 Q 85 94.5 97 98.5 Q 85 97 73 101.5 Z', iy: 99.8, ir: 2.4 },
    old: { white: 'M76 101 Q 85 97 93 100 Q 85 103 76 101 Z', lid: 'M74 100 Q 85 95 95 99.5 Q 85 97.6 74 101 Z', iy: 100.3, ir: 2.4 },
    bright: { white: 'M75 100 Q 85 93 95 99 Q 85 105 75 100 Z', lid: 'M73 100 Q 85 90.5 97 98.5 Q 85 94 73 101 Z', iy: 99.4, ir: 3.6 },
  };
  const e = shapes[kind];
  return (
    <g>
      <path d={e.white} fill="#fbf6ec" />
      <circle cx="85.5" cy={e.iy} r={e.ir} fill="#2a1d16" />
      <circle cx="86.6" cy={e.iy - 1} r={e.ir * 0.28} fill="#fff" />
      <path d={e.lid} fill={INK} />
      {kind === 'old' && <path d="M77 105 Q 85 108 93 104" fill="none" stroke={INK} strokeOpacity="0.35" strokeWidth="0.9" />}
      {kind === 'gentle' && <path d="M78 103.5 Q 85 106 92 103" fill="none" stroke={INK} strokeOpacity="0.25" strokeWidth="0.8" />}
    </g>
  );
}

function Brow({ kind, color }: { kind: PortraitSpec['brows']; color: string }) {
  const d: Record<PortraitSpec['brows'], string> = {
    thick: 'M72 89 Q 82 81 96 85 Q 84 85.5 72 92 Z',
    fine: 'M74 88 Q 84 83 95 86 Q 84 85.5 74 89.5 Z',
    sharp: 'M72 87 Q 84 85 97 81 Q 85 87 73 90 Z',
    white: 'M71 90 Q 82 82 96 86 Q 84 86 71 93 Z',
  };
  return <path d={d[kind]} fill={kind === 'white' ? '#e9e5dc' : color} stroke={kind === 'white' ? '#a39d93' : 'none'} strokeWidth="0.6" />;
}

function Mouth({ kind }: { kind: PortraitSpec['mouth'] }) {
  switch (kind) {
    case 'smile':
      return <path d="M91 130 Q 100 136.5 109 130" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />;
    case 'stern':
      return <path d="M91 132.5 Q 100 130.5 109 132.5" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />;
    case 'smirk':
      return <path d="M91 132 Q 101 133.5 109 129" fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />;
    case 'lips':
      return (
        <g>
          <path d="M93 131 Q 97 129 100 130.4 Q 103 129 107 131 Q 100 135.5 93 131 Z" fill="#b8423a" />
          <path d="M93 131 Q 100 132.2 107 131" fill="none" stroke="#6e221c" strokeWidth="0.8" />
        </g>
      );
    default:
      return <path d="M92 131.5 Q 100 133 108 131.5" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />;
  }
}

function Beard({ kind, color }: { kind: PortraitSpec['beard']; color: string }) {
  switch (kind) {
    case 'stubble':
      return <path d="M80 128 C 84 146, 116 146, 120 128 C 116 140, 84 140, 80 128 Z" fill="#3a3a3a" opacity="0.14" />;
    case 'mustache':
      return (
        <g fill={color}>
          <path d="M100 125 Q 92 123 87 128 Q 93 126.5 100 127.4 Z" />
          <path d="M100 125 Q 108 123 113 128 Q 107 126.5 100 127.4 Z" />
        </g>
      );
    case 'whitegoatee':
      return (
        <g fill="#ece8e0" stroke="#a39d93" strokeWidth="0.6">
          <path d="M100 125.5 Q 90 123 85 130 Q 92 127.5 100 128 Z" />
          <path d="M100 125.5 Q 110 123 115 130 Q 108 127.5 100 128 Z" />
          <path d="M94 139 Q 100 162 106 139 Q 100 143 94 139 Z" />
        </g>
      );
    case 'full':
      return (
        <g>
          <path d="M74 118 C 76 146, 92 154, 100 154 C 108 154, 124 146, 126 118 C 120 136, 112 141, 100 141 C 88 141, 80 136, 74 118 Z" fill={color} opacity="0.85" />
          <path d="M100 125 Q 90 122 85 129 Q 93 126.5 100 127.6 Q 107 126.5 115 129 Q 110 122 100 125 Z" fill={color} />
        </g>
      );
    default:
      return null;
  }
}

/** 头发：在脸之前（后发）与之后（前发、发髻）分两层绘制 */
function HairBack({ p }: { p: PortraitSpec }) {
  if (p.hair === 'woman') {
    return <path d="M63 94 C 58 124, 64 150, 78 168 L122 168 C 136 150, 142 124, 137 94 C 133 54, 67 54, 63 94 Z" fill={p.hairColor} />;
  }
  if (p.hair === 'modern') {
    return <path d="M66 98 C 60 58, 140 58, 134 98 L132 110 L68 110 Z" fill={p.hairColor} />;
  }
  return null;
}

function HairFront({ p }: { p: PortraitSpec }) {
  const c = p.hairColor;
  switch (p.hair) {
    case 'chonmage':
    case 'ronin': {
      const ronin = p.hair === 'ronin';
      return (
        <g>
          {/* 月代：剃过的头顶，泛着青色；浪人则长出了一层短发 */}
          <path d="M69 90 C 66 54, 134 54, 131 90 C 120 80, 80 80, 69 90 Z" fill={ronin ? '#5a544e' : p.skin} stroke={INK} strokeWidth="1.1" />
          {!ronin && <path d="M72 86 C 70 58, 130 58, 128 86 C 118 79, 82 79, 72 86 Z" fill="#7d95b5" opacity="0.28" />}
          {/* 鬓发 */}
          <path d="M65 104 C 62 80, 70 70, 80 68 C 74 80, 73 92, 74 106 L69 112 Z" fill={c} />
          <path d="M135 104 C 138 80, 130 70, 120 68 C 126 80, 127 92, 126 106 L131 112 Z" fill={c} />
          {/* 髷：细长的发髻折向前，压在头顶 */}
          <path d="M93.5 70 C 93 60, 96 55, 100 55 C 104 55, 107 60, 106.5 70 Z" fill={c} />
          <ellipse cx="100" cy="57.5" rx="4.6" ry="3" fill="#3a332e" />
          <path d="M94 66 L106 66" stroke="#efe6d0" strokeWidth="2.2" />
          {ronin && (
            <path d="M76 78 Q 70 90 73 100 M124 78 Q 130 92 127 102 M90 64 Q 86 70 88 78" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
        </g>
      );
    }
    case 'chasen':
      return (
        <g>
          <path d="M67 98 C 60 56, 140 56, 133 98 C 128 84, 118 74, 100 74 C 82 74, 72 84, 67 98 Z" fill={c} />
          {/* 茶筅髷：高束的发根，发梢散开如茶筅 */}
          <path d="M95 64 L 95 52 L 105 52 L 105 64 Z" fill={c} />
          <path d="M94 55 L106 55 M94 59.5 L106 59.5" stroke={p.accent} strokeWidth="2.4" />
          <g stroke={c} strokeWidth="1.7" strokeLinecap="round" fill="none">
            <path d="M97 52 Q 92 45 85 43" />
            <path d="M99 52 Q 97 44 93 39" />
            <path d="M101 52 Q 103 44 107 39" />
            <path d="M103 52 Q 108 45 115 43" />
            <path d="M98 52 Q 93 47 88 47" />
            <path d="M102 52 Q 107 47 112 47" />
          </g>
          <path d="M70 92 Q 75 102 71 112 M130 92 Q 125 102 129 112" stroke={c} strokeWidth="2.2" fill="none" />
        </g>
      );
    case 'old':
      return (
        <g>
          <path d="M70 84 C 70 64, 130 64, 130 84 C 120 78, 80 78, 70 84 Z" fill="#ddd3c3" />
          <path d="M66 100 C 64 80, 72 72, 80 72 C 75 82, 74 92, 75 106 L70 110 Z" fill={c} stroke="#a39d93" strokeWidth="0.6" />
          <path d="M134 100 C 136 80, 128 72, 120 72 C 125 82, 126 92, 125 106 L130 110 Z" fill={c} stroke="#a39d93" strokeWidth="0.6" />
          <path d="M94 66 C 94 60, 106 58, 108 62 L 108 54 C 104 52, 98 52, 94 56 Z" fill={c} stroke="#a39d93" strokeWidth="0.6" />
          <rect x="97" y="60" width="10" height="5" rx="2" fill={c} stroke="#a39d93" strokeWidth="0.6" />
        </g>
      );
    case 'bald':
      return (
        <g>
          <path d="M66 100 C 64 88, 68 82, 72 80 C 71 90, 72 98, 73 106 Z" fill={c} />
          <path d="M134 100 C 136 88, 132 82, 128 80 C 129 90, 128 98, 127 106 Z" fill={c} />
        </g>
      );
    case 'woman':
      return (
        <g>
          {/* 中分的前发 */}
          <path d="M100 66 C 84 66, 70 80, 68 104 C 74 88, 86 76, 100 74 Z" fill={c} />
          <path d="M100 66 C 116 66, 130 80, 132 104 C 126 88, 114 76, 100 74 Z" fill={c} />
          <path d="M100 66 L100 74" stroke="#3a2f28" strokeWidth="0.8" />
          <path d="M69 104 Q 66 124 72 142" stroke={c} strokeWidth="3" fill="none" />
          <path d="M131 104 Q 134 124 128 142" stroke={c} strokeWidth="3" fill="none" />
        </g>
      );
    case 'modern':
      return (
        <g>
          {/* 现代人的短发：没有发髻，刘海凌乱 */}
          <path d="M68 96 C 66 70, 86 62, 102 64 C 118 64, 134 72, 132 96 C 126 86, 120 80, 112 84 C 108 78, 100 80, 96 86 C 90 80, 82 82, 78 90 C 74 88, 70 92, 68 96 Z" fill={c} />
        </g>
      );
  }
}

function Headwear({ p }: { p: PortraitSpec }) {
  const c = p.headColor ?? '#efe6d0';
  if (p.head === 'hachimaki')
    return (
      <g>
        <path d="M67 82 Q 100 74 133 82 L133 89 Q 100 81 67 89 Z" fill={c} stroke={INK} strokeWidth="0.8" />
        <path d="M133 84 L146 78 L144 90 Z M133 86 L150 92 L140 96 Z" fill={c} stroke={INK} strokeWidth="0.8" />
      </g>
    );
  if (p.head === 'tenugui')
    return (
      <g>
        <path d="M67 80 Q 100 72 133 80 L133 88 Q 100 80 67 88 Z" fill={c} stroke={INK} strokeWidth="0.8" />
        <path d="M70 82 Q 100 76 130 82" stroke="#3e5a78" strokeWidth="1" strokeDasharray="3 3" fill="none" />
        <path d="M68 84 L56 80 L60 90 Z" fill={c} stroke={INK} strokeWidth="0.8" />
      </g>
    );
  if (p.head === 'hokkamuri')
    return (
      <g>
        <path d="M62 104 C 56 54, 144 54, 138 104 C 132 82, 120 74, 100 74 C 80 74, 68 82, 62 104 Z" fill={c} stroke={INK} strokeWidth="1" />
      </g>
    );
  return null;
}

function Head({ p }: { p: PortraitSpec }) {
  const face = facePath(p.jaw);
  return (
    <g>
      <HairBack p={p} />
      {/* 颈 */}
      <path d="M88 138 L88 174 Q 100 180 112 174 L112 138 Z" fill={p.skin} stroke={INK} strokeWidth="1.2" />
      <path d="M88 146 Q 100 156 112 146 L112 152 Q 100 160 88 152 Z" fill="#000" opacity="0.12" />
      {/* 耳 */}
      <ellipse cx="68.5" cy="106" rx="4.6" ry="8" fill={p.skin} stroke={INK} strokeWidth="1.1" />
      <ellipse cx="131.5" cy="106" rx="4.6" ry="8" fill={p.skin} stroke={INK} strokeWidth="1.1" />
      {/* 脸 */}
      <path d={face} fill={p.skin} stroke={INK} strokeWidth="1.3" />
      {/* 阴影：光从观者左上方来 */}
      <path d="M122 92 C 128 112, 124 132, 110 144 C 118 132, 124 116, 122 92 Z" fill="#7a4a2a" opacity="0.14" />
      <ellipse cx="80" cy="118" rx="9" ry="6" fill="url(#pt-cheek)" />
      <ellipse cx="120" cy="118" rx="9" ry="6" fill="url(#pt-cheek)" />
      {/* 五官 */}
      <Brow kind={p.brows} color={p.hairColor} />
      <g transform={mirror}>
        <Brow kind={p.brows} color={p.hairColor} />
      </g>
      <Eye kind={p.eyes} />
      <g transform={mirror}>
        <Eye kind={p.eyes} />
      </g>
      <path d="M100 104 Q 98 113 96.5 118 Q 100 121 104 118.5" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      {p.wrinkles && (
        <g stroke={INK} strokeOpacity="0.3" strokeWidth="0.9" fill="none">
          <path d="M84 76 Q 100 72 116 76 M86 80 Q 100 77 114 80" />
          <path d="M88 122 Q 86 128 89 134 M112 122 Q 114 128 111 134" />
        </g>
      )}
      {p.scar && <path d="M114 108 L124 120" stroke="#a5654f" strokeWidth="1.5" strokeLinecap="round" />}
      <Beard kind={p.beard} color={p.hairColor} />
      <Mouth kind={p.mouth} />
      <HairFront p={p} />
      <Headwear p={p} />
    </g>
  );
}

export type PortraitCrop = 'bust' | 'face';

export function Portrait({ spec, size = 48, crop = 'face', className, label }: { spec: PortraitSpec; size?: number; crop?: PortraitCrop; className?: string; label?: string }) {
  const vb = crop === 'face' ? '44 28 112 124' : '12 20 176 211';
  const h = crop === 'face' ? size * 1.107 : size * 1.199;
  return (
    <svg
      className={`portrait ${crop} ${className ?? ''}`}
      viewBox={vb}
      width={size}
      height={h}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
    >
      <Defs />
      <Background bg={spec.bg} />
      <Body p={spec} />
      <g transform="translate(100 152) scale(1.14) translate(-100 -152)">
        <Head p={spec} />
      </g>
    </svg>
  );
}


/** 按人物 id 取立绘；未相识时显示剪影 */
export function CharPortrait({ id, size = 48, crop = 'face', unknown, className }: { id: string; size?: number; crop?: PortraitCrop; unknown?: boolean; className?: string }) {
  const spec = PORTRAITS[id] ?? PORTRAITS.player;
  return <Portrait spec={spec} size={size} crop={crop} className={`${unknown ? 'unknown' : ''} ${className ?? ''}`} />;
}
