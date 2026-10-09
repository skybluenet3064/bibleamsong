import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Volume2, VolumeX, Eye, HelpCircle, CheckCircle2, ArrowRight, 
  RotateCcw, Sparkles, BookMarked, Bookmark, Heart, Copy, Save, Check, Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VerseItem, MemorizeProgress, TTSVoiceStyle } from '../types/bible';
import { tts, VOICE_STYLE_PRESETS, CORE_BIBLICAL_KEYWORDS } from '../services/ttsService';
import { loadSettings, saveSettings, saveVersePrayer, getVersePrayer } from '../services/storage';
import { 
  toInitialConsonants, applyBlind, generateClozeQuiz, evaluateTyping, ClozeQuiz 
} from '../services/hangulUtils';
import { STAGE_LABELS } from '../services/srsEngine';
import { generatePrayReading, PrayerTheme } from '../services/prayReadingService';

interface VerseMemorizeModalProps {
  verseItem: VerseItem;
  existingProgress?: MemorizeProgress;
  onClose: () => void;
  onComplete: (result: 'again' | 'good' | 'easy', userPrayer?: string) => void;
  onToggleBookmark?: (id: string) => void;
}

export const VerseMemorizeModal: React.FC<VerseMemorizeModalProps> = ({
  verseItem,
  existingProgress,
  onClose,
  onComplete,
  onToggleBookmark
}) => {
  // 6단계 파이프라인: 1(통독), 2(가림판), 3(초성), 4(빈칸), 5(타이핑), 6(말씀 기도)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState<TTSVoiceStyle>(() => {
    return loadSettings().ttsVoiceStyle || 'natural';
  });

  // Step 2 (가림판)
  const [blindRatio, setBlindRatio] = useState<number>(0.5);
  const [isPeeking, setIsPeeking] = useState(false);

  // Step 3 (초성)
  const [showAnswerInStep3, setShowAnswerInStep3] = useState(false);

  // Step 4 (빈칸)
  const [clozeQuiz, setClozeQuiz] = useState<ClozeQuiz | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [clozeError, setClozeError] = useState(false);

  // Step 5 (타이핑)
  const [typedInput, setTypedInput] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const typingInputRef = useRef<HTMLTextAreaElement>(null);

  // Step 6 (말씀 기도 & 프레이리딩)
  const verseId = `${verseItem.bookId}_${verseItem.chapter}_${verseItem.verse}`;
  const prayReadingData = useMemo(() => generatePrayReading(verseItem), [verseItem]);
  const [selectedPrayerTheme, setSelectedPrayerTheme] = useState<PrayerTheme>('praise');
  const [userPrayerText, setUserPrayerText] = useState<string>(() => {
    return existingProgress?.userPrayer || getVersePrayer(verseId)?.userPrayer || '';
  });
  const [prayerSavedToast, setPrayerSavedToast] = useState(false);
  const [isPlayingPrayerAudio, setIsPlayingPrayerAudio] = useState(false);

  // 음성 낭독 토글 (성경 구절)
  const handleToggleAudio = async () => {
    if (isPlayingAudio) {
      tts.stop();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      await tts.speak(verseItem.text, { style: voiceStyle });
      setIsPlayingAudio(false);
    }
  };

  // 낭독 스타일 변경
  const handleChangeVoiceStyle = (newStyle: TTSVoiceStyle) => {
    setVoiceStyle(newStyle);
    const currSettings = loadSettings();
    const preset = VOICE_STYLE_PRESETS[newStyle];
    saveSettings({
      ...currSettings,
      ttsVoiceStyle: newStyle,
      ttsPitch: newStyle === 'custom' ? currSettings.ttsPitch : preset.pitch,
      ttsSpeed: newStyle === 'custom' ? currSettings.ttsSpeed : preset.rate
    });

    if (isPlayingAudio) {
      tts.stop();
      setIsPlayingAudio(true);
      tts.speak(verseItem.text, { style: newStyle }).finally(() => {
        setIsPlayingAudio(false);
      });
    }
  };

  // 모달 닫힐 때 TTS 중단
  useEffect(() => {
    return () => {
      tts.stop();
    };
  }, []);

  // Step 4 빈칸 생성
  useEffect(() => {
    if (step === 4 && !clozeQuiz) {
      setClozeQuiz(generateClozeQuiz(verseItem.text, 3));
      setSelectedWords([]);
    }
  }, [step, verseItem.text, clozeQuiz]);

  // Step 5 포커스
  useEffect(() => {
    if (step === 5) {
      setTimeout(() => {
        typingInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  // 빈칸 칩 선택 처리
  const handleSelectWordChip = (word: string) => {
    if (!clozeQuiz) return;
    const currentCount = selectedWords.length;
    const expectedWord = clozeQuiz.items.filter(it => it.isBlank)[currentCount]?.word;

    if (expectedWord === word) {
      const nextWords = [...selectedWords, word];
      setSelectedWords(nextWords);
      setClozeError(false);

      if (nextWords.length === clozeQuiz.blankWords.length) {
        setTimeout(() => {
          setStep(5);
        }, 500);
      }
    } else {
      setClozeError(true);
      setTimeout(() => setClozeError(false), 800);
    }
  };

  // Step 5 타이핑 평가
  const { accuracy, diffs } = evaluateTyping(typedInput, verseItem.text);

  useEffect(() => {
    if (step === 5 && accuracy === 100 && !typingComplete) {
      setTypingComplete(true);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    }
  }, [step, accuracy, typingComplete]);

  // ----------------------------------------------------
  // Step 6: 말씀 기도 헬퍼
  // ----------------------------------------------------
  const currentRecommendedPrayer = useMemo(() => {
    const opt = prayReadingData.options.find(o => o.theme === selectedPrayerTheme);
    return opt ? opt.prayer : prayReadingData.defaultPrayer;
  }, [prayReadingData, selectedPrayerTheme]);

  // 추천 기도를 사용자 기도창에 복사
  const handleCopyRecommendedToUserPrayer = () => {
    if (userPrayerText.trim()) {
      setUserPrayerText(prev => prev + '\n\n' + currentRecommendedPrayer);
    } else {
      setUserPrayerText(currentRecommendedPrayer);
    }
  };

  // 키워드 알약 클릭 시 추가
  const handleAppendKeyword = (kw: string) => {
    setUserPrayerText(prev => {
      const cleanKw = kw.startsWith('+') ? kw.slice(1).trim() : kw;
      if (!prev.trim()) return cleanKw;
      return prev.endsWith(' ') || prev.endsWith('\n') ? prev + cleanKw : prev + ' ' + cleanKw;
    });
  };

  // 기도문 TTS 음성 낭독 토글
  const handleTogglePrayerAudio = async () => {
    if (isPlayingPrayerAudio) {
      tts.stop();
      setIsPlayingPrayerAudio(false);
    } else {
      setIsPlayingPrayerAudio(true);
      const textToRead = userPrayerText.trim() ? userPrayerText : currentRecommendedPrayer;
      await tts.speak(textToRead, { style: voiceStyle });
      setIsPlayingPrayerAudio(false);
    }
  };

  // 기도만 단독 저장
  const handleSavePrayerOnly = () => {
    saveVersePrayer(verseId, userPrayerText, currentRecommendedPrayer);
    setPrayerSavedToast(true);
    setTimeout(() => setPrayerSavedToast(false), 2000);
  };

  // 최종 완료 및 SRS 복습 주기 평가
  const handleFinishWithRating = (result: 'again' | 'good' | 'easy') => {
    tts.stop();
    saveVersePrayer(verseId, userPrayerText, currentRecommendedPrayer);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    onComplete(result, userPrayerText);
  };

  const stepTitles = ['1. 통독/묵상', '2. 가림판', '3. 초성', '4. 빈칸', '5. 타이핑', '6. 말씀 기도'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 740 }}>
        
        {/* 상단 헤더: 구절 출처 및 닫기 */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-gold" style={{ fontSize: '0.82rem' }}>
                {verseItem.bookName} {verseItem.chapter}장 {verseItem.verse}절
              </span>
              {existingProgress && (
                <span className="badge badge-blue">
                  {STAGE_LABELS[existingProgress.stage]}
                </span>
              )}
              {existingProgress?.isBookmarked && (
                <span className="badge badge-orange">취약 구절</span>
              )}
              {(existingProgress?.userPrayer || userPrayerText) && (
                <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Heart size={12} />
                  <span>말씀 기도 저장됨</span>
                </span>
              )}
            </div>
            {verseItem.outline && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {verseItem.outline}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* 상시 구절 낭독 듣기 버튼 */}
            <button
              onClick={handleToggleAudio}
              className={`btn ${isPlayingAudio ? 'btn-gold' : 'btn-outline'}`}
              style={{ padding: '6px 10px', borderRadius: 'var(--radius-md)' }}
              title={isPlayingAudio ? '낭독 중지' : `구절 듣기 (${VOICE_STYLE_PRESETS[voiceStyle]?.name})`}
            >
              {isPlayingAudio ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {onToggleBookmark && existingProgress && (
              <button
                onClick={() => onToggleBookmark(existingProgress.id)}
                className="btn btn-outline"
                style={{ padding: '6px 10px', borderRadius: 'var(--radius-md)' }}
                title="취약 구절 북마크 토글"
              >
                {existingProgress.isBookmarked ? (
                  <BookMarked size={18} color="var(--accent-gold)" />
                ) : (
                  <Bookmark size={18} color="var(--text-muted)" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="btn btn-outline"
              style={{ padding: '6px 10px', borderRadius: 'var(--radius-md)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 6단계 진행도 탭 바 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s as any)}
              style={{
                padding: '10px 2px',
                border: 'none',
                background: step === s ? 'var(--bg-secondary)' : 'transparent',
                color: step === s ? 'var(--text-gold)' : 'var(--text-muted)',
                fontWeight: step === s ? 700 : 500,
                fontSize: '0.76rem',
                borderBottom: step === s ? '2px solid var(--accent-gold)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              {s === 6 && <Heart size={12} color={step === 6 ? 'var(--accent-gold)' : 'currentColor'} />}
              <span>{stepTitles[s - 1]}</span>
            </button>
          ))}
        </div>

        {/* 단계별 본문 영역 */}
        <div style={{ padding: '24px 24px', minHeight: 340, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {/* STEP 1: 통독 & 묵상 */}
          {step === 1 && (
            <div>
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: 24,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                marginBottom: 20
              }}>
                <p className="verse-text-serif" style={{ fontSize: '1.35rem', color: 'var(--text-primary)', lineHeight: 1.75 }}>
                  {(() => {
                    const regex = new RegExp(`(${CORE_BIBLICAL_KEYWORDS.join('|')})`, 'g');
                    const parts = verseItem.text.split(regex);
                    return parts.map((part, idx) => {
                      if (CORE_BIBLICAL_KEYWORDS.includes(part)) {
                        return (
                          <span 
                            key={idx} 
                            style={{ 
                              color: 'var(--text-gold)', 
                              fontWeight: 700,
                              textDecoration: 'underline',
                              textDecorationColor: 'rgba(212, 175, 55, 0.45)',
                              textUnderlineOffset: '4px'
                            }}
                            title="낭독시 자연스럽게 강조되는 성경 핵심 단어"
                          >
                            {part}
                          </span>
                        );
                      }
                      return <span key={idx}>{part}</span>;
                    });
                  })()}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 12 }}>
                  <Sparkles size={13} color="var(--accent-gold)" />
                  <span>황금빛 단어: 사람이 옆에서 이야기하듯 끊김 없이 매끄럽게 흐르며 핵심 단어를 자연스럽게 강조합니다.</span>
                </div>
              </div>

              {/* 거룩하고 신실한 음성 낭독 컨트롤 바 */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <button
                    onClick={handleToggleAudio}
                    className={`btn ${isPlayingAudio ? 'btn-gold' : 'btn-outline'}`}
                    style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                  >
                    {isPlayingAudio ? <VolumeX size={17} /> : <Volume2 size={17} />}
                    <span>{isPlayingAudio ? '낭독 중지' : '음성으로 듣기'}</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>목소리:</span>
                    <select
                      value={voiceStyle}
                      onChange={(e) => handleChangeVoiceStyle(e.target.value as TTSVoiceStyle)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-gold)',
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        cursor: 'pointer'
                      }}
                    >
                      {Object.values(VOICE_STYLE_PRESETS).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.icon} {p.name} ({p.tag})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {isPlayingAudio && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--accent-gold)'
                    }}></span>
                    {VOICE_STYLE_PRESETS[voiceStyle]?.desc || '경건한 낭독 진행 중'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setStep(6)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Heart size={14} color="var(--accent-gold)" />
                  <span>말씀 기도로 바로 건너뛰기</span>
                </button>

                <button
                  onClick={() => setStep(2)}
                  className="btn btn-gold"
                  style={{ padding: '9px 20px', fontSize: '0.9rem' }}
                >
                  <span>다음: 가림판 훈련</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: 점진적 가림판 */}
          {step === 2 && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16
              }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  가림판 비율: <strong style={{ color: 'var(--text-gold)' }}>{Math.round(blindRatio * 100)}%</strong>
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0.3, 0.5, 0.8].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setBlindRatio(ratio)}
                      className={`btn ${blindRatio === ratio ? 'btn-gold' : 'btn-outline'}`}
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      {Math.round(ratio * 100)}%
                    </button>
                  ))}
                </div>
              </div>

              <div style={{
                background: 'var(--bg-tertiary)',
                padding: 24,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                marginBottom: 20,
                minHeight: 120,
                display: 'flex',
                alignItems: 'center'
              }}>
                <p className="verse-text-serif" style={{ fontSize: '1.35rem', color: 'var(--text-primary)', lineHeight: 1.8 }}>
                  {isPeeking ? verseItem.text : applyBlind(verseItem.text, blindRatio).maskedText}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onMouseDown={() => setIsPeeking(true)}
                  onMouseUp={() => setIsPeeking(false)}
                  onTouchStart={() => setIsPeeking(true)}
                  onTouchEnd={() => setIsPeeking(false)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Eye size={16} />
                  <span>누르고 있으면 원문 보기</span>
                </button>

                <button onClick={() => setStep(3)} className="btn btn-gold">
                  <span>다음: 초성 연상</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: 초성 연상 */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                첫 글자 초성을 보고 머릿속으로 전체 말씀을 온전히 인출해 보세요:
              </p>

              <div style={{
                background: 'var(--bg-tertiary)',
                padding: 24,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                marginBottom: 20
              }}>
                <p className="verse-text-serif" style={{ fontSize: '1.35rem', color: 'var(--text-gold)', letterSpacing: '0.08em', lineHeight: 1.8 }}>
                  {toInitialConsonants(verseItem.text)}
                </p>

                {showAnswerInStep3 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border-color)' }}>
                    <p className="verse-text-serif" style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                      {verseItem.text}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => setShowAnswerInStep3(!showAnswerInStep3)}
                  className="btn btn-outline"
                >
                  <HelpCircle size={16} />
                  <span>{showAnswerInStep3 ? '정답 숨기기' : '원문 확인하기'}</span>
                </button>

                <button onClick={() => setStep(4)} className="btn btn-gold">
                  <span>다음: 빈칸 완성</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: 빈칸 완성 */}
          {step === 4 && clozeQuiz && (
            <div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                아래 단어들을 순서대로 터치하여 빈칸을 완성하세요:
              </p>

              <div style={{
                background: 'var(--bg-tertiary)',
                padding: 24,
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${clozeError ? '#ef4444' : 'var(--border-color)'}`,
                marginBottom: 20,
                lineHeight: 2
              }}>
                {clozeQuiz.items.map((item, idx) => {
                  if (!item.isBlank) {
                    return <span key={idx} style={{ fontSize: '1.25rem' }}>{item.word} </span>;
                  }
                  const filledIndex = clozeQuiz.items.filter(it => it.isBlank).indexOf(item);
                  const isFilled = selectedWords.length > filledIndex;
                  return (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        minWidth: 50,
                        padding: '2px 8px',
                        margin: '0 4px',
                        borderBottom: '2px solid var(--accent-gold)',
                        background: isFilled ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                        color: isFilled ? 'var(--text-gold)' : 'transparent',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        textAlign: 'center'
                      }}
                    >
                      {isFilled ? selectedWords[filledIndex] : '___'}
                    </span>
                  );
                })}
              </div>

              {/* 단어 선택 칩 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {clozeQuiz.blankWords.map((item) => {
                  const isUsed = selectedWords.filter(w => w === item.word).length > 
                    clozeQuiz.blankWords.filter(sc => sc.word === item.word && sc.id < item.id).length;
                  return (
                    <button
                      key={item.id}
                      disabled={isUsed}
                      onClick={() => handleSelectWordChip(item.word)}
                      className="btn"
                      style={{
                        padding: '8px 16px',
                        fontSize: '1rem',
                        background: isUsed ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                        color: isUsed ? 'var(--text-muted)' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        opacity: isUsed ? 0.4 : 1,
                        cursor: isUsed ? 'default' : 'pointer'
                      }}
                    >
                      {item.word}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => setSelectedWords([])}
                  className="btn btn-outline"
                >
                  <RotateCcw size={16} />
                  <span>초기화</span>
                </button>

                <button onClick={() => setStep(5)} className="btn btn-gold">
                  <span>다음: 타이핑 검증</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: 전문 타이핑 검증 */}
          {step === 5 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  전체 구절을 직접 타이핑하여 100% 암송 여부를 검증하세요:
                </p>
                <span className={`badge ${accuracy >= 90 ? 'badge-green' : accuracy >= 50 ? 'badge-orange' : 'badge-gold'}`}>
                  일치율: {accuracy}%
                </span>
              </div>

              {/* 실시간 타이핑 비교 박스 */}
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                marginBottom: 16,
                fontSize: '1.15rem',
                lineHeight: 1.8
              }}>
                {diffs.map((d, i) => {
                  let color = 'var(--text-muted)';
                  if (d.status === 'correct') color = '#10b981';
                  if (d.status === 'wrong') color = '#ef4444';
                  return (
                    <span key={i} style={{ color, fontWeight: d.status === 'correct' ? 700 : 400 }}>
                      {d.expected}
                    </span>
                  );
                })}
              </div>

              {/* 입력 텍스트영역 */}
              <textarea
                ref={typingInputRef}
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="여기에 위 구절을 암송하여 타이핑하세요..."
                disabled={typingComplete}
                rows={3}
                style={{
                  width: '100%',
                  padding: 14,
                  fontSize: '1.05rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${typingComplete ? '#10b981' : 'var(--border-color)'}`,
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  marginBottom: 16
                }}
              />

              {/* 완료 시 피드백 & 6단계 말씀 기도 안내 */}
              {typingComplete ? (
                <div style={{
                  padding: 18,
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8, color: '#10b981' }}>
                    <Sparkles size={20} />
                    <strong style={{ fontSize: '1.05rem' }}>완벽하게 암송하셨습니다!</strong>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                    암송한 말씀을 살아있는 기도로 바꾸어 읽고 영 안에 깊이 새겨보세요:
                  </p>

                  <button
                    onClick={() => setStep(6)}
                    className="btn btn-gold"
                    style={{ padding: '11px 24px', fontSize: '0.96rem', width: '100%', marginBottom: 14 }}
                  >
                    <Heart size={18} />
                    <span>🕊️ 6단계: 말씀 기도로 영 안에 새기기 (추천)</span>
                    <ArrowRight size={18} />
                  </button>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, marginTop: 4 }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                      또는 기도를 건너뛰고 바로 복습 주기 평가로 완료:
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <button
                        onClick={() => handleFinishWithRating('again')}
                        className="btn btn-outline"
                        style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: '0.8rem', padding: '6px 12px' }}
                      >
                        <RotateCcw size={14} />
                        <span>다시 (내일)</span>
                      </button>
                      <button
                        onClick={() => handleFinishWithRating('good')}
                        className="btn btn-gold"
                        style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                      >
                        <CheckCircle2 size={14} />
                        <span>기억남 (Good)</span>
                      </button>
                      <button
                        onClick={() => handleFinishWithRating('easy')}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                      >
                        <Sparkles size={14} />
                        <span>매우 쉬움</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      setTypedInput(verseItem.text);
                      setTypingComplete(true);
                    }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.82rem' }}
                  >
                    타이핑 건너뛰기
                  </button>

                  <button
                    disabled={typedInput.length < 3}
                    onClick={() => {
                      if (accuracy >= 80) setTypingComplete(true);
                    }}
                    className="btn btn-gold"
                  >
                    암송 완료 검증
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: 말씀 기도 (Pray-Reading) & 감상 나눔 */}
          {step === 6 && (
            <div>
              {/* 안내 배너 */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(212, 175, 55, 0.03))',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px 18px',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}>
                <Heart size={22} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-gold)', marginBottom: 2 }}>
                    말씀 기도로 영 안에 새기기 (Pray-Reading)
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    암송한 구절을 살아있는 기도로 바꾸어 읽으며 주님과 영 안에서 호흡하세요. 
                    추천 기도를 소리 내어 읽거나, 자신이 느낀 고백과 기도를 덧붙여 마무리할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* 본문 짧은 인용 박스 */}
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                marginBottom: 16
              }}>
                <span className="badge badge-gold" style={{ fontSize: '0.72rem', marginBottom: 4, display: 'inline-block' }}>
                  {verseItem.bookName} {verseItem.chapter}:{verseItem.verse}
                </span>
                <p className="verse-text-serif" style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
                  "{verseItem.text}"
                </p>
              </div>

              {/* 추천 말씀 기도 (3가지 테마 탭) */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={16} color="var(--accent-gold)" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                      추천 말씀 기도
                    </span>
                  </div>

                  {/* 3가지 기도 테마 버튼 */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {prayReadingData.options.map((opt) => (
                      <button
                        key={opt.theme}
                        onClick={() => setSelectedPrayerTheme(opt.theme)}
                        className="btn"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.76rem',
                          borderRadius: 'var(--radius-md)',
                          background: selectedPrayerTheme === opt.theme ? 'var(--accent-gold)' : 'var(--bg-card)',
                          color: selectedPrayerTheme === opt.theme ? '#000' : 'var(--text-secondary)',
                          border: `1px solid ${selectedPrayerTheme === opt.theme ? 'var(--accent-gold)' : 'var(--border-color)'}`,
                          fontWeight: selectedPrayerTheme === opt.theme ? 700 : 500
                        }}
                      >
                        {opt.icon} {opt.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 추천 기도문 본문 카드 */}
                <div style={{
                  background: 'var(--bg-card)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  fontSize: '0.96rem',
                  lineHeight: 1.7,
                  color: 'var(--text-primary)',
                  fontStyle: 'normal',
                  marginBottom: 10
                }}>
                  {currentRecommendedPrayer}
                </div>

                {/* 추천 기도 액션 버튼 (음성 함께 읽기 & 내 기도창으로 복사) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    onClick={handleTogglePrayerAudio}
                    className={`btn ${isPlayingPrayerAudio ? 'btn-gold' : 'btn-outline'}`}
                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                  >
                    {isPlayingPrayerAudio ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    <span>{isPlayingPrayerAudio ? '기도 낭독 정지' : '거룩한 음성으로 함께 기도하기'}</span>
                  </button>

                  <button
                    onClick={handleCopyRecommendedToUserPrayer}
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    title="추천 기도문을 내 기도 입력창으로 복사하여 추가 작성"
                  >
                    <Copy size={14} />
                    <span>추천 기도를 내 기도창에 복사</span>
                  </button>
                </div>
              </div>

              {/* 말씀 기도 키워드 알약 (Pills) */}
              {prayReadingData.keywords.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    기도 키워드 (터치하면 기도문에 추가됩니다):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {prayReadingData.keywords.map((kw, i) => (
                      <button
                        key={i}
                        onClick={() => handleAppendKeyword(kw)}
                        className="btn btn-outline"
                        style={{
                          padding: '3px 10px',
                          fontSize: '0.76rem',
                          borderRadius: '14px',
                          background: 'var(--bg-card)'
                        }}
                      >
                        <Plus size={12} color="var(--accent-gold)" />
                        <span>{kw}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => handleAppendKeyword('오 주 예수님!')}
                      className="btn btn-outline"
                      style={{ padding: '3px 10px', fontSize: '0.76rem', borderRadius: '14px' }}
                    >
                      <Plus size={12} color="var(--accent-gold)" />
                      <span>오 주 예수님!</span>
                    </button>
                    <button
                      onClick={() => handleAppendKeyword('아멘!')}
                      className="btn btn-outline"
                      style={{ padding: '3px 10px', fontSize: '0.76rem', borderRadius: '14px' }}
                    >
                      <Plus size={12} color="var(--accent-gold)" />
                      <span>아멘!</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 나의 말씀 기도 및 감상 작성창 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    나의 말씀 기도 & 감상 고백 (선택사항)
                  </label>
                  {prayerSavedToast && (
                    <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={14} />
                      <span>성공적으로 저장되었습니다!</span>
                    </span>
                  )}
                </div>

                <textarea
                  value={userPrayerText}
                  onChange={(e) => setUserPrayerText(e.target.value)}
                  placeholder="이 말씀을 묵상하며 마음에 와닿은 감동, 회개, 감사, 그리고 삶의 적용 기도를 자유롭게 작성해 보세요 (추후 복습 시에도 유지됩니다)..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: '0.94rem',
                    lineHeight: 1.6,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    marginBottom: 8
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    onClick={handleSavePrayerOnly}
                    className="btn btn-outline"
                    style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                  >
                    <Save size={14} />
                    <span>나의 기도만 임시 저장</span>
                  </button>
                </div>
              </div>

              {/* 7차 복습 주기 평가 & 암송 완료 */}
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  오늘의 암송과 말씀 기도를 마치며 기억 난이도를 선택해 주세요:
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    onClick={() => handleFinishWithRating('again')}
                    className="btn btn-outline"
                    style={{ borderColor: '#ef4444', color: '#ef4444', padding: '9px 18px', fontSize: '0.88rem' }}
                  >
                    <RotateCcw size={16} />
                    <span>다시 (내일 복습)</span>
                  </button>

                  <button
                    onClick={() => handleFinishWithRating('good')}
                    className="btn btn-gold"
                    style={{ padding: '9px 24px', fontSize: '0.92rem' }}
                  >
                    <CheckCircle2 size={16} />
                    <span>기억남 (Good)</span>
                  </button>

                  <button
                    onClick={() => handleFinishWithRating('easy')}
                    className="btn btn-primary"
                    style={{ padding: '9px 24px', fontSize: '0.92rem' }}
                  >
                    <Sparkles size={16} />
                    <span>매우 쉬움 (Easy)</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
