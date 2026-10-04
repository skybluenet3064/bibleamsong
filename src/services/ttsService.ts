/**
 * 브라우저 Web Speech API를 활용한 한국어 성경 낭독 서비스
 */
class TTSService {
  private synth: SpeechSynthesis | null = null;
  private koreanVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // 한국어 음성 우선 선택 (예: Google 한국어, Yuna 등)
    this.koreanVoice = voices.find(v => v.lang.startsWith('ko')) || null;
  }

  public speak(text: string, rate: number = 0.95): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      this.stop(); // 이전 음성 중단

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.koreanVoice) {
        utterance.voice = this.koreanVoice;
      }
      utterance.lang = 'ko-KR';
      utterance.rate = rate; // 0.95 정도가 또박또박 성경 낭독에 최적
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synth.speak(utterance);
    });
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public isSupported(): boolean {
    return !!this.synth;
  }
}

export const tts = new TTSService();
