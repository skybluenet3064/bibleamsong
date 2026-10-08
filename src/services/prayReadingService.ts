import { VerseItem } from '../types/bible';

export type PrayerTheme = 'praise' | 'enjoy' | 'consecrate';

export interface PrayReadingOption {
  theme: PrayerTheme;
  title: string;
  icon: string;
  prayer: string;
}

export interface PrayReadingResult {
  keywords: string[];
  options: PrayReadingOption[];
  defaultPrayer: string;
}

/**
 * 성경 66권 주요 대표 요절별 정선된 프레이리딩(Pray-Reading) 말씀 기도문 라이브러리
 */
const CURATED_PRAYERS: Record<string, PrayReadingOption[]> = {
  // 창세기 1:1
  '1_1_1': [
    {
      theme: 'praise',
      title: '창조의 찬양',
      icon: '🕊️',
      prayer: '오 주 예수님, 태초에 하늘들과 땅을 창조하신 전능하신 하나님을 찬양합니다! 황폐와 흑암을 이기시고 영광스러운 창조를 이루신 주님을 경배합니다. 아멘!'
    },
    {
      theme: 'enjoy',
      title: '새 창조의 누림',
      icon: '🌿',
      prayer: '아멘! 주님, 태초에 만물을 창조하셨듯이 오늘 제 안에서도 그리스도 안의 새로운 창조를 새롭게 이루어 주소서. 제 마음에 하나님의 빛과 생명이 충만하게 하소서!'
    },
    {
      theme: 'consecrate',
      title: '주권에 대한 헌신',
      icon: '✝️',
      prayer: '오 주 하나님, 온 우주의 주인이신 주님께 저의 모든 삶과 시간과 존재를 올려드립니다. 오늘도 주님의 신성한 다스림 아래 살게 하소서. 아멘!'
    }
  ],
  // 요한복음 1:1
  '43_1_1': [
    {
      theme: 'praise',
      title: '말씀이신 그리스도 찬양',
      icon: '🕊️',
      prayer: '오 주 예수님, 태초부터 계셨고 하나님과 함께 계셨으며 바로 하나님 자신이신 영원한 말씀이신 주님을 찬양합니다! 아멘!'
    },
    {
      theme: 'enjoy',
      title: '살아있는 말씀 섭취',
      icon: '🌿',
      prayer: '아멘! 주님, 태초의 말씀이 오늘 제게 읽혀지고 들려지는 살아있는 레마(Rhema)의 말씀이 되어 제 영을 소생케 하시고 살려주시옵소서!'
    },
    {
      theme: 'consecrate',
      title: '말씀의 전달자로 헌신',
      icon: '✝️',
      prayer: '오 주님, 신성한 말씀이신 그리스도로 제 온 존재가 적셔지게 하시고, 제 입술을 통하여 주님의 살아있는 말씀이 흘러넘치게 하소서. 아멘!'
    }
  ],
  // 요한복음 3:16
  '43_3_16': [
    {
      theme: 'praise',
      title: '측량할 수 없는 사랑 찬양',
      icon: '🕊️',
      prayer: '하나님 아버지, 세상을 이처럼 사랑하사 독생자 예수 그리스도를 아낌없이 내어주신 크고 무한하신 신성한 사랑을 높이 찬양합니다! 할렐루야!'
    },
    {
      theme: 'enjoy',
      title: '영원한 생명의 누림',
      icon: '🌿',
      prayer: '오 주 예수님! 멸망하지 않고 영원한 생명을 얻게 하심을 감사드립니다. 그 생명이신 그리스도를 오늘 제 영 안에서 호흡하며 충만히 누립니다. 아멘!'
    },
    {
      theme: 'consecrate',
      title: '생명을 전하는 삶',
      icon: '✝️',
      prayer: '주님, 독생자를 주신 이 거룩한 복음의 사랑을 저만 누리지 않고, 제 주변의 잃어버린 영혼들에게 담대히 흘려보내게 하소서. 아멘!'
    }
  ],
  // 갈라디아서 2:20
  '48_2_20': [
    {
      theme: 'praise',
      title: '그리스도와의 연합 찬양',
      icon: '🕊️',
      prayer: '오 주 예수님, 내가 그리스도와 함께 십자가에 못 박혔음을 선포합니다! 이제는 내가 사는 것이 아니요 오직 내 안에 사시는 그리스도를 찬양합니다! 아멘!'
    },
    {
      theme: 'enjoy',
      title: '내주하시는 생명 누림',
      icon: '🌿',
      prayer: '아멘! 나를 사랑하사 나를 위하여 자신을 버리신 하나님의 아들을 믿는 믿음 안에서 오늘을 살아갑니다. 내 안에 사시는 주님으로 만족합니다!'
    },
    {
      theme: 'consecrate',
      title: '옛 자아의 부인과 헌신',
      icon: '✝️',
      prayer: '오 주님, 저의 옛 사람과 천연적인 자아는 십자가에 두고, 오직 부활하신 그리스도만이 저의 인격과 생명이 되어 살아가게 하소서. 아멘!'
    }
  ],
  // 빌립보서 4:13
  '50_4_13': [
    {
      theme: 'praise',
      title: '능력 주시는 자 찬양',
      icon: '🕊️',
      prayer: '오 주님! 나에게 능력 주시는 그리스도 안에서 내가 모든 것을 할 수 있음을 찬양합니다! 저의 한계를 뛰어넘으시는 주님을 신뢰합니다. 아멘!'
    },
    {
      theme: 'enjoy',
      title: '모든 것을 감당하는 은혜',
      icon: '🌿',
      prayer: '아멘! 어떠한 환경과 상황 속에서도 만족할 줄 아는 비결을 배우게 하시고, 내게 능력 주시는 그분 안에서 평강과 안식을 누리게 하소서!'
    },
    {
      theme: 'consecrate',
      title: '전적인 신뢰와 전진',
      icon: '✝️',
      prayer: '주 예수님, 제 자신의 힘을 의지하지 않고 그리스도의 비밀한 공급을 힘입어 오늘도 부르심의 푯대를 향해 전진합니다. 나를 이끄소서. 아멘!'
    }
  ],
  // 로마서 8:28
  '45_8_28': [
    {
      theme: 'praise',
      title: '합력하여 선을 이루심 찬양',
      icon: '🕊️',
      prayer: '오 하나님 아버지, 하나님을 사랑하는 자 곧 그분의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루게 하심을 믿고 찬양합니다! 아멘!'
    },
    {
      theme: 'enjoy',
      title: '어떤 환경도 영적 유익',
      icon: '🌿',
      prayer: '아멘! 이해할 수 없는 고난과 어려움 속에서도 하나님의 선하신 손길을 신뢰합니다. 모든 환경이 나를 그리스도의 형상을 닮게 하는 과정임을 믿습니다!'
    },
    {
      theme: 'consecrate',
      title: '하나님을 더 사랑하기로 결단',
      icon: '✝️',
      prayer: '오 주님, 환경을 바라보지 않고 환경을 다스리시는 하나님을 더욱 사랑하겠습니다. 제 마음의 중심을 온전히 주님께 드립니다. 아멘!'
    }
  ]
};

/**
 * 구절 텍스트에서 말씀 기도에 유용한 주요 핵심 단어 추출
 */
export function extractPrayerKeywords(text: string): string[] {
  // 불용어 및 조사 분리
  const cleaned = text.replace(/[.,;!?()'"“”…·]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(t => t.length >= 2);

  const stopParticles = ['에서', '에게', '으로', '로써', '이며', '하고', '하여', '하신', '하는', '이니', '이라', '께서', '들은', '들을', '에게는'];
  const keywordsSet = new Set<string>();

  for (const token of tokens) {
    let word = token;
    for (const p of stopParticles) {
      if (word.endsWith(p) && word.length > p.length + 1) {
        word = word.slice(0, -p.length);
        break;
      }
    }
    // 기본 조사 제거
    word = word.replace(/[은는이가을를의에로도]$/, '');
    if (word.length >= 2 && !['그것', '이것', '저것', '모든', '하나', '있는', '없는'].includes(word)) {
      keywordsSet.add(word);
    }
  }

  const list = Array.from(keywordsSet);
  return list.slice(0, 6);
}

/**
 * 성경 구절 분석을 통한 자동 말씀 기도문 생성 엔진
 */
export function generatePrayReading(verse: VerseItem): PrayReadingResult {
  const key = `${verse.bookId}_${verse.chapter}_${verse.verse}`;
  const keywords = extractPrayerKeywords(verse.text);

  // 1. 사전 큐레이션된 깊이 있는 기도문이 있는 경우 우선 반환
  if (CURATED_PRAYERS[key]) {
    const curated = CURATED_PRAYERS[key];
    return {
      keywords: keywords.length > 0 ? keywords : [verse.bookName, `${verse.chapter}장`, '은혜', '아멘'],
      options: curated,
      defaultPrayer: curated[0].prayer
    };
  }

  // 2. 동적 기도문 생성 (Dynamic Pray-Reading Generation)
  const mainKeywords = keywords.slice(0, 3).join(', ');
  const firstKeyword = keywords[0] || '주님의 말씀';
  const cleanVerseText = verse.text.replace(/\s+/g, ' ').trim();

  // 문장의 끝부분 패턴에 따른 어조 분석
  let praiseTail = '이 말씀대로 살아계신 주님을 높이 찬양합니다!';
  let enjoyTail = '이 말씀이 오늘 제 영의 참된 양식과 생수가 되게 하소서!';
  let consecrateTail = '이 거룩한 말씀 앞에 제 자신을 드리며 온전히 순종하길 원합니다.';

  if (/하라|말라|지키라|오라|믿으라/.test(cleanVerseText)) {
    // 명령/권면형 말씀
    praiseTail = '우리에게 생명의 길을 명령하시고 인도하시는 주님의 권위를 찬양합니다!';
    enjoyTail = '말씀대로 순종할 수 있는 신성한 은혜와 공급을 제 영에 넘치도록 부어주소서!';
    consecrateTail = '저의 육신과 생각을 내려놓고, 오직 이 말씀에 순종하여 주님만을 기쁘시게 하소서!';
  } else if (/약속|주리라|하리라|이루리라|얻으리라/.test(cleanVerseText)) {
    // 약속형 말씀
    praiseTail = '변치 않는 신실한 언약으로 우리를 붙드시는 주님을 찬송합니다!';
    enjoyTail = '약속하신 이 보배로운 은혜를 믿음으로 취하며 기쁨으로 누리게 하소서!';
    consecrateTail = '의심을 거두고 이 말씀을 굳게 붙잡아 주님의 영광을 보게 하소서!';
  }

  const dynamicOptions: PrayReadingOption[] = [
    {
      theme: 'praise',
      title: '찬양과 경배의 기도',
      icon: '🕊️',
      prayer: `오 주 예수님! "${cleanVerseText}" 하신 주님의 말씀을 감사와 찬양으로 받습니다. ${praiseTail} 아멘!`
    },
    {
      theme: 'enjoy',
      title: '생명과 누림의 기도',
      icon: '🌿',
      prayer: `아멘! 주 예수님, 오늘 제 영 안에서 [${firstKeyword}]의 말씀이 살아 숨쉬게 하소서. ${enjoyTail} 주님을 더 깊이 누립니다!`
    },
    {
      theme: 'consecrate',
      title: '순종과 헌신의 기도',
      icon: '✝️',
      prayer: `오 주님, 저의 삶 가운데 "${cleanVerseText}"의 실재가 온전히 이루어지기를 기도합니다. ${consecrateTail} 주 예수님의 이름으로 기도합니다. 아멘!`
    }
  ];

  return {
    keywords: keywords.length > 0 ? keywords : [verse.bookName, `${verse.chapter}장`, '아멘'],
    options: dynamicOptions,
    defaultPrayer: dynamicOptions[0].prayer
  };
}
