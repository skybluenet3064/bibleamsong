import React, { useState } from 'react';
import { BookMarked, AlertCircle, ArrowRight, Trash2, RotateCcw, Filter } from 'lucide-react';
import { MemorizeProgress, VerseItem } from '../types/bible';
import { STAGE_LABELS } from '../services/srsEngine';

interface WeakVersesViewProps {
  progressMap: Record<string, MemorizeProgress>;
  onStartMemorize: (verse: VerseItem, existing?: MemorizeProgress) => void;
  onToggleBookmark: (id: string) => void;
}

export const WeakVersesView: React.FC<WeakVersesViewProps> = ({
  progressMap,
  onStartMemorize,
  onToggleBookmark
}) => {
  const [filterType, setFilterType] = useState<'all' | 'mistakes' | 'bookmarked'>('all');

  const allList = Object.values(progressMap);

  const weakVerses = allList.filter((item) => {
    const hasMistake = item.mistakeCount > 0;
    const isBookmarked = !!item.isBookmarked;

    if (filterType === 'mistakes') return hasMistake;
    if (filterType === 'bookmarked') return isBookmarked;
    return hasMistake || isBookmarked;
  }).sort((a, b) => b.mistakeCount - a.mistakeCount);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <BookMarked size={22} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              취약 구절 및 오답 노트 ({weakVerses.length})
            </h2>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            암송 중 오답이 발생했거나 직접 북마크해 둔 구절들을 집중 훈련합니다.
          </p>
        </div>

        {/* 필터 탭 */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          padding: 4,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setFilterType('all')}
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-sm)',
              background: filterType === 'all' ? 'var(--bg-tertiary)' : 'transparent',
              color: filterType === 'all' ? 'var(--text-gold)' : 'var(--text-secondary)',
              border: 'none'
            }}
          >
            전체 ({allList.filter(i => i.mistakeCount > 0 || i.isBookmarked).length})
          </button>
          <button
            onClick={() => setFilterType('mistakes')}
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-sm)',
              background: filterType === 'mistakes' ? 'var(--bg-tertiary)' : 'transparent',
              color: filterType === 'mistakes' ? 'var(--text-gold)' : 'var(--text-secondary)',
              border: 'none'
            }}
          >
            오답 이력 ({allList.filter(i => i.mistakeCount > 0).length})
          </button>
          <button
            onClick={() => setFilterType('bookmarked')}
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-sm)',
              background: filterType === 'bookmarked' ? 'var(--bg-tertiary)' : 'transparent',
              color: filterType === 'bookmarked' ? 'var(--text-gold)' : 'var(--text-secondary)',
              border: 'none'
            }}
          >
            북마크 구절 ({allList.filter(i => i.isBookmarked).length})
          </button>
        </div>
      </div>

      {/* 목록 */}
      {weakVerses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <AlertCircle size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
            취약 구절이 없습니다!
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            암송 중 헷갈리는 구절은 북마크 아이콘을 누르면 이곳에서 집중 학습할 수 있습니다.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {weakVerses.map((item) => (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: item.mistakeCount > 0 ? '4px solid var(--accent-danger)' : '4px solid var(--accent-gold)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="badge badge-gold">
                    {item.bookName} {item.chapter}장 {item.verse}절
                  </span>
                  
                  <div style={{ display: 'flex', gap: 6 }}>
                    {item.mistakeCount > 0 && (
                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                        오답 {item.mistakeCount}회
                      </span>
                    )}
                    <span className="badge badge-blue">
                      {STAGE_LABELS[item.stage]}
                    </span>
                  </div>
                </div>

                {item.outline && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    {item.outline}
                  </p>
                )}

                <p className="verse-text-serif" style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 16 }}>
                  {item.text}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => onToggleBookmark(item.id)}
                  className="btn btn-outline"
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                >
                  {item.isBookmarked ? '북마크 해제' : '북마크 추가'}
                </button>

                <button
                  onClick={() => onStartMemorize(item, item)}
                  className="btn btn-gold"
                  style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                >
                  <span>집중 훈련</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
