import React, { useRef } from 'react';
import { X, Download, Upload, Trash2, CheckCircle2, Sliders, Volume2, Shield } from 'lucide-react';
import { UserSettings } from '../types/bible';
import { exportBackupData, importBackupData } from '../services/storage';

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        
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
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>설정 및 데이터 관리</h3>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '6px 10px' }}>
            <X size={18} />
          </button>
        </div>

        {/* 바디 */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
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

          {/* TTS 낭독 속도 설정 */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>
              <Volume2 size={16} />
              <span>음성(TTS) 낭독 속도: <span style={{ color: 'var(--text-gold)' }}>{settings.ttsSpeed}배속</span></span>
            </label>
            <input
              type="range"
              min={0.7}
              max={1.3}
              step={0.05}
              value={settings.ttsSpeed}
              onChange={(e) => onUpdateSettings({ ...settings, ttsSpeed: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              <span>0.7배속 (느리게)</span>
              <span>0.95배속 (보통)</span>
              <span>1.3배속 (빠르게)</span>
            </div>
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
