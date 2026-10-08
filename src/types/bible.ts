export type Testament = 'OT' | 'NT';

export interface BibleBook {
  id: number;              // 1 ~ 66 (1~39 구약, 40~66 신약)
  testament: Testament;
  name: string;            // 예: 창세기, 마태복음
  abbr: string;            // 예: 창, 마
  engName: string;         // 예: Genesis, Matthew
  totalChapters: number;   // 총 장수
  rvVer: number;           // rv.or.kr bibleVer (0: 구약, 1: 신약)
  rvBookId: number;        // rv.or.kr bibleSelOp (구약 1~39, 신약 1~27)
  theme: string;           // 각 권 주제
}

export interface VerseItem {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  outline?: string;        // 해당 장/절 성경 개요
}

export interface KeyVerseMeta {
  bookId: number;
  chapter: number;
  verses: number[];        // 예: [1] 또는 [1, 2]
  previewText: string;     // 대표 본문 텍스트
  outline?: string;
}

// SRS 7차 복습 단계
// 0: 당일 최초 암송
// 1: D+1 (1일 뒤)
// 2: D+3 (3일 뒤)
// 3: D+7 (7일 뒤)
// 4: D+14 (14일 뒤)
// 5: D+30 (30일 뒤)
// 6: D+60 (60일 뒤)
// 7: 마스터(Mastered)
export type SRSStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface MemorizeProgress {
  id: string;              // bookId_chapter_verse (예: "1_1_1")
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  outline?: string;
  stage: SRSStage;
  nextReviewDate: string;  // YYYY-MM-DD
  lastReviewedDate: string;// YYYY-MM-DD
  reviewCount: number;     // 누적 복습 횟수
  mistakeCount: number;    // 누적 오답 횟수
  isBookmarked?: boolean;  // 취약/관심 구절 북마크
  history: {
    date: string;
    result: 'again' | 'good' | 'easy';
    stageBefore: SRSStage;
    stageAfter: SRSStage;
  }[];
}

export interface DailyActivity {
  [dateString: string]: number; // 날짜별 암송/복습 횟수 (예: "2026-10-04": 5)
}

export type TTSVoiceStyle = 'reverent' | 'faithful' | 'solemn' | 'peaceful' | 'clear' | 'custom';

export interface UserSettings {
  dailyGoal: number;          // 하루 목표 구절 수 (기본: 3)
  theme: 'dark' | 'light' | 'sepia';
  ttsSpeed: number;           // TTS 재생 속도 (0.6 ~ 1.3)
  ttsPitch: number;           // 음높이 (0.6 ~ 1.4, 거룩한 중저음: 0.85~0.88)
  ttsVoiceStyle: TTSVoiceStyle; // 거룩한 낭독 스타일 프리셋
  ttsVoiceURI: string;        // 지정 성우 Voice URI
  ttsAddBreaths: boolean;     // 문장 간 묵상 호흡(쉼) 적용 여부
  autoPlayAudio: boolean;     // 학습 시작 시 자동 낭독 여부
}

// 끝장 암송 훈련 (Mastery Drill) 모드
export type DrillMode = 
  | 'VERSE_MASTERY'   // 핵심 구절을 암송할 때까지 연속 반복 (초성 -> 빈칸 -> 타이핑)
  | 'DICTATION'       // 성경 말씀 듣고 받아쓰기 (실시간 오타 색상 표시, 100% 맞을 때까지)
  | 'REF_TO_VERSE'    // 장/절을 보고 본문을 맞출 때까지 연속 반복
  | 'VERSE_TO_REF';   // 본문을 보고 장/절을 맞출 때까지 연속 반복 (객관식 -> 단계별선택 -> 직접입력)

export type DrillLevel = 1 | 2 | 3;

export interface DrillItem {
  id: string;
  verse: VerseItem;
  masteryPoints: number; // 성공 시 +1, 틀리면 0으로 리셋 (목표: 레벨당 요구 점수 달성)
  wrongAttempts: number;
  isPassed: boolean;
}

