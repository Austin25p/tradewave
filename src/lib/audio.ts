export type InteractionSound = 'click_light' | 'click_heavy' | 'success' | 'error' | 'switch';

class AudioManager {
  private context: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.2;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_sound_enabled');
      if (saved !== null) {
        this.isEnabled = saved === 'true';
      }
    }
  }

  private initContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('app_sound_enabled', String(enabled));
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public play(type: InteractionSound) {
    if (!this.isEnabled) return;
    try {
      this.initContext();
      if (!this.context) return;

      const osc = this.context.createOscillator();
      const gainNode = this.context.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.context.destination);

      const now = this.context.currentTime;

      switch (type) {
        case 'click_light':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.03);
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(this.volume, now + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        case 'click_heavy':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(this.volume * 1.5, now + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        case 'success':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.setValueAtTime(600, now + 0.1);
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(this.volume, now + 0.05);
          gainNode.gain.setValueAtTime(this.volume, now + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        case 'error':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.setValueAtTime(150, now + 0.1);
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(this.volume, now + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        case 'switch':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(this.volume, now + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
          osc.start(now);
          osc.stop(now + 0.06);
          break;
      }
    } catch (e) {
      console.warn('Audio playback failed', e);
    }
  }
}

export const audioSystem = new AudioManager();

export function useAudio() {
  const play = (type: InteractionSound) => {
    audioSystem.play(type);
  };
  return play;
}
