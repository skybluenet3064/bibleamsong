import React, { useState, useEffect } from 'react';
import { X, BookOpen, Loader2, Sparkles, ArrowRight, Search, CheckCircle2, Heart } from 'lucide-react';
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
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedVerseNum, setSelectedVerseNum] = useState<number | null>(null);

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
        console.error('Failed to fetch chapter verses', err);
        setError('구절을 불러오는 중 네트워크 오류가 발생했습니다. 대표 요절로 계속할 수 있습니다.');
        setVerses([getDefaultKeyVerse(book.id, chapter)]);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [book, chapter]);

  const defaultKeyVerse = getDefaultKeyVerse(book.id, chapter);

  // 검색/필터 적용된 구절 목록
  const filteredVerses = verses.filter((v) => {
    if (!searchKeyword.trim()) return true;
    const q = searchKeyword.trim().toLowerCase();
    const isNumMatch = String(v.verse) === q || `${v.verse}절` === q;
    const isTextMatch = v.text.toLowerCase().includes(q);
    return isNumMatch || isTextMatch;
  });

  const scrollToVerse = (verseNum: number) => {
    setSelectedVerseNum(verseNum);
    const el = document.getElementById(`verse-row-${verseNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const mainOutline = verses[0]?.outline || defaultKeyVerse.outline;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 820,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* 모달 상단 헤더 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
          flexShrink: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-gold" style={{ fontSize: '0.9rem', padding: '4px 12px' }}>
                {book.name} {chapter}장
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {loading ? '구절 불러오는 중...' : `총 ${verses.length}개 절 수록`}
              </span>
            </div>
            {mainOutline && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6, maxWidth: 640 }}>
                📌 개요: <span style={{ color: 'var(--text-secondary)' }}>{mainOutline}</span>
              </p>
            )}
          </div>

          <button onClick={onClose} className="btn btn-outline" style={{ padding: '8px 12px' }}>
            <X size={18} />
          </button>
        </div>

        {/* 퀵 점프 & 검색 바 */}
        {!loading && verses.length > 1 && (
          <div style={{
            padding: '12px 24px',
            background: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flexShrink: 0
          }}>
            {/* 검색 인풋 */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="원하는 절 번호(예: 3) 또는 단어를 검색하여 빠르게 찾으세요..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* 절 번호 빠른 이동 버튼 띠 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'thin'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, marginRight: 2 }}>
                절 바로가기:
              </span>
              {verses.map((v) => {
                const isSelected = selectedVerseNum === v.verse;
                const isKey = defaultKeyVerse.verse === v.verse;
                return (
                  <button
                    key={v.verse}
                    onClick={() => scrollToVerse(v.verse)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                      fontWeight: isKey || isSelected ? 700 : 500,
                      borderRadius: 4,
                      border: isSelected
                        ? '1px solid var(--accent-gold)'
                        : isKey
                        ? '1px solid rgba(212, 175, 55, 0.5)'
                        : '1px solid var(--border-color)',
                      background: isSelected
                        ? 'var(--accent-gold)'
                        : isKey
                        ? 'rgba(212, 175, 55, 0.15)'
                        : 'var(--bg-secondary)',
                      color: isSelected ? '#000' : isKey ? 'var(--text-gold)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title={`${v.verse}절로 스크롤`}
                  >
                    {v.verse}절
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 본문 스크롤 영역 */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2
                size={36}
                color="var(--accent-gold)"
                className="animate-spin"
                style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}
              />
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                회복역 성경(rv.or.kr)에서 {book.name} {chapter}장 전체 구절을 불러오는 중입니다...
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                잠시만 기다려주시면 각 절을 직접 선택하여 암송하실 수 있습니다.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#ef4444',
                  fontSize: '0.85rem'
                }}>
                  {error}
                </div>
              )}

              {/* 검색 결과 없음 안내 */}
              {filteredVerses.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  <p>검색 조건에 맞는 구절이 없습니다.</p>
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="btn btn-outline"
                    style={{ marginTop: 12, padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    전체 구절 보기
                  </button>
                </div>
              )}

              {/* 전체 구절 카드 목록 */}
              {filteredVerses.map((v) => {
                const isDefault = defaultKeyVerse.verse === v.verse;
                const progress = existingProgressList.find(
                  (p) => p.bookId === v.bookId && p.chapter === v.chapter && p.verse === v.verse
                );
                const isHighlight = selectedVerseNum === v.verse;

                return (
                  <div
                    key={v.verse}
                    id={`verse-row-${v.verse}`}
                    onClick={() => onSelectVerse(v)}
                    className="glass-panel"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 16,
                      borderRadius: 'var(--radius-md)',
                      border: isHighlight
                        ? '2px solid var(--accent-gold)'
                        : isDefault
                        ? '1.5px solid var(--accent-gold)'
                        : '1px solid var(--border-color)',
                      background: isHighlight
                        ? 'rgba(212, 175, 55, 0.15)'
                        : isDefault
                        ? 'rgba(212, 175, 55, 0.05)'
                        : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.18s'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.92rem',
                          color: isDefault ? 'var(--text-gold)' : 'var(--text-primary)',
                          background: 'var(--bg-tertiary)',
                          padding: '3px 9px',
                          borderRadius: 4
                        }}>
                          {v.verse}절
                        </span>

                        {isDefault && (
                          <span className="badge badge-gold" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Sparkles size={11} />
                            이 장의 추천 요절
                          </span>
                        )}

                        {progress && (
                          <span className="badge badge-green" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={11} />
                            암송 중 (Stage {progress.stage})
                          </span>
                        )}

                        {progress?.userPrayer && (
                          <span className="badge badge-purple" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Heart size={11} />
                            말씀 기도
                          </span>
                        )}
                      </div>

                      <p className="verse-text-serif" style={{ fontSize: '1.08rem', lineHeight: 1.8, color: 'var(--text-primary)' }}>
                        {v.text}
                      </p>

                      {progress?.userPrayer && (
                        <div style={{
                          marginTop: 8,
                          padding: '6px 12px',
                          background: 'rgba(168, 85, 247, 0.08)',
                          borderLeft: '3px solid #a855f7',
                          borderRadius: '0 4px 4px 0',
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)'
                        }}>
                          <strong style={{ color: '#a855f7', marginRight: 6 }}>🕊️ 나의 말씀 기도:</strong>
                          {progress.userPrayer}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVerse(v);
                      }}
                      className={`btn ${isDefault ? 'btn-gold' : 'btn-outline'}`}
                      style={{ padding: '9px 16px', fontSize: '0.85rem', flexShrink: 0, marginTop: 4 }}
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

        {/* 모달 하단 안내 바 */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          flexShrink: 0
        }}>
          <span>구절 카드를 클릭하시면 해당 구절의 5단계 암송 인출(Active Recall) 화면으로 이동합니다.</span>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
