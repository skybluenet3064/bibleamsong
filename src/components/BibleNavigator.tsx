import React, { useState } from 'react';
import { 
  Search, BookOpen, Check, Clock, ChevronDown, ChevronUp, 
  ExternalLink, Layers, Sparkles 
} from 'lucide-react';
import { BibleBook, MemorizeProgress, VerseItem } from '../types/bible';
import { BIBLE_BOOKS, OT_BOOKS, NT_BOOKS } from '../data/bibleBooks';
import { getDefaultKeyVerse } from '../data/defaultKeyVerses';
import { getTodayDateString } from '../services/srsEngine';

interface BibleNavigatorProps {
  progressMap: Record<string, MemorizeProgress>;
  onStartMemorize: (verse: VerseItem, existing?: MemorizeProgress) => void;
  onOpenVersePicker: (book: BibleBook, chapter: number) => void;
}

export const BibleNavigator: React.FC<BibleNavigatorProps> = ({
  progressMap,
  onStartMemorize,
  onOpenVersePicker
}) => {
  const [testament, setTestament] = useState<'ALL' | 'OT' | 'NT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBookId, setExpandedBookId] = useState<number | null>(1); // 기본으로 창세기 열기
  const today = getTodayDateString();

  const booksToDisplay = BIBLE_BOOKS.filter((b) => {
    if (testament === 'OT' && b.testament !== 'OT') return false;
    if (testament === 'NT' && b.testament !== 'NT') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.abbr.toLowerCase().includes(q) ||
        b.engName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // 특정 장의 암송 상태 판별
  const getChapterStatus = (bookId: number, chapter: number) => {
    // 해당 장의 구절 중 진행 중인 구절 탐색
    const matching = Object.values(progressMap).filter(
      (p) => p.bookId === bookId && p.chapter === chapter
    );

    if (matching.length === 0) return 'unstarted';

    const hasDue = matching.some((p) => p.nextReviewDate <= today);
    if (hasDue) return 'due';

    const allMastered = matching.every((p) => p.stage === 7);
    if (allMastered) return 'mastered';

    return 'learning';
  };

  const getBookCompletedCount = (book: BibleBook) => {
    let count = 0;
    for (let ch = 1; ch <= book.totalChapters; ch++) {
      const status = getChapterStatus(book.id, ch);
      if (status === 'mastered' || status === 'learning' || status === 'due') {
        count++;
      }
    }
    return count;
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* 상단 타이틀 및 필터 컨트롤 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>
            성경 66권 <span style={{ color: 'var(--text-gold)' }}>1,189장 내비게이터</span>
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            구약 39권(929장)과 신약 27권(260장)의 장별 암송 진도를 관리하고 원하는 장을 학습합니다.
          </p>
        </div>

        {/* 필터 탭 & 검색 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            padding: 4,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setTestament('ALL')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-sm)',
                background: testament === 'ALL' ? 'var(--bg-tertiary)' : 'transparent',
                color: testament === 'ALL' ? 'var(--text-gold)' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              전체 (66)
            </button>
            <button
              onClick={() => setTestament('OT')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-sm)',
                background: testament === 'OT' ? 'var(--bg-tertiary)' : 'transparent',
                color: testament === 'OT' ? 'var(--text-gold)' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              구약 (39)
            </button>
            <button
              onClick={() => setTestament('NT')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-sm)',
                background: testament === 'NT' ? 'var(--bg-tertiary)' : 'transparent',
                color: testament === 'NT' ? 'var(--text-gold)' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              신약 (27)
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            width: 220
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="성경 이름 검색..."
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.88rem',
                width: '100%'
              }}
            />
          </div>
        </div>
      </div>

      {/* 상태 범례 (Legend) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 16px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        fontSize: '0.82rem',
        color: 'var(--text-secondary)'
      }}>
        <span style={{ fontWeight: 600 }}>상태 구분:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-gold)' }} />
          <span>오늘 복습 필요</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
          <span>복습 진행 중</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
          <span>마스터 (Stage 7)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-color)' }} />
          <span>미학습</span>
        </div>
      </div>

      {/* 성경 66권 아코디언 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {booksToDisplay.map((book) => {
          const isExpanded = expandedBookId === book.id;
          const completedCount = getBookCompletedCount(book);
          const percent = Math.round((completedCount / book.totalChapters) * 100);

          return (
            <div
              key={book.id}
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: isExpanded ? '1px solid var(--border-active)' : '1px solid var(--border-color)',
                transition: 'border-color 0.2s'
              }}
            >
              {/* 책 헤더 바 */}
              <div
                onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: isExpanded ? 'var(--bg-tertiary)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    background: book.testament === 'OT' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: book.testament === 'OT' ? 'var(--text-gold)' : '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}>
                    {book.abbr}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{book.name}</h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{book.engName}</span>
                      <span className="badge" style={{ background: 'var(--bg-secondary)', fontSize: '0.7rem' }}>
                        총 {book.totalChapters}장
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2, maxWidth: 680 }}>
                      {book.theme}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* 진도율 바 */}
                  <div style={{ textAlign: 'right', minWidth: 90 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {completedCount}/{book.totalChapters}장
                    </div>
                    <div style={{
                      width: 80,
                      height: 5,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 3,
                      overflow: 'hidden',
                      marginTop: 4
                    }}>
                      <div style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: percent === 100 ? '#10b981' : 'var(--accent-gold)'
                      }} />
                    </div>
                  </div>

                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* 장(Chapter) 그리드 펼침 */}
              {isExpanded && (
                <div style={{
                  padding: '20px 24px',
                  background: 'var(--bg-secondary)',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))',
                    gap: 8,
                    marginBottom: 16
                  }}>
                    {Array.from({ length: book.totalChapters }, (_, i) => i + 1).map((ch) => {
                      const status = getChapterStatus(book.id, ch);
                      let bg = 'var(--bg-tertiary)';
                      let border = 'var(--border-color)';
                      let textColor = 'var(--text-primary)';

                      if (status === 'due') {
                        bg = 'rgba(212, 175, 55, 0.2)';
                        border = 'var(--accent-gold)';
                        textColor = 'var(--text-gold)';
                      } else if (status === 'mastered') {
                        bg = 'rgba(16, 185, 129, 0.2)';
                        border = '#10b981';
                        textColor = '#10b981';
                      } else if (status === 'learning') {
                        bg = 'rgba(59, 130, 246, 0.2)';
                        border = '#3b82f6';
                        textColor = '#60a5fa';
                      }

                      return (
                        <div
                          key={ch}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <button
                            onClick={() => {
                              const keyVerse = getDefaultKeyVerse(book.id, ch);
                              const existing = Object.values(progressMap).find(
                                (p) => p.bookId === book.id && p.chapter === ch
                              );
                              onStartMemorize(existing || keyVerse, existing);
                            }}
                            className="btn"
                            style={{
                              width: '100%',
                              padding: '10px 4px',
                              background: bg,
                              border: `1px solid ${border}`,
                              color: textColor,
                              borderRadius: 'var(--radius-md)',
                              fontWeight: 700,
                              fontSize: '0.88rem'
                            }}
                            title={`${book.name} ${ch}장 대표 구절 암송하기`}
                          >
                            {ch}장
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenVersePicker(book, ch);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.65rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                            title="이 장의 전체 구절 보기 / 변경"
                          >
                            <ExternalLink size={10} />
                            구절선택
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
