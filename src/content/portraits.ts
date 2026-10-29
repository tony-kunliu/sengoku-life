// 人物立绘的外观设定（原创人物设计，数据驱动，由 ui/portrait.tsx 绘制）
export type Hair = 'chonmage' | 'ronin' | 'chasen' | 'old' | 'woman' | 'modern' | 'bald';
export type Outfit = 'dogi' | 'kataginu' | 'kosode' | 'work' | 'farmer' | 'yukata' | 'armor';
export type Eyes = 'sharp' | 'gentle' | 'narrow' | 'old' | 'bright';
export type Mouth = 'neutral' | 'smile' | 'stern' | 'smirk' | 'lips';
export type Beard = 'none' | 'stubble' | 'mustache' | 'whitegoatee' | 'full';
export type Headwear = 'none' | 'hachimaki' | 'tenugui' | 'hokkamuri';

export interface PortraitSpec {
  hair: Hair;
  hairColor: string;
  skin: string;
  outfit: Outfit;
  /** 外衣主色 / 衬里色 / 点缀色 */
  cloth: string;
  inner: string;
  accent: string;
  eyes: Eyes;
  brows: 'thick' | 'fine' | 'sharp' | 'white';
  mouth: Mouth;
  beard: Beard;
  head?: Headwear;
  headColor?: string;
  /** 脸型：宽(男性成人) / 窄(女性、少年) / 方(壮汉) */
  jaw: 'wide' | 'narrow' | 'square';
  wrinkles?: boolean;
  scar?: boolean;
  /** 家纹（胸前小圆纹） */
  crest?: 'mokko' | 'kikyo' | 'circle' | null;
  /** 金箔底的色调 */
  bg?: 'gold' | 'silver' | 'dusk';
}

const SKIN = { fair: '#f1d6b8', warm: '#ebc9a3', tan: '#ddb085', old: '#e4c4a0' };
const BLACK = '#1d1916';

export const PORTRAITS: Record<string, PortraitSpec> = {
  player: {
    hair: 'modern',
    hairColor: '#2a221d',
    skin: SKIN.warm,
    outfit: 'kosode',
    cloth: '#6f7a6a',
    inner: '#e9e1cf',
    accent: '#3d4a3a',
    eyes: 'bright',
    brows: 'fine',
    mouth: 'neutral',
    beard: 'none',
    jaw: 'narrow',
    bg: 'silver',
  },
  gensai: {
    hair: 'old',
    hairColor: '#e8e4dc',
    skin: SKIN.old,
    outfit: 'kosode',
    cloth: '#2c3550',
    inner: '#e9e1cf',
    accent: '#5b6278',
    eyes: 'old',
    brows: 'white',
    mouth: 'stern',
    beard: 'whitegoatee',
    jaw: 'wide',
    wrinkles: true,
    crest: 'circle',
  },
  hayato: {
    hair: 'chonmage',
    hairColor: BLACK,
    skin: SKIN.warm,
    outfit: 'dogi',
    cloth: '#f0ebe0',
    inner: '#2c3550',
    accent: '#9b2d20',
    eyes: 'sharp',
    brows: 'sharp',
    mouth: 'smirk',
    beard: 'none',
    head: 'hachimaki',
    headColor: '#b5361f',
    jaw: 'narrow',
  },
  seibei: {
    hair: 'chonmage',
    hairColor: BLACK,
    skin: SKIN.tan,
    outfit: 'work',
    cloth: '#3e5a78',
    inner: '#c9b48f',
    accent: '#5b4a3a',
    eyes: 'gentle',
    brows: 'thick',
    mouth: 'smile',
    beard: 'stubble',
    head: 'tenugui',
    headColor: '#e9e1cf',
    jaw: 'wide',
  },
  oryo: {
    hair: 'woman',
    hairColor: BLACK,
    skin: SKIN.fair,
    outfit: 'kosode',
    cloth: '#3f6f63',
    inner: '#efe2c8',
    accent: '#c8873a',
    eyes: 'narrow',
    brows: 'fine',
    mouth: 'lips',
    beard: 'none',
    jaw: 'narrow',
  },
  toshiie: {
    hair: 'ronin',
    hairColor: BLACK,
    skin: SKIN.warm,
    outfit: 'kataginu',
    cloth: '#7a5a12',
    inner: '#2a2622',
    accent: '#d8b45a',
    eyes: 'sharp',
    brows: 'thick',
    mouth: 'smirk',
    beard: 'stubble',
    jaw: 'square',
    scar: true,
    crest: 'circle',
    bg: 'dusk',
  },
  gonroku: {
    hair: 'chonmage',
    hairColor: BLACK,
    skin: SKIN.tan,
    outfit: 'dogi',
    cloth: '#2f3a52',
    inner: '#f0ebe0',
    accent: '#4b5560',
    eyes: 'narrow',
    brows: 'thick',
    mouth: 'stern',
    beard: 'full',
    jaw: 'square',
  },
  gosaku: {
    hair: 'bald',
    hairColor: '#b8b3aa',
    skin: SKIN.tan,
    outfit: 'farmer',
    cloth: '#7b6a4a',
    inner: '#c9b48f',
    accent: '#5a4a32',
    eyes: 'old',
    brows: 'white',
    mouth: 'smile',
    beard: 'stubble',
    head: 'hokkamuri',
    headColor: '#3e5a78',
    jaw: 'wide',
    wrinkles: true,
  },
  nobunaga: {
    hair: 'chasen',
    hairColor: BLACK,
    skin: SKIN.fair,
    outfit: 'yukata',
    cloth: '#e7dcc4',
    inner: '#1d1916',
    accent: '#b5361f',
    eyes: 'sharp',
    brows: 'sharp',
    mouth: 'smirk',
    beard: 'mustache',
    jaw: 'narrow',
    crest: 'mokko',
    bg: 'gold',
  },
  imagawa: {
    hair: 'chonmage',
    hairColor: BLACK,
    skin: SKIN.tan,
    outfit: 'armor',
    cloth: '#3a3530',
    inner: '#2a2622',
    accent: '#7a2a20',
    eyes: 'narrow',
    brows: 'thick',
    mouth: 'stern',
    beard: 'full',
    head: 'hachimaki',
    headColor: '#e9e1cf',
    jaw: 'square',
    crest: 'kikyo',
    bg: 'dusk',
  },
  looter: {
    hair: 'ronin',
    hairColor: '#2a2622',
    skin: SKIN.tan,
    outfit: 'kosode',
    cloth: '#5a4a3a',
    inner: '#8a7a5e',
    accent: '#3a2a1c',
    eyes: 'narrow',
    brows: 'thick',
    mouth: 'smirk',
    beard: 'full',
    jaw: 'square',
    scar: true,
    bg: 'dusk',
  },
};
