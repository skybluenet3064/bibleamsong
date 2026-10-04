import React from 'react';
import { 
  Sparkles, CheckCircle2, Clock, Flame, BookOpen, ArrowRight, 
  RotateCcw, Trophy, Compass, PlusCircle
} from 'lucide-react';
import { MemorizeProgress, VerseItem, DailyActivity, UserSettings } from '../types/bible';
import { filterDueReviews, STAGE_LABELS, getTodayDateString } from '../services/srsEngine';
import { BIBLE_BOOKS, TOTAL_CHAPTERS } from '../data/bibleBooks';
import { DEFAULT_KEY_VERSES, getDefaultKeyVerse } from '../data/defaultKeyVerses';

interface DashboardProps {
  progressMap: Record<string, MemorizeProgress>;
  activityHistory: DailyActivity;
  settings: UserSettings;
  onStartMemorize: (verse: VerseItem, existing?: MemorizeProgress) => void;
  onNavigateToNavigator: () => void;
  onNavigateToDrill: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  progressMap,
  activityHistory,
  settings,
  onStartMemorize,
  onNavigateToNavigator,
  onNavigateToDrill
}) => {
  const allProgressList = Object.values(progressMap);
  const dueReviews = filterDueReviews(allProgressList);
  const today = getTodayDateString();
  const todayCount = activityHistory[today] || 0;

  // 마스터 구절 수 (Stage 7)
  const masteredCount = allProgressList.filter(p => p.stage === 7).length;
  // 전체 진행 중인 장/구절 수
  const inProgressCount = allProgressList.length;
  // 전체 성경 완주율
  const progressPercent = Math.min(100, Math.round((inProgressCount / TOTAL_CHAPTERS) * 100));

  // 신규 추천 구절: 아직 학습하지 않은 대표 요절 찾기
  const unstartedRecommendations: VerseItem[] = [];
  for (const [key, verse] of Object.entries(DEFAULT_KEY_VERSES)) {
    const progressId = `${verse.bookId}_${verse.chapter}_${verse.verse}`;
    if (!progressMap[progressId]) {
      unstartedRecommendations.push(verse);
      if (unstartedRecommendations.length >= 3) break;
    }
  }

  // 만약 기본 목록이 다 시작되었다면 임의의 미학습 장 추천
  if (unstartedRecommendations.length === 0) {
    for (const b of BIBLE_BOOKS) {
      for (let ch = 1; ch <= b.totalChapters; ch++) {
        const pId = `${b.id}_${ch}_1`;
        if (!progressMap[pId]) {
          unstartedRecommendations.push(getDefaultKeyVerse(b.id, ch));
          if (unstartedRecommendations.length >= 3) break;
        }
      }
      if (unstartedRecommendations.length >= 3) break;
    }
  }

  // 최근 28일 날짜 배열 생성 (잔디 히트맵)
  const recentDays: { dateStr: string; count: number; dayLabel: string }[] = [];
  const now = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    recentDays.push({
      dateStr: key,
      count: activityHistory[key] || 0,
      dayLabel: `${d.getMonth() + 1}/${d.getDate()}`
    });
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* 1. 상단 히어로 배너 & 핵심 지표 통계 */}
      <section className="glass-panel" style={{ padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, var(--accent-gold-glow) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="badge badge-gold">
                <Sparkles size={13} />
                오늘의 말씀 묵상
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {today}
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
              말씀을 영 안에 채우는 <span style={{ color: 'var(--text-gold)' }}>과학적 암송 여정</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 600, fontSize: '0.95rem' }}>
              영독의 7차 복습법(에빙하우스 망각곡선)을 통해 구약 929장과 신약 260장의 핵심 말씀을 영구 장기기억으로 조성합니다.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={onNavigateToDrill} className="btn btn-gold">
              <Sparkles size={18} />
              <span>끝장 암송 훈련소 (외울 때까지)</span>
            </button>
            <button onClick={onNavigateToNavigator} className="btn btn-outline">
              <Compass size={18} />
              <span>66권 1,189장 둘러보기</span>
            </button>
          </div>
        </div>

        {/* 4분할 통계 카드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginTop: 28,
          paddingTop: 24,
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 4 }}>
              <Clock size={16} color="var(--accent-gold)" />
              <span>오늘 복습 대기</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: dueReviews.length > 0 ? 'var(--text-gold)' : 'var(--text-primary)' }}>
              {dueReviews.length} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>구절</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 4 }}>
              <BookOpen size={16} color="#3b82f6" />
              <span>암송 진행 구절</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>
              {inProgressCount} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>/ {TOTAL_CHAPTERS}장</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 4 }}>
              <Trophy size={16} color="#10b981" />
              <span>장기기억 마스터</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981' }}>
              {masteredCount} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>구절</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 4 }}>
              <Flame size={16} color="#ef4444" />
              <span>오늘 암송 / 목표</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>
              {todayCount} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>/ {settings.dailyGoal}구절</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 오늘 복습해야 할 큐 (Review Queue) */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              오늘의 복습 큐 ({dueReviews.length})
            </h3>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            에빙하우스 망각곡선 스케줄에 따른 복습 대상
          </span>
        </div>

        {dueReviews.length === 0 ? (
          <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
              오늘 복습할 구절을 모두 완료했습니다!
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 16 }}>
              새로운 장의 핵심 말씀을 암송하거나 성경 66권 탐색기에서 원하는 장을 선택해 보세요.
            </p>
            <button onClick={onNavigateToNavigator} className="btn btn-outline">
              새로운 장 암송하러 가기
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {dueReviews.map((item) => (
              <div 
                key={item.id}
                className="glass-panel"
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: '4px solid var(--accent-gold)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="badge badge-gold">
                      {item.bookName} {item.chapter}장 {item.verse}절
                    </span>
                    <span className="badge badge-blue">
                      {STAGE_LABELS[item.stage]}
                    </span>
                  </div>
                  {item.outline && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                      {item.outline}
                    </p>
                  )}
                  <p className="verse-text-serif" style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 16 }}>
                    {item.text}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    복습 {item.reviewCount}회차
                  </span>
                  <button
                    onClick={() => onStartMemorize(item, item)}
                    className="btn btn-gold"
                    style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                  >
                    <span>복습 시작</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. 신규 암송 추천 구절 */}
      {unstartedRecommendations.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <PlusCircle size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              새로운 핵심 구절 암송 추천
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {unstartedRecommendations.map((verse, idx) => (
              <div 
                key={idx}
                className="glass-panel"
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="badge badge-blue">
                      {verse.bookName} {verse.chapter}장 {verse.verse}절
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      미학습
                    </span>
                  </div>
                  {verse.outline && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                      {verse.outline}
                    </p>
                  )}
                  <p className="verse-text-serif" style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 16 }}>
                    {verse.text}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => onStartMemorize(verse)}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                  >
                    <span>암송 시작</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. 연속 학습 잔디 (Streak Activity Heatmap) */}
      <section className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={20} color="#ef4444" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              최근 4주 학습 활동 잔디
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            매일 꾸준한 암송이 말씀을 영구 기억으로 전환합니다
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(28, 1fr)',
          gap: 6,
          alignItems: 'end',
          padding: '12px 0'
        }}>
          {recentDays.map((d, i) => {
            const hasActivity = d.count > 0;
            const intensity = d.count >= 5 ? 1 : d.count >= 3 ? 0.75 : d.count >= 1 ? 0.45 : 0;
            return (
              <div
                key={i}
                title={`${d.dateStr}: ${d.count}개 구절 암송/복습`}
                style={{
                  height: 32,
                  borderRadius: 4,
                  background: hasActivity 
                    ? `rgba(16, 185, 129, ${Math.max(0.3, intensity)})`
                    : 'var(--bg-tertiary)',
                  border: d.dateStr === today ? '1px solid var(--accent-gold)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              />
            );
          })}
        </div>
      </section>

    </div>
  );
};
