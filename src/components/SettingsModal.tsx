import React, { useRef, useState, useEffect } from 'react';
import { 
  X, Download, Upload, Trash2, Sliders, Volume2, VolumeX, Shield, 
  Sparkles, Play, Square, Check
} from 'lucide-react';
import { UserSettings, TTSVoiceStyle } from '../types/bible';
import { exportBackupData, importBackupData } from '../services/storage';
import { tts, VOICE_STYLE_PRESETS } from '../services/ttsService';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onClose: () => void;
  onDataReset: () => void;
  onDataImported: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onDataReset,
  onDataImported
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [koreanVoices, setKoreanVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const list = tts.getKoreanVoices();
    setKoreanVoices(list);
  }, []);

  // 모달 닫힐 때 오디오 정지
  useEffect(() => {
    return () => {
      tts.stop();
    };
  }, []);

  const handleExport = () => {
    const jsonStr = exportBackupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bible_amsong_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackupData(content);
        if (success) {
          alert('데이터가 성공적으로 복원되었습니다.');
          onDataImported();
          onClose();
        } else {
          alert('유효하지 않은 백업 파일 형식입니다.');
        }
      }
    };
    reader.readAsText(file);
  };

  // 프리셋 선택 핸들러
  const handleSelectPreset = (styleId: TTSVoiceStyle) => {
    const preset = VOICE_STYLE_PRESETS[styleId];
    if (!preset) return;

    const next = {
      ...settings,
      ttsVoiceStyle: styleId,
      ttsSpeed: styleId === 'custom' ? settings.ttsSpeed : preset.rate,
      ttsPitch: styleId === 'custom' ? (settings.ttsPitch ?? preset.pitch) : preset.pitch
    };
    onUpdateSettings(next);
  };

  // 미리듣기 실행/중단
  const handleTogglePreview = async () => {
    if (isPlayingPreview) {
      tts.stop();
      setIsPlayingPreview(false);
    } else {
      setIsPlayingPreview(true);
      await tts.preview(
        settings.ttsVoiceStyle || 'reverent',
        settings.ttsVoiceURI,
        settings.ttsSpeed,
        settings.ttsPitch
      );
      setIsPlayingPreview(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        
        {/* 헤더 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>설정 및 음성 낭독 관리</h3>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '6px 10px' }}>
            <X size={18} />
          </button>
        </div>

        {/* 바디 */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, maxHeight: '80vh', overflowY: 'auto' }}>
          
          {/* 일일 목표 설정 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>
              하루 목표 암송 구절 수: <span style={{ color: 'var(--text-gold)' }}>{settings.dailyGoal}구절</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={settings.dailyGoal}
              onChange={(e) => onUpdateSettings({ ...settings, dailyGoal: parseInt(e.target.value, 10) })}
              style={{ width: '100%', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              <span>1구절 (가볍게)</span>
              <span>3구절 (추천)</span>
              <span>10구절 (몰입)</span>
            </div>
          </div>

          {/* 거룩하고 신실한 성경 음성 낭독 (TTS) 엔진 설정 */}
          <div style={{
            padding: '18px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Volume2 size={18} color="var(--accent-gold)" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                  성경 음성 낭독(TTS) 및 목소리 스타일
                </h4>
              </div>
              <button
                onClick={handleTogglePreview}
                className={`btn ${isPlayingPreview ? 'btn-gold' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                {isPlayingPreview ? <Square size={14} /> : <Play size={14} />}
                <span>{isPlayingPreview ? '낭독 정지' : '목소리 미리듣기'}</span>
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '-4px 0 4px', lineHeight: 1.5 }}>
              딱딱하고 교과서적인 기본 기계음 대신, 깊은 중저음과 경건한 호흡으로 성경 말씀을 선포하는 음성 스타일을 제공합니다.
            </p>

            {/* 음성 스타일 프리셋 선택 카드 그리드 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                낭독 음성 스타일 선택
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {(Object.values(VOICE_STYLE_PRESETS)).map((p) => {
                  const isSelected = (settings.ttsVoiceStyle || 'reverent') === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p.id)}
                      className="btn"
                      style={{
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        textAlign: 'left',
                        background: isSelected ? 'var(--bg-card)' : 'transparent',
                        border: `1.5px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)',
                        position: 'relative',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                          {p.icon} {p.name}
                        </span>
                        <span className={`badge ${isSelected ? 'badge-gold' : 'badge-gray'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          {p.tag}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                        {p.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 시스템 한국어 성우 선택 (가능한 경우) */}
            {koreanVoices.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                  설치된 성우(Voice) 선택
                </label>
                <select
                  value={settings.ttsVoiceURI || ''}
                  onChange={(e) => onUpdateSettings({ ...settings, ttsVoiceURI: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="">자동 선택 (가장 자연스러운 한국어 성우 우선)</option>
                  {koreanVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} {v.localService ? '(로컬)' : '(온라인)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 슬라이더 세부 조절 (속도, 음높이) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 4 }}>
              {/* 속도 슬라이더 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                  <span>낭독 속도</span>
                  <span style={{ color: 'var(--text-gold)' }}>{settings.ttsSpeed}배속</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={1.3}
                  step={0.02}
                  value={settings.ttsSpeed}
                  onChange={(e) => {
                    onUpdateSettings({ 
                      ...settings, 
                      ttsSpeed: parseFloat(e.target.value),
                      ttsVoiceStyle: 'custom'
                    });
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>0.6 (천천히)</span>
                  <span>0.84 (거룩한 추천)</span>
                  <span>1.3 (빠르게)</span>
                </div>
              </div>

              {/* 음높이(Pitch) 슬라이더 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                  <span>목소리 톤 (음높이)</span>
                  <span style={{ color: 'var(--text-gold)' }}>{(settings.ttsPitch ?? 0.88).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={1.3}
                  step={0.02}
                  value={settings.ttsPitch ?? 0.88}
                  onChange={(e) => {
                    onUpdateSettings({ 
                      ...settings, 
                      ttsPitch: parseFloat(e.target.value),
                      ttsVoiceStyle: 'custom'
                    });
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>0.6 (중후한 저음)</span>
                  <span>0.88 (거룩한 중저음)</span>
                  <span>1.3 (높은 톤)</span>
                </div>
              </div>
            </div>

            {/* 묵상 호흡(쉼) 적용 옵션 */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.83rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginTop: 4
            }}>
              <input
                type="checkbox"
                checked={settings.ttsAddBreaths ?? true}
                onChange={(e) => onUpdateSettings({ ...settings, ttsAddBreaths: e.target.checked })}
                style={{ accentColor: 'var(--accent-gold)', width: 16, height: 16 }}
              />
              <span>구/절 및 쉼표(,), 마침표(.) 사이에 자연스러운 묵상 호흡(쉼) 적용</span>
            </label>

          </div>

          {/* 테마 선택 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>
              테마 스타일
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(['dark', 'light', 'sepia'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    onUpdateSettings({ ...settings, theme: t });
                    document.documentElement.setAttribute('data-theme', t);
                  }}
                  className="btn"
                  style={{
                    padding: '8px',
                    fontSize: '0.85rem',
                    background: settings.theme === t ? 'var(--bg-tertiary)' : 'transparent',
                    border: `1px solid ${settings.theme === t ? 'var(--accent-gold)' : 'var(--border-color)'}`,
                    color: settings.theme === t ? 'var(--text-gold)' : 'var(--text-secondary)'
                  }}
                >
                  {t === 'dark' ? '다크 모드' : t === 'light' ? '라이트 모드' : '세피아 양장'}
                </button>
              ))}
            </div>
          </div>

          {/* 백업 및 복원 */}
          <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={16} color="var(--accent-gold)" />
              데이터 안전 백업 및 복원
            </h4>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleExport} className="btn btn-outline" style={{ flex: 1, fontSize: '0.85rem' }}>
                <Download size={16} />
                <span>백업 파일 다운로드</span>
              </button>

              <button onClick={() => fileInputRef.current?.click()} className="btn btn-outline" style={{ flex: 1, fontSize: '0.85rem' }}>
                <Upload size={16} />
                <span>백업 파일 복원</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* 초기화 */}
          <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => {
                if (window.confirm('모든 암송 진도와 학습 기록을 초기화하시겠습니까? (되돌릴 수 없습니다.)')) {
                  onDataReset();
                  onClose();
                }
              }}
              className="btn btn-outline"
              style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', fontSize: '0.85rem' }}
            >
              <Trash2 size={16} />
              <span>학습 데이터 전체 초기화</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
