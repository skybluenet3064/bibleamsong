import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BibleNavigator } from './components/BibleNavigator';
import { WeakVersesView } from './components/WeakVersesView';
import { MasteryDrillView } from './components/MasteryDrillView';
import { VerseMemorizeModal } from './components/VerseMemorizeModal';
import { VersePickerModal } from './components/VersePickerModal';
import { SettingsModal } from './components/SettingsModal';

import { BibleBook, VerseItem, MemorizeProgress, DailyActivity, UserSettings } from './types/bible';
import { 
  loadProgressMap, saveProgressMap, updateProgressItem, toggleBookmarkItem,
  loadActivityHistory, calculateStreak, loadSettings, saveSettings 
} from './services/storage';
import { createInitialProgress, calculateNextSRS, getTodayDateString } from './services/srsEngine';

export function App() {
  const [tab, setTab] = useState<'dashboard' | 'navigator' | 'drill' | 'weak'>('dashboard');
  const [progressMap, setProgressMap] = useState<Record<string, MemorizeProgress>>({});
  const [activityHistory, setActivityHistory] = useState<DailyActivity>({});
  const [settings, setSettings] = useState<UserSettings>(loadSettings());

  // 모달 제어 상태
  const [memorizeTarget, setMemorizeTarget] = useState<{
    verse: VerseItem;
    existing?: MemorizeProgress;
  } | null>(null);

  const [pickerTarget, setPickerTarget] = useState<{
    book: BibleBook;
    chapter: number;
  } | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 초기 데이터 로드 및 테마 동기화
  useEffect(() => {
    const p = loadProgressMap();
    const a = loadActivityHistory();
    const s = loadSettings();
    setProgressMap(p);
    setActivityHistory(a);
    setSettings(s);
    document.documentElement.setAttribute('data-theme', s.theme);
  }, []);

  const refreshData = () => {
    setProgressMap(loadProgressMap());
    setActivityHistory(loadActivityHistory());
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // 암송 시작 핸들러
  const handleStartMemorize = (verse: VerseItem, existing?: MemorizeProgress) => {
    setMemorizeTarget({ verse, existing });
  };

  // 암송 5단계 완료 & SRS 복습 피드백 적용
  const handleCompleteMemorize = (result: 'again' | 'good' | 'easy') => {
    if (!memorizeTarget) return;

    let updated: MemorizeProgress;
    if (memorizeTarget.existing) {
      // 기존 복습 건 처리
      updated = calculateNextSRS(memorizeTarget.existing, result);
    } else {
      // 신규 구절 최초 완료 처리
      updated = createInitialProgress({
        bookId: memorizeTarget.verse.bookId,
        bookName: memorizeTarget.verse.bookName,
        chapter: memorizeTarget.verse.chapter,
        verse: memorizeTarget.verse.verse,
        text: memorizeTarget.verse.text,
        outline: memorizeTarget.verse.outline
      });
      if (result === 'again') {
        updated = calculateNextSRS(updated, 'again');
      } else if (result === 'easy') {
        updated = calculateNextSRS(updated, 'easy');
      }
    }

    const nextMap = updateProgressItem(updated);
    setProgressMap(nextMap);
    setActivityHistory(loadActivityHistory());
    setMemorizeTarget(null);
  };

  // 드릴 훈련 중 구절 완료 콜백
  const handleDrillCompleteVerse = (verse: VerseItem, result: 'again' | 'good' | 'easy') => {
    const existing = Object.values(progressMap).find(
      (p) => p.bookId === verse.bookId && p.chapter === verse.chapter && p.verse === verse.verse
    );
    let updated: MemorizeProgress;
    if (existing) {
      updated = calculateNextSRS(existing, result);
    } else {
      updated = createInitialProgress({
        bookId: verse.bookId,
        bookName: verse.bookName,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        outline: verse.outline
      });
      if (result === 'again') updated = calculateNextSRS(updated, 'again');
    }
    const nextMap = updateProgressItem(updated);
    setProgressMap(nextMap);
    setActivityHistory(loadActivityHistory());
  };

  // 북마크 토글
  const handleToggleBookmark = (id: string) => {
    const nextMap = toggleBookmarkItem(id);
    setProgressMap(nextMap);
  };

  // 장별 전체 구절 선택기 열기
  const handleOpenVersePicker = (book: BibleBook, chapter: number) => {
    setPickerTarget({ book, chapter });
  };

  // 구절 선택기에서 구절 클릭 시
  const handleSelectVerseFromPicker = (verse: VerseItem) => {
    const existing = Object.values(progressMap).find(
      (p) => p.bookId === verse.bookId && p.chapter === verse.chapter && p.verse === verse.verse
    );
    setPickerTarget(null);
    setMemorizeTarget({ verse, existing });
  };

  // 스트릭 & 오늘 암송 수 계산
  const { currentStreak } = calculateStreak(activityHistory);
  const todayKey = getTodayDateString();
  const todayCount = activityHistory[todayKey] || 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <Header
        currentTab={tab}
        onSelectTab={setTab}
        streak={currentStreak}
        todayCount={todayCount}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 메인 뷰 */}
      <main style={{ flex: 1, paddingBottom: 60 }}>
        {tab === 'dashboard' && (
          <Dashboard
            progressMap={progressMap}
            activityHistory={activityHistory}
            settings={settings}
            onStartMemorize={handleStartMemorize}
            onNavigateToNavigator={() => setTab('navigator')}
            onNavigateToDrill={() => setTab('drill')}
          />
        )}

        {tab === 'navigator' && (
          <BibleNavigator
            progressMap={progressMap}
            onStartMemorize={handleStartMemorize}
            onOpenVersePicker={handleOpenVersePicker}
          />
        )}

        {tab === 'drill' && (
          <MasteryDrillView
            progressMap={progressMap}
            onCompleteVerse={handleDrillCompleteVerse}
            onExit={() => setTab('dashboard')}
          />
        )}

        {tab === 'weak' && (
          <WeakVersesView
            progressMap={progressMap}
            onStartMemorize={handleStartMemorize}
            onToggleBookmark={handleToggleBookmark}
          />
        )}
      </main>

      {/* 푸터 */}
      <footer style={{
        padding: '24px 20px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
        background: 'var(--bg-card)'
      }}>
        <p style={{ marginBottom: 4 }}>
          성경 66권 장별 핵심 구절 암송 플랫폼 · 회복역 성경(rv.or.kr) 말씀 텍스트 기반
        </p>
        <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>
          과학적 7차 복습 시스템(Spaced Repetition System)과 5단계 능동 암송 인출(Active Recall) 엔진
        </p>
      </footer>

      {/* 5단계 암송 모달 */}
      {memorizeTarget && (
        <VerseMemorizeModal
          verseItem={memorizeTarget.verse}
          existingProgress={memorizeTarget.existing}
          onClose={() => setMemorizeTarget(null)}
          onComplete={handleCompleteMemorize}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {/* 구절 선택기 모달 */}
      {pickerTarget && (
        <VersePickerModal
          book={pickerTarget.book}
          chapter={pickerTarget.chapter}
          existingProgressList={Object.values(progressMap).filter(
            (p) => p.bookId === pickerTarget.book.id && p.chapter === pickerTarget.chapter
          )}
          onClose={() => setPickerTarget(null)}
          onSelectVerse={handleSelectVerseFromPicker}
        />
      )}

      {/* 설정 모달 */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
          onDataReset={() => {
            localStorage.clear();
            refreshData();
          }}
          onDataImported={refreshData}
        />
      )}
    </div>
  );
}

export default App;
