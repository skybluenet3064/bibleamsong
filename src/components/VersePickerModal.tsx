import React, { useState, useEffect } from 'react';
import { X, BookOpen, Loader2, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { BibleBook, VerseItem, MemorizeProgress } from '../types/bible';
import { fetchChapterVerses } from '../services/rvApi';
import { getDefaultKeyVerse } from '../data/defaultKeyVerses';

interface VersePickerModalProps {
  book: BibleBook;
  chapter: number;
  existingProgressList: MemorizeProgress[];
  onClose: () => void;
  onSelectVerse: (verse: VerseItem) => void;
}

export const VersePickerModal: React.FC<VersePickerModalProps> = ({
  book,
  chapter,
  existingProgressList,
  onClose,
  onSelectVerse
}) => {
  const [verses, setVerses] = useState<VerseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchChapterVerses(book.id, chapter)
      .then((data) => {
        if (!isMounted) return;
        if (data.length === 0) {
          // fallback 기본 구절 사용
          const fallback = getDefaultKeyVerse(book.id, chapter);
          setVerses([fallback]);
        } else {
          setVerses(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError('구절을 불러오는 중 문제가 발생했습니다. 기본 구절로 진행합니다.');
        setVerses([getDefaultKeyVerse(book.id, chapter)]);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [book, chapter]);

  const defaultKeyVerse = getDefaultKeyVerse(book.id, chapter);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 750, maxHeight: '85vh' }}>
        
        {/* 모달 헤더 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-secondary)',
          zIndex: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-gold" style={{ fontSize: '0.85rem' }}>
                {book.name} {chapter}장 전체 구절
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                총 {verses.length}개 절
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              암송하고 싶은 구절을 선택하시면 즉시 5단계 암송 트레이닝을 시작할 수 있습니다.
            </p>
          </div>

          <button onClick={onClose} className="btn btn-outline" style={{ padding: '6px 10px' }}>
            <X size={18} />
          </button>
        </div>

        {/* 본문 리스트 */}
        <div style={{ padding: '20px 24px' }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '0.9rem' }}>rv.or.kr에서 {book.name} {chapter}장 본문을 불러오는 중입니다...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {error && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ef4444',
                  fontSize: '0.82rem'
                }}>
                  {error}
                </div>
              )}

              {verses.map((v) => {
                const isDefault = defaultKeyVerse.verse === v.verse;
                const progress = existingProgressList.find(
                  (p) => p.bookId === v.bookId && p.chapter === v.chapter && p.verse === v.verse
                );

                return (
                  <div
                    key={v.verse}
                    className="glass-panel"
                    style={{
                      padding: 16,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 16,
                      border: isDefault ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                      background: isDefault ? 'rgba(212, 175, 55, 0.05)' : 'var(--bg-card)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          color: isDefault ? 'var(--text-gold)' : 'var(--text-primary)',
                          background: 'var(--bg-tertiary)',
                          padding: '2px 8px',
                          borderRadius: 4
                        }}>
                          {v.verse}절
                        </span>

                        {isDefault && (
                          <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>
                            <Sparkles size={11} />
                            추천 요절
                          </span>
                        )}

                        {progress && (
                          <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                            암송 중 (Stage {progress.stage})
                          </span>
                        )}
                      </div>

                      <p className="verse-text-serif" style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {v.text}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectVerse(v)}
                      className={`btn ${isDefault ? 'btn-gold' : 'btn-outline'}`}
                      style={{ padding: '8px 14px', fontSize: '0.85rem', flexShrink: 0 }}
                    >
                      <span>암송하기</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
