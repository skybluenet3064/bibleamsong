import { MemorizeProgress, DailyActivity, UserSettings } from '../types/bible';
import { getTodayDateString } from './srsEngine';

const STORAGE_KEYS = {
  PROGRESS: 'bible_amsong_progress_v1',
  ACTIVITY: 'bible_amsong_activity_v1',
  SETTINGS: 'bible_amsong_settings_v1',
  CUSTOM_VERSES: 'bible_amsong_custom_verses_v1'
};

const DEFAULT_SETTINGS: UserSettings = {
  dailyGoal: 3,
  theme: 'dark',
  ttsSpeed: 0.84,             // 거룩하고 차분한 기본 낭독 속도
  ttsPitch: 0.88,             // 깊고 묵직한 중저음 거룩한 톤
  ttsVoiceStyle: 'reverent',  // 거룩하고 경건한 목소리 기본값
  ttsVoiceURI: '',
  ttsAddBreaths: true,        // 문장/쉼표 간 묵상 호흡 적용
  autoPlayAudio: true
};

/**
 * 암송 진도 데이터 로드
 */
export function loadProgressMap(): Record<string, MemorizeProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load progress from localStorage', e);
    return {};
  }
}

/**
 * 암송 진도 저장
 */
export function saveProgressMap(map: Record<string, MemorizeProgress>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save progress to localStorage', e);
  }
}

/**
 * 단일 구절 진도 업데이트 및 일일 활동 카운트 증가
 */
export function updateProgressItem(item: MemorizeProgress): Record<string, MemorizeProgress> {
  const current = loadProgressMap();
  current[item.id] = item;
  saveProgressMap(current);
  incrementDailyActivity();
  return current;
}

/**
 * 구절 북마크(취약 구절 표시) 토글
 */
export function toggleBookmarkItem(id: string): Record<string, MemorizeProgress> {
  const current = loadProgressMap();
  if (current[id]) {
    current[id].isBookmarked = !current[id].isBookmarked;
    saveProgressMap(current);
  }
  return current;
}

/**
 * 구절 말씀 기도 및 사용자 묵상 노트 저장
 */
export function saveVersePrayer(verseId: string, userPrayer: string, recommendedPrayer?: string): Record<string, MemorizeProgress> {
  const current = loadProgressMap();
  if (current[verseId]) {
    current[verseId] = {
      ...current[verseId],
      userPrayer,
      recommendedPrayer: recommendedPrayer || current[verseId].recommendedPrayer
    };
    saveProgressMap(current);
  } else {
    try {
      localStorage.setItem(`bible_amsong_prayer_${verseId}`, JSON.stringify({ userPrayer, recommendedPrayer }));
    } catch (e) {
      // ignore
    }
  }
  return current;
}

/**
 * 저장된 말씀 기도 로드
 */
export function getVersePrayer(verseId: string): { userPrayer: string; recommendedPrayer?: string } | null {
  const current = loadProgressMap();
  if (current[verseId]?.userPrayer) {
    return {
      userPrayer: current[verseId].userPrayer || '',
      recommendedPrayer: current[verseId].recommendedPrayer
    };
  }
  try {
    const raw = localStorage.getItem(`bible_amsong_prayer_${verseId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * 일일 활동 기록 로드
 */
export function loadActivityHistory(): DailyActivity {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * 오늘 활동 카운트 1 증가
 */
export function incrementDailyActivity(): DailyActivity {
  const today = getTodayDateString();
  const current = loadActivityHistory();
  current[today] = (current[today] || 0) + 1;
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save activity to localStorage', e);
  }
  return current;
}

/**
 * 연속 학습일(Streak) 계산
 */
export function calculateStreak(activity: DailyActivity): { currentStreak: number; bestStreak: number } {
  const today = getTodayDateString();
  const dates = Object.keys(activity).sort();
  if (dates.length === 0) return { currentStreak: 0, bestStreak: 0 };

  // 현재 스트릭: 오늘 또는 어제부터 거슬러 올라감
  let currentStreak = 0;
  let checkDate = new Date();
  
  // 오늘 아직 안 했더라도 어제까지 했으면 스트릭 유지
  const todayKey = getTodayDateString();
  if (!activity[todayKey]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    if (activity[key] && activity[key] > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 역대 최고 스트릭 계산
  let bestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const dateStr of dates) {
    if (activity[dateStr] > 0) {
      const d = new Date(dateStr);
      if (lastDate) {
        const diffDays = Math.round((d.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      lastDate = d;
      bestStreak = Math.max(bestStreak, tempStreak);
    }
  }

  return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak) };
}

/**
 * 사용자 설정
 */
export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

/**
 * 전체 데이터 JSON 내보내기 (백업)
 */
export function exportBackupData(): string {
  const data = {
    progress: loadProgressMap(),
    activity: loadActivityHistory(),
    settings: loadSettings(),
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  return JSON.stringify(data, null, 2);
}

/**
 * 백업 JSON 가져오기 (복원)
 */
export function importBackupData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.progress) localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress));
    if (data.activity) localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(data.activity));
    if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    return true;
  } catch (e) {
    console.error('Failed to import backup', e);
    return false;
  }
}
