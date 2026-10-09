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
  emphasize?: boolean;
}

/**
 * 사람이 옆에서 말하듯 자연스럽고 생생한 성경 낭독을 위한 음성 스타일 프리셋
 */
export const VOICE_STYLE_PRESETS: Record<TTSVoiceStyle, VoiceStyleConfig> = {
  natural: {
    id: 'natural',
    name: '자연스러운 사람 목소리',
    tag: '기본 추천',
    icon: '🌿',
    desc: '끊어짐 없이 물흐르듯, 사람이 바로 곁에서 편안하게 읽어주는 자연스러운 대화체',
    pitch: 1.0,
    rate: 0.95,
    pauseMs: 60,
    emphasize: false,
  },
  emphasis: {
    id: 'emphasis',
    name: '중요 단어 강조 낭독',
    tag: '핵심 진리 강조',
    icon: '✨',
    desc: '하나님, 생명, 영, 사랑 등 성경의 핵심 단어에 억양과 생동감을 살린 낭독',
    pitch: 0.98,
    rate: 0.93,
    pauseMs: 80,
    emphasize: true,
  },
  warm: {
    id: 'warm',
    name: '따뜻하고 다정한 목소리',
    tag: '위로와 은혜',
    icon: '🕊️',
    desc: '곁에서 나직이 성경을 들려주듯 다정하고 은혜로운 온화한 목소리',
    pitch: 0.98,
    rate: 0.91,
    pauseMs: 80,
    emphasize: false,
  },
  reverent: {
    id: 'reverent',
    name: '거룩하고 경건한 목소리',
    tag: '차분한 묵상',
    icon: '✝️',
    desc: '깊이 있고 고요하게 말씀에 젖어드는 차분한 묵상형 낭독',
    pitch: 0.95,
    rate: 0.88,
    pauseMs: 120,
    emphasize: false,
  },
  faithful: {
    id: 'faithful',
    name: '신실하고 온화한 목소리',
    tag: '신실한 톤',
    icon: '🌸',
    desc: '은혜롭고 따뜻하며 신실한 톤의 부드러운 성경 낭독',
    pitch: 0.98,
    rate: 0.92,
    pauseMs: 80,
    emphasize: false,
  },
  solemn: {
    id: 'solemn',
    name: '웅장한 선포의 목소리',
    tag: '장엄 선포',
    icon: '🎺',
    desc: '권위 있고 확신에 찬 힘있는 성경 말씀 선포 스타일',
    pitch: 1.02,
    rate: 0.96,
    pauseMs: 90,
    emphasize: true,
  },
  peaceful: {
    id: 'peaceful',
    name: '기도와 묵상의 목소리',
    tag: '깊은 기도',
    icon: '🕯️',
    desc: '마음을 울리는 고요한 기도와 묵상용 천천히 읽기',
    pitch: 0.95,
    rate: 0.84,
    pauseMs: 140,
    emphasize: false,
  },
  clear: {
    id: 'clear',
    name: '맑고 또박또박한 목소리',
    tag: '표준 발음',
    icon: '📖',
    desc: '원음에 가까운 깔끔하고 명확한 표준 낭독',
    pitch: 1.0,
    rate: 0.98,
    pauseMs: 60,
    emphasize: false,
  },
  custom: {
    id: 'custom',
    name: '사용자 직접 맞춤 설정',
    tag: '커스텀',
    icon: '⚙️',
    desc: '음높이와 낭독 속도를 원하는 대로 직접 미세 조절',
    pitch: 1.0,
    rate: 0.95,
    pauseMs: 60,
    emphasize: false,
  }
};

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  style?: TTSVoiceStyle;
  voiceURI?: string;
  addBreaths?: boolean;
  onBoundary?: (charIndex: number, length: number) => void;
}

/**
 * 성경 핵심 진리 단어 목록 (자연스러운 발음 강조 대상)
 */
export const CORE_BIBLICAL_KEYWORDS = [
  '하나님', '하나님께서', '하나님의', '주 예수님', '예수 그리스도', '그리스도',
  '성령', '여호와', '생명', '영', '빛', '사랑', '은혜', '진리', '믿음',
  '구원', '부활', '십자가', '말씀', '하늘들과 땅', '창조하셨다', '영원히', '아멘'
];

/**
 * 사람의 구어처럼 매끄럽게 들리도록 성경 텍스트 정제
 */
export function cleanScriptureForSpeech(text: string): string {
  return text
    .replace(/\[\d+\]|\(\d+\)|\d+:\d+/g, '') // 각주 번호나 1:1 같은 숫자 제거
    .replace(/[\r\n]+/g, ' ')               // 줄바꿈을 공백으로 변환
    .replace(/["“”'‘’]/g, '')               // 따옴표 발음 쉼 방지
    .replace(/\s+/g, ' ')                   // 중복 공백 정리
    .trim();
}

/**
 * 인위적인 토막 끊김을 방지하고 문장 단위로 자연스럽게 분절
 * (쉼표나 30자 단위로 토막 내지 않고, 실제 마침표 단위로만 유려하게 처리)
 */
function splitIntoNaturalSentences(text: string): string[] {
  const cleaned = cleanScriptureForSpeech(text);
  if (!cleaned) return [];

  // 짧은 구절은 한 호흡으로 통째로 낭독 (가장 자연스러운 억양 형성)
  if (cleaned.length <= 140) {
    return [cleaned];
  }

  // 문장이 긴 경우 온점(.), 느낌표(!), 물음표(?) 기준으로만 분절
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  return sentences.length > 0 ? sentences : [cleaned];
}

/**
 * 브라우저 Web Speech API를 활용한 자연스러운 인간 음성 성경 낭독 서비스
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
   * 브라우저에서 사용 가능한 모든 한국어 성우 목록 (자연스러운 인간 음성 우선 순위)
   */
  public getKoreanVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }

    const koreanVoices = this.voices.filter(v => 
      v.lang.startsWith('ko') || v.lang.toLowerCase().includes('korean')
    );

    // 자연스러운 사람 목소리 우선 순위 채점
    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      const name = v.name.toLowerCase();
      let score = 0;
      if (name.includes('natural') || name.includes('online')) score += 100; // Edge Neural (SunHi, InJoon)
      if (name.includes('neural')) score += 90;
      if (name.includes('siri')) score += 80; // Apple Siri
      if (name.includes('premium') || name.includes('enhanced')) score += 70;
      if (name.includes('yuna')) score += 60; // macOS 대표 고품질 음성
      if (name.includes('sora') || name.includes('sinji')) score += 50;
      if (name.includes('google')) score += 40; // Google 한국어
      if (v.lang === 'ko-KR') score += 10;
      return score;
    };

    return koreanVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
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
    // 최상위 점수 한국어 음성 반환
    return koreanVoices[0] || null;
  }

  /**
   * 성경 구절 낭독 실행 (끊김 없는 매끄러운 사람 톤)
   */
  public async speak(text: string, options?: Partial<SpeakOptions>): Promise<void> {
    if (!this.synth || !text.trim()) return;

    this.stop(); // 이전 낭독 즉시 취소
    this.activeSpeaking = true;
    const sessionId = ++this.currentSessionId;

    // 사용자 설정 로드
    const userSettings = loadSettings();
    const styleKey = options?.style || userSettings.ttsVoiceStyle || 'natural';
    const stylePreset = VOICE_STYLE_PRESETS[styleKey] || VOICE_STYLE_PRESETS.natural;

    // 음높이(pitch), 속도(rate), 음성(voice) 결정
    const rate = options?.rate ?? (styleKey === 'custom' ? userSettings.ttsSpeed : stylePreset.rate);
    const pitch = options?.pitch ?? (styleKey === 'custom' ? (userSettings.ttsPitch ?? stylePreset.pitch) : stylePreset.pitch);
    const voiceURI = options?.voiceURI || userSettings.ttsVoiceURI;
    const pauseMs = stylePreset.pauseMs ?? 60;

    const selectedVoice = this.resolveVoice(voiceURI);

    // 끊김 없이 문장 전체 단위로 자연스럽게 분절
    const sentences = splitIntoNaturalSentences(text);

    for (let i = 0; i < sentences.length; i++) {
      if (!this.activeSpeaking || this.currentSessionId !== sessionId) {
        break;
      }

      const sentence = sentences[i];
      await this.speakSingleSentence(sentence, {
        voice: selectedVoice,
        pitch,
        rate,
        onBoundary: options?.onBoundary
      }, sessionId);

      // 문장 간 자연스러운 미세 숨고르기 (사람 호흡 수준: 60~80ms)
      if (i < sentences.length - 1 && this.activeSpeaking && this.currentSessionId === sessionId && pauseMs > 0) {
        await new Promise((res) => setTimeout(res, pauseMs));
      }
    }

    if (this.currentSessionId === sessionId) {
      this.activeSpeaking = false;
    }
  }

  /**
   * 단일 문장 끊김 없이 자연 발화
   */
  private speakSingleSentence(
    sentence: string,
    config: { 
      voice: SpeechSynthesisVoice | null; 
      pitch: number; 
      rate: number;
      onBoundary?: (charIndex: number, length: number) => void;
    },
    sessionId: number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth || !this.activeSpeaking || this.currentSessionId !== sessionId) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentence);
      if (config.voice) {
        utterance.voice = config.voice;
      }
      utterance.lang = 'ko-KR';
      // 사람이 말하듯 자연스러운 속도와 톤 범위 보정
      utterance.rate = Math.max(0.6, Math.min(1.4, config.rate));
      utterance.pitch = Math.max(0.7, Math.min(1.3, config.pitch));
      utterance.volume = 1.0;

      if (config.onBoundary) {
        utterance.onboundary = (e) => {
          config.onBoundary?.(e.charIndex, (e as any).charLength || 1);
        };
      }

      // 긴 문장 발화 안전 타임아웃
      const wordCount = sentence.length;
      const expectedDurationMs = Math.max(2500, (wordCount * 350) / config.rate);
      const safetyTimer = setTimeout(() => {
        resolve();
      }, expectedDurationMs + 2500);

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
   * 특정 스타일 미리듣기 테스트 (자연스러운 사람 발성 검증)
   */
  public async preview(styleKey: TTSVoiceStyle, voiceURI?: string, customRate?: number, customPitch?: number): Promise<void> {
    const sampleText = '태초에 하나님께서 하늘들과 땅을 창조하셨다. 하나님의 영은 수면 위에 운행하고 계셨다.';
    const preset = VOICE_STYLE_PRESETS[styleKey] || VOICE_STYLE_PRESETS.natural;
    
    await this.speak(sampleText, {
      style: styleKey,
      voiceURI,
      rate: customRate ?? preset.rate,
      pitch: customPitch ?? preset.pitch
    });
  }

  public isSupported(): boolean {
    return !!this.synth;
  }
}

export const tts = new TTSService();
