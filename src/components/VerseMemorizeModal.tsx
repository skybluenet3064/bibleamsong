import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Volume2, VolumeX, Eye, HelpCircle, CheckCircle2, ArrowRight, 
  RotateCcw, Sparkles, BookMarked, Bookmark
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VerseItem, MemorizeProgress, TTSVoiceStyle } from '../types/bible';
import { tts, VOICE_STYLE_PRESETS } from '../services/ttsService';
import { loadSettings, saveSettings } from '../services/storage';
import { 
  toInitialConsonants, applyBlind, generateClozeQuiz, evaluateTyping, ClozeQuiz 
} from '../services/hangulUtils';
import { STAGE_LABELS } from '../services/srsEngine';

interface VerseMemorizeModalProps {
  verseItem: VerseItem;
  existingProgress?: MemorizeProgress;
  onClose: () => void;
  onComplete: (result: 'again' | 'good' | 'easy') => void;
  onToggleBookmark?: (id: string) => void;
}

export const VerseMemorizeModal: React.FC<VerseMemorizeModalProps> = ({
  verseItem,
  existingProgress,
  onClose,
  onComplete,
  onToggleBookmark
}) => {
  // 5단계: 1(통독), 2(가림판), 3(초성), 4(빈칸), 5(타이핑)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState<TTSVoiceStyle>(() => {
    return loadSettings().ttsVoiceStyle || 'reverent';
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

  // 음성 낭독 토글
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
    // 정답 단어와 일치하는지 확인
    const expectedWord = clozeQuiz.items.filter(it => it.isBlank)[currentCount]?.word;

    if (expectedWord === word) {
      const nextWords = [...selectedWords, word];
      setSelectedWords(nextWords);
      setClozeError(false);

      // 모든 빈칸 맞춤
      if (nextWords.length === clozeQuiz.blankWords.length) {
        setTimeout(() => {
          setStep(5);
        }, 500);
      }
    } else {
      // 오답 애니메이션 효과
      setClozeError(true);
      setTimeout(() => setClozeError(false), 600);
    }
  };

  // 타이핑 검사
  const { diffs, accuracy, isComplete } = evaluateTyping(verseItem.text, typedInput);

  useEffect(() => {
    if (isComplete && !typingComplete) {
      setTypingComplete(true);
      // 축하 폭죽 발사!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isComplete, typingComplete]);

  // 가림판 텍스트 계산
  const { maskedText } = applyBlind(verseItem.text, blindRatio);
  const initialConsonantsText = toInitialConsonants(verseItem.text);

  const stepTitles = [
    '1. 통독 & 묵상',
    '2. 점진적 가림판',
    '3. 초성 퀴즈',
    '4. 빈칸 채우기',
    '5. 전문 타이핑 검증'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
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
            </div>
            {verseItem.outline && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {verseItem.outline}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* 상시 낭독 듣기 버튼 */}
            <button
              onClick={handleToggleAudio}
              className={`btn ${isPlayingAudio ? 'btn-gold' : 'btn-outline'}`}
              style={{ padding: '6px 10px', borderRadius: 'var(--radius-md)' }}
              title={isPlayingAudio ? '낭독 중지' : `음성으로 듣기 (${VOICE_STYLE_PRESETS[voiceStyle]?.name})`}
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

        {/* 5단계 진행도 탭 바 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s as any)}
              style={{
                padding: '10px 4px',
                border: 'none',
                background: step === s ? 'var(--bg-secondary)' : 'transparent',
                color: step === s ? 'var(--text-gold)' : 'var(--text-muted)',
                fontWeight: step === s ? 700 : 500,
                fontSize: '0.78rem',
                borderBottom: step === s ? '2px solid var(--accent-gold)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {stepTitles[s - 1]}
            </button>
          ))}
        </div>

        {/* 단계별 본문 영역 */}
        <div style={{ padding: '28px 24px', minHeight: 340, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
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
                <p className="verse-text-serif" style={{ fontSize: '1.35rem', color: 'var(--text-primary)' }}>
                  {verseItem.text}
                </p>
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

                  {/* 음성 스타일 즉시 변경 드롭다운 */}
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

                {/* 낭독 진행 상태 표시 */}
                {isPlayingAudio && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--accent-gold)',
                      animation: 'pulse 1.5s infinite ease-in-out'
                    }}></span>
                    {VOICE_STYLE_PRESETS[voiceStyle]?.desc || '경건한 낭독 진행 중'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[0.3, 0.6, 1.0].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setBlindRatio(ratio)}
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                        background: blindRatio === ratio ? 'var(--accent-gold)' : 'var(--bg-tertiary)',
                        color: blindRatio === ratio ? '#121008' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {Math.round(ratio * 100)}% 가림
                    </button>
                  ))}
                </div>

                <button
                  onMouseDown={() => setIsPeeking(true)}
                  onMouseUp={() => setIsPeeking(false)}
                  onTouchStart={() => setIsPeeking(true)}
                  onTouchEnd={() => setIsPeeking(false)}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <Eye size={16} />
                  <span>누르고 있으면 엿보기</span>
                </button>
              </div>

              <div style={{
                background: 'var(--bg-tertiary)',
                padding: 24,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                marginBottom: 20
              }}>
                <p className="verse-text-serif" style={{ fontSize: '1.35rem', letterSpacing: '0.05em' }}>
                  {isPeeking ? verseItem.text : maskedText}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setStep(3)} className="btn btn-gold">
                  <span>다음: 초성 퀴즈</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: 초성 퀴즈 */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                초성만 보고 소리 내어 구절 전체를 암송해 보세요:
              </p>

              <div style={{
                background: 'var(--bg-tertiary)',
                padding: 24,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                marginBottom: 20
              }}>
                <p className="verse-text-serif" style={{ fontSize: '1.35rem', color: 'var(--text-gold)', letterSpacing: '0.08em' }}>
                  {initialConsonantsText}
                </p>

                {showAnswerInStep3 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border-color)' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>원문 확인:</p>
                    <p className="verse-text-serif" style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                      {verseItem.text}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  onClick={() => setShowAnswerInStep3(!showAnswerInStep3)}
                  className="btn btn-outline"
                >
                  <HelpCircle size={18} />
                  <span>{showAnswerInStep3 ? '정답 가리기' : '정답 확인하기'}</span>
                </button>

                <button onClick={() => setStep(4)} className="btn btn-gold">
                  <span>다음: 빈칸 채우기</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: 빈칸 채우기 */}
          {step === 4 && clozeQuiz && (
            <div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                아래 단어 조각들을 순서대로 클릭하여 빈칸을 완성하세요:
              </p>

              {/* 빈칸이 포함된 문장 디스플레이 */}
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: 24,
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${clozeError ? 'var(--accent-danger)' : 'var(--border-color)'}`,
                marginBottom: 20,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
                transition: 'border-color 0.2s'
              }}>
                {(() => {
                  let filledCount = 0;
                  return clozeQuiz.items.map((it, idx) => {
                    if (!it.isBlank) {
                      return <span key={idx} style={{ fontSize: '1.25rem' }}>{it.word}</span>;
                    }
                    const filledWord = selectedWords[filledCount];
                    filledCount++;
                    return (
                      <span
                        key={idx}
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 700,
                          padding: '2px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: filledWord ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 175, 55, 0.15)',
                          color: filledWord ? '#10b981' : 'var(--text-gold)',
                          border: `1px dashed ${filledWord ? '#10b981' : 'var(--accent-gold)'}`,
                          minWidth: 48,
                          textAlign: 'center'
                        }}
                      >
                        {filledWord || '____'}
                      </span>
                    );
                  });
                })()}
              </div>

              {/* 단어 칩 선택 목록 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {clozeQuiz.blankWords.map((item, idx) => {
                  const isUsed = selectedWords.includes(item.word);
                  return (
                    <button
                      key={idx}
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
                  marginBottom: 20
                }}
              />

              {/* 완료 시 7차 복습 피드백 버튼 */}
              {typingComplete ? (
                <div style={{
                  padding: 16,
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, color: '#10b981' }}>
                    <Sparkles size={22} />
                    <strong style={{ fontSize: '1.1rem' }}>완벽하게 암송하셨습니다!</strong>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                    이 구절을 기억하는 난이도를 선택하면 7차 복습 주기에 따라 다음 복습일이 자동 설정됩니다:
                  </p>

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      onClick={() => onComplete('again')}
                      className="btn btn-outline"
                      style={{ borderColor: '#ef4444', color: '#ef4444' }}
                    >
                      <RotateCcw size={16} />
                      <span>다시 (내일 복습)</span>
                    </button>

                    <button
                      onClick={() => onComplete('good')}
                      className="btn btn-gold"
                    >
                      <CheckCircle2 size={16} />
                      <span>기억남 (Good)</span>
                    </button>

                    <button
                      onClick={() => onComplete('easy')}
                      className="btn btn-primary"
                    >
                      <Sparkles size={16} />
                      <span>매우 쉬움 (Easy)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => setTypedInput(verseItem.text)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.82rem' }}
                  >
                    타이핑 건너뛰기
                  </button>

                  <button
                    disabled={typedInput.length < 5}
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

        </div>
      </div>
    </div>
  );
};
