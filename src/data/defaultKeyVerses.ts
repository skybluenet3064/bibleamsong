import { VerseItem } from '../types/bible';
import { BIBLE_BOOKS } from './bibleBooks';

// 성경 핵심 명구 데이터베이스 (대표 요절)
export const DEFAULT_KEY_VERSES: Record<string, VerseItem> = {
  // === 구약 대표 구절 ===
  // 창세기
  '1_1': {
    bookId: 1,
    bookName: '창세기',
    chapter: 1,
    verse: 1,
    text: '태초에 하나님께서 하늘들과 땅을 창조하셨다.',
    outline: 'Ⅰ. 하나님의 창조 ― 1:1-2:25'
  },
  '1_2': {
    bookId: 1,
    bookName: '창세기',
    chapter: 2,
    verse: 7,
    text: '여호와 하나님께서 땅의 흙으로 사람을 지으시고 생명의 호흡을 그 코에 불어넣으시니 사람이 산 혼이 되었다.',
    outline: 'B. 사람의 창조 ― 2:4-25'
  },
  '1_3': {
    bookId: 1,
    bookName: '창세기',
    chapter: 3,
    verse: 15,
    text: '내가 너와 여자 사이에, 네 씨와 여자의 씨 사이에 적대감을 둘 것이니, 여자의 씨는 네 머리를 상하게 할 것이고 너는 그의 발꿈치를 상하게 할 것이다.',
    outline: 'Ⅱ. 사탄의 부패시킴 ― 3:1-11:32'
  },
  '1_12': {
    bookId: 1,
    bookName: '창세기',
    chapter: 12,
    verse: 2,
    text: '내가 너로 큰 민족을 이루게 하고 너에게 복을 주어 네 이름을 창대하게 하리니, 너는 복이 될 것이다.',
    outline: 'Ⅲ. 여호와의 부르심 ― 12:1-50:26'
  },
  '1_15': {
    bookId: 1,
    bookName: '창세기',
    chapter: 15,
    verse: 6,
    text: '아브람이 여호와를 믿으니, 여호와께서 이것을 그의 의로 여기셨다.',
    outline: 'B. 아브라함의 믿음과 의'
  },
  '1_22': {
    bookId: 1,
    bookName: '창세기',
    chapter: 22,
    verse: 14,
    text: '아브라함이 그곳의 이름을 여호와 이레라 불렀으므로, 오늘날까지 사람들이 이르기를 \'여호와의 산에서 준비될 것이다\'라고 한다.',
    outline: 'C. 이삭을 바침과 여호와 이레'
  },

  // 출애굽기
  '2_3': {
    bookId: 2,
    bookName: '출애굽기',
    chapter: 3,
    verse: 14,
    text: '하나님께서 모세에게 말씀하셨다. "나는 스스로 있는 자이다." 또 말씀하셨다. "너는 이스라엘 자손에게 이렇게 말하여라. \'스스로 계신 분께서 나를 여러분에게 보내셨습니다.\'"',
    outline: '모세의 부르심과 하나님의 이름'
  },
  '2_12': {
    bookId: 2,
    bookName: '출애굽기',
    chapter: 12,
    verse: 13,
    text: '그 피는 여러분이 있는 집들에서 여러분을 위한 표가 될 것입니다. 내가 그 피를 볼 때 여러분을 넘어가겠으니, 재앙이 여러분에게 내려 멸망시키지 않을 것입니다.',
    outline: '유월절 어린양의 피'
  },
  '2_20': {
    bookId: 2,
    bookName: '출애굽기',
    chapter: 20,
    verse: 3,
    text: '너는 내 앞에 다른 신들을 두지 마라.',
    outline: '십계명의 선포'
  },

  // 시편
  '19_1': {
    bookId: 19,
    bookName: '시편',
    chapter: 1,
    verse: 2,
    text: '오직 여호와의 율법을 즐거워하여 그분의 율법을 밤낮으로 묵상하는 사람이다.',
    outline: '복 있는 사람'
  },
  '19_23': {
    bookId: 19,
    bookName: '시편',
    chapter: 23,
    verse: 1,
    text: '여호와는 나의 목자이시니 내게 부족함이 없으리로다.',
    outline: '목자이신 여호와'
  },
  '19_103': {
    bookId: 19,
    bookName: '시편',
    chapter: 103,
    verse: 1,
    text: '내 혼아, 여호와를 송축하여라. 내 속에 있는 모든 것들아, 그분의 거룩한 이름을 송축하여라.',
    outline: '여호와의 은택을 찬양함'
  },
  '19_119': {
    bookId: 19,
    bookName: '시편',
    chapter: 119,
    verse: 105,
    text: '주의 말씀은 내 발의 등이요, 내 길의 빛입니다.',
    outline: '말씀의 빛과 인도'
  },

  // 잠언
  '20_3': {
    bookId: 20,
    bookName: '잠언',
    chapter: 3,
    verse: 5,
    text: '너는 마음을 다하여 여호와를 신뢰하고 네 명철에 기대지 마라.',
    outline: '지혜자의 신뢰'
  },
  '20_4': {
    bookId: 20,
    bookName: '잠언',
    chapter: 4,
    verse: 23,
    text: '모든 지킬 만한 것보다 더욱 네 마음을 지켜라. 생명의 근원이 거기에서 나오기 때문이다.',
    outline: '마음을 지키는 지혜'
  },

  // 이사야서
  '23_9': {
    bookId: 23,
    bookName: '이사야서',
    chapter: 9,
    verse: 6,
    text: '한 아기가 우리에게 태어났고 한 아들을 우리에게 주셨는데, 그의 어깨에는 정권이 메일 것이요 그의 이름은 기묘자요 모사요 전능하신 하나님이요 영존하시는 아버지요 평강의 왕이라 불릴 것이다.',
    outline: '기묘자요 전능하신 하나님으로 오시는 그리스도'
  },
  '23_40': {
    bookId: 23,
    bookName: '이사야서',
    chapter: 40,
    verse: 31,
    text: '오직 여호와를 앙망하는 사람들은 새 힘을 얻을 것이니, 독수리가 날개 치며 솟아오르듯 올라갈 것이요, 달음질하여도 지치지 않으며 걸어가도 피곤하지 않을 것이다.',
    outline: '여호와를 앙망하는 자의 새 힘'
  },
  '23_53': {
    bookId: 23,
    bookName: '이사야서',
    chapter: 53,
    verse: 5,
    text: '그러나 그가 찔린 것은 우리의 허물 때문이었고, 그가 상한 것은 우리의 죄악 때문이었다. 그가 징계를 받음으로 우리가 평화를 누리고, 그가 채찍에 맞음으로 우리가 나음을 입었다.',
    outline: '대속의 고난을 받으시는 그리스도'
  },

  // === 신약 대표 구절 ===
  // 마태복음
  '40_1': {
    bookId: 40,
    bookName: '마태복음',
    chapter: 1,
    verse: 21,
    text: '마리아가 아들을 낳을 것이니 그 이름을 예수라 하십시오. 왜냐하면 그분께서 자기 백성을 그들의 죄들에서 구원하실 것이기 때문입니다.',
    outline: '왕-구주의 탄생과 이름 예수'
  },
  '40_5': {
    bookId: 40,
    bookName: '마태복음',
    chapter: 5,
    verse: 3,
    text: '영 안에서 가난한 사람들은 복이 있습니다. 왜냐하면 천국이 그들의 것이기 때문입니다.',
    outline: '천국 헌법 ― 아홉 가지 복'
  },
  '40_6': {
    bookId: 40,
    bookName: '마태복음',
    chapter: 6,
    verse: 33,
    text: '여러분은 먼저 하나님의 왕국과 그분의 의를 구하십시오. 그러면 이 모든 것을 여러분에게 더해 주실 것입니다.',
    outline: '왕국 백성의 재물관과 신뢰'
  },
  '40_16': {
    bookId: 40,
    bookName: '마태복음',
    chapter: 16,
    verse: 16,
    text: '시몬 베드로가 대답하였다. "주님은 그리스도시요 살아 계신 하나님의 아들이십니다."',
    outline: '그리스도와 교회에 관한 계시'
  },
  '40_16_18': {
    bookId: 40,
    bookName: '마태복음',
    chapter: 16,
    verse: 18,
    text: '또 내가 그대에게 말합니다. 그대는 베드로입니다. 내가 이 반석 위에 내 교회를 건축할 것이니, 음부의 문들이 교회를 이기지 못할 것입니다.',
    outline: '반석 위에 건축되는 교회'
  },
  '40_28': {
    bookId: 40,
    bookName: '마태복음',
    chapter: 28,
    verse: 19,
    text: '그러므로 여러분은 가서 모든 민족을 제자로 삼아, 아버지와 아들과 성령의 이름 안으로 침례를 주고',
    outline: '부활하신 왕의 대위임'
  },

  // 요한복음
  '43_1': {
    bookId: 43,
    bookName: '요한복음',
    chapter: 1,
    verse: 1,
    text: '태초에 말씀께서 계셨다. 말씀은 하나님과 함께 계셨으며, 말씀은 곧 하나님이셨다.',
    outline: '말씀이신 하나님'
  },
  '43_1_14': {
    bookId: 43,
    bookName: '요한복음',
    chapter: 1,
    verse: 14,
    text: '말씀께서 육체가 되시어 우리 가운데 장막을 치시니, 은혜와 실재가 충만하였다. 우리가 그분의 영광을 보니, 아버지에게서 온 독생자의 영광이었다.',
    outline: '말씀이 육체가 되심'
  },
  '43_3': {
    bookId: 43,
    bookName: '요한복음',
    chapter: 3,
    verse: 16,
    text: '하나님께서 세상을 이처럼 사랑하시어 독생자를 주셨으니, 이것은 그분을 믿는 사람마다 멸망하지 않고 영원한 생명을 얻도록 하려는 것입니다.',
    outline: '거듭남과 하나님의 영원한 사랑'
  },
  '43_4': {
    bookId: 43,
    bookName: '요한복음',
    chapter: 4,
    verse: 24,
    text: '하나님은 영이시니, 예배하는 사람들은 영과 진실함으로 예배해야 합니다.',
    outline: '참된 예배와 영의 접촉'
  },
  '43_10': {
    bookId: 43,
    bookName: '요한복음',
    chapter: 10,
    verse: 10,
    text: '도둑이 오는 것은 도둑질하고 죽이고 멸망시키려는 것뿐이지만, 내가 온 것은 양들이 생명을 얻고 더 풍성히 얻도록 하기 위한 것입니다.',
    outline: '선한 목자이신 그리스도'
  },
  '43_11': {
    bookId: 43,
    bookName: '요한복음',
    chapter: 11,
    verse: 25,
    text: '예수님께서 마르다에게 말씀하셨다. "나는 부활이요 생명이니, 나를 믿는 사람은 죽어도 살겠고,"',
    outline: '부활이요 생명이신 그리스도'
  },
  '43_14': {
    bookId: 43,
    bookName: '요한복음',
    chapter: 14,
    verse: 6,
    text: '예수님께서 그에게 말씀하셨다. "내가 곧 길이요 실재요 생명이니, 나를 거치지 않고는 아무도 아버지께로 올 수 없습니다."',
    outline: '길과 실재와 생명'
  },
  '43_15': {
    bookId: 43,
    bookName: '요한복음',
    chapter: 15,
    verse: 5,
    text: '나는 포도나무요 여러분은 가지들입니다. 그가 내 안에 머물고 내가 그 안에 머물면 그 사람은 열매를 많이 맺습니다. 왜냐하면 나를 떠나서는 여러분이 아무것도 할 수 없기 때문입니다.',
    outline: '참포도나무와 유기적 연결'
  },

  // 로마서
  '45_1': {
    bookId: 45,
    bookName: '로마서',
    chapter: 1,
    verse: 16,
    text: '내가 복음을 부끄러워하지 않습니다. 왜냐하면 이 복음은 믿는 모든 사람을 구원에 이르게 하는 하나님의 능력이기 때문입니다. 첫째는 유대인에게요, 다음은 헬라인에게입니다.',
    outline: '하나님의 능력인 복음'
  },
  '45_5': {
    bookId: 45,
    bookName: '로마서',
    chapter: 5,
    verse: 8,
    text: '그러나 우리가 아직 죄인이었을 때에 그리스도께서 우리를 위하여 죽으심으로 하나님께서 우리에 대한 자기의 사랑을 확증하셨습니다.',
    outline: '화목과 그리스도의 사랑'
  },
  '45_8': {
    bookId: 45,
    bookName: '로마서',
    chapter: 8,
    verse: 1,
    text: '그러므로 이제 그리스도 예수님 안에 있는 사람들에게는 유죄 판결이 결코 없습니다.',
    outline: '생명의 영의 법과 해방'
  },
  '45_8_2': {
    bookId: 45,
    bookName: '로마서',
    chapter: 8,
    verse: 2,
    text: '왜냐하면 그리스도 예수님 안에 있는 생명의 영의 법이 죄와 죽음의 법에서 나를 해방하였기 때문입니다.',
    outline: '생명의 영의 법'
  },
  '45_8_28': {
    bookId: 45,
    bookName: '로마서',
    chapter: 8,
    verse: 28,
    text: '하나님을 사랑하는 사람들, 곧 그분의 목적에 따라 부르심을 받은 사람들에게는 모든 것이 협력하여 선을 이룬다는 것을 우리는 압니다.',
    outline: '모든 것이 협력하여 선을 이룸'
  },
  '45_12': {
    bookId: 45,
    bookName: '로마서',
    chapter: 12,
    verse: 2,
    text: '여러분은 이 시대를 본받지 말고, 마음의 생각을 새롭게 함으로 변화되어, 하나님의 선하시고 기뻐하시고 온전하신 뜻이 무엇인지 분별하도록 하십시오.',
    outline: '생각의 갱신과 변화'
  },

  // 갈라디아서
  '48_2': {
    bookId: 48,
    bookName: '갈라디아서',
    chapter: 2,
    verse: 20,
    text: '내가 그리스도와 함께 십자가에 못 박혔습니다. 그러므로 이제는 더 이상 내가 사는 것이 아니라 내 안에 그리스도께서 사시는 것입니다. 이제 내가 육체 안에서 사는 삶은 나를 사랑하시어 나를 위해 자신을 버리신 하나님의 아들을 믿는 믿음 안에서 사는 것입니다.',
    outline: '내 안에 사시는 그리스도'
  },
  '48_5': {
    bookId: 48,
    bookName: '갈라디아서',
    chapter: 5,
    verse: 22,
    text: '그러나 성령의 열매는 사랑과 기쁨과 평화와 오래 참음과 친절과 선함과 신실과 온유와 절제입니다.',
    outline: '성령의 열매'
  },

  // 에베소서
  '49_1': {
    bookId: 49,
    bookName: '에베소서',
    chapter: 1,
    verse: 22,
    text: '만물을 그분의 발아래 복종하게 하시고, 그분을 만물 위에 교회의 머리로 주셨습니다.',
    outline: '만물 위의 머리이신 그리스도'
  },
  '49_2': {
    bookId: 49,
    bookName: '에베소서',
    chapter: 2,
    verse: 8,
    text: '여러분은 은혜로 인하여 믿음을 통하여 구원을 받았습니다. 이것은 여러분에게서 난 것이 아니요, 하나님의 선물입니다.',
    outline: '은혜로 받은 구원'
  },
  '49_4': {
    bookId: 49,
    bookName: '에베소서',
    chapter: 4,
    verse: 15,
    text: '오직 사랑 안에서 참된 것을 붙잡아 모든 일에서 머리이신 그리스도에게까지 자라나야 합니다.',
    outline: '그리스도 안에서의 성장'
  },

  // 빌립보서
  '50_1': {
    bookId: 50,
    bookName: '빌립보서',
    chapter: 1,
    verse: 21,
    text: '왜냐하면 나에게 있어서 사는 것은 그리스도요 죽는 것은 유익하기 때문입니다.',
    outline: '내 몸에서 그리스도를 확대함'
  },
  '50_4': {
    bookId: 50,
    bookName: '빌립보서',
    chapter: 4,
    verse: 13,
    text: '나에게 능력 주시는 분 안에서 내가 모든 것을 할 수 있습니다.',
    outline: '능력 주시는 분 안에서의 비밀'
  },

  // 골로새서
  '51_1': {
    bookId: 51,
    bookName: '골로새서',
    chapter: 1,
    verse: 18,
    text: '그분은 몸인 교회의 머리이십니다. 그분은 시작이시며 죽은 사람들 가운데서 가장 먼저 나신 분이시니, 이는 그분께서 친히 만물 가운데 으뜸이 되시려는 것입니다.',
    outline: '만물 가운데 으뜸이신 그리스도'
  },
  '51_3': {
    bookId: 51,
    bookName: '골로새서',
    chapter: 3,
    verse: 4,
    text: '우리의 생명이신 그리스도께서 나타나실 때에 여러분도 그분과 함께 영광 가운데 나타날 것입니다.',
    outline: '우리의 생명이신 그리스도'
  },

  // 디모데후서
  '55_3': {
    bookId: 55,
    bookName: '디모데후서',
    chapter: 3,
    verse: 16,
    text: '모든 성경은 하나님의 호흡으로 된 것으로, 가르침과 책망과 바르게 함과 의로 교육하기에 유익합니다.',
    outline: '하나님의 호흡인 성경'
  },

  // 히브리서
  '58_4': {
    bookId: 58,
    bookName: '히브리서',
    chapter: 4,
    verse: 12,
    text: '하나님의 말씀은 살아 있고 효력이 있어 어떤 양날 선 칼보다 더 날카로워서, 혼과 영과 관절과 골수를 찔러 쪼개기까지 하며 마음의 생각과 뜻을 판단합니다.',
    outline: '살아 있는 하나님의 말씀'
  },
  '58_11': {
    bookId: 58,
    bookName: '히브리서',
    chapter: 11,
    verse: 1,
    text: '믿음은 바라는 것들의 실체요, 보이지 않는 것들의 증거입니다.',
    outline: '믿음의 정의와 증인들'
  },
  '58_12': {
    bookId: 58,
    bookName: '히브리서',
    chapter: 12,
    verse: 2,
    text: '우리의 믿음의 창시자이시며 완성자이신 예수님을 바라봅시다.',
    outline: '예수님을 바라봄'
  },

  // 요한계시록
  '66_1': {
    bookId: 66,
    bookName: '요한계시록',
    chapter: 1,
    verse: 8,
    text: '주 하나님, 곧 지금도 계시고 전에도 계셨고 장차 오실 분, 전능하신 분께서 말씀하신다. "나는 알파와 오메가이다."',
    outline: '알파와 오메가이신 주님'
  },
  '66_21': {
    bookId: 66,
    bookName: '요한계시록',
    chapter: 21,
    verse: 2,
    text: '또 내가 보니 거룩한 성 새 예루살렘이 하나님께로부터 하늘에서 내려오는데, 그 모습이 마치 신부가 남편을 위하여 단장한 것 같았다.',
    outline: '거룩한 성 새 예루살렘'
  },
  '66_22': {
    bookId: 66,
    bookName: '요한계시록',
    chapter: 22,
    verse: 17,
    text: '그 영과 신부가 말씀하신다. "오십시오!" 듣는 사람도 "오십시오!" 하고 말하십시오. 목마른 사람도 오십시오. 원하는 사람은 거저 생명수를 마시십시오.',
    outline: '그 영과 신부의 부르심'
  }
};

/**
 * 특정 권과 장의 대표 구절 가져오기 (기본값 제공 및 1절 fallback)
 */
export function getDefaultKeyVerse(bookId: number, chapter: number): VerseItem {
  const key = `${bookId}_${chapter}`;
  if (DEFAULT_KEY_VERSES[key]) {
    return DEFAULT_KEY_VERSES[key];
  }

  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  const bookName = book ? book.name : '성경';

  return {
    bookId,
    bookName,
    chapter,
    verse: 1,
    text: `${bookName} ${chapter}장의 핵심 구절입니다. (클릭하여 구절을 확인하거나 원하는 절을 선택하세요.)`,
    outline: book ? book.theme : undefined
  };
}
