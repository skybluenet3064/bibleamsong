import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Trophy, RotateCcw, CheckCircle2, XCircle, ArrowRight, 
  HelpCircle, Volume2, Sparkles, BookOpen, Layers, Flame, RefreshCw,
  Headphones, Edit3, Check, AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VerseItem, MemorizeProgress, DrillMode, DrillLevel, DrillItem } from '../types/bible';
import { DEFAULT_KEY_VERSES } from '../data/defaultKeyVerses';
import { BIBLE_BOOKS } from '../data/bibleBooks';
import { tts } from '../services/ttsService';
import { toInitialConsonants, generateClozeQuiz, evaluateTyping, ClozeQuiz } from '../services/hangulUtils';

interface MasteryDrillViewProps {
  progressMap: Record<string, MemorizeProgress>;
  onCompleteVerse: (verse: VerseItem, result: 'again' | 'good' | 'easy') => void;
  onExit: () => void;
}

export const MasteryDrillView: React.FC<MasteryDrillViewProps> = ({
  progressMap,
  onCompleteVerse,
  onExit
}) => {
  // 훈련 설정 상태
  const [drillMode, setDrillMode] = useState<DrillMode>('DICTATION');
  const [level, setLevel] = useState<DrillLevel>(2);
  const [selectedSet, setSelectedSet] = useState<'my_progress' | 'nt_keys' | 'ot_keys' | 'all_keys'>('nt_keys');
  const [isPlaying, setIsPlaying] = useState(false);

  // 훈련 진행 큐
  const [queue, setQueue] = useState<DrillItem[]>([]);
  const [passedItems, setPassedItems] = useState<DrillItem[]>([]);
  const [currentItem, setCurrentItem] = useState<DrillItem | null>(null);
  const [totalInitialCount, setTotalInitialCount] = useState(0);

  // 문제 풀이 상태
  const [typedInput, setTypedInput] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const [clozeQuiz, setClozeQuiz] = useState<ClozeQuiz | null>(null);
  const [clozeSelected, setClozeSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [isCompletedAll, setIsCompletedAll] = useState(false);
  const [showHintInDictation, setShowHintInDictation] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);

  // VERSE_TO_REF Level 2 (단계별 맞추기) 상태
  const [stepStage, setStepStage] = useState<'book' | 'chapter' | 'verse'>('book');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [bookChoices, setBookChoices] = useState<string[]>([]);
  const [chapterChoices, setChapterChoices] = useState<number[]>([]);
  const [verseChoices, setVerseChoices] = useState<number[]>([]);

  const typingInputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // 훈련 세트 후보 목록
  const getCandidateVerses = (): VerseItem[] => {
    const allKeyVerses = Object.values(DEFAULT_KEY_VERSES);

    if (selectedSet === 'my_progress') {
      const list = Object.values(progressMap).map(p => ({
        bookId: p.bookId,
        bookName: p.bookName,
        chapter: p.chapter,
        verse: p.verse,
        text: p.text,
        outline: p.outline
      }));
      return list.length > 0 ? list : allKeyVerses.slice(0, 5);
    }

    if (selectedSet === 'nt_keys') {
      return allKeyVerses.filter(v => v.bookId >= 40).slice(0, 10);
    }

    if (selectedSet === 'ot_keys') {
      return allKeyVerses.filter(v => v.bookId < 40).slice(0, 10);
    }

    return allKeyVerses.slice(0, 15);
  };

  // 훈련 시작
  const handleStartDrill = () => {
    const verses = getCandidateVerses();
    if (verses.length === 0) {
      alert('훈련할 구절이 없습니다. 다른 세트를 선택하세요.');
      return;
    }

    const items: DrillItem[] = verses
      .sort(() => Math.random() - 0.5)
      .map(v => ({
        id: `${v.bookId}_${v.chapter}_${v.verse}`,
        verse: v,
        masteryPoints: 0,
        wrongAttempts: 0,
        isPassed: false
      }));

    setQueue(items);
    setPassedItems([]);
    setTotalInitialCount(items.length);
    setCurrentItem(items[0]);
    setIsPlaying(true);
    setIsCompletedAll(false);
    prepareQuestion(items[0], drillMode, level);
  };

  // 문제 세팅
  const prepareQuestion = (item: DrillItem, mode: DrillMode, lvl: DrillLevel) => {
    setTypedInput('');
    setFeedback('none');
    setStepError(null);
    setStepStage('book');
    setSelectedBook(null);
    setSelectedChapter(null);
    setShowHintInDictation(false);
    setIsPeeking(false);

    const allKeyVerses = Object.values(DEFAULT_KEY_VERSES);

    // 모드 1: VERSE_TO_REF (본문 -> 몇장 몇절)
    if (mode === 'VERSE_TO_REF') {
      if (lvl === 1) {
        // 객관식 4지선다
        const correctRef = `${item.verse.bookName} ${item.verse.chapter}장 ${item.verse.verse}절`;
        const others = allKeyVerses.filter(v => `${v.bookId}_${v.chapter}_${v.verse}` !== item.id);
        const wrongRefs = others.sort(() => Math.random() - 0.5).slice(0, 3).map(v => `${v.bookName} ${v.chapter}장 ${v.verse}절`);
        setChoices([correctRef, ...wrongRefs].sort(() => Math.random() - 0.5));
      } else if (lvl === 2) {
        // 단계별 선택 (책 -> 장 -> 절)
        const currentBook = item.verse.bookName;
        const otherBooks = Array.from(new Set(allKeyVerses.map(v => v.bookName))).filter(b => b !== currentBook);
        const bChoices = [currentBook, ...otherBooks.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
        setBookChoices(bChoices);

        // 장 후보들
        const currentCh = item.verse.chapter;
        const randomChs = [Math.max(1, currentCh - 2), currentCh + 1, currentCh + 3].filter(c => c !== currentCh);
        setChapterChoices([currentCh, ...randomChs].slice(0, 4).sort((a, b) => a - b));

        // 절 후보들
        const currentV = item.verse.verse;
        const randomVs = [Math.max(1, currentV - 3), currentV + 2, currentV + 5].filter(c => c !== currentV);
        setVerseChoices([currentV, ...randomVs].slice(0, 4).sort((a, b) => a - b));
      }
    } else if (mode === 'REF_TO_VERSE') {
      if (lvl === 1) {
        const correctText = item.verse.text;
        const others = allKeyVerses.filter(v => v.text !== correctText);
        const wrongTexts = others.sort(() => Math.random() - 0.5).slice(0, 3).map(v => v.text);
        setChoices([correctText, ...wrongTexts].sort(() => Math.random() - 0.5));
      } else if (lvl === 2) {
        const words = item.verse.text.split(/\s+/);
        setChoices([...words].sort(() => Math.random() - 0.5));
        setClozeSelected([]);
      }
    } else if (mode === 'VERSE_MASTERY') {
      if (lvl === 2) {
        const quiz = generateClozeQuiz(item.verse.text, 3);
        setClozeQuiz(quiz);
        setClozeSelected([]);
      }
    }

    setTimeout(() => {
      typingInputRef.current?.focus();
    }, 150);
  };

  // 실시간 타이핑 비교 (받아쓰기 및 직접 입력용)
  const targetTextForTyping = drillMode === 'VERSE_TO_REF' && level === 3
    ? `${currentItem?.verse.bookName} ${currentItem?.verse.chapter}장 ${currentItem?.verse.verse}절`
    : currentItem?.verse.text || '';

  const { diffs, accuracy, isComplete } = evaluateTyping(targetTextForTyping, typedInput);

  // 받아쓰기 모드에서 100% 일치 시 자동 통과
  useEffect(() => {
    if (isPlaying && (drillMode === 'DICTATION' || (drillMode === 'VERSE_MASTERY' && level === 3) || (drillMode === 'REF_TO_VERSE' && level === 3) || (drillMode === 'VERSE_TO_REF' && level === 3))) {
      if (isComplete && feedback === 'none') {
        handleSuccess();
      }
    }
  }, [isComplete, isPlaying, drillMode, level, feedback]);

  // 성공 처리 로직
  const handleSuccess = () => {
    if (!currentItem) return;
    setFeedback('correct');

    const nextPoints = currentItem.masteryPoints + 1;
    const targetPoints = 1;

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

    if (nextPoints >= targetPoints) {
      const updatedItem = { ...currentItem, masteryPoints: nextPoints, isPassed: true };
      setPassedItems(prev => [...prev, updatedItem]);
      onCompleteVerse(currentItem.verse, 'good');

      const nextQueue = queue.slice(1);
      setQueue(nextQueue);

      if (nextQueue.length === 0) {
        setIsCompletedAll(true);
      } else {
        setTimeout(() => {
          setCurrentItem(nextQueue[0]);
          prepareQuestion(nextQueue[0], drillMode, level);
        }, 1000);
      }
    } else {
      const updatedItem = { ...currentItem, masteryPoints: nextPoints };
      const nextQueue = [...queue.slice(1), updatedItem];
      setQueue(nextQueue);
      setTimeout(() => {
        setCurrentItem(nextQueue[0]);
        prepareQuestion(nextQueue[0], drillMode, level);
      }, 1000);
    }
  };

  // 오답 처리 로직 (외울 때까지 큐 맨 뒤로 재출제)
  const handleFail = () => {
    if (!currentItem) return;
    setFeedback('wrong');

    const updatedItem = {
      ...currentItem,
      masteryPoints: 0,
      wrongAttempts: currentItem.wrongAttempts + 1
    };
    onCompleteVerse(currentItem.verse, 'again');

    const nextQueue = [...queue.slice(1), updatedItem];
    setQueue(nextQueue);
  };

  const handleNextAfterWrong = () => {
    if (queue.length > 0) {
      setCurrentItem(queue[0]);
      prepareQuestion(queue[0], drillMode, level);
    }
  };

  // VERSE_TO_REF Level 2 단계별 선택 핸들러
  const handleStepBookSelect = (book: string) => {
    if (!currentItem) return;
    if (book === currentItem.verse.bookName) {
      setSelectedBook(book);
      setStepStage('chapter');
      setStepError(null);
    } else {
      setStepError(`틀렸습니다! 이 구절은 '${book}'이 아닙니다.`);
      handleFail();
    }
  };

  const handleStepChapterSelect = (chapter: number) => {
    if (!currentItem) return;
    if (chapter === currentItem.verse.chapter) {
      setSelectedChapter(chapter);
      setStepStage('verse');
      setStepError(null);
    } else {
      setStepError(`틀렸습니다! '${selectedBook} ${chapter}장'이 아닙니다.`);
      handleFail();
    }
  };

  const handleStepVerseSelect = (verseNum: number) => {
    if (!currentItem) return;
    if (verseNum === currentItem.verse.verse) {
      setStepError(null);
      handleSuccess();
    } else {
      setStepError(`틀렸습니다! '${selectedBook} ${selectedChapter}장 ${verseNum}절'이 아닙니다.`);
      handleFail();
    }
  };

  const progressPercent = totalInitialCount > 0 
    ? Math.round((passedItems.length / totalInitialCount) * 100) 
    : 0;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* 훈련 설정 화면 */}
      {!isPlaying && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Zap size={24} color="var(--accent-gold)" fill="var(--accent-gold)" />
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800 }}>
                끝장 암송 훈련소 <span style={{ color: 'var(--text-gold)' }}>& 받아쓰기</span>
              </h2>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              틀린 구절은 별도 색상으로 표시되며, 100% 완벽히 외울 때까지 연속해서 훈련합니다.
            </p>
          </div>

          {/* 1. 훈련 모드 4가지 */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="var(--accent-gold)" />
              1. 훈련 방식 선택
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              
              {/* 모드 1: 몇장 몇절 제시 ➔ 외워서 구절 받아쓰기 (정답 맞추기) */}
              <div
                onClick={() => setDrillMode('DICTATION')}
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-lg)',
                  border: drillMode === 'DICTATION' ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                  background: drillMode === 'DICTATION' ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Edit3 size={20} color="var(--accent-gold)" />
                  <strong style={{ fontSize: '1rem' }}>장/절 제시 ➔ 외워서 구절 맞추기</strong>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  몇 장 몇 절(예: 요한복음 3장 16절)을 제시하면 그 말씀 본문을 기억하여 받아쓰고 정답을 맞춥니다. 틀린 글자는 실시간 빨간색으로 표시되며 100% 맞을 때까지 반복합니다.
                </p>
              </div>

              {/* 모드 2: 구절 무한 암송 */}
              <div
                onClick={() => setDrillMode('VERSE_MASTERY')}
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-lg)',
                  border: drillMode === 'VERSE_MASTERY' ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                  background: drillMode === 'VERSE_MASTERY' ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Sparkles size={20} color="#3b82f6" />
                  <strong style={{ fontSize: '1rem' }}>핵심 구절 무한 암송</strong>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  초성, 빈칸, 타이핑 단계로 구절을 완벽하게 외울 때까지 연속으로 물어봅니다.
                </p>
              </div>

              {/* 모드 3: 몇장 몇절 ➔ 본문 암송 */}
              <div
                onClick={() => setDrillMode('REF_TO_VERSE')}
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-lg)',
                  border: drillMode === 'REF_TO_VERSE' ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                  background: drillMode === 'REF_TO_VERSE' ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <BookOpen size={20} color="#10b981" />
                  <strong style={{ fontSize: '1rem' }}>몇장 몇절 ➔ 본문 암송</strong>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  장/절을 제시하면 본문 말씀을 정확히 연상하여 맞출 때까지 물어봅니다.
                </p>
              </div>

              {/* 모드 4: 본문 ➔ 몇장 몇절 맞추기 */}
              <div
                onClick={() => setDrillMode('VERSE_TO_REF')}
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-lg)',
                  border: drillMode === 'VERSE_TO_REF' ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                  background: drillMode === 'VERSE_TO_REF' ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <HelpCircle size={20} color="#ec4899" />
                  <strong style={{ fontSize: '1rem' }}>구절 ➔ 몇장 몇절 맞추기</strong>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  말씀을 보고 객관식 또는 책/장/절 단계별 탐색으로 정확한 출처를 맞춥니다.
                </p>
              </div>

            </div>
          </div>

          {/* 2. 난이도 레벨 선택 */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={18} color="#ef4444" />
              2. 훈련 난이도 레벨
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { 
                  lvl: 1 as DrillLevel, 
                  name: 'Level 1: 입문 (초성 가이드)', 
                  desc: drillMode === 'DICTATION' ? '장/절 제시 + 초성 힌트 제공 + 오타 실시간 빨간색 교정' : drillMode === 'VERSE_TO_REF' ? '4지 선다형 장/절 선택' : '선택지 / 초성 힌트 제공' 
                },
                { 
                  lvl: 2 as DrillLevel, 
                  name: 'Level 2: 숙련 (블라인드 암송)', 
                  desc: drillMode === 'DICTATION' ? '장/절 제시 + 글자 마스킹 가이드 ➔ 외워서 타이핑 (오타 즉시 빨간색 교정)' : drillMode === 'VERSE_TO_REF' ? '[책 선택 ➔ 장 선택 ➔ 절 선택] 단계별 맞추기' : '단어 블록 및 빈칸 조립' 
                },
                { 
                  lvl: 3 as DrillLevel, 
                  name: 'Level 3: 마스터 (완전 직접 입력)', 
                  desc: drillMode === 'DICTATION' ? '장/절 제시 + 무힌트 직접 타이핑 (100% 완벽 일치 통과)' : drillMode === 'VERSE_TO_REF' ? '장/절 출처 직접 타이핑 검증' : '힌트 없이 100% 완전 타이핑 일치 검증' 
                }
              ].map(item => (
                <div
                  key={item.lvl}
                  onClick={() => setLevel(item.lvl)}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: level === item.lvl ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                    background: level === item.lvl ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-tertiary)',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: level === item.lvl ? 'var(--text-gold)' : 'var(--text-primary)', marginBottom: 4 }}>
                    {item.name}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 구절 세트 선택 */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16 }}>
              3. 암송 대상 구절 세트
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { id: 'nt_keys', title: '신약 대표 구절 (10선)', count: '마태복음 ~ 요한계시록' },
                { id: 'ot_keys', title: '구약 대표 구절 (10선)', count: '창세기 ~ 이사야서' },
                { id: 'all_keys', title: '신구약 핵심 명구 (15선)', count: '전체 주요 요절' },
                { id: 'my_progress', title: '내 학습 / 복습 구절', count: `${Object.keys(progressMap).length}개 구절` }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSet(s.id as any)}
                  className="btn"
                  style={{
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    background: selectedSet === s.id ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                    border: selectedSet === s.id ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <strong style={{ fontSize: '0.95rem', color: selectedSet === s.id ? 'var(--text-gold)' : 'inherit' }}>
                    {s.title}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {s.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 시작 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleStartDrill}
              className="btn btn-gold"
              style={{ padding: '16px 48px', fontSize: '1.15rem' }}
            >
              <Zap size={22} />
              <span>정답을 맞출 때까지 훈련 시작</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* 훈련 진행 화면 (Active Drill Loop) */}
      {isPlaying && !isCompletedAll && currentItem && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* 상단 현황 바 */}
          <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-gold">
                  {drillMode === 'DICTATION' ? '장/절 제시 ➔ 외워서 구절 맞추기' : drillMode === 'VERSE_MASTERY' ? '구절 무한 암송' : drillMode === 'REF_TO_VERSE' ? '몇장 몇절 ➔ 본문 암송' : '구절 ➔ 몇장 몇절 맞추기'}
                </span>
                <span className="badge badge-blue">Level {level}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  마스터 진행: {passedItems.length} / {totalInitialCount} ({progressPercent}%)
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (window.confirm('훈련을 중단하고 나가시겠습니까?')) {
                  setIsPlaying(false);
                }
              }}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              훈련 종료
            </button>
          </div>

          {/* 진행률 게이지 바 */}
          <div style={{ width: '100%', height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
              transition: 'width 0.3s'
            }} />
          </div>

          {/* 메인 문제 카드 */}
          <div className="glass-panel" style={{
            padding: 32,
            border: feedback === 'wrong' ? '2px solid var(--accent-danger)' : feedback === 'correct' ? '2px solid var(--accent-success)' : '1px solid var(--border-color)',
            transition: 'border-color 0.2s'
          }}>

            {/* 1. 받아쓰기 암송 모드 (DICTATION) - 몇 장 몇 절 제시 ➔ 외워서 본문 맞추기 */}
            {drillMode === 'DICTATION' && (
              <div>
                {/* [핵심] 몇장 몇절 출제 카드 */}
                <div style={{
                  background: 'var(--bg-tertiary)',
                  border: '2px solid var(--accent-gold)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px 28px',
                  textAlign: 'center',
                  marginBottom: 20,
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(212, 175, 55, 0.15)',
                    padding: '4px 14px',
                    borderRadius: 20,
                    color: 'var(--text-gold)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginBottom: 10
                  }}>
                    <BookOpen size={15} />
                    <span>[출제 문제] 아래 제시된 장/절의 말씀 본문을 기억하여 작성하세요:</span>
                  </div>
                  <h2 style={{
                    fontSize: '2.1rem',
                    fontWeight: 800,
                    color: 'var(--text-gold)',
                    letterSpacing: '-0.02em',
                    margin: '6px 0 10px'
                  }}>
                    {currentItem.verse.bookName} {currentItem.verse.chapter}장 {currentItem.verse.verse}절
                  </h2>
                  {currentItem.verse.outline && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: 650, margin: '0 auto' }}>
                      📌 개요: <span style={{ color: 'var(--text-primary)' }}>{currentItem.verse.outline}</span>
                    </p>
                  )}
                </div>

                {/* 보조 안내 및 힌트 툴바 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    외운 구절을 아래에 타이핑하세요. 틀린 글자는 실시간으로 <strong style={{ color: '#ef4444' }}>빨간색</strong>으로 표시됩니다.
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowHintInDictation(prev => !prev)}
                      className={`btn ${showHintInDictation ? 'btn-gold' : 'btn-outline'}`}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      <Sparkles size={14} />
                      <span>{showHintInDictation ? '초성 힌트 닫기' : '초성 힌트 보기'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPeeking(true);
                        setTimeout(() => setIsPeeking(false), 1500);
                      }}
                      disabled={isPeeking}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      <span>{isPeeking ? '👀 정답 확인 중...' : '👀 1.5초 엿보기'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => tts.speak(currentItem.verse.text)}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      <Volume2 size={14} />
                      <span>낭독 힌트</span>
                    </button>
                  </div>
                </div>

                {/* Level 1 또는 힌트 활성화 시 상단 초성 가이드 띠 */}
                {(level === 1 || showHintInDictation) && (
                  <div style={{
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px dashed var(--accent-gold)',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 14
                  }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-gold)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                      초성 힌트 가이드:
                    </span>
                    <span className="verse-text-serif" style={{ color: 'var(--text-gold)', letterSpacing: '0.08em', fontSize: '1.15rem' }}>
                      {toInitialConsonants(currentItem.verse.text)}
                    </span>
                  </div>
                )}

                {/* 실시간 암송 받아쓰기 오타/정답 색상 피드백 디스플레이 */}
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '22px 26px',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${diffs.some(d => d.status === 'wrong') ? 'rgba(239, 68, 68, 0.5)' : isComplete ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-color)'}`,
                  marginBottom: 16,
                  fontSize: '1.3rem',
                  lineHeight: 1.9,
                  letterSpacing: '0.03em',
                  minHeight: 100,
                  wordBreak: 'break-all'
                }}>
                  {diffs.map((d, idx) => {
                    if (d.status === 'correct') {
                      return (
                        <span key={idx} style={{ color: '#10b981', fontWeight: 700 }}>
                          {d.expected}
                        </span>
                      );
                    }
                    if (d.status === 'wrong') {
                      return (
                        <span
                          key={idx}
                          style={{
                            color: '#ffffff',
                            backgroundColor: '#ef4444',
                            padding: '2px 5px',
                            borderRadius: 4,
                            fontWeight: 800,
                            margin: '0 1px'
                          }}
                          title={`오타 입력: '${d.char || '공백'}'`}
                        >
                          {d.char || '␣'}
                        </span>
                      );
                    }
                    // status === 'pending' (아직 입력되지 않은 뒷부분)
                    if (isPeeking) {
                      return (
                        <span key={idx} style={{ color: 'var(--text-gold)', fontWeight: 600 }}>
                          {d.expected}
                        </span>
                      );
                    }
                    if (level === 1 || showHintInDictation) {
                      return (
                        <span key={idx} style={{ color: 'var(--text-gold)', opacity: 0.55, letterSpacing: '0.04em' }}>
                          {toInitialConsonants(d.expected)}
                        </span>
                      );
                    }
                    if (level === 2) {
                      return d.expected === ' ' || d.expected === '\n' ? (
                        <span key={idx}> </span>
                      ) : (
                        <span key={idx} style={{ color: 'var(--text-muted)', opacity: 0.35 }}>
                          ●
                        </span>
                      );
                    }
                    // level === 3 (완전 블라인드)
                    return d.expected === ' ' ? (
                      <span key={idx}> </span>
                    ) : (
                      <span key={idx} style={{ color: 'var(--text-muted)', opacity: 0.2 }}>
                        _
                      </span>
                    );
                  })}
                </div>

                {/* 타이핑 입력창 */}
                <textarea
                  ref={typingInputRef as any}
                  rows={3}
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder="제시된 장/절의 말씀 본문을 기억하여 이곳에 타이핑하세요... (틀린 글자는 위에서 즉시 빨간색으로 표시됩니다)"
                  style={{
                    width: '100%',
                    padding: 16,
                    fontSize: '1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: `2px solid ${isComplete ? '#10b981' : diffs.some(d => d.status === 'wrong') ? '#ef4444' : 'var(--border-color)'}`,
                    color: 'var(--text-primary)',
                    marginBottom: 16,
                    fontFamily: 'inherit',
                    outline: 'none',
                    lineHeight: 1.6
                  }}
                />

                {/* 하단 진행상황 및 통과 안내 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge ${accuracy === 100 ? 'badge-green' : accuracy >= 50 ? 'badge-gold' : 'badge-orange'}`}>
                      정확도: {accuracy}%
                    </span>

                    {diffs.some(d => d.status === 'wrong') && (
                      <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={15} />
                        빨간색 글자({diffs.filter(d => d.status === 'wrong').length}개)를 올바르게 고쳐주세요!
                      </span>
                    )}

                    {isComplete && (
                      <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={16} />
                        100% 정답 일치! 통과되었습니다.
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!isComplete) {
                        const wrongCount = diffs.filter(d => d.status === 'wrong').length;
                        alert(wrongCount > 0 
                          ? `아직 빨간색 오타가 ${wrongCount}개 남아있습니다. 위 피드백을 확인하고 정확히 고쳐주세요!`
                          : '말씀 본문 전체를 끝까지 입력해주세요!');
                      }
                    }}
                    disabled={!isComplete}
                    className="btn btn-gold"
                    style={{ padding: '10px 24px', opacity: isComplete ? 1 : 0.6 }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{isComplete ? '100% 정답 통과!' : '100% 일치할 때까지 수정'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. 구절 본문 ➔ 몇장 몇절 맞추기 (VERSE_TO_REF) */}
            {drillMode === 'VERSE_TO_REF' && (
              <div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  [문제] 아래 말씀은 성경 몇 장 몇 절입니까?
                </p>
                <div style={{ background: 'var(--bg-tertiary)', padding: 24, borderRadius: 'var(--radius-lg)', marginBottom: 24 }}>
                  <p className="verse-text-serif" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                    "{currentItem.verse.text}"
                  </p>
                </div>

                {/* Level 1: 4지 선다형 */}
                {level === 1 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    {choices.map((choice, i) => (
                      <button
                        key={i}
                        disabled={feedback !== 'none'}
                        onClick={() => {
                          const correctRef = `${currentItem.verse.bookName} ${currentItem.verse.chapter}장 ${currentItem.verse.verse}절`;
                          if (choice === correctRef) {
                            handleSuccess();
                          } else {
                            handleFail();
                          }
                        }}
                        className="btn btn-outline"
                        style={{ padding: 16, fontSize: '1.05rem', fontWeight: 700 }}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                )}

                {/* Level 2: 단계별 맞추기 (Step 1 책 ➔ Step 2 장 ➔ Step 3 절) */}
                {level === 2 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <span className={`badge ${stepStage === 'book' ? 'badge-gold' : 'badge-green'}`}>
                        1단계: 성경 책 선택
                      </span>
                      <span>➔</span>
                      <span className={`badge ${stepStage === 'chapter' ? 'badge-gold' : stepStage === 'verse' ? 'badge-green' : 'badge-blue'}`}>
                        2단계: 장 선택
                      </span>
                      <span>➔</span>
                      <span className={`badge ${stepStage === 'verse' ? 'badge-gold' : 'badge-blue'}`}>
                        3단계: 절 선택
                      </span>
                    </div>

                    {stepError && (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontSize: '0.85rem',
                        marginBottom: 16
                      }}>
                        {stepError}
                      </div>
                    )}

                    {/* Step 1: 책 선택 */}
                    {stepStage === 'book' && (
                      <div>
                        <p style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-gold)', fontWeight: 600 }}>
                          어느 성경 책의 말씀입니까?
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                          {bookChoices.map((b, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleStepBookSelect(b)}
                              className="btn btn-outline"
                              style={{ padding: 16, fontSize: '1.1rem', fontWeight: 700 }}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 2: 장 선택 */}
                    {stepStage === 'chapter' && (
                      <div>
                        <p style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-gold)', fontWeight: 600 }}>
                          [{selectedBook}] 몇 장의 말씀입니까?
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                          {chapterChoices.map((ch, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleStepChapterSelect(ch)}
                              className="btn btn-outline"
                              style={{ padding: 16, fontSize: '1.1rem', fontWeight: 700 }}
                            >
                              {ch}장
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 3: 절 선택 */}
                    {stepStage === 'verse' && (
                      <div>
                        <p style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-gold)', fontWeight: 600 }}>
                          [{selectedBook} {selectedChapter}장] 몇 절의 말씀입니까?
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                          {verseChoices.map((v, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleStepVerseSelect(v)}
                              className="btn btn-outline"
                              style={{ padding: 16, fontSize: '1.1rem', fontWeight: 700 }}
                            >
                              {v}절
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Level 3: 장절 직접 타이핑 (실시간 오타 색상 표시) */}
                {level === 3 && (
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      성경 책 이름과 몇 장 몇 절을 직접 타이핑하세요 (예: 요한복음 3장 16절):
                    </p>

                    {/* 실시간 오타 비교 박스 */}
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      padding: 16,
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 12,
                      fontSize: '1.15rem'
                    }}>
                      {diffs.map((d, idx) => (
                        <span key={idx} style={{
                          color: d.status === 'correct' ? '#10b981' : d.status === 'wrong' ? '#ffffff' : 'var(--text-muted)',
                          backgroundColor: d.status === 'wrong' ? '#ef4444' : 'transparent',
                          padding: d.status === 'wrong' ? '2px 4px' : '0',
                          borderRadius: 3,
                          fontWeight: d.status === 'correct' ? 700 : 400
                        }}>
                          {d.expected}
                        </span>
                      ))}
                    </div>

                    <input
                      ref={typingInputRef as any}
                      type="text"
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      placeholder="예: 창세기 1장 1절"
                      style={{
                        width: '100%',
                        padding: 16,
                        fontSize: '1.1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        border: `2px solid ${isComplete ? '#10b981' : 'var(--border-color)'}`,
                        color: 'var(--text-primary)',
                        marginBottom: 12,
                        outline: 'none'
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge ${isComplete ? 'badge-green' : 'badge-gold'}`}>
                        정확도: {accuracy}%
                      </span>
                      <button
                        disabled={!isComplete}
                        onClick={handleSuccess}
                        className="btn btn-gold"
                      >
                        정답 통과
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. 몇장 몇절 ➔ 본문 암송 (REF_TO_VERSE) */}
            {drillMode === 'REF_TO_VERSE' && (
              <div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  [문제] 다음 성경 구절의 말씀 본문은 무엇입니까?
                </p>
                <div style={{ background: 'var(--bg-tertiary)', padding: 20, borderRadius: 'var(--radius-lg)', marginBottom: 24, textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-gold)' }}>
                    {currentItem.verse.bookName} {currentItem.verse.chapter}장 {currentItem.verse.verse}절
                  </h3>
                  {currentItem.verse.outline && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      개요: {currentItem.verse.outline}
                    </p>
                  )}
                </div>

                {level === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {choices.map((choice, i) => (
                      <button
                        key={i}
                        disabled={feedback !== 'none'}
                        onClick={() => {
                          if (choice === currentItem.verse.text) {
                            handleSuccess();
                          } else {
                            handleFail();
                          }
                        }}
                        className="btn btn-outline"
                        style={{ padding: 16, textAlign: 'left', fontSize: '1rem', lineHeight: 1.6 }}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                )}

                {level === 2 && (
                  <div>
                    <div style={{
                      minHeight: 60,
                      background: 'var(--bg-secondary)',
                      padding: 16,
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-color)',
                      marginBottom: 16,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      fontSize: '1.15rem'
                    }}>
                      {clozeSelected.length === 0 && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          아래 단어 조각들을 순서대로 클릭하여 완성하세요...
                        </span>
                      )}
                      {clozeSelected.map((w, idx) => (
                        <span key={idx} style={{ background: 'rgba(212, 175, 55, 0.2)', padding: '4px 10px', borderRadius: 4, color: 'var(--text-gold)', fontWeight: 600 }}>
                          {w}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      {choices.map((w, idx) => {
                        const isUsed = clozeSelected.includes(w);
                        return (
                          <button
                            key={idx}
                            disabled={isUsed}
                            onClick={() => setClozeSelected(prev => [...prev, w])}
                            className="btn btn-outline"
                            style={{ opacity: isUsed ? 0.3 : 1 }}
                          >
                            {w}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => setClozeSelected([])} className="btn btn-outline">
                        <RotateCcw size={16} /> 초기화
                      </button>
                      <button
                        onClick={() => {
                          const assembled = clozeSelected.join(' ');
                          if (assembled.trim() === currentItem.verse.text.trim()) {
                            handleSuccess();
                          } else {
                            handleFail();
                          }
                        }}
                        className="btn btn-gold"
                        style={{ flex: 1 }}
                      >
                        조립 완료 제출
                      </button>
                    </div>
                  </div>
                )}

                {level === 3 && (
                  <div>
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 12,
                      fontSize: '1.15rem',
                      lineHeight: 1.8
                    }}>
                      {diffs.map((d, idx) => (
                        <span key={idx} style={{
                          color: d.status === 'correct' ? '#10b981' : d.status === 'wrong' ? '#ffffff' : 'var(--text-muted)',
                          backgroundColor: d.status === 'wrong' ? '#ef4444' : 'transparent',
                          padding: d.status === 'wrong' ? '2px 4px' : '0',
                          borderRadius: 3,
                          fontWeight: d.status === 'correct' ? 700 : 400
                        }}>
                          {d.expected}
                        </span>
                      ))}
                    </div>

                    <textarea
                      ref={typingInputRef as any}
                      rows={3}
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      placeholder="이 장절의 전체 본문을 직접 암송하여 타이핑하세요..."
                      style={{
                        width: '100%',
                        padding: 16,
                        fontSize: '1.1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        border: `2px solid ${isComplete ? '#10b981' : 'var(--border-color)'}`,
                        color: 'var(--text-primary)',
                        marginBottom: 16,
                        fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className={`badge ${isComplete ? 'badge-green' : 'badge-gold'}`}>
                        정확도: {accuracy}%
                      </span>
                      <button disabled={!isComplete} onClick={handleSuccess} className="btn btn-gold">
                        암송 완료 검증
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. 핵심 구절 무한 암송 (VERSE_MASTERY) */}
            {drillMode === 'VERSE_MASTERY' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="badge badge-gold">
                    {currentItem.verse.bookName} {currentItem.verse.chapter}장 {currentItem.verse.verse}절
                  </span>
                  <button
                    onClick={() => tts.speak(currentItem.verse.text)}
                    className="btn btn-outline"
                    style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                  >
                    <Volume2 size={14} /> 낭독 듣기
                  </button>
                </div>

                {level === 1 && (
                  <div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: 24, borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        초성 힌트를 보며 소리 내어 암송해 보세요:
                      </p>
                      <p className="verse-text-serif" style={{ fontSize: '1.4rem', color: 'var(--text-gold)', letterSpacing: '0.08em' }}>
                        {toInitialConsonants(currentItem.verse.text)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={handleFail}
                        className="btn btn-outline"
                        style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444', padding: 14 }}
                      >
                        <XCircle size={18} />
                        <span>헷갈림 (다시 반복)</span>
                      </button>

                      <button
                        onClick={handleSuccess}
                        className="btn btn-gold"
                        style={{ flex: 1, padding: 14 }}
                      >
                        <CheckCircle2 size={18} />
                        <span>완벽히 외움 (통과)</span>
                      </button>
                    </div>
                  </div>
                )}

                {level === 2 && clozeQuiz && (
                  <div>
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      padding: 24,
                      borderRadius: 'var(--radius-lg)',
                      marginBottom: 20,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      fontSize: '1.25rem'
                    }}>
                      {(() => {
                        let fillIdx = 0;
                        return clozeQuiz.items.map((it, idx) => {
                          if (!it.isBlank) return <span key={idx}>{it.word}</span>;
                          const filled = clozeSelected[fillIdx];
                          fillIdx++;
                          return (
                            <span key={idx} style={{
                              fontWeight: 700,
                              color: filled ? '#10b981' : 'var(--text-gold)',
                              borderBottom: '2px solid var(--accent-gold)',
                              padding: '0 6px'
                            }}>
                              {filled || '____'}
                            </span>
                          );
                        });
                      })()}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                      {clozeQuiz.blankWords.map((item, idx) => {
                        const isUsed = clozeSelected.includes(item.word);
                        return (
                          <button
                            key={idx}
                            disabled={isUsed}
                            onClick={() => setClozeSelected(prev => [...prev, item.word])}
                            className="btn btn-outline"
                            style={{ opacity: isUsed ? 0.3 : 1 }}
                          >
                            {item.word}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => setClozeSelected([])} className="btn btn-outline">
                        <RotateCcw size={16} /> 초기화
                      </button>
                      <button
                        onClick={() => {
                          const expected = clozeQuiz.items.filter(i => i.isBlank).map(i => i.word).join(' ');
                          const given = clozeSelected.join(' ');
                          if (expected === given) {
                            handleSuccess();
                          } else {
                            handleFail();
                          }
                        }}
                        className="btn btn-gold"
                        style={{ flex: 1 }}
                      >
                        빈칸 채우기 검증
                      </button>
                    </div>
                  </div>
                )}

                {level === 3 && (
                  <div>
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 12,
                      fontSize: '1.15rem',
                      lineHeight: 1.8
                    }}>
                      {diffs.map((d, idx) => (
                        <span key={idx} style={{
                          color: d.status === 'correct' ? '#10b981' : d.status === 'wrong' ? '#ffffff' : 'var(--text-muted)',
                          backgroundColor: d.status === 'wrong' ? '#ef4444' : 'transparent',
                          padding: d.status === 'wrong' ? '2px 4px' : '0',
                          borderRadius: 3,
                          fontWeight: d.status === 'correct' ? 700 : 400
                        }}>
                          {d.expected}
                        </span>
                      ))}
                    </div>

                    <textarea
                      ref={typingInputRef as any}
                      rows={3}
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      placeholder="구절 전체를 직접 암송하여 타이핑하세요..."
                      style={{
                        width: '100%',
                        padding: 16,
                        fontSize: '1.1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        border: `2px solid ${isComplete ? '#10b981' : 'var(--border-color)'}`,
                        color: 'var(--text-primary)',
                        marginBottom: 16,
                        fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className={`badge ${isComplete ? 'badge-green' : 'badge-gold'}`}>
                        정확도: {accuracy}%
                      </span>
                      <button disabled={!isComplete} onClick={handleSuccess} className="btn btn-gold">
                        암송 완료 검증
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 정답 / 오답 피드백 알림창 */}
            {feedback === 'wrong' && (
              <div style={{
                marginTop: 20,
                padding: 20,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', marginBottom: 8, fontWeight: 700 }}>
                  <XCircle size={20} />
                  <span>아쉽습니다! 완벽히 맞출 때까지 나중에 다시 출제됩니다.</span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-gold)', fontWeight: 700, marginBottom: 4 }}>
                    정답: {currentItem.verse.bookName} {currentItem.verse.chapter}장 {currentItem.verse.verse}절
                  </p>
                  <p className="verse-text-serif" style={{ fontSize: '1.15rem' }}>
                    {currentItem.verse.text}
                  </p>
                </div>
                <button
                  onClick={handleNextAfterWrong}
                  className="btn btn-outline"
                  style={{ width: '100%', borderColor: 'var(--accent-gold)', color: 'var(--text-gold)' }}
                >
                  <RefreshCw size={16} />
                  <span>확인했습니다. 다음 문제로 (이 구절은 큐 뒤에서 다시 나옵니다)</span>
                </button>
              </div>
            )}

            {feedback === 'correct' && (
              <div style={{
                marginTop: 20,
                padding: 16,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#10b981',
                fontWeight: 700
              }}>
                <CheckCircle2 size={20} />
                <span>정답입니다! 100% 마스터 완료로 기록되었습니다.</span>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 모든 구절 마스터 완료 축하 화면 */}
      {isCompletedAll && (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <Trophy size={64} color="var(--accent-gold)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
            축하합니다! 모든 구절을 <span style={{ color: 'var(--text-gold)' }}>100% 마스터</span>하셨습니다!
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto 24px', fontSize: '0.95rem' }}>
            틀렸던 구절도 끝까지 다시 받아쓰고 맞추어 전 구절을 완벽하게 기억 속에 각인하셨습니다.
          </p>

          <div style={{
            display: 'inline-flex',
            gap: 20,
            background: 'var(--bg-tertiary)',
            padding: '16px 32px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 28
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>마스터한 구절</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-gold)' }}>
                {passedItems.length}개
              </div>
            </div>
            <div style={{ width: 1, background: 'var(--border-color)' }} />
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>훈련 난이도</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>
                Level {level}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => setIsPlaying(false)} className="btn btn-gold">
              다른 모드로 계속 훈련하기
            </button>
            <button onClick={onExit} className="btn btn-outline">
              홈 대시보드로 돌아가기
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
