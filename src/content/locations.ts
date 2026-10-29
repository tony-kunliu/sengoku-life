import type { LocationDef } from '../engine/registry';
import type { LocationId } from '../engine/types';

export const LOCATIONS: Record<LocationId, LocationDef> = {
  town: {
    id: 'town',
    name: '清洲城下',
    sub: '尾张的中心 · 五条川畔',
    art: 'town',
    desc: (s) =>
      s.world.imagawa >= 80
        ? '街上到处是搬运兵粮的人夫，商铺半掩着门。人们压低声音议论今川的大军。'
        : '五条川畔的城下町，商人、足轻与百姓往来不息。远处清洲城的橹在晨雾里若隐若现。',
  },
  dojo: {
    id: 'dojo',
    name: '柳心馆',
    sub: '城下西侧的小道场',
    art: 'dojo',
    desc: '旧木板地被磨得发亮，墙上挂着“心正剑正”的匾额。木刀相击的声音从清晨响到黄昏。',
  },
  teahouse: {
    id: 'teahouse',
    name: '茶屋·水月',
    sub: '城下街口的茶屋',
    art: 'teahouse',
    desc: '门口挂着褪色的暖帘。行商、浪人、足轻都在这里歇脚——这里是清洲消息最灵通的地方。',
  },
  village: {
    id: 'village',
    name: '城外·五条村',
    sub: '五条川上游的农村 · 往返需半个时辰',
    art: 'village',
    desc: '水田映着天光，村后是一片杂木林和炭窑的青烟。你就是在这里的田埂上醒来的。',
  },
};
