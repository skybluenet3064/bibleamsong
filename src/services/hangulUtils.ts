// 한글 유니코드 상수
const HANGUL_START = 0xAC00; // '가'
const HANGUL_END = 0xD7A3;   // '힣'

// 초성 19자
const INITIAL_CONSONANTS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 중성 21자
const VOWELS = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

// 종성 28자 (공백 포함)
const FINAL_CONSONANTS = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 특정 글자가 완성형 한글인지 확인
 */
export function isHangul(char: string): boolean {
  if (!char || char.length === 0) return false;
  const code = char.charCodeAt(0);
  return code >= HANGUL_START && code <= HANGUL_END;
}

/**
 * 한 글자의 초성 추출
 */
export function getInitialConsonant(char: string): string {
  if (!isHangul(char)) return char;
  const code = char.charCodeAt(0) - HANGUL_START;
  const initialIndex = Math.floor(code / 588);
  return INITIAL_CONSONANTS[initialIndex];
}

/**
 * 전체 문장을 초성으로 변환
 * 예: "태초에 하나님께서" -> "ㅌㅊㅇ ㅎㄴㄴㄲㅅ"
 */
export function toInitialConsonants(text: string): string {
  return text
    .split('')
    .map(char => getInitialConsonant(char))
    .join('');
}

/**
 * 점진적 가림판(Fading) 생성
 * blindRatio: 0.0 ~ 1.0 (가릴 비율)
 */
export function applyBlind(text: string, blindRatio: number, seed: number = 42): { maskedText: string; isMasked: boolean[] } {
  if (blindRatio <= 0) {
    return { maskedText: text, isMasked: new Array(text.length).fill(false) };
  }

  // 간단한 결정론적 의사 난수 생성기 (일관성 유지)
  let s = seed;
  const pseudoRandom = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const chars = text.split('');
  const isMasked: boolean[] = [];

  const maskedText = chars.map((char) => {
    // 공백, 마침표, 쉼표, 기호는 가리지 않음
    if (!/[가-힣a-zA-Z0-9]/.test(char)) {
      isMasked.push(false);
      return char;
    }
    const mask = pseudoRandom() < blindRatio;
    isMasked.push(mask);
    return mask ? '●' : char;
  }).join('');

  return { maskedText, isMasked };
}

/**
 * 빈칸 퀴즈 생성
 * 문장에서 핵심 어절(단어)들을 선정하여 빈칸으로 만들고, 선택지 블록을 섞어 반환
 */
export interface ClozeItem {
  index: number;
  word: string;
  isBlank: boolean;
}

export interface ClozeQuiz {
  items: ClozeItem[];
  blankWords: { id: string; word: string }[];
}

export function generateClozeQuiz(text: string, blankCount: number = 3): ClozeQuiz {
  const words = text.split(/\s+/);
  // 단어 길이가 2자 이상인 후보들
  const eligibleIndices: number[] = [];
  words.forEach((w, idx) => {
    const cleaned = w.replace(/[^가-힣a-zA-Z0-9]/g, '');
    if (cleaned.length >= 2) {
      eligibleIndices.push(idx);
    }
  });

  // 균등하게 간격을 두어 빈칸 선정
  const selectedIndices = new Set<number>();
  if (eligibleIndices.length <= blankCount) {
    eligibleIndices.forEach(i => selectedIndices.add(i));
  } else {
    const step = Math.floor(eligibleIndices.length / blankCount);
    for (let i = 0; i < blankCount; i++) {
      const idx = eligibleIndices[Math.min(i * step + Math.floor(step / 2), eligibleIndices.length - 1)];
      selectedIndices.add(idx);
    }
  }

  const items: ClozeItem[] = [];
  const blankWords: { id: string; word: string }[] = [];

  words.forEach((w, idx) => {
    const isBlank = selectedIndices.has(idx);
    items.push({ index: idx, word: w, isBlank });
    if (isBlank) {
      blankWords.push({ id: `blank_${idx}`, word: w });
    }
  });

  // 선택지 단어 셔플
  const shuffledChoices = [...blankWords].sort(() => Math.random() - 0.5);

  return { items, blankWords: shuffledChoices };
}

/**
 * 타이핑 일치 검사
 */
export interface TypingDiff {
  char: string;
  expected: string;
  status: 'correct' | 'wrong' | 'pending';
}

export function evaluateTyping(target: string, input: string): {
  diffs: TypingDiff[];
  accuracy: number;
  isComplete: boolean;
} {
  const diffs: TypingDiff[] = [];
  let correctCount = 0;

  for (let i = 0; i < target.length; i++) {
    const exp = target[i];
    if (i < input.length) {
      const inp = input[i];
      if (inp === exp) {
        diffs.push({ char: inp, expected: exp, status: 'correct' });
        correctCount++;
      } else {
        diffs.push({ char: inp, expected: exp, status: 'wrong' });
      }
    } else {
      diffs.push({ char: '', expected: exp, status: 'pending' });
    }
  }

  // 목표 구절 길이를 초과하여 더 입력된 글자들도 오타(wrong)로 표시
  if (input.length > target.length) {
    for (let i = target.length; i < input.length; i++) {
      diffs.push({ char: input[i], expected: '', status: 'wrong' });
    }
  }

  const isComplete = input.trim() === target.trim();
  const accuracy = input.length > 0 ? Math.round((correctCount / Math.max(input.length, target.length)) * 100) : 0;

  return { diffs, accuracy, isComplete };
}
