import React, { useState, useMemo } from 'react';
import { 
  X, Heart, Volume2, VolumeX, Sparkles, Copy, Save, Check, Plus 
} from 'lucide-react';
import { VerseItem, TTSVoiceStyle } from '../types/bible';
import { generatePrayReading, PrayerTheme } from '../services/prayReadingService';
import { tts, VOICE_STYLE_PRESETS } from '../services/ttsService';
import { getVersePrayer, saveVersePrayer, loadSettings } from '../services/storage';

interface PrayReadingModalProps {
  verseItem: VerseItem;
  onClose: () => void;
  onSavePrayer?: (userPrayer: string) => void;
}

export const PrayReadingModal: React.FC<PrayReadingModalProps> = ({
  verseItem,
  onClose,
  onSavePrayer
}) => {
  const verseId = `${verseItem.bookId}_${verseItem.chapter}_${verseItem.verse}`;
  const prayReadingData = useMemo(() => generatePrayReading(verseItem), [verseItem]);

  const [selectedTheme, setSelectedTheme] = useState<PrayerTheme>('praise');
  const [userPrayerText, setUserPrayerText] = useState<string>(() => {
    return getVersePrayer(verseId)?.userPrayer || '';
  });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const voiceStyle: TTSVoiceStyle = loadSettings().ttsVoiceStyle || 'reverent';

  // 현재 선택된 추천 기도문
  const currentRecommendedPrayer = useMemo(() => {
    const opt = prayReadingData.options.find(o => o.theme === selectedTheme);
    return opt ? opt.prayer : prayReadingData.defaultPrayer;
  }, [prayReadingData, selectedTheme]);

  // 추천 기도를 사용자 기도창에 복사
  const handleCopyRecommended = () => {
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

  // 기도문 음성 낭독 토글
  const handleToggleAudio = async () => {
    if (isPlayingAudio) {
      tts.stop();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      const textToRead = userPrayerText.trim() ? userPrayerText : currentRecommendedPrayer;
      await tts.speak(textToRead, { style: voiceStyle });
      setIsPlayingAudio(false);
    }
  };

  // 사용자 기도 저장
  const handleSave = () => {
    saveVersePrayer(verseId, userPrayerText, currentRecommendedPrayer);
    if (onSavePrayer) {
      onSavePrayer(userPrayerText);
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 660 }}>
        
        {/* 모달 헤더 */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Heart size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              말씀 기도로 누리기 (Pray-Reading)
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '6px 10px' }}>
            <X size={18} />
          </button>
        </div>

        {/* 모달 바디 */}
        <div style={{ padding: '20px 24px', maxHeight: '78vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* 성경 구절 카드 */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-gold" style={{ fontSize: '0.8rem' }}>
                {verseItem.bookName} {verseItem.chapter}장 {verseItem.verse}절
              </span>
              {verseItem.outline && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {verseItem.outline}
                </span>
              )}
            </div>
            <p className="verse-text-serif" style={{ fontSize: '1.12rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.7 }}>
              "{verseItem.text}"
            </p>
          </div>

          {/* 추천 말씀 기도 (3가지 테마 탭) */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="var(--accent-gold)" />
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                  추천 말씀 기도
                </span>
              </div>

              {/* 테마 버튼 */}
              <div style={{ display: 'flex', gap: 6 }}>
                {prayReadingData.options.map((opt) => (
                  <button
                    key={opt.theme}
                    onClick={() => setSelectedTheme(opt.theme)}
                    className="btn"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: selectedTheme === opt.theme ? 'var(--accent-gold)' : 'var(--bg-card)',
                      color: selectedTheme === opt.theme ? '#000' : 'var(--text-secondary)',
                      border: `1px solid ${selectedTheme === opt.theme ? 'var(--accent-gold)' : 'var(--border-color)'}`,
                      fontWeight: selectedTheme === opt.theme ? 700 : 500
                    }}
                  >
                    {opt.icon} {opt.title}
                  </button>
                ))}
              </div>
            </div>

            {/* 기도문 박스 */}
            <div style={{
              background: 'var(--bg-card)',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: 'var(--text-primary)',
              marginBottom: 10
            }}>
              {currentRecommendedPrayer}
            </div>

            {/* 액션 버튼 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <button
                onClick={handleToggleAudio}
                className={`btn ${isPlayingAudio ? 'btn-gold' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              >
                {isPlayingAudio ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isPlayingAudio ? '기도 낭독 정지' : '거룩한 음성으로 함께 기도하기'}</span>
              </button>

              <button
                onClick={handleCopyRecommended}
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                title="추천 기도문을 내 기도 입력창으로 복사"
              >
                <Copy size={14} />
                <span>추천 기도를 내 기도창에 복사</span>
              </button>
            </div>
          </div>

          {/* 말씀 기도 키워드 알약 */}
          {prayReadingData.keywords.length > 0 && (
            <div>
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

          {/* 나의 말씀 기도 & 감상 작성창 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                나의 말씀 기도 & 감상 고백 (선택사항)
              </label>
              {saveToast && (
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
                onClick={handleSave}
                className="btn btn-gold"
                style={{ padding: '7px 18px', fontSize: '0.85rem' }}
              >
                <Save size={15} />
                <span>나의 말씀 기도 저장하기</span>
              </button>
            </div>
          </div>

        </div>

        {/* 모달 푸터 */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <span>저장된 말씀 기도는 향후 복습 및 성경 내비게이터에 기록되어 함께 누릴 수 있습니다.</span>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '5px 14px', fontSize: '0.8rem' }}>
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
