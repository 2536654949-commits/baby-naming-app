// 模拟数据类型（用于开发阶段，生产环境使用真实API）
export interface MockNameRecommendation {
  id: string;
  name: string;
  pinyin: string;
  score: number;
  meaning: string;
  tags: string[];
  stars: number;
}

export interface MockNameDetail extends MockNameRecommendation {
  subScores: {
    sound: number;
    culture: number;
    luck: number;
  };
  wuxing: {
    wood: string;
    water: string;
    fire: string;
    earth: string;
    metal: string;
  };
  analysis: string;
  characters: {
    char: string;
    pinyin: string;
    meaning: string;
    detail: string;
  }[];
  poem: {
    content: string;
    source: string;
    explanation: string;
  };
  highlights: {
    tone: string;
    structure: string;
    strokes: string;
    imagery: string;
  }
}

export interface MockHistoryRecord {
  id: string;
  date: string;
  surname: string;
  gender: 'boy' | 'girl';
  names: string[];
}

export const MOCK_NAMES: MockNameRecommendation[] = [
  {
    id: '1',
    name: '李泽言',
    pinyin: 'lǐ zé yán',
    score: 98,
    meaning: '泽润万物，言出必行。意寓心怀慈悲、信守承诺，如同春雨润泽大地般造福他人。',
    tags: ['大吉'],
    stars: 5
  },
  {
    id: '2',
    name: '浩宇',
    pinyin: 'hào yǔ',
    score: 96,
    meaning: '浩渺宇宙，气象万千。象征着心胸开阔、志向远大，拥有如宇宙般广阔的未来。',
    tags: ['上上'],
    stars: 4.5
  },
  {
    id: '3',
    name: '沐宸',
    pinyin: 'mù chén',
    score: 95,
    meaning: '沐浴恩泽，宸极之辉。展现出高贵文雅的气质，寓意生活优渥、受人尊敬。',
    tags: ['上上'],
    stars: 4.5
  },
  {
    id: '4',
    name: '芷若',
    pinyin: 'zhǐ ruò',
    score: 94,
    meaning: '白芷清香，杜若芬芳。比喻女子才貌双全，如香草般清雅脱俗，柔美而有韧性。',
    tags: ['上吉'],
    stars: 4.5
  },
  {
    id: '5',
    name: '俊凯',
    pinyin: 'jùn kǎi',
    score: 92,
    meaning: '俊杰之才，凯旋而归。寓意才智出众，事业有成，能够不断取得成功与胜利。',
    tags: ['吉'],
    stars: 4
  }
];

export const MOCK_DETAIL: MockNameDetail = {
  ...MOCK_NAMES[0],
  subScores: {
    sound: 98,
    culture: 95,
    luck: 92
  },
  wuxing: {
    wood: "旺",
    water: "相",
    fire: "微",
    earth: "弱",
    metal: "平"
  },
  analysis: "此名构成了和谐的水生木循环。寓意生命力顽强，性格温润如水且具备向上攀升的动力，利于事业学业的发展。",
  characters: [
    {
      char: "泽",
      pinyin: "Zé",
      meaning: "含义：润泽、恩惠、水聚汇处。",
      detail: "引申为仁慈、博爱，寓意孩子一生常遇贵人，福泽深厚。"
    },
    {
      char: "言",
      pinyin: "Yán",
      meaning: "含义：语言、说话、见解、诺言。",
      detail: "象征出口成章、诚实守信，具备优秀的表达能力与领导才干。"
    }
  ],
  poem: {
    content: "与子偕老，言笑晏晏",
    source: "出自《诗经·卫风·氓》",
    explanation: "\"晏晏\"意为和悦的样子。此名描绘出一种和谐、温婉、从容的生活态度，富有极高的文学底蕴与历史厚度。"
  },
  highlights: {
    tone: "仄-平-平",
    structure: "左右平衡",
    strokes: "共15画 (大吉)",
    imagery: "温润儒雅"
  }
};

export const MOCK_HISTORY: MockHistoryRecord[] = [
  {
    id: 'h1',
    date: '2023-10-27',
    surname: '陈',
    gender: 'girl',
    names: ['梦琪', '语嫣', '诗涵', '欣怡', '晨曦']
  },
  {
    id: 'h2',
    date: '2023-10-15',
    surname: '陈',
    gender: 'boy',
    names: ['宇轩', '浩然', '子墨', '奕辰', '俊杰']
  },
  {
    id: 'h3',
    date: '2023-09-30',
    surname: '张',
    gender: 'girl',
    names: ['雅静', '佳瑞', '沐妍', '思琪', '悦心']
  },
   {
    id: 'h4',
    date: '2023-09-12',
    surname: '李',
    gender: 'boy',
    names: ['博文', '智宸', '嘉木', '峻熙', '明辉']
  }
];

export const MOCK_FAVORITES = [
  {
    id: 'f1',
    name: '沐辰',
    pinyin: 'mù chén',
    score: 98,
    meaning: '沐浴日月星辰，寓意心胸开阔、前途璀璨。',
  },
  {
    id: 'f2',
    name: '子衿',
    pinyin: 'zǐ jīn',
    score: 96,
    meaning: '青青子衿，悠悠我心。寓意才华横溢、气质高雅。',
  },
  {
    id: 'f3',
    name: '雨泽',
    pinyin: 'yǔ zé',
    score: 95,
    meaning: '恩惠像雨露一样，寓意福泽深厚、心怀仁慈。',
  }
];
