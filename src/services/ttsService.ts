import { TTSVoiceStyle } from '../types/bible';
import { loadSettings } from './storage';

export interface VoiceStyleConfig {
  id: TTSVoiceStyle;
  name: string;
  tag: string;
  icon: string;
  desc: string;
  pitch: number;
  rate: number;
  pauseMs: number;
}

/**
 * 거룩하고 신실한 성경 낭독을 위한 음성 스타일 프리셋
 */
export const VOICE_STYLE_PRESETS: Record<TTSVoiceStyle, VoiceStyleConfig> = {
  reverent: {
    id: 'reverent',
    name: '거룩하고 경건한 목소리',
    tag: '대표 추천',
    icon: '🕊️',
    desc: '중저음의 깊고 묵직한 울림, 차분하고 거룩한 말씀 선포 낭독',
    pitch: 0.86,
    rate: 0.84,
    pauseMs: 380,
  },
  faithful: {
    id: 'faithful',
    name: '신실하고 온화한 목소리',
    tag: '은혜 낭독',
    icon: '✝️',
    desc: '은혜롭고 따뜻하며 신실한 톤의 부드러운 성경 낭독',
    pitch: 0.94,
    rate: 0.88,
    pauseMs: 320,
  },
  solemn: {
    id: 'solemn',
    name: '웅장한 선포의 목소리',
    tag: '장엄 선포',
    icon: '🎺',
    desc: '권위 있고 장엄한 성경 말씀 선포 스타일',
    pitch: 0.80,
    rate: 0.80,
    pauseMs: 440,
  },
  peaceful: {
    id: 'peaceful',
    name: '기도와 묵상의 목소리',
    tag: '깊은 묵상',
    icon: '🕯️',
    desc: '마음을 울리는 고요하고 깊은 묵상용 천천히 읽기',
    pitch: 0.90,
    rate: 0.76,
    pauseMs: 500,
  },
  clear: {
    id: 'clear',
    name: '맑고 또박또박한 목소리',
    tag: '표준 발음',
    icon: '📖',
    desc: '원음에 가까운 깔끔하고 명확한 표준 낭독',
    pitch: 1.0,
    rate: 0.95,
    pauseMs: 200,
  },
  custom: {
    id: 'custom',
    name: '사용자 직접 맞춤 설정',
    tag: '커스텀',
    icon: '⚙️',
    desc: '음높이와 속도, 묵상 호흡을 원하는 대로 직접 조절',
    pitch: 0.88,
    rate: 0.85,
    pauseMs: 350,
  }
};

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  style?: TTSVoiceStyle;
  voiceURI?: string;
  addBreaths?: boolean;
}

/**
 * 성경 낭독을 위한 자연스러운 구/절(마디) 분절 유틸리티
 */
function splitScriptureIntoPhrases(text: string): string[] {
  // 쉼표, 마침표, 콜론, 세미콜론, 느낌표, 줄바꿈을 기준으로 자연스러운 호흡 단위 생성
  const rawParts = text.split(/([,.;:!?\n]+)/);
  const phrases: string[] = [];

  for (let i = 0; i < rawParts.length; i += 2) {
    const segment = rawParts[i]?.trim();
    const punct = rawParts[i + 1]?.trim() || '';
    if (segment) {
      phrases.push(segment + (punct ? ' ' + punct : ''));
    } else if (punct && phrases.length > 0) {
      phrases[phrases.length - 1] += ' ' + punct;
    }
  }

  // 너무 긴 문장은 띄어쓰기 기준 30자 단위로 부드럽게 추가 분절
  const result: string[] = [];
  for (const phrase of phrases) {
    if (phrase.length > 40 && phrase.includes(' ')) {
      const words = phrase.split(' ');
      let buffer = '';
      for (const w of words) {
        if ((buffer + ' ' + w).length > 30) {
          if (buffer) result.push(buffer);
          buffer = w;
        } else {
          buffer = buffer ? buffer + ' ' + w : w;
        }
      }
      if (buffer) result.push(buffer);
    } else if (phrase.trim()) {
      result.push(phrase.trim());
    }
  }

  return result.length > 0 ? result : [text];
}

/**
 * 브라우저 Web Speech API를 활용한 거룩하고 신실한 성경 낭독 서비스
 */
class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private activeSpeaking: boolean = false;
  private currentSessionId: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  /**
   * 브라우저에서 사용 가능한 모든 한국어 성우 목록 반환
   */
  public getKoreanVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }

    const koreanVoices = this.voices.filter(v => 
      v.lang.startsWith('ko') || v.lang.toLowerCase().includes('korean')
    );

    // 자연스럽고 품질 높은 보이스 우선 정렬 (Yuna, Siri, Google 한국어 순)
    return koreanVoices.sort((a, b) => {
      const aIsNatural = /natural|yuna|sora|sinji|siri/i.test(a.name);
      const bIsNatural = /natural|yuna|sora|sinji|siri/i.test(b.name);
      if (aIsNatural && !bIsNatural) return -1;
      if (!aIsNatural && bIsNatural) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * 지정된 voiceURI 또는 최적의 한국어 성우 찾기
   */
  private resolveVoice(voiceURI?: string): SpeechSynthesisVoice | null {
    const koreanVoices = this.getKoreanVoices();
    if (voiceURI) {
      const matched = koreanVoices.find(v => v.voiceURI === voiceURI);
      if (matched) return matched;
    }
    // 기본 추천 한국어 음성 (Yuna 또는 첫 번째 한국어 음성)
    return koreanVoices[0] || null;
  }

  /**
   * 성경 구절 낭독 실행
   */
  public async speak(text: string, options?: Partial<SpeakOptions>): Promise<void> {
    if (!this.synth || !text.trim()) return;

    this.stop(); // 이전 낭독 즉시 취소
    this.activeSpeaking = true;
    const sessionId = ++this.currentSessionId;

    // 사용자 설정 로드
    const userSettings = loadSettings();
    const styleKey = options?.style || userSettings.ttsVoiceStyle || 'reverent';
    const stylePreset = VOICE_STYLE_PRESETS[styleKey] || VOICE_STYLE_PRESETS.reverent;

    // 음높이(pitch), 속도(rate), 음성(voice), 호흡(pauseMs) 결정
    const rate = options?.rate ?? (styleKey === 'custom' ? userSettings.ttsSpeed : stylePreset.rate);
    const pitch = options?.pitch ?? (styleKey === 'custom' ? (userSettings.ttsPitch ?? stylePreset.pitch) : stylePreset.pitch);
    const voiceURI = options?.voiceURI || userSettings.ttsVoiceURI;
    const addBreaths = options?.addBreaths ?? userSettings.ttsAddBreaths ?? true;
    const pauseMs = addBreaths ? stylePreset.pauseMs : 80;

    const selectedVoice = this.resolveVoice(voiceURI);

    // 구/절 단위 묵상 호흡 분절
    const phrases = addBreaths ? splitScriptureIntoPhrases(text) : [text];

    for (let i = 0; i < phrases.length; i++) {
      if (!this.activeSpeaking || this.currentSessionId !== sessionId) {
        break;
      }

      const phrase = phrases[i];
      await this.speakSinglePhrase(phrase, {
        voice: selectedVoice,
        pitch,
        rate
      }, sessionId);

      // 마지막 문장이 아니고 낭독이 계속 진행 중일 때 묵상 호흡(쉼) 대기
      if (i < phrases.length - 1 && this.activeSpeaking && this.currentSessionId === sessionId && pauseMs > 0) {
        await new Promise((res) => setTimeout(res, pauseMs));
      }
    }

    if (this.currentSessionId === sessionId) {
      this.activeSpeaking = false;
    }
  }

  /**
   * 단일 구절 조각 발화
   */
  private speakSinglePhrase(
    phrase: string,
    config: { voice: SpeechSynthesisVoice | null; pitch: number; rate: number },
    sessionId: number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth || !this.activeSpeaking || this.currentSessionId !== sessionId) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(phrase);
      if (config.voice) {
        utterance.voice = config.voice;
      }
      utterance.lang = 'ko-KR';
      utterance.rate = Math.max(0.5, Math.min(1.5, config.rate));
      utterance.pitch = Math.max(0.5, Math.min(1.5, config.pitch));
      utterance.volume = 1.0;

      // Chrome 브라우저의 긴 발화 정지 버그 방지를 위한 안전 타임아웃
      const wordCount = phrase.length;
      const expectedDurationMs = Math.max(2500, (wordCount * 400) / config.rate);
      const safetyTimer = setTimeout(() => {
        resolve();
      }, expectedDurationMs + 2000);

      utterance.onend = () => {
        clearTimeout(safetyTimer);
        resolve();
      };

      utterance.onerror = (e) => {
        clearTimeout(safetyTimer);
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('TTS utterance error:', e.error);
        }
        resolve();
      };

      try {
        this.synth.speak(utterance);
      } catch (err) {
        clearTimeout(safetyTimer);
        resolve();
      }
    });
  }

  /**
   * 낭독 즉시 중지
   */
  public stop(): void {
    this.activeSpeaking = false;
    this.currentSessionId++;
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * 현재 낭독 중인지 여부
   */
  public isBusy(): boolean {
    return this.activeSpeaking || (this.synth?.speaking ?? false);
  }

  /**
   * 특정 스타일 미리듣기 테스트 (샘플 말씀 선포)
   */
  public async preview(styleKey: TTSVoiceStyle, voiceURI?: string, customRate?: number, customPitch?: number): Promise<void> {
    const sampleText = '태초에 하나님께서 하늘들과 땅을 창조하셨다. 하나님의 영은 수면 위에 운행하고 계셨다.';
    const preset = VOICE_STYLE_PRESETS[styleKey] || VOICE_STYLE_PRESETS.reverent;
    
    await this.speak(sampleText, {
      style: styleKey,
      voiceURI,
      rate: customRate ?? preset.rate,
      pitch: customPitch ?? preset.pitch,
      addBreaths: true
    });
  }

  public isSupported(): boolean {
    return !!this.synth;
  }
}

export const tts = new TTSService();
