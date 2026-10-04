import React from 'react';
import { BookOpen, Flame, CheckCircle2, Settings, Moon, Sun, BookMarked, Layers, Zap } from 'lucide-react';
import { UserSettings } from '../types/bible';

interface HeaderProps {
  currentTab: 'dashboard' | 'navigator' | 'drill' | 'weak';
  onSelectTab: (tab: 'dashboard' | 'navigator' | 'drill' | 'weak') => void;
  streak: number;
  todayCount: number;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  streak,
  todayCount,
  settings,
  onUpdateSettings,
  onOpenSettings
}) => {
  const toggleTheme = () => {
    const nextTheme: UserSettings['theme'] =
      settings.theme === 'dark' ? 'light' : settings.theme === 'light' ? 'sepia' : 'dark';
    onUpdateSettings({ ...settings, theme: nextTheme });
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg-card)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* 로고 영역 */}
        <div 
          onClick={() => onSelectTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, #b8860b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--accent-gold-glow)'
          }}>
            <BookOpen size={22} color="#121008" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                성경 66권 <span style={{ color: 'var(--text-gold)' }}>암송</span>
              </h1>
              <span className="badge badge-gold" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>회복역</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              1,189장 장별 핵심 구절 7차 복습 시스템
            </p>
          </div>
        </div>

        {/* 탭 내비게이션 */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          padding: 4,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          gap: 2
        }}>
          <button
            onClick={() => onSelectTab('dashboard')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
              background: currentTab === 'dashboard' ? 'var(--bg-tertiary)' : 'transparent',
              color: currentTab === 'dashboard' ? 'var(--text-gold)' : 'var(--text-secondary)',
              border: currentTab === 'dashboard' ? '1px solid var(--border-color)' : 'none'
            }}
          >
            <BookOpen size={15} />
            오늘의 학습
          </button>

          <button
            onClick={() => onSelectTab('navigator')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
              background: currentTab === 'navigator' ? 'var(--bg-tertiary)' : 'transparent',
              color: currentTab === 'navigator' ? 'var(--text-gold)' : 'var(--text-secondary)',
              border: currentTab === 'navigator' ? '1px solid var(--border-color)' : 'none'
            }}
          >
            <Layers size={15} />
            66권 탐색기
          </button>

          <button
            onClick={() => onSelectTab('drill')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
              background: currentTab === 'drill' ? 'var(--bg-tertiary)' : 'transparent',
              color: currentTab === 'drill' ? 'var(--text-gold)' : 'var(--text-secondary)',
              border: currentTab === 'drill' ? '1px solid var(--border-color)' : 'none'
            }}
          >
            <Zap size={15} color="var(--accent-gold)" fill="var(--accent-gold)" />
            끝장 훈련소
          </button>

          <button
            onClick={() => onSelectTab('weak')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
              background: currentTab === 'weak' ? 'var(--bg-tertiary)' : 'transparent',
              color: currentTab === 'weak' ? 'var(--text-gold)' : 'var(--text-secondary)',
              border: currentTab === 'weak' ? '1px solid var(--border-color)' : 'none'
            }}
          >
            <BookMarked size={15} />
            취약 구절
          </button>
        </nav>

        {/* 우측 유저 지표 & 유틸리티 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 스트릭 뱃지 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            fontSize: '0.88rem',
            fontWeight: 700
          }}>
            <Flame size={18} fill="#ef4444" color="#ef4444" />
            <span>{streak}일 연속</span>
          </div>

          {/* 일일 목표 진행도 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: todayCount >= settings.dailyGoal ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-secondary)',
            border: `1px solid ${todayCount >= settings.dailyGoal ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            color: todayCount >= settings.dailyGoal ? '#10b981' : 'var(--text-secondary)',
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            <CheckCircle2 size={16} color={todayCount >= settings.dailyGoal ? '#10b981' : 'var(--text-muted)'} />
            <span>오늘 {todayCount}/{settings.dailyGoal}</span>
          </div>

          {/* 테마 토글 */}
          <button
            onClick={toggleTheme}
            className="btn btn-outline"
            style={{ padding: 8, borderRadius: 'var(--radius-md)' }}
            title={`현재 테마: ${settings.theme} (클릭하여 변경)`}
          >
            {settings.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* 설정 버튼 */}
          <button
            onClick={onOpenSettings}
            className="btn btn-outline"
            style={{ padding: 8, borderRadius: 'var(--radius-md)' }}
            title="설정 및 데이터 관리"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
