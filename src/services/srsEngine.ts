import { MemorizeProgress, SRSStage } from '../types/bible';

// SRS 복습 간격 일수 (에빙하우스 망각곡선 모델)
export const SRS_INTERVAL_DAYS: Record<SRSStage, number> = {
  0: 0,   // 당일
  1: 1,   // 1일 뒤
  2: 3,   // 3일 뒤
  3: 7,   // 7일 뒤
  4: 14,  // 14일 뒤
  5: 30,  // 30일 뒤
  6: 60,  // 60일 뒤
  7: 120  // 마스터 유지보수
};

export const STAGE_LABELS: Record<SRSStage, string> = {
  0: '신규 학습',
  1: '1차 복습 (1일 뒤)',
  2: '2차 복습 (3일 뒤)',
  3: '3차 복습 (7일 뒤)',
  4: '4차 복습 (14일 뒤)',
  5: '5차 복습 (30일 뒤)',
  6: '6차 복습 (60일 뒤)',
  7: '장기기억 마스터'
};

/**
 * 오늘 날짜 문자열 (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * N일 뒤의 날짜 문자열 계산
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 신규 구절 암송 완료 시 초기 Progress 생성
 */
export function createInitialProgress(params: {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  outline?: string;
}): MemorizeProgress {
  const today = getTodayDateString();
  const nextReview = addDaysToDate(today, SRS_INTERVAL_DAYS[1]); // 1일 뒤

  return {
    id: `${params.bookId}_${params.chapter}_${params.verse}`,
    bookId: params.bookId,
    bookName: params.bookName,
    chapter: params.chapter,
    verse: params.verse,
    text: params.text,
    outline: params.outline,
    stage: 1, // 1단계로 진입 (내일 1차 복습 예정)
    nextReviewDate: nextReview,
    lastReviewedDate: today,
    reviewCount: 1,
    mistakeCount: 0,
    history: [
      {
        date: today,
        result: 'good',
        stageBefore: 0,
        stageAfter: 1
      }
    ]
  };
}

/**
 * 복습 결과에 따른 다음 SRS 단계 및 일정 계산
 */
export function calculateNextSRS(
  item: MemorizeProgress,
  result: 'again' | 'good' | 'easy'
): MemorizeProgress {
  const today = getTodayDateString();
  let nextStage: SRSStage = item.stage;
  let mistakeCount = item.mistakeCount;

  if (result === 'again') {
    // 기억 안남: 1단계로 리셋, 오답 카운트 증가
    nextStage = 1;
    mistakeCount += 1;
  } else if (result === 'good') {
    // 정상 기억: 1단계 전진 (최대 7)
    nextStage = Math.min(item.stage + 1, 7) as SRSStage;
  } else if (result === 'easy') {
    // 매우 쉬움: 2단계 전진
    nextStage = Math.min(item.stage + 2, 7) as SRSStage;
  }

  const daysUntilNext = result === 'again' ? 1 : SRS_INTERVAL_DAYS[nextStage];
  const nextDate = addDaysToDate(today, daysUntilNext);

  return {
    ...item,
    stage: nextStage,
    lastReviewedDate: today,
    nextReviewDate: nextDate,
    reviewCount: item.reviewCount + 1,
    mistakeCount: mistakeCount,
    history: [
      ...item.history,
      {
        date: today,
        result,
        stageBefore: item.stage,
        stageAfter: nextStage
      }
    ]
  };
}

/**
 * 오늘 복습해야 하는 구절 필터링
 */
export function filterDueReviews(items: MemorizeProgress[]): MemorizeProgress[] {
  const today = getTodayDateString();
  return items.filter(item => {
    // 다음 복습일이 오늘 이전이거나 오늘인 경우
    return item.nextReviewDate <= today;
  });
}
