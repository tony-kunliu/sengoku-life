// 原创水墨淡彩场景插画（纯 SVG，无外部素材）
const INK = '#2a2622';

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <filter id={`bleed-${id}`} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="5" />
        <feGaussianBlur stdDeviation="0.6" />
      </filter>
      <filter id={`soft-${id}`}>
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d9d2c0" />
        <stop offset="1" stopColor="#efe8da" />
      </linearGradient>
      <linearGradient id={`night-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#16203a" />
        <stop offset="1" stopColor="#3b4766" />
      </linearGradient>
    </defs>
  );
}

function Mountains({ id, y = 120, tone = 0.25 }: { id: string; y?: number; tone?: number }) {
  return (
    <g filter={`url(#soft-${id})`} opacity={tone}>
      <path d={`M0 ${y} Q60 ${y - 60} 120 ${y - 20} T240 ${y - 35} T400 ${y - 10} V220 H0Z`} fill="#41506e" />
      <path d={`M0 ${y + 20} Q90 ${y - 25} 180 ${y + 5} T400 ${y} V220 H0Z`} fill="#2f3b55" opacity="0.7" />
    </g>
  );
}

function Town({ id }: { id: string }) {
  return (
    <g>
      <rect width="400" height="200" fill={`url(#sky-${id})`} />
      <Mountains id={id} y={110} tone={0.3} />
      {/* 清洲城天守与石垣 */}
      <g filter={`url(#bleed-${id})`} fill={INK}>
        <path d="M262 112 h56 l-6 -10 h-44z" opacity="0.85" />
        <path d="M268 102 h44 l-4 -8 h-36z" opacity="0.85" />
        <path d="M274 94 h32 l-6 -9 h-20z" />
        <path d="M282 85 h16 l-8 -8z" />
        <path d="M255 128 l10 -16 h50 l10 16z" opacity="0.6" />
      </g>
      {/* 城下町屋顶 */}
      <g filter={`url(#bleed-${id})`}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path key={i} d={`M${i * 58 - 10} ${150 - (i % 2) * 6} l30 -14 l30 14z`} fill={INK} opacity={0.55 + (i % 3) * 0.12} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={`w${i}`} x={i * 58 - 4} y={150 - (i % 2) * 6} width="48" height="26" fill="#c9bfa8" opacity="0.8" />
        ))}
      </g>
      {/* 五条川 */}
      <path d="M0 182 Q100 172 200 184 T400 178 V200 H0Z" fill="#41506e" opacity="0.35" />
      <circle cx="70" cy="40" r="14" fill="#b5361f" opacity="0.75" />
    </g>
  );
}

function Dojo({ id }: { id: string }) {
  return (
    <g>
      <rect width="400" height="200" fill="#d7ccb4" />
      {/* 梁柱 */}
      <g filter={`url(#bleed-${id})`} fill={INK}>
        <rect x="0" y="18" width="400" height="10" opacity="0.8" />
        <rect x="30" y="18" width="12" height="182" opacity="0.7" />
        <rect x="358" y="18" width="12" height="182" opacity="0.7" />
        <rect x="0" y="150" width="400" height="4" opacity="0.4" />
      </g>
      {/* 匾额 */}
      <g filter={`url(#bleed-${id})`}>
        <rect x="140" y="36" width="120" height="40" fill="#efe8da" stroke={INK} strokeWidth="3" />
        <text x="200" y="65" textAnchor="middle" fontSize="22" fontFamily="'Zhi Mang Xing','Ma Shan Zheng',serif" fill={INK}>
          心正剑正
        </text>
      </g>
      {/* 木地板 */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <line key={i} x1={i * 55} y1="154" x2={i * 55 - 40} y2="200" stroke="#8a7a5e" strokeWidth="1" opacity="0.5" />
      ))}
      {/* 两名剑士剪影 */}
      <g filter={`url(#bleed-${id})`} fill={INK}>
        <path d="M150 150 q-4 -30 2 -44 q6 -10 14 0 q6 14 2 44z" opacity="0.85" />
        <circle cx="159" cy="98" r="7" />
        <line x1="166" y1="112" x2="200" y2="92" stroke={INK} strokeWidth="3" />
        <path d="M250 150 q4 -30 -2 -44 q-6 -10 -14 0 q-6 14 -2 44z" opacity="0.85" />
        <circle cx="241" cy="98" r="7" />
        <line x1="234" y1="112" x2="204" y2="96" stroke={INK} strokeWidth="3" />
      </g>
      {/* 木刀架 */}
      {[0, 1, 2, 3].map((i) => (
        <line key={`b${i}`} x1={60 + i * 8} y1="90" x2={56 + i * 8} y2="148" stroke="#5b4a3a" strokeWidth="3" />
      ))}
    </g>
  );
}

function Teahouse({ id }: { id: string }) {
  return (
    <g>
      <rect width="400" height="200" fill={`url(#sky-${id})`} />
      <Mountains id={id} y={100} tone={0.2} />
      <g filter={`url(#bleed-${id})`}>
        <path d="M40 70 L200 40 L360 70 Z" fill={INK} opacity="0.85" />
        <rect x="60" y="70" width="280" height="110" fill="#c9bfa8" />
        <rect x="60" y="70" width="280" height="8" fill={INK} opacity="0.5" />
        {/* 暖帘 */}
        {[0, 1, 2].map((i) => (
          <rect key={i} x={140 + i * 42} y="80" width="38" height="56" fill="#2f4a6b" opacity="0.92" />
        ))}
        <text x="203" y="118" textAnchor="middle" fontSize="26" fontFamily="'Zhi Mang Xing','Ma Shan Zheng',serif" fill="#efe8da">
          水 月
        </text>
        {/* 灯笼 */}
        <ellipse cx="100" cy="102" rx="12" ry="16" fill="#b5361f" opacity="0.9" />
        <line x1="100" y1="80" x2="100" y2="86" stroke={INK} strokeWidth="2" />
        {/* 长凳 */}
        <rect x="240" y="160" width="90" height="8" fill="#b5361f" opacity="0.8" />
        <rect x="246" y="168" width="4" height="12" fill={INK} />
        <rect x="320" y="168" width="4" height="12" fill={INK} />
      </g>
      <rect x="0" y="180" width="400" height="20" fill="#bfb49b" />
    </g>
  );
}

function Village({ id }: { id: string }) {
  return (
    <g>
      <rect width="400" height="200" fill={`url(#sky-${id})`} />
      <Mountains id={id} y={95} tone={0.35} />
      {/* 炭窑之烟 */}
      <path d="M310 90 q-10 -20 6 -34 q16 -14 2 -36" stroke="#6b6a6a" strokeWidth="6" fill="none" opacity="0.25" filter={`url(#soft-${id})`} />
      <g filter={`url(#bleed-${id})`}>
        <path d="M290 96 l20 -12 l20 12z" fill={INK} opacity="0.7" />
        <path d="M60 112 l26 -18 l26 18z" fill={INK} opacity="0.8" />
        <rect x="66" y="112" width="40" height="18" fill="#c9bfa8" />
      </g>
      {/* 水田 */}
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M0 ${132 + i * 17} Q200 ${126 + i * 17} 400 ${134 + i * 17}`}
          stroke="#6b7a4a"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
      ))}
      <rect x="0" y="130" width="400" height="70" fill="#9fb0a8" opacity="0.25" />
      {/* 秧苗 */}
      {Array.from({ length: 28 }).map((_, i) => (
        <line key={`s${i}`} x1={(i * 37) % 400} y1={150 + (i % 4) * 12} x2={((i * 37) % 400) + 2} y2={144 + (i % 4) * 12} stroke="#4f6b3a" strokeWidth="1.5" />
      ))}
    </g>
  );
}

function Night({ id }: { id: string }) {
  return (
    <g>
      <rect width="400" height="200" fill={`url(#night-${id})`} />
      <circle cx="310" cy="50" r="20" fill="#efe8da" opacity="0.85" />
      <g filter={`url(#soft-${id})`} opacity="0.6">
        <path d="M0 130 Q100 90 200 120 T400 110 V200 H0Z" fill="#0f1528" />
      </g>
      <g filter={`url(#bleed-${id})`} fill="#0b0f1d">
        <path d="M140 140 h56 l-6 -10 h-44z" />
        <path d="M146 130 h44 l-4 -8 h-36z" />
        <path d="M152 122 h32 l-6 -9 h-20z" />
        <path d="M160 113 h16 l-8 -8z" />
      </g>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={40 + i * 60} cy={170 - (i % 2) * 6} r="3" fill="#d8a64a" opacity="0.8" />
      ))}
    </g>
  );
}

const SCENES: Record<string, (p: { id: string }) => any> = {
  town: Town,
  dojo: Dojo,
  teahouse: Teahouse,
  village: Village,
  night: Night,
};

let uid = 0;

export function SceneArt({ name, className, height }: { name: string; className?: string; height?: number }) {
  const C = SCENES[name] ?? Town;
  const id = `a${name}${(uid = (uid + 1) % 1000)}`;
  return (
    <svg
      className={className}
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
      style={height ? { height } : undefined}
    >
      <Defs id={id} />
      <C id={id} />
    </svg>
  );
}

/** 印章式人物头像 */
export function Seal({ glyph, color, size = 48, dim }: { glyph: string; color: string; size?: number; dim?: boolean }) {
  return (
    <span
      className="seal"
      style={{ width: size, height: size, fontSize: size * 0.56, background: color, opacity: dim ? 0.45 : 1 }}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}

/** 标题页的远山 */
export function TitleArt() {
  return (
    <svg className="title-art" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id="tsoft">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <linearGradient id="tsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141d33" />
          <stop offset="0.6" stopColor="#2b3655" />
          <stop offset="1" stopColor="#4a5470" />
        </linearGradient>
      </defs>
      <rect width="400" height="600" fill="url(#tsky)" />
      <circle cx="290" cy="150" r="46" fill="#b5361f" opacity="0.85" />
      <g filter="url(#tsoft)">
        <path d="M0 380 Q80 290 160 350 T320 320 T400 340 V600 H0Z" fill="#1b2440" opacity="0.9" />
        <path d="M0 440 Q120 370 220 420 T400 400 V600 H0Z" fill="#10172b" />
      </g>
      <g fill="#0b1020">
        <path d="M60 470 h70 l-8 -12 h-54z" />
        <path d="M68 458 h54 l-6 -10 h-42z" />
        <path d="M76 448 h38 l-7 -10 h-24z" />
        <path d="M86 438 h18 l-9 -9z" />
      </g>
      <path d="M0 520 Q200 500 400 525 V600 H0Z" fill="#0b1020" />
    </svg>
  );
}
